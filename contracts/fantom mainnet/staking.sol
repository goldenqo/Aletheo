// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;
interface I {
	function balanceOf(address a) external view returns (uint);
	function transfer(address recipient, uint amount) external returns (bool);
	function transferFrom(address sender,address recipient, uint amount) external returns (bool);
	function totalSupply() external view returns (uint);
	function getRewards(address a,uint rewToClaim) external returns(bool);
	function deposits(address a) external view returns(uint);
}

contract StakingContract {
	uint128 private _foundingFTMDeposited;
	uint128 private _foundingLPtokensMinted;
	address private _tokenFTMLP;
	uint32 private _genesis;
	uint private _genLPtokens;
	address public foundingEvent;
	address public letToken;
	address public treasury;
	uint public totalLetLocked;
	struct LPProvider {uint32 lastClaim; uint16 lastEpoch; bool founder; uint128 tknAmount; uint128 lpShare;uint128 lockedAmount;uint128 lockUpTo;}
	struct TokenLocker {uint128 amount; uint32 lastClaim; uint32 lockUpTo;}

	bytes32[] private _epochs;
	bytes32[] private _founderEpochs;

	mapping(address => LPProvider) private _ps;
	mapping(address => TokenLocker) private _ls;

	function init() public {
		foundingEvent = 0x2D9F853F1a71D0635E64FcC4779269A05BccE2E2;//change addresses
		letToken = 0x2D9F853F1a71D0635E64FcC4779269A05BccE2E2;
		treasury = 0x2D9F853F1a71D0635E64FcC4779269A05BccE2E2;
	}

	function genesis(uint foundingFTM, address tkn, uint gen) public {
		require(msg.sender == foundingEvent && _genesis != 0);
		_foundingFTMDeposited = uint128(foundingFTM);
		_foundingLPtokensMinted = uint128(I(tkn).balanceOf(address(this)));
		_tokenFTMLP = tkn;
		_genesis = uint32(gen);
		_createEpoch(0,false);
		_createEpoch(1e24,true);
	}

	function claimFounderStatus() public {
		uint FTMContributed = I(foundingEvent).deposits(msg.sender);
		require(FTMContributed > 0);
		require(_genesis != 0 && _ps[msg.sender].founder == false);
		_ps[msg.sender].founder = true;
		uint foundingFTM = _foundingFTMDeposited;
		uint lpShare = _foundingLPtokensMinted*FTMContributed/foundingFTM;
		uint tknAmount = FTMContributed*1e24/foundingFTM;
		_ps[msg.sender].lpShare = uint128(lpShare);
		_ps[msg.sender].tknAmount = uint128(tknAmount);
		_ps[msg.sender].lastClaim = uint32(_genesis);
		_ps[msg.sender].lockedAmount = uint128(lpShare/2);
		_ps[msg.sender].lockUpTo = uint128(block.number+2e6);
	}

	function unstakeLp(uint amount) public {
		(uint lastClaim,bool status,uint tknAmount,uint lpShare,uint lockedAmount) = getProvider(msg.sender);
		require(lpShare-lockedAmount >= amount);
		if (lastClaim != block.number) {_getRewards(msg.sender);}
		_ps[msg.sender].lpShare = uint128(lpShare - amount);
		uint toSubtract = tknAmount*amount/lpShare; // not an array of deposits. if a provider stakes and then stakes again, and then unstakes - he loses share as if he staked only once at lowest price he had
		_ps[msg.sender].tknAmount = uint128(tknAmount-toSubtract);
		bytes32 epoch; uint length;
		if (status == true) {length = _founderEpochs.length; epoch = _founderEpochs[length-1];}
		else{length = _epochs.length; epoch = _epochs[length-1];_genLPtokens -= amount;}
		(uint80 eBlock,uint96 eAmount,) = _extractEpoch(epoch);
		eAmount -= uint96(toSubtract);
		_storeEpoch(eBlock,eAmount,status,length);
		I(_tokenFTMLP).transfer(address(msg.sender), amount*10/9);
	}

	function getRewards() public {_getRewards(msg.sender);}

	function _getRewards(address a) internal {
		uint lastClaim = _ps[a].lastClaim;
		uint epochToClaim = _ps[a].lastEpoch;
		bool status = _ps[a].founder;
		uint tknAmount = _ps[a].tknAmount;
		require(block.number>lastClaim);
		_ps[a].lastClaim = uint32(block.number);
		uint rate = _getRate();
		uint eBlock; uint eAmount; uint eEnd; bytes32 epoch; uint length; uint toClaim;
		if (status) {length = _founderEpochs.length;} else {length = _epochs.length;}
		if (length>0 && epochToClaim < length-1) {
			for (uint i = epochToClaim; i<length;i++) {
				if (status) {epoch = _founderEpochs[i];} else {epoch = _epochs[i];}
				(eBlock,eAmount,eEnd) = _extractEpoch(epoch);
				if(i == length-1) {eBlock = lastClaim;}
				toClaim += _computeRewards(eBlock,eAmount,eEnd,tknAmount,rate);
			}
			_ps[a].lastEpoch = uint16(length-1);
		} else {
			if(status){epoch = _founderEpochs[length-1];} else {epoch = _epochs[length-1];}
			eAmount = uint96(bytes12(epoch << 80)); toClaim = _computeRewards(lastClaim,eAmount,block.number,tknAmount,rate);
		}
		bool success = I(treasury).getRewards(a, toClaim); require(success == true);
	}

	function _getRate() internal view returns(uint){uint rate = 56e14; uint halver = block.number/75e6;if (halver>2) {for (uint i=1;i<halver;i++) {rate=rate*3/4;}}return rate;}//THIS NUMBER

	function _computeRewards(uint eBlock, uint eAmount, uint eEnd, uint tknAmount, uint rate) internal view returns(uint){
		if(eEnd==0){eEnd = block.number;}
		uint blocks = eEnd - eBlock;
		uint toClaim = blocks*tknAmount*rate/eAmount;
	}

	function lock25days(uint amount) public {// the game theory disallows the deployer to exploit this lock
		_getLockRewards(msg.sender);
		_ls[msg.sender].lockUpTo=uint32(block.number+2e6);
		if(amount>0){
			require(I(letToken).balanceOf(msg.sender)>=amount);
			_ls[msg.sender].amount+=uint128(amount);
			I(letToken).transferFrom(msg.sender,address(this),amount);
			totalLetLocked+=amount;
		}
	}

	function _getLockRewards(address a) internal {// no epochs for this, not required
		if(_ls[a].lockUpTo>block.number&&_ls[a].amount>0){
			uint blocks = block.number - _ls[msg.sender].lastClaim;
			uint rate = _getRate();
			uint toClaim = blocks*_ls[a].amount*rate/totalLetLocked;
			bool success = I(treasury).getRewards(a, toClaim); require(success == true);
		}
		_ls[msg.sender].lastClaim = uint32(block.number);
	}

	function unlock(address tkn, uint amount) public {
		if(tkn = _tokenFTMLP){
			require(_ps[msg.sender].lockedAmount >= amount && block.number>=_ps[msg.sender].lockUpTo);
			_ps[msg.sender].lockedAmount -= uint128(amount);
		}
		if(tkn == letToken){
			require(_ls[msg.sender].amount>=amount);
			_getLockRewards(msg.sender);
			_ls[msg.sender].amount-=uint128(amount);
			I(letToken).transfer(msg.sender,amount);
			totalLetLocked-=amount;
		}
	}

	function stakeLP(uint amount) public {
		address tkn = _tokenFTMLP;
		uint length = _epochs.length;
		uint lastClaim = _ps[msg.sender].lastClaim;
		require(_ps[msg.sender].founder==false && I(tkn).balanceOf(msg.sender)>=amount);
		I(tkn).transferFrom(msg.sender,address(this),amount);
		if(lastClaim==0){_ps[msg.sender].lastClaim = uint32(block.number);}
		else if (lastClaim != block.number) {_getRewards(msg.sender);}
		bytes32 epoch = _epochs[length-1];
		(uint80 eBlock,uint96 eAmount,) = _extractEpoch(epoch);
		eAmount += uint96(amount);
		_storeEpoch(eBlock,eAmount,false,length);
		_ps[msg.sender].lastEpoch = uint16(_epochs.length);
		uint genLPtokens = _genLPtokens;
		genLPtokens += amount;
		_genLPtokens = genLPtokens;
		uint share = amount*I(letToken).balanceOf(tkn)/genLPtokens;
		_ps[msg.sender].tknAmount += uint128(share);
		_ps[msg.sender].lpShare += uint128(amount);
		_ps[msg.sender].lockedAmount = uint128(amount);
		_ps[msg.sender].lockUpTo = uint128(block.number+2e6);
	}

	function _extractEpoch(bytes32 epoch) internal pure returns (uint80,uint96,uint80){
		uint80 eBlock = uint80(bytes10(epoch));
		uint96 eAmount = uint96(bytes12(epoch << 80));
		uint80 eEnd = uint80(bytes10(epoch << 176));
		return (eBlock,eAmount,eEnd);
	}
 
	function _storeEpoch(uint80 eBlock, uint96 eAmount, bool founder, uint length) internal {
		uint eEnd;
		if(block.number-1209600>eBlock){eEnd = block.number-1;}// so an epoch can be bigger than 2 weeks, it's normal behavior and even desirable
		bytes memory by = abi.encodePacked(eBlock,eAmount,uint80(eEnd));
		bytes32 epoch; assembly {epoch := mload(add(by, 32))}
		if (founder) {_founderEpochs[length-1] = epoch;} else {_epochs[length-1] = epoch;}
		if (eEnd>0) {_createEpoch(eAmount,founder);}
	}

	function _createEpoch(uint amount, bool founder) internal {
		bytes memory by = abi.encodePacked(uint80(block.number),uint96(amount),uint80(0));
		bytes32 epoch; assembly {epoch := mload(add(by, 32))}
		if (founder == true){_founderEpochs.push(epoch);} else {_epochs.push(epoch);}
	}
// VIEW FUNCTIONS ==================================================
	function getVoter(address a) external view returns (uint128,uint128,uint128,uint128,uint128,uint128) {
		return (_ps[a].tknAmount,_ps[a].lpShare,_ps[a].lockedAmount,_ps[a].lockUpTo,_ls[a].amount,_ls[a].lockUpTo);
	}

	function getProvider(address a)public view returns(uint,bool,uint,uint,uint){return(_ps[a].lastClaim,_ps[a].founder,_ps[a].tknAmount,_ps[a].lpShare,_ps[a].lockedAmount);}

	function getAPYInfo()public view returns(uint,uint,uint,uint){return(_foundingFTMDeposited,_foundingLPtokensMinted,_genesis,_genLPtokens);}
}