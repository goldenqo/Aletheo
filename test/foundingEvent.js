const { expect } = require('chai');
const { mine, loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { foundingEventFixture, foundingEventProxiedFixture, foundingEventWithUniswapFixture } = require('./fixtures/foundingEventFixtures.js');

let foundingEvent,
  eerc20,
  wbnb,
  busd,
  router,
  factory,
  bnbBUSDPool,
  foundingEventProxied = {},
  accounts = [];
const provider = ethers.provider;

describe('foundingEvent', function () {
  describe('init()', function () {
    beforeEach('deploy fixture', async () => {
      const fixture = await loadFixture(foundingEventFixture);
      accounts = fixture.accounts;
      foundingEvent = fixture.foundingEvent;
      eerc20 = fixture.eerc20;
      wbnb = fixture.wbnb;
      busd = fixture.busd;
      router = accounts[5];
      factory = accounts[6];
    });
    it('Should initialize state variables correctly', async function () {
      expect(await foundingEvent.maxSold()).to.equal(ethers.BigNumber.from('50000000000000000000000'));
      expect(await foundingEvent.deployer()).to.equal(accounts[0].address);
      expect(await foundingEvent.letToken()).to.equal(eerc20.address);
      expect(await foundingEvent.WBNB()).to.equal(wbnb.address);
      expect(await foundingEvent.BUSD()).to.equal(busd.address);
      expect(await foundingEvent.router()).to.equal(router.address);
      expect(await foundingEvent.factory()).to.equal(factory.address);
      expect(await foundingEvent.emergency()).to.equal(false);
      expect(await foundingEvent.swapToBNB()).to.equal(false);
      expect(await foundingEvent.genesisBlock()).to.equal(0);
      expect(await foundingEvent.hardcap()).to.equal(0);
      expect(await foundingEvent.sold()).to.equal(0);
      expect(await foundingEvent.presaleEndBlock()).to.equal(0);
    });
    it('Should set correct initial allowances to router for letToken, wbnb and wbusd', async () => {
      expect(await eerc20.allowance(foundingEvent.address, router.address)).to.equal(ethers.constants.MaxUint256);
      expect(await wbnb.allowance(foundingEvent.address, router.address)).to.equal(ethers.constants.MaxUint256);
      expect(await busd.allowance(foundingEvent.address, router.address)).to.equal(ethers.constants.MaxUint256);
    });
  });

  describe('setupEvent(uint b)', function () {
    beforeEach('deploy fixture', async () => {
      const fixture = await loadFixture(foundingEventFixture);
      foundingEvent = fixture.foundingEvent;
      accounts = fixture.accounts;
      eerc20 = fixture.eerc20;
      wbnb = fixture.wbnb;
      busd = fixture.busd;
      router = fixture.uniswapV2Router02;
      factory = fixture.uniswapV2Factory;
    });
    it('Should fail if not deployer', async function () {
      const arg = 11111111111111;
      await expect(foundingEvent.connect(accounts[1]).setupEvent(arg)).to.be.reverted;
      expect(await foundingEvent.presaleEndBlock()).to.equal(0);
    });
    it('Should set presaleEndBlock', async function () {
      const arg = 11111111111111;
      await foundingEvent.setupEvent(arg);
      expect(await foundingEvent.presaleEndBlock()).to.equal(arg);
    });
    it('Should fail to set presaleEndBlock if not higher than block.number', async function () {
      const arg = 1;
      await expect(foundingEvent.setupEvent(arg)).to.be.reverted;
      expect(await foundingEvent.presaleEndBlock()).to.equal(0);
    });
    it('Should set presaleEndBlock if presaleEndBlock already wasnt zero and new value is lower than previous', async function () {
      const arg = 11111111111111;
      const arg1 = 1111111111111;
      await expect(foundingEvent.setupEvent(arg));
      await expect(foundingEvent.setupEvent(arg1));
      expect(await foundingEvent.presaleEndBlock()).to.equal(arg1);
    });
    it('Should fail to set presaleEndBlock if presaleEndBlock already not zero and new value is not lower than previous', async function () {
      const arg = 11111111111111;
      const arg1 = 111111111111111;
      await expect(foundingEvent.setupEvent(arg));
      await expect(foundingEvent.setupEvent(arg1)).to.be.reverted;
      expect(await foundingEvent.presaleEndBlock()).to.equal(arg);
    });
  });

  describe('toggleEmergency()', function () {
    beforeEach('deploy fixture', async () => {
      const fixture = await loadFixture(foundingEventFixture);
      foundingEvent = fixture.foundingEvent;
      accounts = fixture.accounts;
      eerc20 = fixture.eerc20;
      wbnb = fixture.wbnb;
      busd = fixture.busd;
    });
    it('Should fail if not deployer', async function () {
      await expect(foundingEvent.connect(accounts[1]).toggleEmergency()).to.be.reverted;
    });
    it('Should set emergency to true if it was false', async function () {
      await foundingEvent.toggleEmergency();
      expect(await foundingEvent.emergency()).to.equal(true);
    });
    it('Should set emergency to false if it was true', async function () {
      await foundingEvent.toggleEmergency();
      expect(await foundingEvent.emergency()).to.equal(true);
      await foundingEvent.toggleEmergency();
      expect(await foundingEvent.emergency()).to.equal(false);
    });
  });

  describe('setSwapToBNB(bool swapToBNB_)', function () {
    beforeEach('deploy fixture', async () => {
      const fixture = await loadFixture(foundingEventWithUniswapFixture);
      accounts = fixture.accounts;
      foundingEvent = fixture.foundingEvent.connect(accounts[0]);
      eerc20 = fixture.eerc20.connect(accounts[0]);
      wbnb = fixture.wbnb.connect(accounts[0]);
      busd = fixture.busd.connect(accounts[0]);
      router = fixture.uniswapV2Router02.connect(accounts[0]);
      factory = fixture.uniswapV2Factory.connect(accounts[0]);
      bnbBUSDPool = fixture.bnbBUSDPool.connect(accounts[0]);
    });
    it('Should fail if not deployer', async function () {
      await expect(foundingEvent.connect(accounts[1]).setSwapToBNB(true)).to.be.reverted;
    });
    it('Should set swapToBNB', async function () {
      const arg = true;
      await foundingEvent.setSwapToBNB(arg);
      expect(await foundingEvent.swapToBNB()).to.equal(arg);
    });
    it('Should swap all BUSD funds to WBNB if swapToBNB is true', async function () {
      await busd.transfer(foundingEvent.address, 1000);
      const arg = true;
      await foundingEvent.setSwapToBNB(arg);
      expect(await wbnb.balanceOf(foundingEvent.address)).to.be.above(0);
    });
    it('Should swap all WBNB funds to BUSD if swapToBNB is false', async function () {
      await wbnb.deposit({ value: 100000 });
      await wbnb.transfer(foundingEvent.address, 100000);
      const arg = false;
      await foundingEvent.setSwapToBNB(arg);
      expect(await busd.balanceOf(foundingEvent.address)).to.be.above(0);
    });
    it('Should result in correct BUSD balance if swapToBNB is true', async function () {
      const transferAmount = 1001110111;
      await busd.transfer(foundingEvent.address, transferAmount);
      const reserves = await bnbBUSDPool.getReserves();
      const wbnbReserve = reserves[0];
      const busdReserve = reserves[1];
      const result = await router.getAmountOut(transferAmount, busdReserve, wbnbReserve);
      const arg = true;
      console.log(result);
      await foundingEvent.setSwapToBNB(arg);
      expect(await wbnb.balanceOf(foundingEvent.address)).to.be.equal(result);
    });
    it('Should result in correct WBNB balance if swapToBNB is true', async function () {
      const transferAmount = 6001110111;
      await wbnb.deposit({ value: transferAmount });
      await wbnb.transfer(foundingEvent.address, transferAmount);
      const reserves = await bnbBUSDPool.getReserves();
      const wbnbReserve = reserves[0];
      const busdReserve = reserves[1];
      const result = await router.getAmountOut(transferAmount, busdReserve, wbnbReserve);
      const arg = false;
      console.log(result);
      await foundingEvent.setSwapToBNB(arg);
      expect(await busd.balanceOf(foundingEvent.address)).to.be.equal(result);
    });
    it('Should ignore swapping funds to BNB if there are no funds to swap', async function () {
      const initialBalance = await wbnb.balanceOf(foundingEvent.address);
      const arg = true;
      await expect(foundingEvent.setSwapToBNB(arg)).not.to.be.reverted;
      expect(await wbnb.balanceOf(foundingEvent.address)).to.be.equal(initialBalance);
    });
    it('Should ignore swapping funds to BUSD if there are no funds to swap', async function () {
      const initialBalance = await busd.balanceOf(foundingEvent.address);
      const arg = false;
      await expect(foundingEvent.setSwapToBNB(arg)).not.to.be.reverted;
      expect(await wbnb.balanceOf(foundingEvent.address)).to.be.equal(initialBalance);
    });
  });

  describe('depositBUSD()', function () {
    beforeEach('deploy fixture', async () => {
      const fixture = await loadFixture(foundingEventWithUniswapFixture);
      accounts = fixture.accounts;
      foundingEvent = fixture.foundingEvent.connect(accounts[0]);
      eerc20 = fixture.eerc20.connect(accounts[0]);
      wbnb = fixture.wbnb.connect(accounts[0]);
      busd = fixture.busd.connect(accounts[0]);
      router = fixture.uniswapV2Router02.connect(accounts[0]);
      factory = fixture.uniswapV2Factory.connect(accounts[0]);
      bnbBUSDPool = fixture.bnbBUSDPool.connect(accounts[0]);
      await eerc20.connect(accounts[19]).init(accounts[2].address, accounts[3].address, foundingEvent.address, accounts[0].address);
    });
    it('Should fail if emergency', async function () {
      await foundingEvent.setupEvent(1111111111111);
      await busd.approve(foundingEvent.address, ethers.constants.MaxUint256);
      await foundingEvent.toggleEmergency();
      await expect(foundingEvent.depositBUSD(111111)).to.be.reverted;
    });
    it('Should fail if presaleEndBlock is zero', async function () {
      await busd.approve(foundingEvent.address, ethers.constants.MaxUint256);
      await expect(foundingEvent.depositBUSD(111111)).to.be.reverted;
    });
    it('Should fail if let token balance of FoundingEvent is zero', async function () {
      await foundingEvent.setupEvent(1111111111111);
      await busd.transfer(foundingEvent.address, ethers.BigNumber.from('11111111111111111111111111'));
      await foundingEvent.triggerLaunch();
      await busd.approve(foundingEvent.address, ethers.constants.MaxUint256);
      await expect(foundingEvent.depositBUSD(111111)).to.be.reverted;
    });
    it('Should send 5% fee to deployer if swapToBnb is false', async function () {
      const depositAmount = 10000000;
      await busd.transfer(accounts[1].address, depositAmount);
      await foundingEvent.setupEvent(1111111111111);
      const initialDeployerBalance = await busd.balanceOf(accounts[0].address);
      await busd.connect(accounts[1]).approve(foundingEvent.address, ethers.constants.MaxUint256);
      await foundingEvent.connect(accounts[1]).depositBUSD(depositAmount);
      const deployerBalance = await busd.balanceOf(accounts[0].address);
      const deposit = await foundingEvent.deposits(accounts[1].address);
      expect(deposit).to.be.above(0);
      expect(deployerBalance).to.equal(ethers.BigNumber.from(initialDeployerBalance).add(ethers.BigNumber.from(depositAmount / 20)));
    });
    it('Should send 5% fee to deployer if swapToBnb is true', async function () {
      await foundingEvent.setSwapToBNB(true);
      const depositAmount = 10000000;
      await busd.transfer(accounts[1].address, depositAmount);
      await foundingEvent.setupEvent(1111111111111);
      const initialDeployerBalance = await busd.balanceOf(accounts[0].address);
      await busd.connect(accounts[1]).approve(foundingEvent.address, ethers.constants.MaxUint256);
      await foundingEvent.connect(accounts[1]).depositBUSD(depositAmount);
      const deployerBalance = await busd.balanceOf(accounts[0].address);
      const deposit = await foundingEvent.deposits(accounts[1].address);
      expect(deposit).to.be.above(0);
      expect(deployerBalance).to.equal(ethers.BigNumber.from(initialDeployerBalance).add(ethers.BigNumber.from(depositAmount / 20)));
    });
    it('Should swap input token amount to WBNB if swapToBNB is true', async function () {
      await foundingEvent.setSwapToBNB(true);
      await foundingEvent.setupEvent(1111111111111);
      const depositAmount = 10000000;
      await busd.transfer(accounts[1].address, depositAmount);
      await busd.connect(accounts[1]).approve(foundingEvent.address, ethers.constants.MaxUint256);
      await foundingEvent.connect(accounts[1]).depositBUSD(depositAmount);
      expect(await busd.balanceOf(foundingEvent.address)).to.be.equal(0);
      expect(await wbnb.balanceOf(foundingEvent.address)).to.be.above(0);
      expect(await provider.getBalance(foundingEvent.address)).to.equal(0);
    });
    it('Should send back let tokens', async function () {
      await foundingEvent.setupEvent(1111111111111);
      await busd.connect(accounts[1]).approve(foundingEvent.address, ethers.constants.MaxUint256);
      await foundingEvent.setSwapToBNB(true);
      const depositAmount = 10000000;
      await busd.transfer(accounts[1].address, depositAmount);
      await foundingEvent.connect(accounts[1]).depositBUSD(depositAmount);
      expect(await eerc20.balanceOf(accounts[1].address)).to.be.above(0);
    });
    it('Should calculate correct let amount according to input token amount', async function () {
      await busd.transfer(accounts[1].address, 10000000);
      await foundingEvent.setupEvent(1111111111111);
      await foundingEvent.setSwapToBNB(true);
      const depositAmount = 10000000;
      await busd.connect(accounts[1]).approve(foundingEvent.address, ethers.constants.MaxUint256);
      await foundingEvent.connect(accounts[1]).depositBUSD(depositAmount);
      expect(await eerc20.balanceOf(accounts[1].address)).to.be.equal(depositAmount);
    });
    it('Should add correct let amount to sold', async function () {
      await busd.transfer(accounts[1].address, 10000000);
      await foundingEvent.setupEvent(1111111111111);
      await foundingEvent.setSwapToBNB(true);
      const depositAmount = 10000000;
      await busd.connect(accounts[1]).approve(foundingEvent.address, ethers.constants.MaxUint256);
      await foundingEvent.connect(accounts[1]).depositBUSD(depositAmount);
      expect(await foundingEvent.sold()).to.be.equal(depositAmount * 2);
    });
    it('Should save let amount to sender deposit', async function () {
      await busd.transfer(accounts[1].address, 10000000);
      await foundingEvent.setupEvent(1111111111111);
      await foundingEvent.setSwapToBNB(true);
      const depositAmount = 10000000;
      await busd.connect(accounts[1]).approve(foundingEvent.address, ethers.constants.MaxUint256);
      await foundingEvent.connect(accounts[1]).depositBUSD(depositAmount);
      expect(await foundingEvent.deposits(accounts[1].address)).to.be.equal(depositAmount);
    });
    it('Should create liquidity if sold is equal or higher than maxSold', async function () {
      await foundingEvent.setupEvent(1111111111111);
      await foundingEvent.setSwapToBNB(true);
      const depositAmount = (await busd.balanceOf(accounts[0].address)).div(700);
      await busd.approve(foundingEvent.address, ethers.constants.MaxUint256);
      console.log(depositAmount);
      await foundingEvent.depositBUSD(depositAmount);
      expect(await foundingEvent.deposits(accounts[0].address)).to.be.equal(depositAmount);
      expect(await eerc20.balanceOf(foundingEvent.address)).to.equal(0);
    });
    it('Should create liquidity if presaleEndBlock is reached or exceeded', async function () {
      await foundingEvent.setupEvent(1000000000);
      await mine(1000000000);
      await foundingEvent.setSwapToBNB(true);
      const depositAmount = ethers.BigNumber.from(10000000);
      await busd.approve(foundingEvent.address, ethers.constants.MaxUint256);
      console.log(depositAmount);
      await foundingEvent.depositBUSD(depositAmount);
      expect(await foundingEvent.deposits(accounts[0].address)).to.be.equal(depositAmount);
      expect(await eerc20.balanceOf(foundingEvent.address)).to.equal(0);
    });
  });

  describe('depositBNB()', function () {
    beforeEach('deploy fixture', async () => {
      const fixture = await loadFixture(foundingEventWithUniswapFixture);
      accounts = fixture.accounts;
      foundingEvent = fixture.foundingEvent.connect(accounts[0]);
      eerc20 = fixture.eerc20.connect(accounts[0]);
      wbnb = fixture.wbnb.connect(accounts[0]);
      busd = fixture.busd.connect(accounts[0]);
      router = fixture.uniswapV2Router02.connect(accounts[0]);
      factory = fixture.uniswapV2Factory.connect(accounts[0]);
      bnbBUSDPool = fixture.bnbBUSDPool.connect(accounts[0]);
      await eerc20.connect(accounts[19]).init(accounts[2].address, accounts[3].address, foundingEvent.address, accounts[0].address);
    });
    it('Should fail if emergency', async function () {
      await foundingEvent.setupEvent(1111111111111);
      await foundingEvent.toggleEmergency();
      await expect(foundingEvent.depositBNB({ value: 111111 })).to.be.reverted;
    });
    it('Should fail if presaleEndBlock is zero', async function () {
      await expect(foundingEvent.depositBNB({ value: 111111 })).to.be.reverted;
    });
    it('Should fail if let token balance of FoundingEvent is zero', async function () {
      await foundingEvent.setupEvent(1111111111111);
      await busd.transfer(foundingEvent.address, ethers.BigNumber.from('111111111111111111111111'));
      await foundingEvent.triggerLaunch();
      expect(await eerc20.balanceOf(foundingEvent.address)).to.equal(0);
      await expect(foundingEvent.depositBNB({ value: 1111111111 })).to.be.reverted;
    });
    it('Should send 5% fee to deployer if swapToBnb is false', async function () {
      const depositAmount = 10000000;
      await foundingEvent.setupEvent(1111111111111);
      const initialDeployerBalance = await provider.getBalance(accounts[0].address);
      await foundingEvent.connect(accounts[1]).depositBNB({ value: depositAmount });
      const deployerBalance = await provider.getBalance(accounts[0].address);
      const deposit = await foundingEvent.deposits(accounts[1].address);
      expect(deposit).to.be.above(0);
      expect(deployerBalance).to.equal(ethers.BigNumber.from(initialDeployerBalance).add(ethers.BigNumber.from(depositAmount / 20)));
    });
    it('Should send 5% fee to deployer if swapToBnb is true', async function () {
      await foundingEvent.setSwapToBNB(true);
      const depositAmount = 10000000;
      await foundingEvent.setupEvent(1111111111111);
      const initialDeployerBalance = await provider.getBalance(accounts[0].address);
      await foundingEvent.connect(accounts[1]).depositBNB({ value: depositAmount });
      const deployerBalance = await provider.getBalance(accounts[0].address);
      const deposit = await foundingEvent.deposits(accounts[1].address);
      expect(deposit).to.be.above(0);
      expect(deployerBalance).to.equal(ethers.BigNumber.from(initialDeployerBalance).add(ethers.BigNumber.from(depositAmount / 20)));
    });
    it('Should swap input token amount to WBNB if swapToBNB is true', async function () {
      await foundingEvent.setSwapToBNB(true);
      await foundingEvent.setupEvent(1111111111111);
      const depositAmount = 10000000;
      await foundingEvent.connect(accounts[1]).depositBNB({ value: depositAmount });
      expect(await busd.balanceOf(foundingEvent.address)).to.be.equal(0);
      expect(await wbnb.balanceOf(foundingEvent.address)).to.be.above(0);
      expect(await provider.getBalance(foundingEvent.address)).to.equal(0);
    });
    it('Should send back let tokens', async function () {
      await foundingEvent.setupEvent(1111111111111);
      await foundingEvent.setSwapToBNB(true);
      const depositAmount = 10000000;
      await foundingEvent.connect(accounts[1]).depositBNB({ value: depositAmount });
      expect(await eerc20.balanceOf(accounts[1].address)).to.be.above(0);
    });
    it('Should calculate correct let amount according to input token amount', async function () {
      await foundingEvent.setupEvent(1111111111111);
      await foundingEvent.setSwapToBNB(true);
      const depositAmount = 10000000;
      await foundingEvent.connect(accounts[1]).depositBNB({ value: depositAmount });
      expect(await eerc20.balanceOf(accounts[1].address)).to.be.equal(depositAmount);
    });
    it('Should add correct let amount to sold', async function () {
      await foundingEvent.setupEvent(1111111111111);
      await foundingEvent.setSwapToBNB(true);
      const depositAmount = 10000000;
      await foundingEvent.connect(accounts[1]).depositBNB({ value: depositAmount });
      expect(await foundingEvent.sold()).to.be.equal(depositAmount * 2);
    });
    it('Should save let amount to sender deposit', async function () {
      await foundingEvent.setupEvent(1111111111111);
      await foundingEvent.setSwapToBNB(true);
      const depositAmount = 10000000;
      await foundingEvent.connect(accounts[1]).depositBNB({ value: depositAmount });
      expect(await foundingEvent.deposits(accounts[1].address)).to.be.equal(depositAmount);
    });
    it('Should create liquidity if sold is equal or higher than maxSold', async function () {
      await foundingEvent.setupEvent(1111111111111);
      await foundingEvent.setSwapToBNB(true);
      for (let i = 0; i < 4; i++) {
        const depositAmount = (await provider.getBalance(accounts[i].address)).mul(7).div(10);
        //console.log(depositAmount);
        await foundingEvent.connect(accounts[i]).depositBNB({ value: depositAmount });
        expect(await foundingEvent.deposits(accounts[i].address)).to.be.equal(depositAmount);
      }
      expect(await eerc20.balanceOf(foundingEvent.address)).to.equal(0);
    });
    it('Should create liquidity if presaleEndBlock is reached or exceeded', async function () {
      await foundingEvent.setupEvent(100000000000);
      await mine(100000000000);
      await foundingEvent.setSwapToBNB(true);
      const depositAmount = ethers.BigNumber.from(10000000);
      await foundingEvent.depositBNB({ value: depositAmount });
      expect(await foundingEvent.deposits(accounts[0].address)).to.be.equal(depositAmount);
      expect(await eerc20.balanceOf(foundingEvent.address)).to.equal(0);
    });
  });

  describe('withdraw()', function () {
    beforeEach('deploy fixture', async () => {
      const fixture = await loadFixture(foundingEventWithUniswapFixture);
      accounts = fixture.accounts;
      foundingEvent = fixture.foundingEvent.connect(accounts[0]);
      eerc20 = fixture.eerc20.connect(accounts[0]);
      wbnb = fixture.wbnb.connect(accounts[0]);
      busd = fixture.busd.connect(accounts[0]);
      router = fixture.uniswapV2Router02.connect(accounts[0]);
      factory = fixture.uniswapV2Factory.connect(accounts[0]);
      bnbBUSDPool = fixture.bnbBUSDPool.connect(accounts[0]);
      await eerc20.connect(accounts[19]).init(accounts[2].address, accounts[3].address, foundingEvent.address, accounts[0].address);
    });
    it('Should fail if not emergency', async function () {
      await expect(foundingEvent.withdraw()).to.be.reverted;
    });
    it('Should fail if deposit is 0', async function () {
      await foundingEvent.toggleEmergency();
      await expect(foundingEvent.withdraw()).to.be.reverted;
    });
    it('Should send deposit amount to msg.sender', async function () {
      const depositAmount = (await busd.balanceOf(accounts[0].address)).div(100000);
      await foundingEvent.setupEvent(1111111111111);
      await foundingEvent.depositBNB({ value: depositAmount });
      const contractBalance = await busd.balanceOf(foundingEvent.address);
      await foundingEvent.toggleEmergency();
      const balanceAfterDeposit = await busd.balanceOf(accounts[0].address);
      await foundingEvent.withdraw();
      expect(await busd.balanceOf(accounts[0].address)).to.equal(balanceAfterDeposit.add(contractBalance));
    });
    it('Should set deposit to 0', async function () {
      const depositAmount = (await busd.balanceOf(accounts[0].address)).div(100000);
      await foundingEvent.setupEvent(1111111111111);
      await foundingEvent.depositBNB({ value: depositAmount });
      const contractBalance = await busd.balanceOf(foundingEvent.address);
      await foundingEvent.toggleEmergency();
      const balanceAfterDeposit = await busd.balanceOf(accounts[0].address);
      await foundingEvent.withdraw();
      expect(await foundingEvent.deposits(accounts[0].address)).to.equal(0);
    });
  });
});
