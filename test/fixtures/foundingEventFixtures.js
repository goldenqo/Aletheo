const foundingEventABI = require('../../artifacts/contracts/FoundingEvent.sol/FoundingEvent.json');
const { busdFixture } = require('./BUSDFixtures');
const { EERC20ProxiedFixture, EERC20FixtureNotInitialized } = require('./eerc20Fixtures');
const { uniswapFixtureWithBNBUSDPool } = require('./uniswapFixtures');
const { wbnbFixture } = require('./WBNBFixtures');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
async function foundingEventFixture() {
  const fixture = await EERC20FixtureNotInitialized();
  const eerc20 = fixture.eerc20;
  const accounts = fixture.accounts;
  const wbnb = await wbnbFixture();
  const busd = await busdFixture();
  const FoundingEvent = await ethers.getContractFactory('FoundingEvent');
  const foundingEvent = await FoundingEvent.deploy();
  await foundingEvent.connect(accounts[19]).init(accounts[0].address, eerc20.address, wbnb.address, busd.address, accounts[5].address, accounts[6].address);
  return { foundingEvent, eerc20, wbnb, busd, accounts };
}

async function foundingEventWithUniswapFixture() {
  const fixture = await EERC20FixtureNotInitialized();
  const eerc20 = fixture.eerc20;
  const accounts = fixture.accounts;
  const uniFixture = await uniswapFixtureWithBNBUSDPool();
  const wbnb = uniFixture.wbnb;
  const busd = uniFixture.busd;
  const uniswapV2Router02 = uniFixture.uniswapV2Router02;
  const uniswapV2Factory = uniFixture.uniswapV2Factory;
  const bnbBUSDPool = uniFixture.bnbBUSDPool;
  const FoundingEvent = await ethers.getContractFactory('FoundingEvent');
  const foundingEvent = await FoundingEvent.deploy();
  await foundingEvent.connect(accounts[19]).init(accounts[0].address, eerc20.address, wbnb.address, busd.address, uniswapV2Router02.address, uniswapV2Factory.address);
  return { foundingEvent, eerc20, wbnb, busd, accounts, uniswapV2Router02, uniswapV2Factory, bnbBUSDPool };
}

async function foundingEventProxiedFixture() {
  const fixture = await EERC20ProxiedFixture();
  const eerc20Proxied = fixture.eerc20Proxied;
  const accounts = fixture.accounts;
  const uniFixture = await uniswapFixtureWithBNBUSDPool();
  const wbnb = uniFixture.wbnb;
  const busd = uniFixture.busd;
  const uniswapV2Router02 = uniFixture.uniswapV2Router02;
  const uniswapV2Factory = uniFixture.uniswapV2Factory;
  const bnbBUSDPoolAddress = uniFixture.bnbBUSDPoolAddress;
  const TrustMinimizedProxy = await ethers.getContractFactory('TrustMinimizedProxy');
  const trustMinimizedProxy = await TrustMinimizedProxy.connect(accounts[19]).deploy();
  const FoundingEvent = await ethers.getContractFactory('FoundingEvent');
  const foundingEvent = await FoundingEvent.deploy();
  const iFoundingEvent = new ethers.utils.Interface(foundingEventABI.abi);
  const initData = iFoundingEvent.encodeFunctionData('init', [accounts[0].address, eerc20Proxied.address, wbnb.address, busd.address, uniswapV2Router02.address, uniswapV2Factory.address]);
  await trustMinimizedProxy.connect(accounts[19]).proposeTo(foundingEvent.address, initData);
  const foundingEventProxied = await foundingEvent.attach(trustMinimizedProxy.address);
  return { foundingEventProxied, eerc20Proxied, wbnb, busd, accounts, uniswapV2Router02, uniswapV2Factory, bnbBUSDPoolAddress };
}

module.exports = {
  foundingEventFixture,
  foundingEventProxiedFixture,
  foundingEventWithUniswapFixture,
};
