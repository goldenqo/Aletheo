// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.6;

interface I {
    function balanceOf(address a) external view returns (uint);

    function transfer(address recipient, uint amount) external returns (bool);

    function transferFrom(address sender, address recipient, uint amount) external returns (bool);

    function getRewards(address a, uint rewToClaim) external;
}

// this contract' beauty was butchered
contract StakingContract {
    event NewStake(address indexed staker, uint stakeAmount, uint unlockBlock);
    event Unstake(address indexed staker, uint unstakeAmount);
    event NewDelegate(address indexed from, address indexed to, uint amount);
    event Undelegate(address indexed from, address indexed to, uint amount);

    address private _letToken;
    address private _treasury;
    address private _otcMarket;
    address private _campaignMarket;
    uint public totalLetLocked;
    uint64 public lastNewTokenId;

    struct TokenRewards {
        address token;
        uint registerBlock;
        uint initialAmount;
    }

    struct Staker {
        uint88 amount;
        uint88 delegatingToOthers;
        uint88 delegatedByOthers;
        uint32 lastClaim;
        uint32 lockUpTo;
        uint64 lastTokenRewardsId;
        uint88 reserved;
    }

    mapping(uint64 => TokenRewards) public tokenRewards;

    mapping(address => Staker) public stakers;

    mapping(address => mapping(address => uint)) public delegates; //to delegate poster commitment stake and voting power but keep stake rewards

    bool public ini; //reserved

    function init(address letToken, address treasury) public {
        //require(ini==false);ini=true;
        _letToken = letToken;
        _treasury = treasury;
    }

    function registerToken(TokenRewards memory token) public {
        require(msg.sender == _campaignMarket);
        uint64 id = ++lastNewTokenId;
        tokenRewards[id] = token;
    }

    function lock(uint amount, uint blocks) public {
        uint safeBlocks = checkSafeBlocks();
        if (blocks > safeBlocks - 86400) {
            blocks = safeBlocks - 86400;
        }
        _lock(msg.sender, amount, blocks);
    }

    function forceLockFor(address a, uint amount, uint blocks) public {
        _lock(a, amount, blocks);
    }

    function _lock(address a, uint amount, uint blocks) private {
        _getLockRewards(a);
        stakers[a].lockUpTo = uint32(blocks);
        require(amount > 0 && I(_letToken).balanceOf(a) >= amount);
        stakers[a].amount += uint88(amount);
        stakers[a].lastTokenRewardsId = lastNewTokenId;
        I(_letToken).transferFrom(a, address(this), amount);
        totalLetLocked += amount;
        emit NewStake(a, amount, blocks);
    }

    function checkSafeBlocks() public view returns (uint) {
        bytes32 PROPOSE_BLOCK_SLOT = 0x4b50776e56454fad8a52805daac1d9fd77ef59e4f1a053c342aaae5568af1388;
        uint proposeBlock;
        assembly {
            proposeBlock := sload(PROPOSE_BLOCK_SLOT)
        }
        if (block.number > proposeBlock) {
            uint nextLogicBlock;
            bytes32 NEXT_LOGIC_BLOCK_SLOT = 0xe3228ec3416340815a9ca41bfee1103c47feb764b4f0f4412f5d92df539fe0ee;
            assembly {
                nextLogicBlock := sload(NEXT_LOGIC_BLOCK_SLOT)
            }
            require(block.number < nextLogicBlock, 'propose block must be increased');
            return nextLogicBlock;
        } else {
            uint zeroTrustPeriod;
            bytes32 ZERO_TRUST_PERIOD_SLOT = 0x7913203adedf5aca5386654362047f05edbd30729ae4b0351441c46289146720;
            assembly {
                zeroTrustPeriod := sload(ZERO_TRUST_PERIOD_SLOT)
            }
            return proposeBlock + zeroTrustPeriod;
        }
    }

    function getLockRewards() public returns (uint) {
        require(stakers[msg.sender].amount > 0);
        return _getLockRewards(msg.sender);
    }

    function getLockRewardsFor(address a) public returns (uint) {
        require(stakers[a].amount > 0);
        return _getLockRewards(a);
    }

    function _getLockRewards(address a) private returns (uint) {
        uint toClaim = 0;
        if (stakers[a].amount > 0) {
            toClaim = lockRewardsAvailable(a);
            I(_treasury).getRewards(a, toClaim);
            _getRegisteredTokenRewards(a);
            //stakers[msg.sender].lockUpTo=uint32(block.number+720000);//alert: it was a hot fix
        }
        stakers[msg.sender].lastClaim = uint32(block.number);
        return toClaim;
    }

    function lockRewardsAvailable(address a) public view returns (uint) {
        if (stakers[a].amount > 0) {
            uint rate = 47e13;
            uint rateCap = (totalLetLocked * 100) / 100000e18;
            if (rateCap > 100) {
                rateCap = 100;
            }
            rate = (rate * rateCap) / 100;
            uint lockUpTo = stakers[a].lockUpTo;
            uint limit = lockUpTo > block.number ? block.number : lockUpTo;
            uint amount = ((limit - stakers[a].lastClaim) * stakers[a].amount * rate) / totalLetLocked;
            return amount;
        } else {
            return 0;
        }
    }

    function _getRegisteredTokenRewards(address a) private {
        if (stakers[a].lastTokenRewardsId != lastNewTokenId && stakers[a].lastTokenRewardsId != 0) {
            for (uint64 i = stakers[a].lastTokenRewardsId; i < lastNewTokenId; i++) {
                uint lockUpTo = stakers[a].lockUpTo;
                if (lockUpTo > tokenRewards[i].registerBlock) {
                    uint limit = lockUpTo > block.number ? block.number : lockUpTo;
                    uint amount = ((limit - tokenRewards[i].registerBlock) * stakers[a].amount * tokenRewards[i].initialAmount) / totalLetLocked;
                    stakers[a].lastTokenRewardsId = lastNewTokenId;
                    I(tokenRewards[i].token).transfer(a, amount);
                }
            }
        }
    }

    function unstake(uint amount) public {
        require(
            stakers[msg.sender].amount - stakers[msg.sender].reserved - stakers[msg.sender].delegatingToOthers >= amount &&
                totalLetLocked >= amount &&
                block.number > stakers[msg.sender].lockUpTo
        );
        _getLockRewards(msg.sender);
        stakers[msg.sender].amount -= uint88(amount);
        I(_letToken).transfer(msg.sender, (amount * 99) / 100);
        uint leftOver = amount - (amount * 99) / 100;
        I(_letToken).transfer(_treasury, leftOver); //1% burn to treasury as protection against poster spam
        totalLetLocked -= amount;
        emit Unstake(msg.sender, amount);
    }

    function delegate(address a, uint amount) public {
        uint88 delegating = stakers[msg.sender].delegatingToOthers;
        require(stakers[msg.sender].amount - delegating >= amount);
        stakers[msg.sender].delegatingToOthers = delegating + uint88(amount);
        stakers[a].delegatedByOthers += uint88(amount);
        delegates[msg.sender][a] += amount;
        emit NewDelegate(msg.sender, a, amount);
    }

    function delegateBatch(address[] memory accs, uint[] memory amounts) public {
        uint amount;
        for (uint i; i < accs.length; i++) {
            stakers[accs[i]].delegatedByOthers += uint88(amounts[i]);
            delegates[msg.sender][accs[i]] += amounts[i];
            amount += amounts[i];
            emit NewDelegate(msg.sender, accs[i], amounts[i]);
        }
        uint88 delegating = stakers[msg.sender].delegatingToOthers;
        require(stakers[msg.sender].amount - delegating >= amount);
        stakers[msg.sender].delegatingToOthers = delegating + uint88(amount);
    }

    function undelegate(address a, uint amount) public {
        uint delegated = delegates[msg.sender][a];
        require(delegated >= amount);
        uint88 delegating = stakers[msg.sender].delegatingToOthers;
        require(delegating >= amount);
        stakers[msg.sender].delegatingToOthers = delegating - uint88(amount);
        stakers[a].delegatedByOthers -= uint88(amount);
        delegates[msg.sender][a] = delegated - amount;
        emit Undelegate(msg.sender, a, amount);
    }

    function undelegateBatch(address[] memory accs, uint[] memory amounts) public {
        uint amount;
        for (uint i; i < accs.length; i++) {
            uint delegated = delegates[msg.sender][accs[i]];
            require(delegated >= amounts[i]);
            stakers[accs[i]].delegatedByOthers -= uint88(amounts[i]);
            delegates[msg.sender][accs[i]] = delegated - amounts[i];
            amount += amounts[i];
            emit Undelegate(msg.sender, accs[i], amounts[i]);
        }
        uint88 delegating = stakers[msg.sender].delegatingToOthers;
        require(delegating >= amount);
        stakers[msg.sender].delegatingToOthers = delegating - uint88(amount);
    }

    function otcReassignment(address from, address to, uint amount) public {
        require(msg.sender == _otcMarket);
        getLockRewardsFor(from);
        stakers[from].reserved -= uint88(amount);
        stakers[from].amount -= uint88(amount);
        stakers[to].amount += uint88(amount);
        stakers[to].lastClaim = uint32(block.number);
        stakers[to].lockUpTo = stakers[from].lockUpTo;
        emit Unstake(from, amount);
        emit NewStake(to, amount, stakers[to].lockUpTo);
    }

    function reserveForOTC(address a, uint amount) public {
        uint88 reserved = stakers[a].reserved;
        require(msg.sender == _otcMarket && stakers[a].amount - stakers[a].delegatingToOthers - reserved >= amount);
        stakers[a].reserved = reserved + uint88(amount);
    }

    function withdrawFromOTC(address a, uint amount) public {
        uint88 reserved = stakers[a].reserved;
        require(msg.sender == _otcMarket && reserved >= amount);
        stakers[a].reserved = reserved - uint88(amount);
    }
}
