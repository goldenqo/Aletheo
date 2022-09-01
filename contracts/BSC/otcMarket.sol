pragma solidity ^0.8.6;
// author: SamPorter1984
interface I{
    function getPair(address t, address t1) external view returns(address pair);
    function createPair(address t, address t1) external returns(address pair);
    function transfer(address to, uint value) external returns(bool);
    function transferFrom(address from, address to, uint amount) external returns(bool);
    function balanceOf(address) external view returns(uint);
    function approve(address spender, uint256 value) external returns (bool);
}

contract OTCMarket {
    // pretty much the only reference point for front-end
    // without listening to events it will be impossible to adequately interact with positions
    event EditAsk(address account, uint amount, uint price, uint timestamp);
    event EditBid(address account, uint amount, uint price, uint timestamp);

    address private _deployer;
    address private _letToken;
    address private _treasury;
    address public USDC;
    bool public ini;

    struct Ask {//selling LET
        uint128 amount;
        uint128 price;
        uint128 founderAmount;
        uint128 founderPrice;
        uint128 posterAmount;
        uint128 posterPrice;
        uint128 airdropAmount;
        uint128 airdropPrice;
    }
    mapping(address=>Ask) public asks;

    struct Bid {//buying LET
        uint128 amount;
        uint128 price;
        uint128 founderAmount;
        uint128 founderPrice;
        uint128 posterAmount;
        uint128 posterPrice;
        uint128 airdropAmount;
        uint128 airdropPrice;
    }
    mapping(address=>Bid) public bids;

    function init() external {
        require(msg.sender==0xc22eFB5258648D016EC7Db1cF75411f6B3421AEc);
        _deployer=0xB23b6201D1799b0E8e209a402daaEFaC78c356Dc;
        _letToken=0x98AAF20cdFaaEf9A4a9dE26a4be52dF4E699fc89;
        _treasury=0x793bb3681F86791D65786EfB3CE7fcCf25370454;
        USDC = 0xc21223249CA28397B4B6541dfFaEcC539BfF0c59;
    }

    function editAsk(uint a_, uint p_,uint fa_,uint fp_,uint pa_,uint pp_,uint aa_,uint ap_)public {
        address a = msg.sender;
        uint amount = asks[a].amount;
        if(a_!=amount){
            //if(a_>amount){ I(_letToken).transferFrom(a,address(this),a_-amount); }
            //else{ I(_letToken).transfer(a,amount-a_); }
            asks[a].amount = uint128(a_);
        }
        asks[a].price = uint128(p_);


        amount = asks[a].founderAmount;
        if(fa_!=amount){
            //if(fa_>amount){ I(_treasury).reserveForOTC(a,fa_-amount,0); }
            //else{ I(_treasury).withdrawFromOTC(a,amount-fa_,0); }//alert should it be called unreserve?
            asks[a].founderAmount = uint128(fa_);
        }
        asks[a].founderPrice = uint128(fp_);


        amount = asks[a].posterAmount;
        if(pa_!=amount){
            //if(pa_>amount){ I(_treasury).reserveForOTC(a,pa_-amount,0); }
            //else{ I(_treasury).withdrawFromOTC(a,amount-pa_,0); }
            asks[a].posterAmount = uint128(pa_);
        }
        asks[a].posterPrice = uint128(pp_);


        amount = asks[a].airdropAmount;
        if(aa_!=amount){
            //if(aa_>amount){ I(_treasury).reserveForOTC(a,aa_-amount,0); }
            //else{ I(_treasury).withdrawFromOTC(a,amount-aa_,0); }
            asks[a].airdropAmount = uint128(aa_);
        }
        asks[a].airdropPrice = uint128(ap_);
        emit EditAsk(a,a_,p_,block.timestamp);
    }

    function editBid(uint a_,uint p_,uint fa_,uint fp_,uint pa_,uint pp_,uint aa_,uint ap_)public{
        address a = msg.sender;
        uint amount = bids[a].amount;
        uint price = bids[a].price;
        uint total = amount*price/1e6;
        uint totalNew = a_*p_/1e6;
        if(totalNew!=total){
            _editBid(a, totalNew, total);
            bids[a].amount = uint128(a_);
            bids[a].price = uint128(p_);
        }

        amount = bids[a].founderAmount;
        price = bids[a].founderPrice;
        total = amount*price/1e6;
        totalNew = fa_*fp_/1e6;
        if(totalNew !=total){
            _editBid(a, totalNew, total);
            bids[a].founderAmount = uint128(fa_);
            bids[a].founderPrice = uint128(fp_);
        }

        amount = bids[a].posterAmount;
        price = bids[a].posterPrice;
        total = amount*price/1e6;
        totalNew = pa_*pp_/1e6;
        if(totalNew!=total){
            _editBid(a, totalNew, total);
            bids[a].posterAmount = uint128(pa_);
            bids[a].posterPrice = uint128(pp_);
        }

        amount = bids[a].airdropAmount;
        price = bids[a].airdropPrice;
        total = amount*price/1e6;
        totalNew = aa_*ap_/1e6;
        if(totalNew!=total){
            _editBid(a, totalNew, total);
            bids[a].airdropAmount = uint128(aa_);
            bids[a].airdropPrice = uint128(ap_);
        }
        emit EditBid(a,a_,p_,block.timestamp);
    }

    function _editBid(address a, uint totalNew, uint total) private{
        if(totalNew!=total){
            if(totalNew>total){
            //alert    I(USDC).transferFrom(a,address(this),totalNew-total);
            } else{
            //    I(USDC).transfer(a,total-totalNew);
            }
        }
    }

    function buyWithUSDC(uint amount, address[] memory asks_)public returns(uint cost){
        for(uint n=0;n<asks_.length;n++){
            address acc = asks_[n];
            uint askAmount = asks[acc].amount;
            if(askAmount>0){
                uint price = asks[acc].price;
                if(amount>askAmount){
                    amount -= askAmount;
                    cost += askAmount*price/1e6;
                    asks[acc].amount=0;
                    asks[acc].price=0;
                    I(USDC).transferFrom(msg.sender,acc,askAmount*price/1e6);
                } else {
                    asks[acc].amount-=uint128(amount);
                    cost += amount*price/1e6;
                    I(USDC).transferFrom(msg.sender,acc,amount*price/1e6);
                    break;
                }
            }
        }
        require(cost>0);
        I(_letToken).transfer(msg.sender,amount);
        return cost;
    }

    function sellToUSDC(uint amount, address[] memory bids_)public returns (uint cost){
        for(uint n=0;n<bids_.length;n++){
            address acc = bids_[n];
            uint bidAmount = bids[acc].amount;
            if(bidAmount>0){
                uint price = bids[acc].price;
                if(amount>bidAmount){
                    amount -= bidAmount;
                    cost += bidAmount*price;
                    bids[acc].amount=0;
                    bids[acc].price=0;
                    I(_letToken).transferFrom(msg.sender,acc,bidAmount);
                } else {
                    asks[acc].amount-=uint128(amount);
                    cost += amount*price;
                    I(_letToken).transferFrom(msg.sender,acc,amount);
                    break;
                }
            }
        }
        require(cost>0);
        I(USDC).transfer(msg.sender,cost);
        return(cost);
    }

    function buyLockedSharesWithUSDC(uint amount, address[] memory asks_, uint t) public returns(uint cost){
        for(uint n=0;n<asks_.length;n++){
            address acc = asks_[n];
            uint askAmount;
            if(t==0){ askAmount = asks[acc].founderAmount; }
            else if(t==1){ askAmount = asks[acc].posterAmount; } 
            else { askAmount = asks[acc].airdropAmount; }
            if(askAmount>0){
                uint price;
                if(t==0){ price = asks[acc].founderPrice; }
                else if(t==1){ price = asks[acc].posterPrice; }
                else { price = asks[acc].airdropPrice; }
                if(amount>askAmount){
                    amount -= askAmount;
                    cost += askAmount*price/1e6;
                    //I(USDC).transferFrom(msg.sender,acc,askAmount*price/1e6);
                    //I(_treasury).otcReassigment(acc,msg.sender,askAmount,t);
                    if(t==0){ asks[acc].founderAmount=0; asks[acc].founderPrice=0; }
                    else if(t==1){ asks[acc].posterAmount=0; asks[acc].posterPrice=0; }
                    else { asks[acc].airdropAmount=0; asks[acc].airdropPrice=0; }
                } else {
                    if(t==0){ asks[acc].founderAmount-=uint128(amount); }
                    else if(t==1){ asks[acc].posterAmount-=uint128(amount); } 
                    else { asks[acc].airdropAmount-=uint128(amount); }
                    cost += amount*price/1e6;
                    //I(USDC).transferFrom(msg.sender,acc,amount*price/1e6);
                    //I(_treasury).otcReassigment(acc,msg.sender,amount,t);
                    break;
                }
            }
        }
        require(cost>0);
        return cost;
    }

    function sellLockedSharesToUSDC(uint amount, address[] memory bids_, uint t)public returns (uint cost){
        //I(_treasury).reserveForOTC(msg.sender,amount,0);
        for(uint n=0;n<bids_.length;n++){
            address acc = bids_[n];
            uint bidAmount;
            if(t==0){ bidAmount = bids[acc].founderAmount; }
            else if(t==1){ bidAmount = bids[acc].posterAmount; } 
            else { bidAmount = bids[acc].airdropAmount; }
            if(bidAmount>0){
                uint price;
                if(t==0){ price = bids[acc].founderPrice; }
                else if(t==1){ price = bids[acc].posterPrice; }
                else { price = bids[acc].airdropPrice; }
                if(amount>bidAmount){
                    amount -= bidAmount;
                    cost += bidAmount*price/1e6;
                    if(t==0){ bids[acc].founderAmount=0; bids[acc].founderPrice=0; }
                    else if(t==1){ bids[acc].posterAmount=0; bids[acc].posterPrice=0; }
                    else { bids[acc].airdropAmount=0; bids[acc].airdropPrice=0; }
                    //I(_treasury).otcReassigment(msg.sender,acc,bidAmount,t);
                } else {
                    if(t==0){ bids[acc].founderAmount-=uint128(amount); }
                    else if(t==1){ bids[acc].posterAmount-=uint128(amount); } 
                    else { bids[acc].airdropAmount-=uint128(amount); }
                    cost += amount*price/1e6;
                    //I(_treasury).otcReassigment(msg.sender,acc,amount,t);
                    break;
                }
            }
        }
        require(cost>0);
        //I(USDC).transfer(msg.sender,cost);
        return(cost);
    }
}