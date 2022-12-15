// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.6;

// A modification of OpenZeppelin ERC20
// Original can be found here: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol

contract eERC {
    event Transfer(address indexed from, address indexed to, uint value);
    event Approval(address indexed owner, address indexed spender, uint value);

    string public name;
    string public symbol;
    uint private _totalSupply;
    bool public ini;
    address public liquidityManager;
    address public governance;
    address public treasury;
    address public foundingEvent;
    address public bridge;
    uint public sellTax;

    mapping(address => mapping(address => bool)) private _allowances;
    mapping(address => uint) private _balances;
    mapping(address => bool) public pools;

    function init() public {
        require(msg.sender == 0xc22eFB5258648D016EC7Db1cF75411f6B3421AEc);
        require(ini == false);
        ini = true;
        name = 'Aletheo';
        symbol = 'LET';
        liquidityManager = 0x539cB40D3670fE03Dbe67857C4d8da307a70B305;
        governance = 0xB23b6201D1799b0E8e209a402daaEFaC78c356Dc;
        treasury = 0xee59B379eC7DC18612B39f35eD8A46C78463E744;
        foundingEvent = 0x6a0c5131fC600009cf2dfC3b5f67901767563d79;
        bridge = 0x26aDe75473FA75da09d7A8B73151A068eF9AD228;
        _mint(0xB23b6201D1799b0E8e209a402daaEFaC78c356Dc, 15000e18);
        _mint(treasury, 50000e18);
        _mint(foundingEvent, 90000e18);
    }

    function totalSupply() public view returns (uint) {
        return _totalSupply - _balances[0x000000000000000000000000000000000000dEaD] - _balances[0x0000000000000000000000000000000000000000];
    }

    function decimals() public pure returns (uint) {
        return 18;
    }

    function balanceOf(address a) public view returns (uint) {
        return _balances[a];
    }

    function disallow(address spender) public returns (bool) {
        delete _allowances[msg.sender][spender];
        emit Approval(msg.sender, spender, 0);
        return true;
    }

    function approve(address spender, uint amount) public returns (bool) {
        if (spender == 0x10ED43C718714eb63d5aA57B78B54704E256024E) {
            // hardcoded pancake router
            emit Approval(msg.sender, spender, 2 ** 256 - 1);
            return true;
        } else {
            _allowances[msg.sender][spender] = true;
            emit Approval(msg.sender, spender, 2 ** 256 - 1);
            return true;
        }
    }

    function allowance(address owner, address spender) public view returns (uint) {
        // hardcoded pancake router
        if (spender == 0x10ED43C718714eb63d5aA57B78B54704E256024E || _allowances[owner][spender] == true) {
            return 2 ** 256 - 1;
        } else {
            return 0;
        }
    }

    function transfer(address recipient, uint amount) public returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint amount) public returns (bool) {
        // hardcoded pancake router
        require(msg.sender == 0x10ED43C718714eb63d5aA57B78B54704E256024E || _allowances[sender][msg.sender] == true);
        _transfer(sender, recipient, amount);
        return true;
    }

    function _transfer(address sender, address recipient, uint amount) internal {
        uint senderBalance = _balances[sender];
        require(sender != address(0) && senderBalance >= amount);
        _balances[sender] = senderBalance - amount;
        //if it's a sell or liquidity add
        if (sellTax > 0 && pools[recipient] == true && sender != liquidityManager && sender != foundingEvent) {
            uint treasuryShare = (amount * sellTax) / 1000;
            amount -= treasuryShare;
            _balances[treasury] += treasuryShare;
        }
        _balances[recipient] += amount;
        emit Transfer(sender, recipient, amount);
    }

    //function signature: ffc3a769
    function transferBatch(address[] memory tos, uint[] memory amounts) public {
        require(tos.length == amounts.length, 'bulkTransferTreasury: array mismatch');
        uint totalAmount;
        for (uint i; i < tos.length; i++) {
            totalAmount += amounts[i];
            _balances[tos[i]] += amounts[i];
            emit Transfer(address(this), tos[i], amounts[i]);
        }
        uint senderBalance = _balances[msg.sender];
        require(senderBalance >= totalAmount);
        _balances[msg.sender] = senderBalance - totalAmount;
    }

    function addPool(address a) external {
        require(msg.sender == liquidityManager);
        if (pools[a] == false) {
            pools[a] = true;
        }
    }

    function setLiquidityManager(address a) external {
        require(msg.sender == governance);
        liquidityManager = a;
    }

    function setGovernance(address a) external {
        require(msg.sender == governance);
        governance = a;
    }

    function setSellTax(uint st) public {
        require(msg.sender == governance && st <= 50);
        sellTax = st;
    }

    function mint(address account, uint amount) public {
        require(msg.sender == treasury);
        _mint(account, amount);
    }

    function _mint(address account, uint amount) internal {
        require(account != address(0), 'ERC20: mint to the zero address');
        uint prevTotalSupply = _totalSupply;
        _totalSupply += amount;
        require(_totalSupply > prevTotalSupply);
        _balances[account] += amount;
        emit Transfer(address(0), account, amount);
    }
}

interface I {
    function defPoolTo() external view returns (address);

    function defPoolFrom() external view returns (address);

    function sync() external;
}
