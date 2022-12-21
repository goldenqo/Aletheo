const { foundingEventFixture, foundingEventConcludedWithUniswapFixture, foundingEventWithUniswapFixture } = require('./foundingEventFixtures');
const { stakingFixture } = require('./stakingFixture');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

async function treasuryFixture() {
  const [foundingEvent, eerc20, wbnb, busd, accounts] = await foundingEventFixture();
  const staking = await stakingFixture();
  const treasury = await (await ethers.getContractFactory('Treasury')).deploy();
  return [treasury, eerc20, wbnb, busd, accounts, foundingEvent, staking];
}

async function treasuryInitializedFixture() {
  const [treasury, eerc20, wbnb, busd, accounts, foundingEvent, staking] = await treasuryFixture();
  await treasury.connect(accounts[19]).init(accounts[0].address, eerc20.address, foundingEvent.address, accounts[10].address, accounts[11].address, busd.address);
  await staking.connect(accounts[19]).init(eerc20.address, treasury.address);
  await eerc20.connect(accounts[19]).init(accounts[2].address, treasury.address, foundingEvent.address, accounts[0].address);
  return [treasury, eerc20, wbnb, busd, accounts, foundingEvent, staking];
}

async function treasuryWithUniswapAndFoundingEventNotConcludedFixture() {
  const [foundingEvent, eerc20, wbnb, busd, accounts, uniswapV2Router02, uniswapV2Factory, bnbBUSDPool] = await foundingEventWithUniswapFixture();
  const staking = await stakingFixture();
  const treasury = await (await ethers.getContractFactory('Treasury')).deploy();
  await treasury.connect(accounts[19]).init(accounts[0].address, eerc20.address, foundingEvent.address, accounts[10].address, uniswapV2Factory.address, wbnb.address);
  await staking.connect(accounts[19]).init(eerc20.address, treasury.address);
  //await eerc20.connect(accounts[19]).init(accounts[2].address, accounts[3].address, foundingEvent.address, accounts[0].address);
  await foundingEvent.connect(accounts[0]).setupEvent(111111111);

  await eerc20.connect(accounts[19]).init(accounts[2].address, treasury.address, foundingEvent.address, accounts[0].address);
  return [treasury, eerc20, wbnb, busd, accounts, foundingEvent, staking, uniswapV2Router02, uniswapV2Factory, bnbBUSDPool];
}

module.exports = {
  treasuryFixture,
  treasuryInitializedFixture,
  treasuryWithUniswapAndFoundingEventNotConcludedFixture,
};
