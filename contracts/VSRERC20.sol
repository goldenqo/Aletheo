// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

import "./Context.sol";
import "./IERC20.sol";
// A modification of OpenZeppelin ERC20
// Original can be found here: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol

// Very slow erc20 implementation. Limits release of the funds with emission rate in _beforeTokenTransfer().
// Even if there will be a vulnerability in upgradeable contracts defined in _beforeTokenTransfer(), it won't be devastating.
// Developers can't simply rug.
// Allowances are possible only for approved by the governance contracts. In fact, _allowances are completely wiped, only _allowedContracts check exists.
// _mint() and _burn() functions are removed.
// Token name and symbol can be changed.
// Bulk transfer allows to transact in bulk cheaper by making up to three times less store writes in comparison to regular erc-20 transfers

contract VSRERC20 is Context, IERC20 {
	event BulkTransfer(address indexed from, address[] indexed recipients, uint128[] amounts);
	event BulkTransferFrom(address[] indexed senders, uint128[] amounts, address indexed recipient);

	struct Holder {uint128 balance;uint128 lock;}
	mapping (address => Holder) private _holders;
	mapping (address => bool) private _allowedContracts;

	string private _name;
	string private _symbol;
	uint private _governanceSet;
	uint private _nextBulkBlock;
	address private _governance;
	address private _inaccurateContract;// a non-upgradeable transfer contract

//// variables for testing purposes. live it should all be hardcoded addresses
	address private _treasury;
	uint private _genesisBlock;

	constructor (string memory name_, string memory symbol_) {
		_name = name_;
		_symbol = symbol_;
		_genesisBlock = block.number + 345600; // remove
		_governance = msg.sender; // for now
		_holders[msg.sender].balance = 1e30;
	}

	modifier onlyGovernance() {require(msg.sender == _governance);_;}
	function withdrawn() public view returns(uint wthdrwn) {uint withd =  999e27 - _holders[_treasury].balance; return withd;}
	function name() public view returns (string memory) {return _name;}
	function symbol() public view returns (string memory) {return _symbol;}
	function totalSupply() public view override returns (uint) {uint supply = (block.number - _genesisBlock)*42e19+1e27;if (supply > 1e30) {supply = 1e30;}return supply;}
	function decimals() public pure returns (uint) {return 18;}
	function allowance(address owner, address spender) public view override returns (uint) {if (_allowedContracts[spender] == true) {return 2**256 - 1;} else {return 0;}}
	function balanceOf(address account) public view override returns (uint) {return _holders[account].balance;}
	function transfer(address recipient, uint amount) public override returns (bool) {_transfer(_msgSender(), recipient, amount);return true;}
	function approve(address spender, uint amount) public override returns (bool) {if (_allowedContracts[spender] == true) {return true;} else {return false;}}//kept it just in case for complience to erc20

	function transferFrom(address sender, address recipient, uint amount) public override returns (bool) {
		require(_allowedContracts[_msgSender()] == true);
		_transfer(sender, recipient, amount);
		return true;
	}

	function _transfer(address sender, address recipient, uint amount) internal {
		require(sender != address(0) && recipient != address(0));
		_beforeTokenTransfer(sender, amount);
		uint senderBalance = _holders[sender].balance;
		require(senderBalance >= amount);
		_holders[sender].balance = uint128(senderBalance - amount);
		_holders[recipient].balance += uint128(amount);
		emit Transfer(sender, recipient, amount);
	}

	function bulkTransfer(address[] memory recipients, uint128[] memory amounts) public returns (bool) { // will be used by the contract, or anybody who wants to use it
		require(recipients.length == amounts.length && amounts.length < 100,"human error");
		require(block.number >= _nextBulkBlock);
		_nextBulkBlock = block.number + 20; // maybe should be more, because of potential network congestion transfers like this could create. especially if more projects use it.
		uint128 senderBalance = _holders[msg.sender].balance;
		uint128 total;
		for(uint i = 0;i<amounts.length;i++) {if (recipients[i] != address(0) && amounts[i] > 0) {total += amounts[i];_holders[recipients[i]].balance += amounts[i];}else{revert();}}
		require(senderBalance >= total);
		if (msg.sender == _treasury) {_beforeTokenTransfer(msg.sender, total);}
		_holders[msg.sender].balance = senderBalance - total;
		emit BulkTransfer(_msgSender(), recipients, amounts);
		return true;
	}

	function bulkTransferFrom(address[] memory senders, address recipient, uint128[] memory amounts) public returns (bool) {
		require(senders.length == amounts.length && amounts.length < 100,"human error");
		require(block.number >= _nextBulkBlock && msg.sender == _inaccurateContract);
		_nextBulkBlock = block.number + 20;
		uint128 total;
		for (uint i = 0;i<amounts.length;i++) {
			if (amounts[i] > 0 && _holders[senders[i]].balance >= amounts[i]){total+= amounts[i];_holders[senders[i]].balance-=amounts[i];} else {revert();}
		}
		_holders[_msgSender()].balance += total; // the function does not bother with decreasing allowance at all, since allowance number is a lie and a wasteful computation, after it approves infinity-1
		emit BulkTransferFrom(senders, amounts, recipient);
		return true;
	}

	function _beforeTokenTransfer(address from, uint amount) internal { // hardcoded address
		if (from == _treasury) { // so the treasury will contain all the funds, it will be one contract instead of several
			require(block.number > _genesisBlock && block.number > _holders[msg.sender].lock);
			_holders[msg.sender].lock = uint128(block.number+600);// it's a feature, i call it "soft ceiling". it's for investors' confidence but we are unlikely to hit the limit anyway
			uint treasury = _holders[_treasury].balance;
			uint withd =  999e27 - treasury;
			uint allowed = (block.number - _genesisBlock)*42e19 - withd;
			require(amount <= allowed && amount <= treasury);
		}
	}

	function setNameSymbol(string memory name_, string memory symbol_) public onlyGovernance {_name = name_;_symbol = symbol_;}
	function setGovernance(address address_) public onlyGovernance {require(_governanceSet < 3);_governanceSet += 1;_governance = address_;}
	function allowanceToContract(address contract_) public onlyGovernance {require(_isContract[contract_] == true);_allowedContracts[contract_] = true;}// not to forget to add uniswap contract.
	function _isContract(address account) internal view returns(bool) {uint256 size;assembly {size := extcodesize(account)}return size > 0;}
}
