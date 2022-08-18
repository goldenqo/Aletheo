pragma solidity ^0.8.6;
// author: SamPorter1984
interface I{
    function getPair(address t, address t1) external view returns(address pair);
    function createPair(address t, address t1) external returns(address pair);
    function transfer(address to, uint value) external returns(bool);
    function balanceOf(address) external view returns(uint);
    function approve(address spender, uint256 value) external returns (bool);
    function addLiquidityETH(address token,uint amountTokenDesired,uint amountTokenMin,uint amountETHMin,address to,uint deadline)external payable returns(uint amountToken,uint amountETH,uint liquidity);
}

contract FoundingEvent {
    mapping(address => uint) public deposits;
    address payable private _deployer;
    bool public _emergency;
    bool public swap;
    uint public genesisBlock;
    uint public hardcap;
    uint private _lock;
    uint public sold;
    uint public bl;
    address private _letToken;
    address private _treasury;
    uint public maxSold;
    function init() external {
        _deployer=payable(0xB23b6201D1799b0E8e209a402daaEFaC78c356Dc);
        _letToken=0x07B5D3EA920Aaf1685a67DD839f61DA7Ede127b5;
        _treasury=0xB199188e1D9a27A74F69b6536aC3B7810F6eFeF3;
    }

    function startLGE(uint b) external {
        require(msg.sender == _deployer&&b>block.number);
        if(bl!= 0){ require(b<bl); }
        bl = b;
    }

    function triggerLaunch() public {
        if(block.number<bl){
            require(msg.sender == _deployer);
        }
        _createLiquidity();
    }

    function deposit() external payable {
        require(bl > 0);
        uint amount = msg.value;
        uint deployerShare = amount/20;
        amount -= deployerShare;
        _deployer.transfer(deployerShare);
        deposits[msg.sender] += amount;
        sold += amount/6; //let sold, required for front-end
        if(sold>=50000e18||block.number>=bl){
            _createLiquidity();
        }
    }

    function _createLiquidity() internal {
        address WCRO = 0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23;
        address liquidityManager = 0x01Ea174989d602abB00Cd67CE2859a60E0bc5f75;
        address factory = 0x3B44B2a187a7b3824131F8db5a74194D0a42Fc15;
        address router = 0x145863Eb42Cf62847A6Ca784e6416C1682b1b2Ae;
        address letToken=_letToken;
        address tknCROLP = I(factory).getPair(letToken,WCRO);
        if (tknCROLP == address(0)) {
            tknCROLP=I(factory).createPair(letToken, WCRO);
        }
        I(WCRO).approve(router,2**256-1);
        I(letToken).approve(router,2**256-1);
        I(router).addLiquidityETH{value: address(this).balance}(letToken,I(letToken).balanceOf(address(this)),0,0,liquidityManager,2**256-1);
        genesisBlock = block.number;
    }

    function toggleEmergency() public {
        require(msg.sender==_deployer);
        if(_emergency != true){
            _emergency = true;
        } else{
            delete _emergency;
        }
    }

    function withdraw() public {
        require(_emergency == true && deposits[msg.sender]>0 && _lock!=1);
        _lock=1;
        payable(msg.sender).transfer(deposits[msg.sender]);
        delete deposits[msg.sender];
        _lock=0;
    }
}