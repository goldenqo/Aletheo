const poolABI = require('./UniswapV2Pair.json'); ///UniswapV2Pair.json
const { busdFixture } = require('./BUSDFixtures');
const { wbnbFixture } = require('./WBNBFixtures');

async function uniswapFixture() {
  const accounts = await ethers.getSigners();

  const wbnb = await wbnbFixture();
  const UniswapV2Factory = await ethers.getContractFactory('UniswapV2Factory');
  const uniswapV2Factory = await UniswapV2Factory.connect(accounts[19]).deploy(accounts[19].address);
  const UniswapV2Router02 = await ethers.getContractFactory('UniswapV2Router02');
  const uniswapV2Router02 = await UniswapV2Router02.connect(accounts[19]).deploy(uniswapV2Factory.address, wbnb.address);
  return { uniswapV2Router02, uniswapV2Factory, wbnb, accounts };
}

async function uniswapFixtureWithBNBUSDPool() {
  const fixture = await uniswapFixture();
  const wbnb = fixture.wbnb;
  const busd = await busdFixture();
  const uniswapV2Router02 = fixture.uniswapV2Router02;
  const uniswapV2Factory = fixture.uniswapV2Factory;
  const accounts = fixture.accounts;
  await uniswapV2Factory.createPair(wbnb.address, busd.address);
  const bnbBUSDPoolAddress = await uniswapV2Factory.getPair(wbnb.address, busd.address);
  const UniswapV2Pair = await ethers.getContractFactory('UniswapV2Pair');
  const uniswapV2Pair = await UniswapV2Pair.connect(accounts[19]).deploy();
  const bnbBUSDPool = await uniswapV2Pair.attach(bnbBUSDPoolAddress);
  //console.log('signer address:' + accounts[0].address);
  //console.log('router address:' + uniswapV2Router02.address);
  //console.log('wbnb address:' + wbnb.address);
  //console.log('busd address:' + busd.address);
  const amount = ethers.BigNumber.from('100000000000000000000');
  await wbnb.deposit({ value: amount });
  await wbnb.approve(uniswapV2Router02.address, ethers.constants.MaxUint256);
  await busd.approve(uniswapV2Router02.address, ethers.constants.MaxUint256);
  //console.log('wbnb allowance:' + (await wbnb.allowance(accounts[0].address, uniswapV2Router02.address)));
  //console.log('busd allowance:' + (await busd.allowance(accounts[0].address, uniswapV2Router02.address)));
  //console.log('wbnb sender balance:' + (await wbnb.balanceOf(accounts[0].address)));
  //console.log('busd sender balance:' + (await busd.balanceOf(accounts[0].address)));

  await uniswapV2Router02.connect(accounts[0]).addLiquidity(wbnb.address, busd.address, amount, amount, 0, 0, accounts[0].address, ethers.constants.MaxUint256);
  return { uniswapV2Router02, uniswapV2Factory, wbnb, busd, bnbBUSDPool };
}

module.exports = {
  uniswapFixture,
  uniswapFixtureWithBNBUSDPool,
};
