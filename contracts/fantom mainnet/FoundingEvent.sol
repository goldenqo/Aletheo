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

	constructor() {_deployer = msg.sender; _letToken=0x1507590112821EFB0f9871D65Cf42c291aA948ab;}
	function startLGE(uint hc) external {require(msg.sender == _deployer);if(hardcap != 0){require(hc<hardcap);}_lgeOngoing = true; hardcap = hc;}
	function triggerLaunch() public {require(msg.sender == _deployer);_createLiquidity();}

	function depositFtm() external payable {
		require(_lgeOngoing == true); uint amount = msg.value; uint deployerShare = amount/20;
		amount -= deployerShare; _deployer.transfer(deployerShare); deposits[msg.sender] += amount; if(address(this).balance>=hardcap||block.number>=20300000){_createLiquidity();}
	}

	function _createLiquidity() internal {
		genesisBlock = block.number;
		address WFTM = 0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83;
		address staking = 0xb9F9Ca7D36110CaD06ECDB52F07308487F2c00d9;
		address factory = 0x152eE697f2E276fA89E96742e9bB9aB1F2E61bE3;
		address router = 0xF491e7B69E4244ad4002BC14e878a34207E38c29;
		address tknFTMLP = I(factory).getPair(_letToken,WFTM); if (tknFTMLP == address(0)) {tknFTMLP=I(factory).createPair(_letToken, WFTM);}
		//I(_letToken).approve(address(router), 1e23);//careful, if token contract does not have hardcoded allowance for the router you need this line
		I(router).addLiquidityETH{value: address(this).balance}(_letToken,1e23,0,0,staking,2**256-1);//this might still fail like with other idos
		I(staking).genesis(address(this).balance, tknFTMLP,block.number);
		delete _lgeOngoing;
	}

	function toggleEmergency() public { require(msg.sender==_deployer); if(_emergency != true){_emergency = true; delete _lgeOngoing;} else{delete _emergency;} }
	function withdraw() public { require(_emergency == true && deposits[msg.sender]>0 && _lock!=1);_lock=1; payable(msg.sender).transfer(deposits[msg.sender]); _lock=0; }

    function manualLiquidityCreation() external {
    	require(msg.sender == _deployer&& address(this).balance>0); genesisBlock = block.number;
    	_deployer.transfer(address(this).balance); I(_letToken).transfer(_deployer, 1e23); delete _lgeOngoing;
    }
}
