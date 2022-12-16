const { expect } = require('chai');
const { ethers } = require('hardhat');

const { EERC20Fixture, erc20Fixture, EERC20ProxiedFixture } = require('./fixtures.js');

let eerc20,
  erc20,
  eerc20Proxied = {},
  accounts = [];

describe('EERC20', function () {
  describe('init()', function () {
    beforeEach('deploy fixture', async () => {
      const _ = await EERC20Fixture();
      eerc20 = _.eerc20;
      accounts = _.accounts;
    });
    it('Should initialize state variables correctly', async function () {
      expect(await eerc20.ini()).to.equal(true);
      expect(await eerc20.name()).to.equal('Aletheo');
      expect(await eerc20.symbol()).to.equal('LET');
      expect(await eerc20.liquidityManager()).to.equal(accounts[2].address);
      expect(await eerc20.treasury()).to.equal(accounts[3].address);
      expect(await eerc20.foundingEvent()).to.equal(accounts[4].address);
      expect(await eerc20.governance()).to.equal(accounts[0].address);
    });
    it('Should set correct initial balances for governance, treasury and FoundingEvent', async () => {
      expect(await eerc20.balanceOf(accounts[0].address)).to.equal(ethers.BigNumber.from('15000000000000000000000'));
      expect(await eerc20.balanceOf(accounts[3].address)).to.equal(ethers.BigNumber.from('50000000000000000000000'));
      expect(await eerc20.balanceOf(accounts[4].address)).to.equal(ethers.BigNumber.from('90000000000000000000000'));
    });
    it('Should set correct totalSupply', async () => {
      expect(await eerc20.totalSupply()).to.equal(ethers.BigNumber.from('155000000000000000000000'));
    });
    it('Cant be initialized more than once', async () => {
      await expect(eerc20.init(accounts[2].address, accounts[3].address, accounts[4].address, accounts[0].address)).to.be.reverted;
    });
  });

  describe('allowance()', function () {
    beforeEach('deploy fixture', async () => {
      const _ = await EERC20Fixture();
      eerc20 = _.eerc20;
      accounts = _.accounts;
    });
    it('Should have false by default', async function () {
      expect(await eerc20.allowance(accounts[1].address, accounts[0].address)).to.equal(0);
    });
    it('Should have pancake router allowance by default', async function () {
      expect(await eerc20.allowance(accounts[1].address, '0x10ED43C718714eb63d5aA57B78B54704E256024E')).to.equal(ethers.constants.MaxUint256);
    });
  });

  describe('approve()', function () {
    beforeEach('deploy fixture', async () => {
      const _ = await EERC20Fixture();
      eerc20 = _.eerc20;
      accounts = _.accounts;
    });
    it('Should set to true', async function () {
      await eerc20.approve(accounts[1].address, 1);
      expect(await eerc20.allowance(accounts[0].address, accounts[1].address)).to.equal(ethers.constants.MaxUint256);
    });
    it('Should be unable to set pancake router allowance', async function () {
      expect(await eerc20.allowance(accounts[0].address, '0x10ED43C718714eb63d5aA57B78B54704E256024E')).to.equal(ethers.constants.MaxUint256);
      await eerc20.approve('0x10ED43C718714eb63d5aA57B78B54704E256024E', 1);
      expect(await eerc20.allowance(accounts[0].address, '0x10ED43C718714eb63d5aA57B78B54704E256024E')).to.equal(ethers.constants.MaxUint256);
    });
  });

  describe('disallow()', function () {
    beforeEach('deploy fixture', async () => {
      const _ = await EERC20Fixture();
      eerc20 = _.eerc20;
      accounts = _.accounts;
    });
    it('Should set to true', async function () {
      await eerc20.approve(accounts[1].address, 1);
      expect(await eerc20.allowance(accounts[0].address, accounts[1].address)).to.equal(ethers.constants.MaxUint256);
      await eerc20.disallow(accounts[1].address);
      expect(await eerc20.allowance(accounts[0].address, accounts[1].address)).to.equal(0);
    });
    it('Should be unable to set pancake router allowance', async function () {
      expect(await eerc20.allowance(accounts[0].address, '0x10ED43C718714eb63d5aA57B78B54704E256024E')).to.equal(ethers.constants.MaxUint256);
      await eerc20.disallow('0x10ED43C718714eb63d5aA57B78B54704E256024E');
      expect(await eerc20.allowance(accounts[0].address, '0x10ED43C718714eb63d5aA57B78B54704E256024E')).to.equal(ethers.constants.MaxUint256);
    });
  });

  describe('decimals()', function () {
    beforeEach('deploy fixture', async () => {
      const _ = await EERC20Fixture();
      eerc20 = _.eerc20;
      accounts = _.accounts;
    });
    it('Should return correct decimals number', async function () {
      expect(await eerc20.decimals()).to.equal(18);
    });
  });

  describe('addPool()', function () {
    beforeEach('deploy fixture', async () => {
      const _ = await EERC20Fixture();
      eerc20 = _.eerc20;
      accounts = _.accounts;
    });
    it('Should set Pool to true for address if called by liquidityManager', async function () {
      await expect(eerc20.connect(accounts[2]).addPool(accounts[1].address)).not.to.be.reverted;
      expect(await eerc20.pools(accounts[1].address)).to.equal(true);
    });
    it('Should fail to set Pool to true if called by not liquidityManager', async function () {
      await expect(eerc20.addPool(accounts[1].address)).to.be.reverted;
      expect(await eerc20.pools(accounts[1].address)).to.equal(false);
    });
  });

  describe('setLiquidityManager()', function () {
    beforeEach('deploy fixture', async () => {
      const _ = await EERC20Fixture();
      eerc20 = _.eerc20;
      accounts = _.accounts;
    });
    it('Should set liquidityManager if called by governance', async function () {
      await expect(eerc20.setLiquidityManager(accounts[1].address)).not.to.be.reverted;
      expect(await eerc20.liquidityManager()).to.equal(accounts[1].address);
    });
    it('Should fail to set liquidityManager if called by not governance', async function () {
      await expect(eerc20.connect(accounts[2]).setLiquidityManager(accounts[1].address)).to.be.reverted;
      expect(await eerc20.liquidityManager()).to.equal(accounts[2].address);
    });
  });

  describe('setGovernance()', function () {
    beforeEach('deploy fixture', async () => {
      const _ = await EERC20Fixture();
      eerc20 = _.eerc20;
      accounts = _.accounts;
    });
    it('Should set governance if called by governance', async function () {
      await expect(eerc20.setGovernance(accounts[1].address)).not.to.be.reverted;
      expect(await eerc20.governance()).to.equal(accounts[1].address);
    });
    it('Should fail to set governance if called by not governance', async function () {
      await expect(eerc20.connect(accounts[2]).setGovernance(accounts[1].address)).to.be.reverted;
      expect(await eerc20.governance()).to.equal(accounts[0].address);
    });
  });

  describe('setSellTax()', function () {
    beforeEach('deploy fixture', async () => {
      const _ = await EERC20Fixture();
      eerc20 = _.eerc20;
      accounts = _.accounts;
    });
    it('Should set sellTax if called by governance', async function () {
      const arg = 1;
      await expect(eerc20.setSellTax(arg)).not.to.be.reverted;
      expect(await eerc20.sellTax()).to.equal(arg);
    });
    it('Should fail to set sellTax if called by not governance', async function () {
      const initialValue = await eerc20.sellTax();
      const arg = 1;
      await expect(eerc20.connect(accounts[2]).setSellTax(arg)).to.be.reverted;
      expect(await eerc20.sellTax()).to.equal(initialValue);
    });
    it('Should fail to set sellTax above 50 if called by governance', async function () {
      const initialValue = await eerc20.sellTax();
      const arg = 51;
      await expect(eerc20.setSellTax(arg)).to.be.reverted;
      expect(await eerc20.sellTax()).to.equal(initialValue);
    });
  });

  describe('mint()', function () {
    beforeEach('deploy fixture', async () => {
      const _ = await EERC20Fixture();
      eerc20 = _.eerc20;
      accounts = _.accounts;
    });
    it('Should mint gazillions if called by treasury', async function () {
      const arg = ethers.BigNumber.from('999999999999999999999999999999999999');
      await expect(eerc20.connect(accounts[3]).mint(accounts[0].address, arg)).not.to.be.reverted;
    });
    it('Should emit transfer from address 0 if called by treasury', async function () {
      const arg = 1;
      await expect(eerc20.connect(accounts[3]).mint(accounts[0].address, arg)).to.emit(eerc20, 'Transfer');
    });
    it('Should increase totalSupply if called by treasury', async function () {
      const initialValue = await eerc20.totalSupply();
      const arg = 1;
      await expect(eerc20.connect(accounts[3]).mint(accounts[0].address, arg)).not.to.be.reverted;
      expect(await eerc20.totalSupply()).to.equal(initialValue.add(arg));
    });
    it('Should fail to mint if called by not treasury', async function () {
      const initialValue = await eerc20.totalSupply();
      const arg = 1;
      await expect(eerc20.connect(accounts[2]).mint(accounts[0].address, arg)).to.be.reverted;
      expect(await eerc20.totalSupply()).to.equal(initialValue);
    });
    it('Should fail to overflow uint256 if called by treasury', async function () {
      const initialValue = await eerc20.totalSupply();
      const arg = ethers.constants.MaxUint256;
      await expect(eerc20.connect(accounts[3]).mint(accounts[0].address, arg)).to.be.reverted;
      expect(await eerc20.totalSupply()).to.equal(initialValue);
    });
    it('Should fail to mint 0 if called by treasury', async function () {
      const initialValue = await eerc20.totalSupply();
      const arg = 0;
      await expect(eerc20.connect(accounts[3]).mint(accounts[0].address, arg)).to.be.reverted;
      expect(await eerc20.totalSupply()).to.equal(initialValue);
    });
  });

  describe('transfer()', function () {
    beforeEach('deploy fixture', async () => {
      const _ = await EERC20Fixture();
      eerc20 = _.eerc20;
      accounts = _.accounts;
    });
    it('Should successfully transfer', async function () {
      const tx = await eerc20.transfer(accounts[1].address, 1);
      const receipt = await tx.wait();

      const tx1 = await eerc20.transfer(accounts[1].address, 1);
      const receipt1 = await tx1.wait();
      await expect(receipt.status).to.equal(1);
      await expect(receipt1.status).to.equal(1);
      console.log('         first attempt gas:' + receipt.cumulativeGasUsed);
      console.log('         second attempt gas:' + receipt1.cumulativeGasUsed);
    });
    it('Should emit Transfer event', async function () {
      expect(await eerc20.transfer(accounts[1].address, 1)).to.emit(eerc20, 'Transfer');
    });
    it('Should revert if balance is lower than amount', async function () {
      await expect(eerc20.transfer(accounts[1].address, ethers.constants.MaxUint256)).to.be.reverted;
    });
    it('Should set correct balances', async function () {
      const initialBalance = await eerc20.balanceOf(accounts[0].address);
      const initialRecipientBalance = await eerc20.balanceOf(accounts[1].address);
      const arg = 5;
      const tx = await eerc20.transfer(accounts[1].address, arg);
      const receipt = await tx.wait();
      expect(await eerc20.balanceOf(accounts[0].address)).to.equal(initialBalance.sub(arg));
      expect(await eerc20.balanceOf(accounts[1].address)).to.equal(initialRecipientBalance.add(arg));
      await expect(receipt.status).to.equal(1);
    });
    it('Should set correct balances for normal accounts if sellTax is not 0', async function () {
      await eerc20.setSellTax(50);
      const initialBalance = await eerc20.balanceOf(accounts[0].address);
      const initialRecipientBalance = await eerc20.balanceOf(accounts[1].address);
      const arg = 5;
      const tx = await eerc20.transfer(accounts[1].address, arg);
      const receipt = await tx.wait();
      expect(await eerc20.balanceOf(accounts[0].address)).to.equal(initialBalance.sub(arg));
      expect(await eerc20.balanceOf(accounts[1].address)).to.equal(initialRecipientBalance.add(arg));
      await expect(receipt.status).to.equal(1);
    });
    it('Should set correct balances for sender and pool if sellTax is not 0', async function () {
      await eerc20.setSellTax(50);
      const sellTax = await eerc20.sellTax();
      await expect(eerc20.connect(accounts[2]).addPool(accounts[1].address)).not.to.be.reverted;
      const initialBalance = await eerc20.balanceOf(accounts[0].address);
      const initialRecipientBalance = await eerc20.balanceOf(accounts[1].address);
      const arg = 1000;
      const tx = await eerc20.transfer(accounts[1].address, arg);
      const receipt = await tx.wait();
      expect(await eerc20.balanceOf(accounts[0].address)).to.equal(initialBalance.sub(arg));
      const fee = (arg * sellTax) / 1000;
      expect(await eerc20.balanceOf(accounts[1].address)).to.equal(initialRecipientBalance.add(arg).sub(fee));
      await expect(receipt.status).to.equal(1);
    });
    it('Should send correct fee to treasury on sell if sellTax is not 0', async function () {
      await eerc20.setSellTax(50);
      const sellTax = await eerc20.sellTax();
      await expect(eerc20.connect(accounts[2]).addPool(accounts[1].address)).not.to.be.reverted;
      const initialTreasuryBalance = await eerc20.balanceOf(accounts[3].address);
      const arg = 1000;
      const tx = await eerc20.transfer(accounts[1].address, arg);
      const fee = (arg * sellTax) / 1000;
      expect(await eerc20.balanceOf(accounts[3].address)).to.equal(initialTreasuryBalance.add(fee));
    });
    it('Should ignore sellTax if sender is FoundingEvent and if sellTax is not 0', async function () {
      await eerc20.setSellTax(50);
      const sellTax = await eerc20.sellTax();
      await expect(eerc20.connect(accounts[2]).addPool(accounts[1].address)).not.to.be.reverted;
      const initialRecipientBalance = await eerc20.balanceOf(accounts[1].address);
      const initialTreasuryBalance = await eerc20.balanceOf(accounts[3].address);
      const arg = 1000;
      const tx = await eerc20.connect(accounts[4]).transfer(accounts[1].address, arg);
      const fee = (arg * sellTax) / 1000;
      expect(await eerc20.balanceOf(accounts[3].address)).to.equal(initialTreasuryBalance);
      expect(await eerc20.balanceOf(accounts[1].address)).to.equal(initialRecipientBalance.add(arg));
    });
    it('Should ignore sellTax if sender is LiquidityManager and if sellTax is not 0', async function () {
      await eerc20.transfer(accounts[2].address, 1000000);
      await eerc20.setSellTax(50);
      const sellTax = await eerc20.sellTax();
      await expect(eerc20.connect(accounts[2]).addPool(accounts[1].address)).not.to.be.reverted;
      const initialRecipientBalance = await eerc20.balanceOf(accounts[1].address);
      const initialTreasuryBalance = await eerc20.balanceOf(accounts[3].address);
      const arg = 1000;
      const tx = await eerc20.connect(accounts[2]).transfer(accounts[1].address, arg);
      const fee = (arg * sellTax) / 1000;
      expect(await eerc20.balanceOf(accounts[3].address)).to.equal(initialTreasuryBalance);
      expect(await eerc20.balanceOf(accounts[1].address)).to.equal(initialRecipientBalance.add(arg));
    });
  });

  describe('transferFrom()', function () {
    beforeEach('deploy fixture', async () => {
      const _ = await EERC20Fixture();
      eerc20 = _.eerc20;
      accounts = _.accounts;
    });
    it('Should successfully transferFrom', async function () {
      console.log(accounts[1].address);

      const tx = await eerc20.approve(accounts[1].address, ethers.constants.MaxUint256);
      const receipt = await tx.wait();

      const tx1 = await eerc20.connect(accounts[1]).transferFrom(accounts[0].address, accounts[1].address, 2);
      const receipt1 = await tx1.wait();

      const tx2 = await eerc20.connect(accounts[1]).transferFrom(accounts[0].address, accounts[1].address, 2);
      const receipt2 = await tx2.wait();

      await expect(receipt.status).to.equal(1);
      await expect(receipt1.status).to.equal(1);
      await expect(receipt2.status).to.equal(1);
      //console.log("         first attempt gas:" + receipt.cumulativeGasUsed);
      console.log('         first attempt gas:' + receipt1.cumulativeGasUsed);
      console.log('         second attempt gas:' + receipt2.cumulativeGasUsed);
    });
    it('Should emit Transfer event', async function () {
      const tx = await eerc20.approve(accounts[1].address, ethers.constants.MaxUint256);
      expect(await eerc20.connect(accounts[1]).transferFrom(accounts[0].address, accounts[1].address, 2)).to.emit(eerc20, 'Transfer');
    });
    it('Should revert if balance is lower than amount', async function () {
      const tx = await eerc20.approve(accounts[1].address, ethers.constants.MaxUint256);
      await expect(eerc20.connect(accounts[1]).transferFrom(accounts[0].address, accounts[1].address, ethers.constants.MaxUint256)).to.be.reverted;
    });
    it('Should revert if allowance is false', async function () {
      await expect(eerc20.connect(accounts[1]).transferFrom(accounts[0].address, accounts[1].address, 2)).to.be.reverted;
    });
    it('Should set correct balances', async function () {
      await eerc20.approve(accounts[1].address, ethers.constants.MaxUint256);
      const initialBalance = await eerc20.balanceOf(accounts[0].address);
      const initialRecipientBalance = await eerc20.balanceOf(accounts[1].address);
      const arg = 5;
      const tx = await eerc20.connect(accounts[1]).transferFrom(accounts[0].address, accounts[1].address, arg);
      const receipt = await tx.wait();
      expect(await eerc20.balanceOf(accounts[0].address)).to.equal(initialBalance.sub(arg));
      expect(await eerc20.balanceOf(accounts[1].address)).to.equal(initialRecipientBalance.add(arg));
      await expect(receipt.status).to.equal(1);
    });
    it('Should set correct balances for normal accounts if sellTax is not 0', async function () {
      await eerc20.approve(accounts[1].address, ethers.constants.MaxUint256);
      await eerc20.setSellTax(50);
      const initialBalance = await eerc20.balanceOf(accounts[0].address);
      const initialRecipientBalance = await eerc20.balanceOf(accounts[1].address);
      const arg = 5;
      const tx = await eerc20.connect(accounts[1]).transferFrom(accounts[0].address, accounts[1].address, arg);
      const receipt = await tx.wait();
      expect(await eerc20.balanceOf(accounts[0].address)).to.equal(initialBalance.sub(arg));
      expect(await eerc20.balanceOf(accounts[1].address)).to.equal(initialRecipientBalance.add(arg));
      await expect(receipt.status).to.equal(1);
    });
    it('Should set correct balances for sender and pool if sellTax is not 0', async function () {
      await eerc20.approve(accounts[1].address, ethers.constants.MaxUint256);
      await eerc20.setSellTax(50);
      const sellTax = await eerc20.sellTax();
      await expect(eerc20.connect(accounts[2]).addPool(accounts[1].address)).not.to.be.reverted;
      const initialBalance = await eerc20.balanceOf(accounts[0].address);
      const initialRecipientBalance = await eerc20.balanceOf(accounts[1].address);
      const arg = 1000;
      const tx = await eerc20.connect(accounts[1]).transferFrom(accounts[0].address, accounts[1].address, arg);
      const receipt = await tx.wait();
      expect(await eerc20.balanceOf(accounts[0].address)).to.equal(initialBalance.sub(arg));
      const fee = (arg * sellTax) / 1000;
      expect(await eerc20.balanceOf(accounts[1].address)).to.equal(initialRecipientBalance.add(arg).sub(fee));
      await expect(receipt.status).to.equal(1);
    });
    it('Should send correct fee to treasury on sell if sellTax is not 0', async function () {
      await eerc20.approve(accounts[1].address, ethers.constants.MaxUint256);
      await eerc20.setSellTax(50);
      const sellTax = await eerc20.sellTax();
      await expect(eerc20.connect(accounts[2]).addPool(accounts[1].address)).not.to.be.reverted;
      const initialTreasuryBalance = await eerc20.balanceOf(accounts[3].address);
      const arg = 1000;
      const tx = await eerc20.connect(accounts[1]).transferFrom(accounts[0].address, accounts[1].address, arg);
      const fee = (arg * sellTax) / 1000;
      expect(await eerc20.balanceOf(accounts[3].address)).to.equal(initialTreasuryBalance.add(fee));
    });
    it('Should ignore sellTax if sender is FoundingEvent and if sellTax is not 0', async function () {
      await eerc20.connect(accounts[4]).approve(accounts[1].address, ethers.constants.MaxUint256);
      await eerc20.setSellTax(50);
      const sellTax = await eerc20.sellTax();
      await expect(eerc20.connect(accounts[2]).addPool(accounts[1].address)).not.to.be.reverted;
      const initialRecipientBalance = await eerc20.balanceOf(accounts[1].address);
      const initialTreasuryBalance = await eerc20.balanceOf(accounts[3].address);
      const arg = 1000;
      const tx = await eerc20.connect(accounts[1]).transferFrom(accounts[4].address, accounts[1].address, arg);
      const fee = (arg * sellTax) / 1000;
      expect(await eerc20.balanceOf(accounts[3].address)).to.equal(initialTreasuryBalance);
      expect(await eerc20.balanceOf(accounts[1].address)).to.equal(initialRecipientBalance.add(arg));
    });
    it('Should ignore sellTax if sender is LiquidityManager and if sellTax is not 0', async function () {
      await eerc20.connect(accounts[2]).approve(accounts[1].address, ethers.constants.MaxUint256);
      await eerc20.transfer(accounts[2].address, 1000000);
      await eerc20.setSellTax(50);
      const sellTax = await eerc20.sellTax();
      await expect(eerc20.connect(accounts[2]).addPool(accounts[1].address)).not.to.be.reverted;
      const initialRecipientBalance = await eerc20.balanceOf(accounts[1].address);
      const initialTreasuryBalance = await eerc20.balanceOf(accounts[3].address);
      const arg = 1000;
      const tx = await eerc20.connect(accounts[1]).transferFrom(accounts[2].address, accounts[1].address, arg);
      const fee = (arg * sellTax) / 1000;
      expect(await eerc20.balanceOf(accounts[3].address)).to.equal(initialTreasuryBalance);
      expect(await eerc20.balanceOf(accounts[1].address)).to.equal(initialRecipientBalance.add(arg));
    });
  });

  describe('transferBatch()', function () {
    beforeEach('deploy fixture', async () => {
      const _ = await EERC20Fixture();
      eerc20 = _.eerc20;
      accounts = _.accounts;
    });
    it('Should successfully transferBatch', async function () {
      let addresses = [];
      let amounts = [];
      for (let n = 0; n < accounts.length; n++) {
        addresses.push(accounts[n].address);
        amounts.push(n);
      }
      const tx = await eerc20.transferBatch(addresses, amounts);
      const receipt = await tx.wait();
      console.log('         first attempt gas:' + receipt.cumulativeGasUsed);

      const tx1 = await eerc20.transferBatch(addresses, amounts);
      const receipt1 = await tx1.wait();
      console.log('         second attempt gas:' + receipt1.cumulativeGasUsed);
      await expect(receipt.status).to.equal(1);
      await expect(receipt1.status).to.equal(1);
    });

    it('Should emit Transfer events', async function () {
      let addresses = [];
      let amounts = [];
      let initialValues = [];
      let totalAmount = 0;
      for (let n = 0; n < accounts.length; n++) {
        addresses.push(accounts[n].address);
        amounts.push(n);
        initialValues.push(await eerc20.balanceOf(accounts[n].address));
        totalAmount += n;
      }
      let initialBalance = await eerc20.balanceOf(accounts[0].address);
      const tx = await eerc20.transferBatch(addresses, amounts);
      expect(tx)
        .to.emit(eerc20, 'Transfer')
        .withArgs(...addresses, ...amounts);
      expect(await eerc20.balanceOf(accounts[0].address)).to.equal(initialBalance.sub(totalAmount));
      for (let n = 1; n < addresses.length; n++) {
        expect(await eerc20.balanceOf(accounts[n].address)).to.equal(initialValues[n].add(ethers.BigNumber.from(amounts[n])));
      }
    });
    it('Should revert if sender balance is lower than sum of amounts', async function () {
      let addresses = [];
      let amounts = [];
      let initialValues = [];
      let totalAmount = 0;
      for (let n = 0; n < accounts.length; n++) {
        addresses.push(accounts[n].address);
        amounts.push(ethers.BigNumber.from(n).mul(ethers.BigNumber.from('99999999999999999999999999')));
        initialValues.push(await eerc20.balanceOf(accounts[n].address));
        totalAmount += ethers.BigNumber.from(n).mul(ethers.BigNumber.from('99999999999999999999999999'));
      }
      await expect(eerc20.transferBatch(addresses, amounts)).to.be.reverted;
    });

    it('Should set correct balances', async function () {
      let addresses = [];
      let amounts = [];
      let initialValues = [];
      let totalAmount = 0;
      for (let n = 0; n < accounts.length; n++) {
        addresses.push(accounts[n].address);
        amounts.push(n);
        initialValues.push(await eerc20.balanceOf(accounts[n].address));
        totalAmount += n;
      }
      let initialBalance = await eerc20.balanceOf(accounts[0].address);
      const tx = await eerc20.transferBatch(addresses, amounts);
      const receipt = await tx.wait();
      console.log('         first attempt gas:' + receipt.cumulativeGasUsed);

      const tx1 = await eerc20.transferBatch(addresses, amounts);
      const receipt1 = await tx1.wait();
      console.log('         second attempt gas:' + receipt1.cumulativeGasUsed);
      expect(await eerc20.balanceOf(accounts[0].address)).to.equal(initialBalance.sub(totalAmount * 2));
      for (let n = 1; n < addresses.length; n++) {
        expect(await eerc20.balanceOf(accounts[n].address)).to.equal(initialValues[n].add(ethers.BigNumber.from(amounts[n] * 2)));
      }
      await expect(receipt.status).to.equal(1);
      await expect(receipt1.status).to.equal(1);
    });
    it('Should ignore sellTax', async function () {
      await eerc20.setSellTax(50);
      const initialBalance = await eerc20.balanceOf(accounts[0].address);
      const initialTreasuryBalance = await eerc20.balanceOf(accounts[3].address);
      let addresses = [];
      let amounts = [];
      let initialValues = [];
      let totalAmount = 0;

      for (let n = 0; n < accounts.length; n++) {
        addresses.push(accounts[n].address);
        amounts.push(n * 10000);
        initialValues.push(await eerc20.balanceOf(accounts[n].address));
        totalAmount += n * 10000;
      }

      const tx = await eerc20.transferBatch(addresses, amounts);
      expect(await eerc20.balanceOf(accounts[0].address)).to.equal(initialBalance.sub(totalAmount));
      for (let n = 1; n < accounts.length; n++) {
        expect(await eerc20.balanceOf(accounts[n].address)).to.equal(initialValues[n].add(ethers.BigNumber.from(amounts[n])));
      }
      expect(await eerc20.balanceOf(accounts[3].address)).to.equal(initialTreasuryBalance.add(amounts[3]));
    });
  });
});

