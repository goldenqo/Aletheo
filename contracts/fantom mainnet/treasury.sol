//CHANGE ADDRESSES

//SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

interface I{function transfer(address to, uint value) external returns(bool);function balanceOf(address) external view returns(uint); function genesisBlock() external view returns(uint);}

contract Treasury {
	address private _governance;
	bool private _init;
	uint public bensTotal; // this limit is not really required because if deployer creates a lot of beneficiaries, it still would be a slow rug, which would just kill the project, but let's have it
	struct Beneficiary {uint88 amount; uint32 lastClaim; uint16 emission;}
	mapping (address => Beneficiary) public bens;
	mapping (address => bool) public airdrops;
	address public letToken;
	address public founding;
	uint public claimedDrops;

	function init() public {
		require(_init == false && msg.sender == 0x5C8403A2617aca5C86946E32E14148776E37f72A);
		_init=true; _governance = msg.sender;
		letToken =0x05658a207a56AA2d6b2821883D373f59Ac6A2fC3;
		founding =0x2f31E7527e69d235BF77b514dd5230941e6A9855;
		setBen(0x2D9F853F1a71D0635E64FcC4779269A05BccE2E2,1e23,0,5e3);
	}

	function setBen(address a, uint amount, uint lastClaim, uint emission) public {
		require(msg.sender == _governance && amount<=1e23 && bens[a].amount == 0 && lastClaim < block.number+1e6 && emission >= 1e2 && emission <=5e3 && bensTotal<6);
		if(lastClaim < block.number) {lastClaim = block.number;}
		uint lc = bens[a].lastClaim;
		if (lc == 0) {bens[a].lastClaim = uint32(lastClaim);}
		if (bens[a].amount == 0 && lc != 0) {bens[a].lastClaim = uint32(lastClaim);}
		bens[a].amount = uint88(amount);
		bens[a].emission = uint16(emission);
		bensTotal+=1;
	}

	function getBenRewards() external{
		uint genesisBlock = I(founding).genesisBlock();//founding
		uint lastClaim = bens[msg.sender].lastClaim;
		if (lastClaim < genesisBlock) {lastClaim = genesisBlock;}
		require(genesisBlock != 0 && lastClaim > block.number);
		uint rate = 3333e7; uint quarter = block.number/75e6;
		if (quarter>1) { for (uint i=1;i<quarter;i++) {rate=rate*3/4;} }
		uint toClaim = (block.number - lastClaim)*bens[msg.sender].emission*rate;
		bens[msg.sender].lastClaim = uint32(block.number);
		bens[msg.sender].amount -= uint88(toClaim);
		if(bens[msg.sender].amount==0){bensTotal-=1;}
		I(letToken).transfer(msg.sender, toClaim);
	}

	function getRewards(address a,uint amount) external{ //for posters, staking and oracles
		uint genesisBlock = I(founding).genesisBlock();//founding
		require(genesisBlock != 0);
		require(msg.sender == 0xB321C6207A215360aC376A816c44B77347D9dc53 || msg.sender == 0x206c22DC9ee61612898018E01D7DaC87AAB97fb0 || msg.sender == 0xcD7961852B972adEF3724D5251fD9BdcDd80D138);
		I(letToken).transfer(a,amount);
	}
	
	function addAirdropR(address[] memory r) external{//add recipients
		require(msg.sender == _governance);//make sure that sending it programmatically so no human error
		for(uint i = 0;i<r.length;i++) { airdrops[r[i]] = true; }
	}

	function claimAirdrop()external{
		uint genesisBlock = I(founding).genesisBlock();//founding
		require(airdrops[msg.sender]==true&&genesisBlock != 0);
		require(block.number>genesisBlock+3e6);
		uint em = (block.number - genesisBlock- 3e6)*28e14;//3 million blocks delay, only 10% of all emission
		require(em>=claimedDrops);
		uint allowed = em - claimedDrops;
		if (allowed>=420e18){
			airdrops[msg.sender]=false;
			I(letToken).transfer(msg.sender, 420e18);
			claimedDrops+=420e18;
		}
	}
	
	function setGov(address a)external{
	    require(msg.sender==0x5C8403A2617aca5C86946E32E14148776E37f72A);
	    _governance=a;
	}
}
