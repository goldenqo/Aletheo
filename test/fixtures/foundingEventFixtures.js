const foundingEventABI = require('../../artifacts/contracts/FoundingEvent.sol/FoundingEvent.json');
const { busdFixture } = require('./BUSDFixtures');
const { EERC20FixtureNotInitialized } = require('./eerc20Fixtures');
const { uniswapFixtureWithBNBUSDPool } = require('./uniswapFixtures');
const { wbnbFixture } = require('./WBNBFixtures');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { ContractFactory } = require('ethers');

async function foundingEventFixture() {
  const eerc20 = await EERC20FixtureNotInitialized();
  const wbnb = await wbnbFixture();
  const busd = await busdFixture();
  const accounts = await ethers.getSigners();
  const foundingEvent = await (await ethers.getContractFactory('FoundingEvent')).deploy();
  await foundingEvent.connect(accounts[19]).init(accounts[0].address, eerc20.address, wbnb.address, busd.address, accounts[5].address, accounts[6].address);
  return [foundingEvent, eerc20, wbnb, busd, accounts];
}

async function foundingEventInitializedFixture() {
  const [foundingEvent, eerc20, wbnb, busd, accounts] = await foundingEventFixture();
  await foundingEvent.connect(accounts[19]).init(accounts[0].address, eerc20.address, wbnb.address, busd.address, accounts[5].address, accounts[6].address);
  return [foundingEvent, eerc20, wbnb, busd, accounts];
}

async function foundingEventWithUniswapFixture() {
  const eerc20 = await EERC20FixtureNotInitialized();
  const [uniswapV2Router02, uniswapV2Factory, wbnb, busd, bnbBUSDPool] = await uniswapFixtureWithBNBUSDPool();
  const accounts = await ethers.getSigners();
  const foundingEvent = await (await ethers.getContractFactory('FoundingEvent')).deploy();
  await foundingEvent.connect(accounts[19]).init(accounts[0].address, eerc20.address, wbnb.address, busd.address, uniswapV2Router02.address, uniswapV2Factory.address);

  return [foundingEvent, eerc20, wbnb, busd, accounts, uniswapV2Router02, uniswapV2Factory, bnbBUSDPool];
}

async function foundingEventConcludedWithUniswapFixture() {
  const [foundingEvent, eerc20, wbnb, busd, accounts, uniswapV2Router02, uniswapV2Factory, bnbBUSDPool] = await foundingEventWithUniswapFixture();
  await eerc20.connect(accounts[19]).init(accounts[2].address, accounts[3].address, foundingEvent.address, accounts[0].address);
  await foundingEvent.connect(accounts[0]).setupEvent(111111111);
  await foundingEvent.connect(accounts[0]).depositBNB({ value: 11111111111111 });
  await foundingEvent.connect(accounts[0]).triggerLaunch();
  //console.log(await uniswapV2Factory.getPair())
  return [foundingEvent, eerc20, wbnb, busd, accounts, uniswapV2Router02, uniswapV2Factory, bnbBUSDPool];
}

module.exports = {
  foundingEventFixture,
  foundingEventInitializedFixture,
  foundingEventWithUniswapFixture,
  foundingEventConcludedWithUniswapFixture,
};
