pragma solidity ^0.8.0;

/*
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes memory) {
        this; // silence state mutability warning without generating bytecode - see https://github.com/ethereum/solidity/issues/2691
        return msg.data;
    }
}

contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor() {
        address msgSender = _msgSender();
        _owner = msgSender;
        emit OwnershipTransferred(address(0), msgSender);
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(_owner == _msgSender(), "Ownable: caller is not the owner");
        _;
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions anymore. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby removing any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(
            newOwner != address(0),
            "Ownable: new owner is the zero address"
        );
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
}

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20 {
    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address recipient, uint256 amount)
        external
        returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender)
        external
        view
        returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `sender` to `recipient` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

// amount of tokens in presale contract
// presale token price
// amount of tokens and amount of avax going to liquidity pool
// amount of tokens and amount of avax for marketing whatever expenses
contract SnowPresale is Ownable {

	address public owner;
	uint public startBlock;
	uint public endBlock;
	uint public snowToAvaxRatio;
	uint public maxContribution;
	bool public presaleOngoing;
	address public router;
	address public factory;

	event Whitelisted(address whitelisted);

	event PresaleStarted();

	mapping(address => bool) public whitelisted;
	
	mapping(address => uint) public deposits;

	modifier onlyWhitelisted(){
		require(whitelisted[msg.sender]==true);
		_;
	}

	constructor(){
		owner = msg.sender;
		startBlock = block.number;
		endBlock = 999999999999999999999999;
		snowToAvaxRatio = 20;
		maxContribution = 1e23;
		router = 0x000000000000000000000000000000000000dEaD;
		factory = 0x000000000000000000000000000000000000dEaD;
	}

	function deposit() external payable onlyWhitelisted {
		require(block.number<endBlock,"presale has ended");
		if(msg.value > maxContribution) {

		}
		if(msg.value > IERC20(snow).balanceOf(address(this))) {

		}
		uint snowAmount = msg.value*snowToAvaxRatio;
		IERC20(snow).transfer(msg.sender, snowAmount);
	}

	function addToWhitelist(address[] memory addresses) external onlyOwner returns(uint quantityOfAddedAddresses){
		for(uint i=0;i<addresses.length;i++){
			whitelisted[addresses[i]]=true;
			emit Whitelisted(addresses[i]);
		}
		return addresses.length;
	}

	function removeFromWhitelist(address[] memory addresses) external onlyOwner returns(uint quantityOfRemovedAddresses){
		for(uint i=0;i<addresses.length;i++){
			whitelisted[addresses[i]]=false;
			emit Blacklisted(addresses[i]);
		}
		return addresses.length;
	}

	function startPresale(uint endBlock_) external onlyOwner {
		presaleOngoing = true;
		endBlock = endBlock_;
		emit PresaleStarted();
	}


//I(letToken).approve(address(router), 1e23);//careful, if token contract does not have hardcoded allowance for the router you need this line
//		I(router).addLiquidityETH{value: address(this).balance}(letToken,I(letToken).balanceOf(address(this)),0,0,staking,2**256-1);
//		

//	address payable private _deployer;
//	bool private _lgeOngoing;
//	bool private _emergency;
//	uint public hardcap;
//	uint public genesisBlock;
//	uint private _lock;
//	address private _letToken;
//	address private _treasury;

//	function init() external {
//		_deployer = 0x5C8403A2617aca5C86946E32E14148776E37f72A;
		//_letToken=0x7DA2331C522D4EDFAf545d2F5eF61406D9d637A9;
//		_treasury=0xeece0f26876a9b5104fEAEe1CE107837f96378F2;//change
//	}

//	function startLGE(uint hc) external {
//		require(msg.sender == _deployer);
//		if(hardcap != 0){
//			require(hc<hardcap);
//		}
//		_lgeOngoing = true;
//		hardcap = hc;
//	}

//	function triggerLaunch() public {
//		require(msg.sender == _deployer);
//		_createLiquidity();
//	}
//
//	function depositFtm() external payable {
//		require(_lgeOngoing == true);
//		uint amount = msg.value;
//		require(amount<=5e20);
//		uint deployerShare = amount/20;
//		amount -= deployerShare;
//		_deployer.transfer(deployerShare);
//		deposits[msg.sender] += amount;
//		require(deposits[msg.sender]<=475e18);
//		if(address(this).balance>=hardcap||block.number>=22712000){
//			_createLiquidity();
//		}
//	}

//	function _createLiquidity() internal {
//		genesisBlock = block.number;
//		address WFTM = 0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83;
//		address staking = 0x0FaCF0D846892a10b1aea9Ee000d7700992B64f8;
//		address factory = 0x152eE697f2E276fA89E96742e9bB9aB1F2E61bE3;
//		address router = 0xF491e7B69E4244ad4002BC14e878a34207E38c29;
//		address letToken=_letToken;
//		address tknFTMLP = I(factory).getPair(letToken,WFTM);
//		address treasury=_treasury;
//		if (tknFTMLP == address(0)) {
//			tknFTMLP=I(factory).createPair(letToken, WFTM);
//		}
//		uint balance = address(this).balance;
//		//** could be required for future mirrors. ftm starting supply must be fixed, for other mirrors it might be fluctuating
//		//uint amount;
//		//if (hardcap>balance){
//		//	amount = 1e23*balance/hardcap;
//		//}
//		//**
//		//I(letToken).approve(address(router), 1e23);//careful, if token contract does not have hardcoded allowance for the router you need this line
//		I(router).addLiquidityETH{value: address(this).balance}(letToken,I(letToken).balanceOf(address(this)),0,0,staking,2**256-1);
//		I(staking).genesis(balance, tknFTMLP,block.number);
//		//I(letToken).transfer(treasury,I(letToken).balanceOf(address(this)));// burn excess to treasury, in case if hardcap is not reached by the end block. for mirror launches
//		I(letToken).genesis(block.number,tknFTMLP);
//		I(treasury).genesis(block.number);
//		delete _lgeOngoing;
//	}

//	function toggleEmergency() public {
//		require(msg.sender==_deployer);
//		if(_emergency != true){
//			_emergency = true;
//			delete _lgeOngoing;
//		} else{
//			delete _emergency;
//		}
//	}

//	function withdraw() public {
//		require(_emergency == true && deposits[msg.sender]>0 && _lock!=1);
//		_lock=1;
//		payable(msg.sender).transfer(deposits[msg.sender]);
//		delete deposits[msg.sender];
//		_lock=0;
//	}

//in case of migration
//    function addFounderManually(address a) external payable{
//    	require(msg.sender == _deployer);
//    	uint amount = msg.value;
//    	require(amount<=5e20);
//    	uint deployerShare = amount/20;
//    	amount -= deployerShare;
//    	_deployer.transfer(deployerShare);
//    	deposits[a]+=amount;
//    	require(deposits[a]<=475e18);
//    }
}