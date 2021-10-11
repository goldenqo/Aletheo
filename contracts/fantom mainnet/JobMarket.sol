//SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

interface I{
    function getRewards(address a,uint rewToClaim) external returns(bool);
    function balanceOf(address) external view returns(uint);
    function genesisBlock() external view returns(uint);
}
//first implementation, most is off-chain
contract PosterRewards {
	bool private fubuki;
	address private oracle;
	address private deployer;
	uint private withdrawn;
	struct Poster {uint128 amount;}
	mapping (address => Poster) public posters;

	function init() public {
		require(fubuki==false);
		fubuki=true; //no reason
		deployer = 0x5C8403A2617aca5C86946E32E14148776E37f72A;
		oracle = 0x5C8403A2617aca5C86946E32E14148776E37f72A;//to change, after giving the oracle different address
	}

	function updatePosters(address[] memory r, uint[] memory amounts) external{//add recipients
		require(msg.sender == oracle);
		for(uint i = 0;i<r.length;i++) {posters[r[i]].amount += uint128(amounts[i]);}
	}

	function getRewards(uint amount)external{
	    uint genesisBlock = I(0x2f31E7527e69d235BF77b514dd5230941e6A9855).genesisBlock();
		uint allowed = (block.number - genesisBlock)*56e14 - withdrawn;//20% of all emission max
		require(amount <= allowed);
		require(posters[msg.sender].amount>=amount);
		posters[msg.sender].amount-=uint128(amount);
		withdrawn += amount;
		bool success = I(0x742133180738679782538C9e66A03d0c0270acE8).getRewards(msg.sender, amount); require(success == true);
	}

	function setOracle(address a) public {require(msg.sender==deployer); oracle = a;}

	function getOracleGas(uint amount) public {//additional limit for transparency, so oracle can't claim too much
		uint genesisBlock = I(0x2f31E7527e69d235BF77b514dd5230941e6A9855).genesisBlock();
		require(msg.sender==oracle&&genesisBlock != 0);
		uint allowed = (block.number - genesisBlock)*1e14 - withdrawn;//max ~0.33% of all emission
		if (allowed>=amount){
			bool success = I(0x742133180738679782538C9e66A03d0c0270acE8).getRewards(msg.sender, amount); require(success == true); withdrawn += amount;
		}
	}
}
