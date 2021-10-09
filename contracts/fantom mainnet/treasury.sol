//CHANGE ETH ADDRESSES TO FTM ADDRESSES

//SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

interface I{function transfer(address to, uint value) external returns(bool);function balanceOf(address) external view returns(uint); function genesisBlock() external view returns(uint);}

contract Treasury {
	address private _governance;
	bool private _init;
	uint private _maxBenEmission;
	uint public bensTotal; // this limit is not really required because if deployer creates a lot of beneficiaries, it still would be a slow rug, which would just kill the project, but let's have it
	struct Beneficiary {uint88 amount; uint32 lastClaim; uint16 emission;}
	mapping (address => Beneficiary) public bens;
	mapping (address => bool) public airdrops;
	address public letToken;

	function init() public {
		require(_init == false && msg.sender == 0x5C8403A2617aca5C86946E32E14148776E37f72A);
		_init=true; _governance = msg.sender;
		letToken =0x2D9F853F1a71D0635E64FcC4779269A05BccE2E2;
		founding =0x2D9F853F1a71D0635E64FcC4779269A05BccE2E2;
		
		//_maxBenEmission = 2e4;
		setBen(0x2D9F853F1a71D0635E64FcC4779269A05BccE2E2,32857142857e12,0,5e3);
	}

	function setBen(address a, uint amount, uint lastClaim, uint emission) public {
		require(msg.sender == _governance && amount<=4e22 && bens[a].amount == 0 && lastClaim < block.number+1e6 && emission >= 1e2 && emission <=5e3 && bensTotal<6);
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

// these checks leave less room for deployer to be malicious. it's basically useless to plug-in malicious logic, because it's impossible to claim a lot maliciously, it's still within emission limits
	function getRewards(address a,uint amount) external{ //for posters, staking and oracles
		uint genesisBlock = I(founding).genesisBlock();//founding
		require(genesisBlock != 0 && msg.sender == 0x93bF14C7Cf7250b09D78D4EadFD79FCA01BAd9F8 || msg.sender == 0x2D9F853F1a71D0635E64FcC4779269A05BccE2E2 || msg.sender == 0x742133180738679782538C9e66A03d0c0270acE8);
		if (msg.sender == 0x2D9F853F1a71D0635E64FcC4779269A05BccE2E2) {// if job market(posters)
			uint withd =  999e24 - I(letToken).balanceOf(address(this));// balanceOf(treasury)
			uint allowed = (block.number - genesisBlock)*56e14 - withd;//20% of all emission max
			require(amount <= allowed);
		}
		if (msg.sender == 0x2D9F853F1a71D0635E64FcC4779269A05BccE2E2) {// if oracle registry
			uint withd =  999e24 - I(letToken).balanceOf(address(this));// balanceOf(treasury)
			uint allowed = (block.number - genesisBlock)*28e14 - withd;//10% of all emission max, maybe actually should be less, depends on stuff
			require(amount <= allowed);
		}
		I(letToken).transfer(a, amount);
	}
	function addAirdropR(address[] memory r) external{//add recipients
		require(msg.sender == 0x5C8403A2617aca5C86946E32E14148776E37f72A);//make sure that sending it programmatically so no human error
		for(uint i = 0;i<r.length;i++) {
			airdrops[r[i]] = true;
		}
	}

	function claimAirdrop()external{
		uint genesisBlock = I(founding).genesisBlock();//founding
		require(airdrops[msg.sender]==true&&genesisBlock != 0);
		require(block.number>genesisBlock+3e6);
		uint withd =  999e24 - I(letToken).balanceOf(address(this));// balanceOf(treasury)
		uint allowed = (block.number - genesisBlock- 3e6)*28e14 - withd;//3 million blocks delay, only 10% of all emission
		if (allowed>=420e18){airdrops[msg.sender]=false;I(letToken).transfer(msg.sender, 42e18);}
	}
}