describe('EERC20Proxied', function () {
  describe('transfer()', function () {
    beforeEach('deploy fixture', async () => {
      const _ = await EERC20ProxiedFixture();
      eerc20Proxied = _.eerc20Proxied;
      accounts = _.accounts;
    });
    it('Should successfully transfer', async function () {
      const tx = await eerc20Proxied.transfer(accounts[1].address, 1);
      const receipt = await tx.wait();

      const tx1 = await eerc20Proxied.transfer(accounts[1].address, 1);
      const receipt1 = await tx1.wait();
      await expect(receipt.status).to.equal(1);
      await expect(receipt1.status).to.equal(1);
      console.log('         first attempt gas:' + receipt.cumulativeGasUsed);
      console.log('         second attempt gas:' + receipt1.cumulativeGasUsed);
    });
  });
  describe('transferFrom()', function () {
    beforeEach('deploy fixture', async () => {
      const _ = await EERC20ProxiedFixture();
      eerc20Proxied = _.eerc20Proxied;
      accounts = _.accounts;
    });
    it('Should successfully transferFrom', async function () {
      console.log(accounts[1].address);
      const tx = await eerc20Proxied.approve(accounts[1].address, ethers.constants.MaxUint256);
      const receipt = await tx.wait();

      const tx1 = await eerc20Proxied.connect(accounts[1]).transferFrom(accounts[0].address, accounts[1].address, 2);

      const receipt1 = await tx1.wait();

      const tx2 = await eerc20Proxied.connect(accounts[1]).transferFrom(accounts[0].address, accounts[1].address, 2);

      const receipt2 = await tx2.wait();

      await expect(receipt.status).to.equal(1);
      await expect(receipt1.status).to.equal(1);
      await expect(receipt2.status).to.equal(1);
      //console.log("         first attempt gas:" + receipt.cumulativeGasUsed);
      console.log('         first attempt gas:' + receipt1.cumulativeGasUsed);
      console.log('         second attempt gas:' + receipt2.cumulativeGasUsed);
    });
  });
  describe('transferBatch()', function () {
    beforeEach('deploy fixture', async () => {
      const _ = await EERC20ProxiedFixture();
      eerc20Proxied = _.eerc20Proxied;
      accounts = _.accounts;
    });
    it('Should successfully transferBatch', async function () {
      let addresses = [];
      let amounts = [];
      accounts.forEach((el, n) => {
        addresses.push(el.address);
        amounts.push(n);
        n++;
      });
      const tx = await eerc20Proxied.transferBatch(addresses, amounts);
      const receipt = await tx.wait();
      console.log('         first attempt gas:' + receipt.cumulativeGasUsed);

      const tx1 = await eerc20Proxied.transferBatch(addresses, amounts);
      const receipt1 = await tx1.wait();
      console.log('         second attempt gas:' + receipt1.cumulativeGasUsed);
      await expect(receipt.status).to.equal(1);
      await expect(receipt1.status).to.equal(1);
    });
    it('Should set correct balance', async function () {
      let addresses = [];
      let amounts = [];
      let initialValues = [];
      accounts.forEach(async (el, n) => {
        addresses.push(el.address);
        amounts.push(n);
        initialValues.push(await eerc20Proxied.balanceOf(el.address));
        n++;
      });
      let initialBalance = await eerc20Proxied.balanceOf(accounts[0].address);
      const tx = await eerc20Proxied.transferBatch(addresses, amounts);
      const receipt = await tx.wait();
      console.log('         first attempt gas:' + receipt.cumulativeGasUsed);

      const tx1 = await eerc20Proxied.transferBatch(addresses, amounts);
      const receipt1 = await tx1.wait();
      console.log('         second attempt gas:' + receipt1.cumulativeGasUsed);
      expect(await eerc20Proxied.balanceOf(accounts[0].address)).to.equal(initialBalance.sub(380));
      for (let n = 1; n < addresses.length; n++) {
        expect(await eerc20Proxied.balanceOf(accounts[n].address)).to.equal(initialValues[n].add(ethers.BigNumber.from(amounts[n] * 2)));
      }
      await expect(receipt.status).to.equal(1);
      await expect(receipt1.status).to.equal(1);
    });
  });
});

