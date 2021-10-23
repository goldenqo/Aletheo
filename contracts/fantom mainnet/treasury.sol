//CHANGE ADDRESSES
//SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

interface I{ function transfer(address to, uint value) external returns(bool); function balanceOf(address) external view returns(uint); function genesisBlock() external view returns(uint);}

contract Treasury {
	address private _governance;
	bool private _init;
	uint public totBenEmission; // this limit is not really required because if deployer creates a lot of beneficiaries, it still would be a slow rug, which would just kill the project, but let's have it
	struct Beneficiary {uint128 amount; uint64 lastClaim; uint64 emission;}
	mapping (address => Beneficiary) public bens;
	struct Poster {uint128 amount;uint128 lastClaim;}
	mapping (address => Poster) public posters;
	struct AirdropRecepient {uint128 amount; uint128 lastClaim;}
	mapping (address => AirdropRecepient) public airdrops;
	struct Refund {uint128 amount; uint64 lastClaim; uint64 emission;}
	mapping (address => Refund) public refunds;
    	address private _oracle;
	address private _letToken;
	address private _founding;
	uint public totalPosters;
	uint public totalAirdrops;
	uint public totalRefunds;
	uint public totalRefundsEmission;

	function init() public {
		require(_init == false && msg.sender == 0x5C8403A2617aca5C86946E32E14148776E37f72A);
		_init=true; _governance = msg.sender;
		_letToken =0x1507590112821EFB0f9871D65Cf42c291aA948ab;
		_founding =0xF91C7639D32Aa2799BF703FC196208F7922A5587;
		addBen(0x5C8403A2617aca5C86946E32E14148776E37f72A,1e23,0,5e22);
	}

	function setGov(address a)external{ require(msg.sender==_governance); _governance=a; }
	function setOracle(address a)external{ require(msg.sender==_governance); _oracle=a; }
	function _getRate() internal view returns(uint){uint rate = 31e14; uint quarter = block.number/28e6;if (quarter>0) {for (uint i=0;i<quarter;i++) {rate=rate*4/5;}}return rate;}

// ADD
	function addBen(address a, uint amount, uint lastClaim, uint emission) public {
		require(msg.sender == _governance && bens[a].amount == 0 && totBenEmission <=1e23);
		if(lastClaim < block.number) {lastClaim = block.number;}
		uint lc = bens[a].lastClaim;
		if (lc == 0) {bens[a].lastClaim = uint64(lastClaim);}
		if (bens[a].amount == 0 && lc != 0) {bens[a].lastClaim = uint64(lastClaim);}
		bens[a].amount = uint128(amount);
		bens[a].emission = uint64(emission);
		totBenEmission+=emission;
	}

	function addAirdropR(address[] memory r,uint[] memory amounts) external{
		require(msg.sender == _governance);
		for(uint i = 0;i<r.length;i++) {
			if(airdrops[r[i]].amount==0){
				totalAirdrops+=1;
				airdrops[r[i]].amount = uint128(amounts[i]);
				if(airdrops[r[i]].lastClaim==0){ airdrops[r[i]].lastClaim=uint128(block.number); }
			}
		}
	}

	function addPosters(address[] memory r, uint[] memory amounts) external{
		require(msg.sender == _oracle);
		for(uint i = 0;i<r.length;i++) {
			if(posters[r[i]].amount==0){ totalPosters+=1;}
			posters[r[i]].amount += uint128(amounts[i]);
			if(posters[r[i]].lastClaim==0){ posters[r[i]].lastClaim=uint128(block.number);}
		}
	}

	function addRefunds(address[] memory r, uint[] memory amount, uint[] memory lastClaim, uint[] memory emission) public {
		require(msg.sender == _governance);
		for(uint i = 0;i<r.length;i++) {
			require(refunds[r[i]].amount == 0);
			if(lastClaim[i] < block.number) {lastClaim[i] = block.number;}
			uint lc = refunds[r[i]].lastClaim;
			if (lc == 0) {refunds[r[i]].lastClaim = uint64(lastClaim[i]);}
			if (refunds[r[i]].amount == 0 && lc != 0) {refunds[r[i]].lastClaim = uint64(lastClaim[i]);}
			refunds[r[i]].emission = uint64(emission[i]);
			totalRefundsEmission+=emission[i];
			refunds[r[i]].amount += uint128(amount[i]);
		}
	}

// CLAIM
	function getRewards(address a,uint amount) external{ //for staking
		uint genesisBlock = I(_founding).genesisBlock();
		require(genesisBlock != 0);
		require(msg.sender == 0xb9F9Ca7D36110CaD06ECDB52F07308487F2c00d9);//staking
		I(_letToken).transfer(a,amount);
	}

	function claimBenRewards() external returns(uint){
		uint genesisBlock = I(_founding).genesisBlock();
		uint lastClaim = bens[msg.sender].lastClaim;
		if (lastClaim < genesisBlock) {lastClaim = genesisBlock;}
		require(genesisBlock != 0 && block.number>lastClaim);
		uint rate = _getRate();	rate = rate*bens[msg.sender].emission/1e23;
		uint toClaim = (block.number - lastClaim)*rate;
		if(toClaim>bens[msg.sender].amount){toClaim=bens[msg.sender].amount;}//this check was supposed to be added on protocol upgrade, emission was so slow, that it could not possibly trigger overflow
		bens[msg.sender].lastClaim = uint64(block.number);
		bens[msg.sender].amount -= uint128(toClaim);
		I(_letToken).transfer(msg.sender, toClaim);
		return toClaim;
	}

	function claimAirdrop()external returns(uint){//founding event posters too
		uint genesisBlock = I(_founding).genesisBlock();
		require(airdrops[msg.sender].amount>0&&genesisBlock != 0&&block.number>airdrops[msg.sender].lastClaim&&block.number>genesisBlock);
		uint rate = _getRate(); uint toClaim = (block.number - airdrops[msg.sender].lastClaim)*rate/totalAirdrops;
		if(toClaim>airdrops[msg.sender].amount){toClaim=airdrops[msg.sender].amount;}
		airdrops[msg.sender].amount -= uint128(toClaim);
		if(airdrops[msg.sender].amount==0){totalAirdrops-=1;airdrops[msg.sender].lastClaim==0;}
		I(_letToken).transfer(msg.sender, toClaim); if(airdrops[msg.sender].amount == 0) {delete airdrops[msg.sender].amount;}
		return toClaim;
	}

	function claimPosterRewards()external returns(uint){ 
		uint genesisBlock = I(_founding).genesisBlock();
		require(posters[msg.sender].amount>0&&genesisBlock != 0&&block.number>posters[msg.sender].lastClaim&&block.number>genesisBlock);
		uint rate = 31e14; rate*=2; uint toClaim = (block.number - posters[msg.sender].lastClaim)*rate/totalPosters; // THIS NUMBER
		if(toClaim>posters[msg.sender].amount){toClaim=posters[msg.sender].amount;}
		posters[msg.sender].amount -= uint128(toClaim);
		I(_letToken).transfer(msg.sender, toClaim);
		if(posters[msg.sender].amount==0){totalPosters-=1;posters[msg.sender].lastClaim==0;}
		return toClaim;
	}

	function claimRefunds()external returns(uint){
		uint genesisBlock = I(_founding).genesisBlock();
		require(refunds[msg.sender].amount>0&&genesisBlock != 0&&block.number>refunds[msg.sender].lastClaim&&block.number>genesisBlock);
		uint rate = _getRate(); uint toClaim = (block.number - refunds[msg.sender].lastClaim)*rate/refunds[msg.sender].emission*totalRefundsEmission; // THIS NUMBER
		if(toClaim>refunds[msg.sender].amount){toClaim=refunds[msg.sender].amount;}
		refunds[msg.sender].amount -= uint128(toClaim);
		if(refunds[msg.sender].amount==0){totalRefundsEmission-=refunds[msg.sender].emission;refunds[msg.sender].lastClaim==0;}
		I(_letToken).transfer(msg.sender, toClaim);
		return toClaim;
	}

// IN CASE OF ANY ISSUE
	//function removeRefunds(address[] memory r) external{ require(msg.sender == _oracle); for(uint i = 0;i<r.length;i++) { delete refunds[r[i]]; } }
	//function removeAirdrops(address[] memory r) external{ require(msg.sender == _oracle); for(uint i = 0;i<r.length;i++) { delete airdrops[r[i]]; } }
	function removePosters(address[] memory r) external{ require(msg.sender == _oracle); for(uint i = 0;i<r.length;i++) { delete posters[r[i]]; } }
	//function removeBen(address a) public { require(msg.sender == _governance); totBenEmission-=bens[a].emission; delete bens[a]; }
}
