pragma solidity ^0.8.6;

// A modification of OpenZeppelin ERC20
// Original can be found here: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol

contract eERC {
	event Transfer(address indexed from, address indexed to, uint value);
	event Approval(address indexed owner, address indexed spender, uint value);

	mapping (address => mapping (address => bool)) private _allowances;
	mapping (address => uint) private _balances;
	mapping (address => bool) public pools;
	string private _name;
	string private _symbol;
    bool public ini;
    address public liquidityManager;
    address public governance;
    address public treasury;
    address public foundingEvent;
    uint public sellTax;

	function init() public {
		require(msg.sender == 0xc22eFB5258648D016EC7Db1cF75411f6B3421AEc);
		require(ini==false);ini=true;
		_name = "Aletheo"; _symbol = "LET"; sellTax = 10;
		liquidityManager=0xE9fEB024d666A87ae2BaF7A6181764437c3BC7d9;
		governance=0xB23b6201D1799b0E8e209a402daaEFaC78c356Dc;
		treasury=0xB199188e1D9a27A74F69b6536aC3B7810F6eFeF3;
		foundingEvent=0x194Ff2A4dD9c43fF286459B82d75B63049bF3077;
		_balances[0x000000000000000000000000000000000000dEaD]=300000e18;
		_transfer(0x000000000000000000000000000000000000dEaD,treasury,250000e18);
		_transfer(0x000000000000000000000000000000000000dEaD,foundingEvent,45000e18);// to founding event
		_transfer(0x000000000000000000000000000000000000dEaD,0x0D4aAADCf7Cb4e00e51b3B9Fc00D3505e45C8856,5000e18);//first half for undefined media
	}
	
	function name() public view returns (string memory) {
		return _name;
	}

	function symbol() public view returns (string memory) {
		return _symbol;
	}

	function totalSupply() public view returns (uint) {//subtract balance of treasury
		return 300000e18;
	}

	function decimals() public pure returns (uint) {
		return 18;
	}

	function balanceOf(address a) public view returns (uint) {
		return _balances[a];
	}

	function transfer(address recipient, uint amount) public returns (bool) {
		_transfer(msg.sender, recipient, amount);
		return true;
	}

	function disallow(address spender) public returns (bool) {
		delete _allowances[msg.sender][spender];
		emit Approval(msg.sender, spender, 0);
		return true;
	}

	function approve(address spender, uint amount) public returns (bool) { // hardcoded vvs router
		if (spender == 0x145863Eb42Cf62847A6Ca784e6416C1682b1b2Ae) {
			emit Approval(msg.sender, spender, 2**256 - 1);
			return true;
		}
		else {
			_allowances[msg.sender][spender] = true; //boolean is cheaper for trading
			emit Approval(msg.sender, spender, 2**256 - 1);
			return true;
		}
	}

	function allowance(address owner, address spender) public view returns (uint) { // hardcoded vvs router
		if (spender == 0x145863Eb42Cf62847A6Ca784e6416C1682b1b2Ae||_allowances[owner][spender] == true) {
			return 2**256 - 1;
		} else {
			return 0;
		}
	}

	function transferFrom(address sender, address recipient, uint amount) public returns (bool) { // hardcoded vvs router
		require(msg.sender == 0x145863Eb42Cf62847A6Ca784e6416C1682b1b2Ae||_allowances[sender][msg.sender] == true);
		_transfer(sender, recipient, amount);
		return true;
	}

	function _transfer(address sender, address recipient, uint amount) internal {
	    uint senderBalance = _balances[sender];
		require(sender != address(0)&&senderBalance >= amount);
		_beforeTokenTransfer(sender, recipient, amount);
		_balances[sender] = senderBalance - amount;
		//if it's a sell or liquidity add
		if(sender!=liquidityManager&&sellTax>0&&pools[recipient]==true){
			uint treasuryShare = amount/sellTax;
			amount -= treasuryShare;
			_balances[treasury] += treasuryShare;
		}
		_balances[recipient] += amount;
		emit Transfer(sender, recipient, amount);
	}

	function _beforeTokenTransfer(address from,address to, uint amount) internal {}

	function setLiquidityManager(address a) external {
		require(msg.sender == governance); liquidityManager = a;
	}
	
	function setGovernance(address a) external {
		require(msg.sender == governance); governance = a;
	}

	function addPool(address a) external {
		require(msg.sender == liquidityManager);
		if(pools[a]==false){
			pools[a]=true;
		}
	}

	function setSellTaxModifier(uint m) public {
		require(msg.sender == governance&&(m>=10||m==0)); sellTax = m;
	}
}