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

    function deposit() external payable;
}
import 'hardhat/console.sol';

contract FoundingEvent {
    mapping(address => uint) public deposits;
    address payable public deployer;
    bool public emergency;
    bool public swapToBNB;
    uint public genesisBlock;
    uint public hardcap;
    uint public sold;
    uint public presaleEndBlock;
    uint public maxSold;
    address public letToken;
    address public WBNB;
    address public BUSD;
    address public router;
    address public factory;

    function init(address _deployer, address letToken_, address _WBNB, address _WBUSD, address _router, address _factory) external {
        require(msg.sender == 0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199);
        deployer = payable(_deployer);
        letToken = letToken_;
        WBNB = _WBNB; //0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;
        BUSD = _WBUSD; //0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56;
        router = _router; //0x10ED43C718714eb63d5aA57B78B54704E256024E;
        factory = _factory;
        maxSold = 50000e18;
        I(WBNB).approve(router, 2 ** 256 - 1);
        I(letToken).approve(router, 2 ** 256 - 1);
        I(BUSD).approve(router, 2 ** 256 - 1);
    }

    function setupEvent(uint248 b) external {
        require(msg.sender == deployer, 'not deployer');
        require(b > block.number, 'choose higher block');
        if (presaleEndBlock != 0) {
            require(b < presaleEndBlock);
        }
        presaleEndBlock = b;
    }

    function depositBUSD(uint amount) external {
        require(presaleEndBlock > 0 && !emergency);
        I(BUSD).transferFrom(msg.sender, address(this), amount);
        I(BUSD).transfer(deployer, amount / 20);
        if (swapToBNB) {
            _swap(BUSD, WBNB, (amount / 20) * 19);
        }
        deposits[msg.sender] += amount;
        I(letToken).transfer(msg.sender, amount);
        sold += amount * 2;
        if (sold >= maxSold || block.number >= presaleEndBlock) {
            _createLiquidity();
        }
    }

    function depositBNB() external payable {
        require(presaleEndBlock > 0 && !emergency, 'too late');
        uint letAmount = _calculateLetAmountInToken(WBNB, msg.value);
        (bool success, ) = payable(deployer).call{value: msg.value / 20}('');
        require(success, 'try again');
        if (!swapToBNB) {
            I(WBNB).deposit{value: address(this).balance}();
            _swap(WBNB, BUSD, (msg.value * 19) / 20);
        } else {
            I(WBNB).deposit{value: address(this).balance}();
        }
        deposits[msg.sender] += letAmount;
        //console.log(I(letToken).balanceOf(address(this)));
        //console.log(letAmount);
        I(letToken).transfer(msg.sender, letAmount);
        sold += letAmount;
        if (sold >= maxSold || block.number >= presaleEndBlock) {
            _createLiquidity();
        }
    }

    //required for fee on transfer tokens
    function _calculateLetAmountInToken(address token, uint amount) internal view returns (uint) {
        if (token == BUSD) return amount;
        address pool = I(factory).getPair(token, BUSD);
        (address token0, ) = token < BUSD ? (token, BUSD) : (BUSD, token);
        (uint reserve0, uint reserve1, ) = I(pool).getReserves();
        (uint reserveToken, uint reserveBUSD) = token == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
        return (amount * reserveToken) / reserveBUSD;
    }

    //probably fails if no direct route available and probably can get scammed with fee on transfer tokens
    function _swap(address token0, address token1, uint amount) private returns (uint[] memory tradeResult) {
        if (I(token0).balanceOf(address(this)) > 0) {
            address[] memory ar = new address[](2);
            ar[0] = token0;
            ar[1] = token1;
            tradeResult = I(router).swapExactTokensForTokens(amount, 0, ar, address(this), 2 ** 256 - 1);
        }
    }

    function setSwapToBNB(bool swapToBNB_) public {
        require(msg.sender == deployer, 'only deployer');
        swapToBNB = swapToBNB_;
        if (swapToBNB_ == true) {
            _swap(BUSD, WBNB, I(BUSD).balanceOf(address(this)));
        } else {
            _swap(WBNB, BUSD, I(WBNB).balanceOf(address(this)));
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
        address token = letToken;
        address tknBNBLP = I(factory).getPair(token, WBNB);
        if (tknBNBLP == address(0)) {
            tknBNBLP = I(factory).createPair(token, WBNB);
        }
        if (!swapToBNB) {
            _swap(BUSD, WBNB, I(BUSD).balanceOf(address(this)));
        }
        I(router).addLiquidity(
            token,
            WBNB,
            I(token).balanceOf(address(this)),
            I(WBNB).balanceOf(address(this)),
            0,
            0,
            liquidityManager,
            2 ** 256 - 1
        );
        genesisBlock = block.number;

        // if somebody already created the pool
        uint wbnbBalance = I(WBNB).balanceOf(address(this));
        if (wbnbBalance > 0) {
            I(WBNB).transfer(tknBNBLP, wbnbBalance);
        }
        uint letBalance = I(token).balanceOf(address(this));
        if (letBalance > 0) {
            I(token).transfer(tknBNBLP, letBalance);
        }
        I(tknBNBLP).sync();
    }

    function triggerLaunch() public {
        if (block.number < presaleEndBlock) {
            require(msg.sender == deployer);
        }
        _createLiquidity();
    }

    function toggleEmergency() public {
        require(msg.sender == deployer);
        if (emergency != true) {
            emergency = true;
        } else {
            delete emergency;
        }
    }

    // founding event can swap funds back and forth between bnb and busd,
    // its almost a guarantee that the last caller of withdraw
    // won't get at least some wei back no matter the setup
    function withdraw() public {
        require(emergency == true && deposits[msg.sender] > 0);
        uint withdrawAmount = (deposits[msg.sender] * 19) / 20;
        if (I(WBNB).balanceOf(address(this)) > 0) {
            _swap(WBNB, BUSD, I(WBNB).balanceOf(address(this)));
        }
        if (I(BUSD).balanceOf(address(this)) < withdrawAmount) {
            withdrawAmount = I(BUSD).balanceOf(address(this));
        }
        I(BUSD).transfer(msg.sender, withdrawAmount);
        delete deposits[msg.sender];
    }
}
