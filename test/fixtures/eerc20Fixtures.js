const EERC20ABI = require('../../artifacts/contracts/EERC20.sol/EERC20.json');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

async function EERC20Fixture() {
  const accounts = await ethers.getSigners();
  const EERC20 = await ethers.getContractFactory('EERC20');
  const eerc20 = await EERC20.deploy();
  await eerc20.connect(accounts[19]).init(accounts[2].address, accounts[3].address, accounts[4].address, accounts[0].address);
  return { eerc20, accounts };
}

async function EERC20FixtureNotInitialized() {
  const accounts = await ethers.getSigners();
  const EERC20 = await ethers.getContractFactory('EERC20');
  const eerc20 = await EERC20.deploy();
  return { eerc20, accounts };
}

async function EERC20ProxiedFixture() {
  const accounts = await ethers.getSigners();
  const TrustMinimizedProxy = await ethers.getContractFactory('TrustMinimizedProxy');
  const trustMinimizedProxy = await TrustMinimizedProxy.connect(accounts[19]).deploy();
  const EERC20 = await ethers.getContractFactory('EERC20');
  const eerc20 = await EERC20.deploy();
  const iEERC20 = new ethers.utils.Interface(EERC20ABI.abi);
  const initData = iEERC20.encodeFunctionData('init', [accounts[2].address, accounts[3].address, accounts[4].address, accounts[0].address]);
  await trustMinimizedProxy.connect(accounts[19]).proposeTo(eerc20.address, initData);
  const eerc20Proxied = await eerc20.attach(trustMinimizedProxy.address);
  return { eerc20Proxied, accounts };
}

async function erc20Fixture() {
  const accounts = await ethers.getSigners();
  const EERC20 = await ethers.getContractFactory('ERC20');
  const erc20 = await EERC20.deploy('unlockTime', '{ value: lockedAmount }');
  return { erc20, accounts };
}

module.exports = {
  EERC20Fixture,
  erc20Fixture,
  EERC20ProxiedFixture,
  EERC20FixtureNotInitialized,
};
