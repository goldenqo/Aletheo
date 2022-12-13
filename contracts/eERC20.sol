// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.6;

// A modification of OpenZeppelin ERC20
// Original can be found here: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol

contract eERC {
	event Transfer(address indexed from, address indexed to, uint value);
	event Approval(address indexed owner, address indexed spender, uint value);

	string private _name;
	string private _symbol;
    bool public ini;
    address public liquidityManager;
    address public governance;
    address public treasury;
    address public foundingEvent;
	address public bridge;
    uint public sellTax;

	mapping (address => mapping (address => bool)) private _allowances;
	mapping (address => uint) private _balances;
	mapping (address => bool) public pools;
	
	bool tradingEnabled;

	function init() public {
		require(msg.sender == 0xc22eFB5258648D016EC7Db1cF75411f6B3421AEc);
		require(ini==false);ini=true;
		_name = "Aletheo"; _symbol = "LET"; sellTax = 10;
		liquidityManager=0x539cB40D3670fE03Dbe67857C4d8da307a70B305;
		governance=0xB23b6201D1799b0E8e209a402daaEFaC78c356Dc;
		treasury=0xee59B379eC7DC18612B39f35eD8A46C78463E744;
		foundingEvent=0x6a0c5131fC600009cf2dfC3b5f67901767563d79;
		bridge=0x26aDe75473FA75da09d7A8B73151A068eF9AD228;
		_balances[0x000000000000000000000000000000000000dEaD]=300000e18;
		_transfer(0x000000000000000000000000000000000000dEaD,treasury,245000e18);
		_transfer(0x000000000000000000000000000000000000dEaD,foundingEvent,45000e18);
		_transfer(0x000000000000000000000000000000000000dEaD,0xB23b6201D1799b0E8e209a402daaEFaC78c356Dc,5000e18);//then this to cryptolamba
		_transfer(0x000000000000000000000000000000000000dEaD,bridge,5000e18);
	}
	
	function name() public view returns (string memory){
		return _name;
	}

	function symbol() public view returns (string memory){
		return _symbol;
	}

	function totalSupply() public pure returns (uint) {//subtract balance of treasury
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

	function approve(address spender, uint amount) public returns (bool) { // hardcoded pancake router
		if (spender == 0x10ED43C718714eb63d5aA57B78B54704E256024E) {
			emit Approval(msg.sender, spender, 2**256 - 1);
			return true;
		}
		else {
			_allowances[msg.sender][spender] = true; //boolean is cheaper for trading
			emit Approval(msg.sender, spender, 2**256 - 1);
			return true;
		}
	}

	function allowance(address owner, address spender) public view returns (uint) { // hardcoded pancake router
		if (spender == 0x10ED43C718714eb63d5aA57B78B54704E256024E||_allowances[owner][spender] == true) {
			return 2**256 - 1;
		} else {
			return 0;
		}
	}

	function transferFrom(address sender, address recipient, uint amount) public returns (bool) { // hardcoded pancake router
		require(msg.sender == 0x10ED43C718714eb63d5aA57B78B54704E256024E||_allowances[sender][msg.sender] == true);
		_transfer(sender, recipient, amount);
		return true;
	}

	function _transfer(address sender, address recipient, uint amount) internal {
	    uint senderBalance = _balances[sender];
		require(sender != address(0)&&senderBalance >= amount);
		_beforeTokenTransfer(sender, recipient, amount);
		_balances[sender] = senderBalance - amount;
		//if it's a sell or liquidity add
		if(!tradingEnabled){
			require(pools[sender]!=true);
		}
		if(sender!=liquidityManager&&sender!=foundingEvent&&sellTax>0&&pools[recipient]==true){
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

	function adjustBridgeBalance() public{// limited capacity to protect liquidity
		require(msg.sender==governance);
		uint poolBalances = _balances[I(liquidityManager).defPoolFrom()]+_balances[I(liquidityManager).defPoolTo()];
		if(_balances[bridge]<poolBalances/100){
			_transfer(treasury,bridge,poolBalances/100);
		}
	}

	function enableTrading() public{
		require(msg.sender==governance||msg.sender==foundingEvent);
		tradingEnabled==true;
	}
}

interface I{
	function defPoolTo() external view returns(address);
	function defPoolFrom() external view returns(address);
	function sync() external;
}
