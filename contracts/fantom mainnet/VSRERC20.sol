//CHANGE ADDRESSES
// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

// A modification of OpenZeppelin ERC20
// Original can be found here: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol

// Very slow erc20 implementation. Limits release of the funds with emission rate in _beforeTokenTransfer().
// Even if there will be a vulnerability in upgradeable contracts defined in _beforeTokenTransfer(), it won't be devastating.
// Developers can't simply rug.

interface I{function genesisBlock() external view returns(uint);}

contract eERC {
	event Transfer(address indexed from, address indexed to, uint value);
	event Approval(address indexed owner, address indexed spender, uint value);
	event BulkTransfer(address indexed from, address[] indexed recipients, uint[] amounts);

	mapping (address => mapping (address => bool)) private _allowances;
	mapping (address => uint) private _balances;

	string private _name;
	string private _symbol;
	bool private _init;
    address private _treasury;
    address private _founding;
    address private _staking;
    uint private _treasuryFees;
    
	function init() public {
	    require(_init == false && msg.sender == 0x5C8403A2617aca5C86946E32E14148776E37f72A);
		_init = true; _name = "Aletheo"; _symbol = "LET";
		_treasury = 0x32cFC998a98450b11D07F698992d8bF79f67876B;
		_founding = 0xF91C7639D32Aa2799BF703FC196208F7922A5587;
		_staking = 0xb9F9Ca7D36110CaD06ECDB52F07308487F2c00d9;
		_balances[0x5C8403A2617aca5C86946E32E14148776E37f72A] = 5e24;
	}
	
	function name() public view returns (string memory) {return _name;}
	function symbol() public view returns (string memory) {return _symbol;}
	function totalSupply() public view returns (uint) {return 5e24-_balances[0x32cFC998a98450b11D07F698992d8bF79f67876B];}//subtract balance of treasury
	function decimals() public pure returns (uint) {return 18;}
	function balanceOf(address a) public view returns (uint) {return _balances[a];}
	function transfer(address recipient, uint amount) public returns (bool) {_transfer(msg.sender, recipient, amount);return true;}
	function disallow(address spender) public returns (bool) {delete _allowances[msg.sender][spender];emit Approval(msg.sender, spender, 0);return true;}

	function approve(address spender, uint amount) public returns (bool) { // hardcoded uniswapv2 router 02, transfer helper library, also spirit
		if (spender == 0x16327E3FbDaCA3bcF7E38F5Af2599D2DDc33aE52||spender == 0xF491e7B69E4244ad4002BC14e878a34207E38c29) {emit Approval(msg.sender, spender, 2**256 - 1);return true;}
		else {_allowances[msg.sender][spender] = true;emit Approval(msg.sender, spender, 2**256 - 1);return true;}
	}

	function allowance(address owner, address spender) public view returns (uint) { // uniswapv2 router 02, transfer helper library
		if (spender == 0x16327E3FbDaCA3bcF7E38F5Af2599D2DDc33aE52||spender == 0xF491e7B69E4244ad4002BC14e878a34207E38c29||_allowances[owner][spender] == true) {return 2**256 - 1;} else {return 0;}//ADD STAKING
	}

	function transferFrom(address sender, address recipient, uint amount) public returns (bool) { // uniswapv2 router 02, transfer helper library
		require(msg.sender == 0x16327E3FbDaCA3bcF7E38F5Af2599D2DDc33aE52||msg.sender == 0xF491e7B69E4244ad4002BC14e878a34207E38c29||_allowances[sender][msg.sender] == true);
		_transfer(sender, recipient, amount);return true;
	}

	function _transfer(address sender, address recipient, uint amount) internal {
	    uint senderBalance = _balances[sender];
		require(sender != address(0)&&senderBalance >= amount);
		_beforeTokenTransfer(sender, amount);
		if(recipient!=0xb9F9Ca7D36110CaD06ECDB52F07308487F2c00d9){ //staking
			uint treasuryShare = amount/100;
			amount -= treasuryShare;
			_balances[0x32cFC998a98450b11D07F698992d8bF79f67876B] += treasuryShare;
			_treasuryFees+=treasuryShare;
		}
		_balances[sender] = senderBalance - amount;
		_balances[recipient] += amount;
		emit Transfer(sender, recipient, amount);
	}

	function bulkTransfer(address[] memory recipients, uint[] memory amounts) public returns (bool) { // will be used by the contract, or anybody who wants to use it
		require(recipients.length == amounts.length && amounts.length < 100,"human error");
		uint senderBalance = _balances[msg.sender]; uint total;
		for(uint i = 0;i<amounts.length;i++) {total += amounts[i];_balances[recipients[i]] += amounts[i];}
		require(senderBalance >= total,"balance is low");
		if (msg.sender == 0x32cFC998a98450b11D07F698992d8bF79f67876B) {_beforeTokenTransfer(msg.sender, total);}//treasury
		_balances[msg.sender] = senderBalance - total; emit BulkTransfer(msg.sender, recipients, amounts); return true;
	}

	function _beforeTokenTransfer(address from, uint amount) internal view {
		if(from == 0x32cFC998a98450b11D07F698992d8bF79f67876B) {//from treasury
			uint genesisBlock = I(0xF91C7639D32Aa2799BF703FC196208F7922A5587).genesisBlock();//founding
			require(genesisBlock != 0);
			uint treasury = _balances[0x32cFC998a98450b11D07F698992d8bF79f67876B] - _treasuryFees; //treasury
			uint withd =  49e23 - treasury;
			uint allowed = (block.number - genesisBlock)*31e15 - withd;
			require(amount <= allowed && amount <= treasury);
		}
	}
}
