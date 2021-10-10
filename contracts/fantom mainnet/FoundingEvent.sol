pragma solidity ^0.7.6;
// author: SamPorter1984
interface I{
	function getPair(address t, address t1) external view returns(address pair);
	function createPair(address t, address t1) external returns(address pair);
	function genesis(uint Ftm,address pair,uint gen) external;
	function deposit() external payable;
	function transfer(address to, uint value) external returns(bool);
	function mint(address to) external returns(uint liquidity);
}

contract FoundingEvent {
	mapping(address => uint) public deposits;
	address payable private _deployer;
	bool private _lgeOngoing;
	uint public hardcap;
	uint public genesisBlock;

	constructor() {_deployer = msg.sender;}
	function startLGE(uint hc) external {require(msg.sender == _deployer && hc < 2e23 && hc > 1e23);if(hardcap != 0){require(hc<hardcap);}_lgeOngoing = true; hardcap = hc;}//hc between 200k and 100k
	function triggerLaunch() public {require(msg.sender == _deployer);_createLiquidity();}

	function depositFtm() external payable {
		require(_lgeOngoing == true);
		uint amount = msg.value;
		uint deployerShare = amount/100; amount -= deployerShare; _deployer.transfer(deployerShare);
		deposits[msg.sender] += amount;
		if (address(this).balance > hardcap) {_createLiquidity();}
	}

	function _createLiquidity() internal {
		genesisBlock = block.number;
		address WFTM = 0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83;
		address token = 0x2D9F853F1a71D0635E64FcC4779269A05BccE2E2;//to change on deployment
		address staking = 0x2D9F853F1a71D0635E64FcC4779269A05BccE2E2;//to change on deployment
		address factory = 0x152eE697f2E276fA89E96742e9bB9aB1F2E61bE3;
		address tknFTMLP = I(factory).getPair(token,WFTM);
		if (tknFTMLP == address(0)) {tknFTMLP=I(factory).createPair(token, WFTM);}
		uint FTMDeposited = address(this).balance;
		I(WFTM).deposit{value: FTMDeposited}();
		I(token).transfer(tknFTMLP, 1e24);
		I(WFTM).transfer(tknFTMLP, FTMDeposited);
		I(tknFTMLP).mint(staking);
		I(staking).genesis(FTMDeposited, tknFTMLP,block.number);
		delete _deployer; delete hardcap;
	}
}
