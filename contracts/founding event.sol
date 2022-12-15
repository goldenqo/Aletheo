// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.6;

// author: SamPorter1984
interface I {
    function enableTrading() external;

    function sync() external;

    function getPair(address t, address t1) external view returns (address pair);

    function createPair(address t, address t1) external returns (address pair);

    function transfer(address to, uint value) external returns (bool);

    function transferFrom(address from, address to, uint amount) external returns (bool);

    function balanceOf(address) external view returns (uint);

    function approve(address spender, uint256 value) external returns (bool);

    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);

    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity);

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity);

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    function swapExactETHForTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable returns (uint[] memory amounts);
}

contract FoundingEvent {
    mapping(address => uint) public deposits;
    address payable private _deployer;
    bool public emergency;
    bool public swapToBNB;
    uint public genesisBlock;
    uint public hardcap;
    uint public sold;
    uint public presaleEndBlock;
    uint public maxSold;
    address private _letToken;
    address public WBNB;
    address public BUSD;
    address public router;
    bool public ini;

    function init() external {
        require(msg.sender == 0xc22eFB5258648D016EC7Db1cF75411f6B3421AEc);
        _deployer = payable(0xB23b6201D1799b0E8e209a402daaEFaC78c356Dc);
        _letToken = 0x74404135DE39FABB87493c389D0Ca55665520d9A;
        WBNB = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;
        BUSD = 0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56;
        router = 0x10ED43C718714eb63d5aA57B78B54704E256024E;
        maxSold = 50000e18;
        I(WBNB).approve(router, 2 ** 256 - 1);
        I(_letToken).approve(router, 2 ** 256 - 1);
        I(BUSD).approve(router, 2 ** 256 - 1);
    }

    function startLGE(uint b) external {
        require(msg.sender == _deployer && b > block.number);
        if (presaleEndBlock != 0) {
            require(b < presaleEndBlock);
        }
        presaleEndBlock = b;
    }

    function triggerLaunch() public {
        if (block.number < presaleEndBlock) {
            require(msg.sender == _deployer);
        }
        _createLiquidity();
    }

    function depositBUSD(uint amount) external {
        require(presaleEndBlock > 0 && !emergency);
        uint deployerShare = amount / 20;
        amount -= deployerShare;
        I(BUSD).transferFrom(msg.sender, _deployer, deployerShare);
        I(BUSD).transferFrom(msg.sender, address(this), amount);
        if (swapToBNB) {
            _swapToBNB();
        }
        deposits[msg.sender] += amount;
        I(_letToken).transfer(msg.sender, amount); //should or not?
        sold += amount * 2;
        if (sold >= maxSold || block.number >= presaleEndBlock) {
            _createLiquidity();
        }
    }

    function depositWBNB(uint amount) external {
        require(presaleEndBlock > 0 && !emergency);
        uint deployerShare = amount / 20;
        amount -= deployerShare;
        I(WBNB).transferFrom(msg.sender, _deployer, deployerShare);
        I(WBNB).transferFrom(msg.sender, address(this), amount);
        if (!swapToBNB) {
            _swapToBUSD();
        }
        uint letAmount = _calculateLetAmountInBNB(amount);
        deposits[msg.sender] += letAmount;
        I(_letToken).transfer(msg.sender, letAmount);
        sold += letAmount * 2;
        if (sold >= maxSold || block.number >= presaleEndBlock) {
            _createLiquidity();
        }
    }

    function deposit() external payable {
        require(presaleEndBlock > 0 && !emergency);
        uint amount = msg.value;
        uint deployerShare = amount / 20;
        amount -= deployerShare;
        (bool success, ) = payable(_deployer).call{value: deployerShare}('');
        require(success, 'try again');
        if (!swapToBNB) {
            _swapToBUSD();
        }
        uint letAmount = _calculateLetAmountInBNB(amount);
        deposits[msg.sender] += letAmount;
        I(_letToken).transfer(msg.sender, letAmount);
        sold += letAmount * 2;
        if (sold >= maxSold || block.number >= presaleEndBlock) {
            _createLiquidity();
        }
    }

    function _calculateLetAmountInBNB(uint amountBNB) internal view returns (uint) {
        address pool; //alert need pool address
        (address token0, ) = WBNB < BUSD ? (WBNB, BUSD) : (BUSD, WBNB); //alert: idk the order yet
        (uint reserve0, uint reserve1, ) = I(pool).getReserves();
        (uint reserveWBNB, uint reserveBUSD) = WBNB == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
        return (amountBNB * reserveBUSD) / reserveWBNB;
    }

    function _createLiquidity() internal {
        address liquidityManager = 0x539cB40D3670fE03Dbe67857C4d8da307a70B305;
        address factory = 0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73;
        address letToken = _letToken;
        address tknBNBLP = I(factory).getPair(letToken, WBNB);
        if (tknBNBLP == address(0)) {
            tknBNBLP = I(factory).createPair(letToken, WBNB);
        }
        if (!swapToBNB) {
            _swapToBNB();
        }
        I(router).addLiquidity(
            letToken,
            WBNB,
            I(letToken).balanceOf(address(this)),
            I(WBNB).balanceOf(address(this)),
            0,
            0,
            liquidityManager,
            2 ** 256 - 1
        );
        uint wbnbBalance = I(WBNB).balanceOf(address(this));
        if (wbnbBalance > 0) {
            I(WBNB).transfer(tknBNBLP, wbnbBalance);
        }
        uint letBalance = I(letToken).balanceOf(address(this));
        if (letBalance > 0) {
            I(letToken).transfer(tknBNBLP, letBalance);
        }
        I(tknBNBLP).sync();
        genesisBlock = block.number;
        I(letToken).enableTrading();
    }

    function toggleEmergency() public {
        require(msg.sender == _deployer);
        if (emergency != true) {
            emergency = true;
        } else {
            delete emergency;
        }
    }

    function withdraw() public {
        require(emergency == true && deposits[msg.sender] > 0);
        I(BUSD).transfer(msg.sender, deposits[msg.sender]);
        delete deposits[msg.sender];
    }

    function setSwapToBNB(bool swapToBNB_) public {
        require(msg.sender == _deployer);
        swapToBNB = swapToBNB_;
        if (swapToBNB_ == true) {
            _swapToBNB();
        } else {
            _swapToBUSD();
        }
    }

    function _swapToBNB() private {
        if (I(BUSD).balanceOf(address(this)) > 0) {
            address[] memory ar = new address[](2);
            ar[0] = BUSD;
            ar[1] = WBNB;
            I(router).swapExactTokensForTokens(I(BUSD).balanceOf(address(this)), 0, ar, address(this), 2 ** 256 - 1);
        }
    }

    function _swapToBUSD() private {
        if (I(WBNB).balanceOf(address(this)) > 0) {
            address[] memory ar = new address[](2);
            ar[0] = WBNB;
            ar[1] = BUSD;
            I(router).swapExactTokensForTokens(I(WBNB).balanceOf(address(this)), 0, ar, address(this), 2 ** 256 - 1);
        }
    }
}