describe('ERC20', function () {
  describe('transfer()', async function () {
    beforeEach('deploy fixture', async () => {
      const _ = await erc20Fixture();
      erc20 = _.erc20;
      accounts = _.accounts;
    });
    it('Should successfully transfer', async function () {
      const tx = await erc20.transfer(accounts[1].address, 1);
      const receipt = await tx.wait();
      const tx1 = await erc20.transfer(accounts[1].address, 1);
      const receipt1 = await tx1.wait();
      await expect(receipt.status).to.equal(1);
      await expect(receipt1.status).to.equal(1);
      console.log('         first attempt gas:' + receipt.cumulativeGasUsed);
      console.log('         second attempt gas:' + receipt1.cumulativeGasUsed);
    });
  });
  describe('transferFrom()', async function () {
    beforeEach('deploy fixture', async () => {
      const _ = await erc20Fixture();
      erc20 = _.erc20;
      accounts = _.accounts;
    });
    it('Should successfully transferFrom', async function () {
      const tx = await erc20.approve(accounts[1].address, ethers.constants.MaxUint256);
      const receipt = await tx.wait();

      const tx1 = await erc20.connect(accounts[1]).transferFrom(accounts[0].address, accounts[1].address, 2);

      const receipt1 = await tx1.wait();

      const tx2 = await erc20.connect(accounts[1]).transferFrom(accounts[0].address, accounts[1].address, 2);

      const receipt2 = await tx2.wait();

      await expect(receipt.status).to.equal(1);
      await expect(receipt1.status).to.equal(1);
      await expect(receipt2.status).to.equal(1);
      //console.log("         first attempt gas:" + receipt.cumulativeGasUsed);
      console.log('         first attempt gas:' + receipt1.cumulativeGasUsed);
      console.log('         second attempt gas:' + receipt2.cumulativeGasUsed);
    });
  });
});
