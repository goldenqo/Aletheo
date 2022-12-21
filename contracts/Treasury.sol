// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.6;

interface I {
    function transfer(address to, uint value) external returns (bool);

    function balanceOf(address) external view returns (uint);

    function genesisBlock() external view returns (uint);

    function deposits(address a) external view returns (uint);

    function sold() external view returns (uint);

    function swapExactTokensForEth(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    function getPair(address t, address t1) external view returns (address pair);

    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
}

import 'hardhat/console.sol';

contract Treasury {
    address public _governance;
    address public _aggregator;
    address public _letToken;
    address public _foundingEvent;
    address public _staking;
    address public _router;
    address public _factory;
    address public _stableCoin;
    address public otcMarket;
    uint public totalPosterRewards;
    uint public totalFounderRewards;
    uint public totalAirdropEmissions;
    uint public totBenEmission;
    uint public baseRate;
    uint public posterRate;

    struct Beneficiary {
        uint128 amount;
        uint128 emission;
        uint lastClaim;
    }

    struct Poster {
        uint128 amount;
        uint128 lastClaim;
        uint128 unapprovedAmount;
        uint reserved;
    }

    struct AirdropRecepient {
        uint64 amount;
        uint64 lastClaim;
        bool emissionIncluded;
        uint reserved;
    }

    struct Founder {
        uint128 amount;
        uint128 lastClaim;
        bool registered;
        uint reserved;
    }

    mapping(address => Beneficiary) public bens;
    mapping(address => Poster) public posters;
    mapping(address => AirdropRecepient) public airdrops;
    mapping(address => Founder) public founders;

    function init(address governance, address letToken, address foundingEvent, address staking, address factory, address stableCoin) public {
        require(msg.sender == 0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199);
        posterRate = 1000;
        baseRate = 95e32;
        _governance = governance;
        _letToken = letToken;
        _foundingEvent = foundingEvent;
        _staking = staking;
        _factory = factory;
        _stableCoin = stableCoin;
    }

    function setGovernance(address a) external {
        require(msg.sender == _governance);
        _governance = a;
    }

    function setAggregator(address a) external {
        require(msg.sender == _governance);
        _aggregator = a;
    }

    function setPosterRate(uint rate) external {
        require(msg.sender == _governance && rate <= 2000 && rate >= 100);
        posterRate = rate;
    }

    function setBaseRate(uint rate) external {
        require(msg.sender == _governance && rate < baseRate && rate > 1e13);
        baseRate = rate;
    }

    function _calculateLetAmountInToken(address token, uint amount) internal view returns (uint) {
        address factory = _factory;
        address letToken = _letToken;
        address pool = I(factory).getPair(token, letToken);
        (address token0, ) = letToken < token ? (letToken, token) : (token, letToken);
        (uint reserve0, uint reserve1, ) = I(pool).getReserves();
        (uint reserveToken, uint reserveBUSD) = token == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
        return (amount * reserveToken) / reserveBUSD;
    }

    function getRate() public view returns (uint rate) {
        address stableCoin = _stableCoin;
        //console.log(block.timestamp);
        uint time = block.timestamp - 1609459200; //portable
        //console.log('time:');
        //console.log(time);
        uint price = _calculateLetAmountInToken(stableCoin, 1e18);
        //console.log('price:');
        //console.log(price);
        if (price > 1e18) {
            rate = baseRate / price / time;
        } else {
            //console.log('args:');
            //console.log(baseRate);
            //console.log(time);
            rate = baseRate / 1e18 / time;
        }
    }

    function exp(uint base, uint e) internal pure returns (uint z) {
        for (uint i = 0; i < e; i++) {
            base /= 2;
            z *= base;
        }
    }

    // ADD
    function addBeneficiary(address a, uint amount, uint emission) public {
        require(msg.sender == _governance && amount >= bens[a].amount && emission >= bens[a].emission);
        totBenEmission += emission;
        require(totBenEmission <= 1e22);
        bens[a].lastClaim = uint64(block.number);
        bens[a].amount = uint128(amount);
        bens[a].emission = uint128(emission);
    }

    function addAirdropBulk(address[] memory r, uint[] memory amounts) external {
        require(msg.sender == _governance && r.length == amounts.length);
        for (uint i; i < r.length; i++) {
            require(amounts[i] < 20000e18);
            airdrops[r[i]].amount += uint64(amounts[i]);
            airdrops[r[i]].lastClaim = uint64(block.number);
        }
    }

    function addPosters(address[] memory r, uint[] memory amounts) external {
        require(msg.sender == _aggregator && r.length == amounts.length);
        for (uint i; i < r.length; i++) {
            require(amounts[i] < 2000e18);
            posters[r[i]].unapprovedAmount += uint128(amounts[i]);
        }
    }

    function editUnapprovedPosters(address[] memory r, uint[] memory amounts) external {
        require(msg.sender == _governance && r.length == amounts.length);
        for (uint i; i < r.length; i++) {
            require(amounts[i] < 2000e18);
            posters[r[i]].unapprovedAmount = uint128(amounts[i]);
        }
    }

    function approvePosters(address[] memory r) external {
        require(msg.sender == _governance, 'only governance');
        for (uint i; i < r.length; i++) {
            uint128 amount = posters[r[i]].unapprovedAmount;
            posters[r[i]].amount += amount;
            posters[r[i]].unapprovedAmount = 0;
            totalPosterRewards += amount;
            if (posters[r[i]].lastClaim == 0) {
                posters[r[i]].lastClaim = uint128(block.number);
            }
        }
    }

    // CLAIM
    function getStakingRewards(address a, uint amount) external {
        require(msg.sender == _staking);
        I(_letToken).transfer(a, amount); //token
    }

    function claimBenRewards() external returns (uint) {
        uint amount = bens[msg.sender].amount;
        uint lastClaim = bens[msg.sender].lastClaim;
        require(block.number > lastClaim, 'too early');
        require(amount > 0, 'not beneficiary');
        uint rate = getRate();
        rate = (rate * bens[msg.sender].emission) / 1e22;
        uint toClaim = (block.number - lastClaim) * rate;
        if (toClaim > bens[msg.sender].amount) {
            toClaim = bens[msg.sender].amount;
        }
        if (toClaim > I(_letToken).balanceOf(address(this))) {
            //this check was supposed to be added on protocol upgrade, emission was so slow, that it could not possibly trigger overflow
            toClaim = I(_letToken).balanceOf(address(this));
        }
        bens[msg.sender].lastClaim = uint64(block.number);
        bens[msg.sender].amount -= uint128(toClaim);
        I(_letToken).transfer(msg.sender, toClaim);
        return toClaim;
    }

    function claimAirdrop() external {
        _claimAirdrop(msg.sender);
    }

    function claimAirdropFor(address[] memory a) public {
        for (uint i; i < a.length; i++) {
            _claimAirdrop(a[i]);
        }
    }

    function _claimAirdrop(address a) private {
        require(airdrops[a].amount > 0 && I(_foundingEvent).genesisBlock() != 0 && block.number > airdrops[a].lastClaim);
        if (!airdrops[a].emissionIncluded) {
            airdrops[a].lastClaim = uint64(block.number);
            airdrops[a].amount -= 1e18;
            I(_letToken).transfer(a, 1e18);
            if (airdrops[a].amount > 0) {
                airdrops[a].emissionIncluded = true;
                totalAirdropEmissions += 1;
            }
        } else {
            uint toClaim = airdropAvailable(a);
            airdrops[a].lastClaim = uint64(block.number);
            airdrops[a].amount -= uint64(toClaim);
            if (airdrops[a].amount == 0) {
                totalAirdropEmissions -= 1;
                delete airdrops[a];
            }
            I(_letToken).transfer(a, toClaim);
        }
    }

    function airdropAvailable(address a) public view returns (uint) {
        uint airdrop = airdrops[a].amount;
        if (airdrop > 0) {
            uint reserved = airdrops[a].reserved;
            uint rate = getRate() / totalAirdropEmissions;
            if (rate > 20e13) {
                rate = 20e13;
            }
            uint amount = (block.number - airdrops[a].lastClaim) * rate;
            if (amount > airdrop - reserved) {
                amount = airdrop - reserved;
            }
            uint treasuryBalance = I(_letToken).balanceOf(address(this));
            if (amount > treasuryBalance) {
                amount = treasuryBalance;
            }
            return amount;
        } else {
            return 0;
        }
    }

    function claimPosterRewards() external {
        _claimPosterRewards(msg.sender);
    }

    function claimPosterRewardsWithSignature(address a, bytes calldata signature) external {
        require(verify(a, signature), 'Signature does not match request');
        _claimPosterRewards(a);
    }

    function verify(address a, bytes memory signature) public view returns (bool) {
        require(signature.length == 65, 'Invalid signature length');
        bytes32 DOMAIN_TYPEHASH = keccak256('EIP712Domain(string name,uint256 chainId,address verifyingContract)');
        bytes32 POSTERREWARDS_TYPEHASH = keccak256('claimPosterRewards()');
        bytes32 r;
        bytes32 s;
        uint8 v;
        uint chainId;
        assembly {
            r := mload(add(signature, 0x20))
            s := mload(add(signature, 0x40))
            v := byte(0, mload(add(signature, 0x60)))
            chainId := chainid()
        }
        bytes32 domainSeparator = keccak256(abi.encode(DOMAIN_TYPEHASH, keccak256(bytes('Aletheo Treasury')), chainId, address(this)));
        bytes32 structHash = keccak256(abi.encode(POSTERREWARDS_TYPEHASH, a));
        bytes32 digest = keccak256(abi.encodePacked('\x19\x01', domainSeparator, structHash));
        address signer = ecrecover(digest, v, r, s);
        return signer == a;
    }

    function claimPosterRewardsFor(address[] memory a) public {
        for (uint i; i < a.length; i++) {
            _claimPosterRewards(a[i]);
        }
    }

    function _claimPosterRewards(address a) private {
        require(posters[a].amount > 0 && block.number > posters[a].lastClaim);
        uint toClaim = posterRewardsAvailable(a);
        posters[a].lastClaim = uint128(block.number);
        posters[a].amount -= uint128(toClaim);
        uint treasuryBalance = I(_letToken).balanceOf(address(this));
        if (totalPosterRewards >= toClaim) {
            totalPosterRewards -= toClaim;
        } else {
            totalPosterRewards = 0;
        }
        uint toClaimInitial = toClaim;
        uint airdrop = airdrops[a].amount;
        if (airdrop >= toClaim) {
            if (toClaim * 2 <= treasuryBalance) {
                airdrops[a].amount -= uint64(toClaim);
                toClaim *= 2;
            }
        } else {
            if (airdrop > 0) {
                if (toClaim + airdrop <= treasuryBalance) {
                    toClaim += airdrop;
                    delete airdrops[a];
                    totalAirdropEmissions -= 1;
                }
            }
        }
        uint founder = founders[a].amount;
        if (founder >= toClaimInitial) {
            if (toClaimInitial + toClaim <= treasuryBalance) {
                founders[a].amount -= uint128(toClaimInitial);
                toClaim += toClaimInitial;
                totalFounderRewards -= toClaimInitial;
            }
        } else {
            if (founder > 0) {
                if (toClaim + founder <= treasuryBalance) {
                    toClaim += founder;
                    founders[a].amount = 0;
                    totalFounderRewards -= founder;
                }
            }
        }

        if (posters[a].amount == 0) {
            posters[a].lastClaim = 0;
        }
        if (address(this).balance <= 1e17) {
            _sendGasInstead(a, toClaim);
        } else {
            I(_letToken).transfer(a, toClaim);
        }
    }

    function _sendGasInstead(address to, uint amount) internal {
        address[] memory ar = new address[](2);
        ar[0] = _letToken;
        ar[1] = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c; //wbnb
        I(_router).swapExactTokensForEth(amount, 0, ar, to, 2 ** 256 - 1);
        (bool success, ) = payable(to).call{value: address(this).balance}('');
        require(success);
    }

    function posterRewardsAvailable(address a) public view returns (uint) {
        uint posterAmount = posters[a].amount;
        if (posterAmount > 0) {
            uint reserved = posters[a].reserved;
            uint rate = (((getRate() * posterAmount) / totalPosterRewards) * posterRate) / 1000;
            uint amount = (block.number - posters[a].lastClaim) * rate;
            if (amount > posterAmount - reserved) {
                amount = posterAmount - reserved;
            }
            uint treasuryBalance = I(_letToken).balanceOf(address(this));
            if (amount > treasuryBalance) {
                amount = treasuryBalance;
            }
            return amount;
        } else {
            return 0;
        }
    }

    function claimFounderRewards() external {
        _claimFounderRewards(msg.sender);
    }

    function claimFounderRewardsFor(address a) public {
        _claimFounderRewards(a);
    }

    function _claimFounderRewards(address a) private {
        uint genesis = uint128(I(_foundingEvent).genesisBlock());
        if (founders[a].registered == false && genesis != 0) {
            uint deposit = I(_foundingEvent).deposits(a);
            if (deposit > 0) {
                founders[a].amount = uint128(deposit);
                founders[a].lastClaim = uint128(genesis);
                founders[a].registered = true;
                if (totalFounderRewards == 0) {
                    totalFounderRewards = I(_foundingEvent).sold();
                }
            }
        }
        require(founders[a].amount > 0 && block.number > founders[a].lastClaim);
        uint toClaim = founderRewardsAvailable(a);
        founders[a].lastClaim = uint128(block.number);
        founders[a].amount -= uint128(toClaim);
        if (totalFounderRewards >= toClaim) {
            totalFounderRewards -= toClaim;
        } else {
            totalFounderRewards = 0;
        }
        I(_letToken).transfer(a, toClaim);
    }

    function founderRewardsAvailable(address a) public view returns (uint) {
        if (founders[a].registered == true) {
            uint foundersAmount = founders[a].amount;
            if (foundersAmount > 0) {
                uint reserved = founders[a].reserved;
                uint rate = (getRate() * 5 * foundersAmount) / totalFounderRewards;
                uint amount = (block.number - founders[a].lastClaim) * rate;
                if (amount > foundersAmount - reserved) {
                    amount = foundersAmount - reserved;
                }
                uint treasuryBalance = I(_letToken).balanceOf(address(this));
                if (amount > treasuryBalance) {
                    amount = treasuryBalance;
                }
                return amount;
            } else {
                return 0;
            }
        } else {
            uint amount = I(_foundingEvent).deposits(a);
            return amount;
        }
    }

    /// OTC MARKET
    function otcReassignment(address from, address to, uint amount, uint t) public {
        require(msg.sender == otcMarket);
        if (t == 0) {
            founders[from].reserved -= amount;
            founders[from].amount -= uint128(amount);
            founders[to].amount += uint128(amount);
            founders[to].lastClaim = uint128(block.number);
            if (!founders[to].registered) {
                founders[to].registered = true;
            }
        } else if (t == 1) {
            posters[from].reserved -= amount;
            posters[from].amount -= uint128(amount);
            posters[to].amount += uint128(amount);
            posters[to].lastClaim = uint128(block.number);
        } else {
            airdrops[from].reserved -= amount;
            airdrops[from].amount -= uint64(amount);
            airdrops[to].amount += uint64(amount);
            airdrops[to].lastClaim = uint64(block.number);
            airdrops[to].emissionIncluded = airdrops[from].emissionIncluded;
        }
    }

    function reserveForOTC(address a, uint amount, uint t) public {
        require(msg.sender == otcMarket);
        if (t == 0) {
            require(founders[a].amount > amount);
            founders[a].reserved += amount;
        } else if (t == 1) {
            require(posters[a].amount > amount);
            posters[a].reserved += amount;
        } else {
            require(airdrops[a].amount > amount);
            airdrops[a].reserved += amount;
        }
    }

    function withdrawFromOTC(address a, uint amount, uint t) public {
        require(msg.sender == otcMarket);
        if (t == 0) {
            founders[a].reserved -= amount;
        } else if (t == 1) {
            posters[a].reserved -= amount;
        } else {
            airdrops[a].reserved -= amount;
        }
    }
}
