/**
 *Submitted for verification at FtmScan.com on 2021-10-28
*/

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
	uint public totalDeposits;
	uint256 private _lock;
	address private _letToken;

	constructor() {_deployer = msg.sender; _letToken=0x944B79AD758c86Df6d004A14F2f79B25B40a4229;}
	function startLGE(uint hc) external {require(msg.sender == _deployer);if(hardcap != 0){require(hc<hardcap);}_lgeOngoing = true; hardcap = hc;}
	function triggerLaunch() public {require(msg.sender == _deployer);_createLiquidity();}

	function depositFtm() external payable {
		require(_lgeOngoing == true); uint amount = msg.value; uint deployerShare = amount/20;
		amount -= deployerShare; _deployer.transfer(deployerShare); deposits[msg.sender] += amount; totalDeposits+=amount; 
		if(address(this).balance>=hardcap||block.number>=20730000){_createLiquidity();}
	}

	function _createLiquidity() internal {
		genesisBlock = block.number;
		address WFTM = 0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83;
		address staking = 0x844D4992375368Ce4Bd03D19307258216D0dd147;
		address factory = 0xEF45d134b73241eDa7703fa787148D9C9F4950b0;
		address router = 0x16327E3FbDaCA3bcF7E38F5Af2599D2DDc33aE52;
		address tknFTMLP = I(factory).getPair(_letToken,WFTM); if (tknFTMLP == address(0)) {tknFTMLP=I(factory).createPair(_letToken, WFTM);}
		//I(_letToken).approve(address(router), 1e23);//careful, if token contract does not have hardcoded allowance for the router you need this line
		I(router).addLiquidityETH{value: address(this).balance}(_letToken,1e23,0,0,staking,2**256-1);//this might still fail like with other idos, manual liquidity creation option might be mandatory with Uniswap v2
		I(staking).genesis(address(this).balance, tknFTMLP,block.number);
		delete _lgeOngoing;
	}

	function toggleEmergency() public { require(msg.sender==_deployer); if(_emergency != true){_emergency = true; delete _lgeOngoing;} else{delete _emergency;} }
	function withdraw() public { require(_emergency == true && deposits[msg.sender]>0 && _lock!=1);_lock=1; payable(msg.sender).transfer(deposits[msg.sender]); _lock=0; }

    function manualLiquidityCreation() external {
    	require(msg.sender == _deployer&& address(this).balance>0); genesisBlock = block.number;
    	_deployer.transfer(totalDeposits); I(_letToken).transfer(_deployer, 1e23); delete _lgeOngoing;
    }

    function addFounderManually(address a) external payable{//in case of migration
    	require(msg.sender == _deployer);
    	uint amount = msg.value; uint deployerShare = amount/20;amount -= deployerShare; _deployer.transfer(deployerShare);
    	deposits[a]+=amount;
    }
}
