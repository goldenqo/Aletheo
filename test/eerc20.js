const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');
const { ethers } = require('hardhat');

const { EERC20Fixture, erc20Fixture, EERC20ProxiedFixture } = require('./fixtures/eerc20Fixtures.js');

let eerc20,
  erc20,
  eerc20Proxied = {},
  accounts = [];

describe('EERC20', function () {
  describe('init()', function () {
    beforeEach('deploy fixture', async () => {
      const fixture = await loadFixture(EERC20Fixture);
      eerc20 = fixture.eerc20;
      accounts = fixture.accounts;
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
      const fixture = await loadFixture(EERC20Fixture);
      eerc20 = fixture.eerc20;
      accounts = fixture.accounts;
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
      const fixture = await loadFixture(EERC20Fixture);
      eerc20 = fixture.eerc20;
      accounts = fixture.accounts;
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
      const fixture = await loadFixture(EERC20Fixture);
      eerc20 = fixture.eerc20;
      accounts = fixture.accounts;
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
      const fixture = await loadFixture(EERC20Fixture);
      eerc20 = fixture.eerc20;
      accounts = fixture.accounts;
    });
    it('Should return correct decimals number', async function () {
      expect(await eerc20.decimals()).to.equal(18);
    });
  });

  describe('addPool()', function () {
    beforeEach('deploy fixture', async () => {
      const fixture = await loadFixture(EERC20Fixture);
      eerc20 = fixture.eerc20;
      accounts = fixture.accounts;
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
      const fixture = await loadFixture(EERC20Fixture);
      eerc20 = fixture.eerc20;
      accounts = fixture.accounts;
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
      const fixture = await loadFixture(EERC20Fixture);
      eerc20 = fixture.eerc20;
      accounts = fixture.accounts;
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
      const fixture = await loadFixture(EERC20Fixture);
      eerc20 = fixture.eerc20;
      accounts = fixture.accounts;
    });
    it('Should set sellTax if called by governance', async function () {
      const arg = 1;
      await expect(eerc20.setSellTax(arg)).not.to.be.reverted;
      expect(await eerc20.sellTax()).to.equal(arg);
    });
    it('Should fail to set sellTax if called by not governance', async function () {
      failToSetGovernance(1, accounts[2]);
    });
    it('Should fail to set sellTax above 50 if called by governance', async function () {
      failToSetGovernance(51, accounts[0]);
    });
  });

  describe('mint()', function () {
    beforeEach('deploy fixture', async () => {
      const fixture = await loadFixture(EERC20Fixture);
      eerc20 = fixture.eerc20;
      accounts = fixture.accounts;
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
      failToMint(1, accounts[2]);
    });
    it('Should fail to overflow uint256 if called by treasury', async function () {
      failToMint(ethers.constants.MaxUint256, accounts[3]);
    });
    it('Should fail to mint 0 if called by treasury', async function () {
      failToMint(0, accounts[3]);
    });
  });

  describe('transfer()', function () {
    beforeEach('deploy fixture', async () => {
      const fixture = await loadFixture(EERC20Fixture);
      eerc20 = fixture.eerc20;
      accounts = fixture.accounts;
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
      const arg = 5;
      const { initialBalance, initialRecipientBalance } = await transferHelper(accounts[0], accounts[1], 0, arg);
      expect(await eerc20.balanceOf(accounts[1].address)).to.equal(initialRecipientBalance.add(arg));
    });
    it('Should set correct balances in transfers not involving trading pools if sellTax is not 0', async function () {
      const arg = 5;
      const { initialBalance, initialRecipientBalance } = await transferHelper(accounts[0], accounts[1], 50, arg);
      expect(await eerc20.balanceOf(accounts[1].address)).to.equal(initialRecipientBalance.add(arg));
    });
    it('Should set correct balances for sender and pool if sellTax is not 0', async function () {
      const arg = 1000,
        sellTax = 50;
      await expect(eerc20.connect(accounts[2]).addPool(accounts[1].address)).not.to.be.reverted;
      const { initialBalance, initialRecipientBalance } = await transferHelper(accounts[0], accounts[1], sellTax, arg);
      const fee = (arg * sellTax) / 1000;
      expect(await eerc20.balanceOf(accounts[1].address)).to.equal(initialRecipientBalance.add(arg).sub(fee));
    });
    it('Should send correct fee to treasury on sell if sellTax is not 0', async function () {
      const arg = 1000,
        sellTax = 50;
      await expect(eerc20.connect(accounts[2]).addPool(accounts[1].address)).not.to.be.reverted;
      const initialTreasuryBalance = await eerc20.balanceOf(accounts[3].address);
      const { initialBalance, initialRecipientBalance } = await transferHelper(accounts[0], accounts[1], sellTax, arg);
      const fee = (arg * sellTax) / 1000;
      expect(await eerc20.balanceOf(accounts[3].address)).to.equal(initialTreasuryBalance.add(fee));
    });
    it('Should ignore sellTax if sender is FoundingEvent and if sellTax is not 0', async function () {
      const arg = 1000,
        sellTax = 50;
      await expect(eerc20.connect(accounts[2]).addPool(accounts[1].address)).not.to.be.reverted;
      const initialTreasuryBalance = await eerc20.balanceOf(accounts[3].address);
      await transferHelper(accounts[4], accounts[1], sellTax, arg);
      expect(await eerc20.balanceOf(accounts[3].address)).to.equal(initialTreasuryBalance);
    });
    it('Should ignore sellTax if sender is LiquidityManager and if sellTax is not 0', async function () {
      await eerc20.transfer(accounts[2].address, 100000);
      const arg = 1000,
        sellTax = 50;
      await expect(eerc20.connect(accounts[2]).addPool(accounts[1].address)).not.to.be.reverted;
      const initialTreasuryBalance = await eerc20.balanceOf(accounts[3].address);
      await transferHelper(accounts[4], accounts[1], sellTax, arg);
      expect(await eerc20.balanceOf(accounts[3].address)).to.equal(initialTreasuryBalance);
    });
  });

  describe('transferFrom()', function () {
    beforeEach('deploy fixture', async () => {
      const fixture = await loadFixture(EERC20Fixture);
      eerc20 = fixture.eerc20;
      accounts = fixture.accounts;
    });
    it('Should successfully transferFrom', async function () {
      await eerc20.approve(accounts[1].address, ethers.constants.MaxUint256);
      const tx1 = await eerc20.connect(accounts[1]).transferFrom(accounts[0].address, accounts[1].address, 2);
      const receipt1 = await tx1.wait();
      const tx2 = await eerc20.connect(accounts[1]).transferFrom(accounts[0].address, accounts[1].address, 2);
      const receipt2 = await tx2.wait();
      await expect(receipt1.status).to.equal(1);
      await expect(receipt2.status).to.equal(1);
      console.log('         first attempt gas:' + receipt1.cumulativeGasUsed);
      console.log('         second attempt gas:' + receipt2.cumulativeGasUsed);
    });
    it('Should emit Transfer event', async function () {
      await eerc20.approve(accounts[1].address, ethers.constants.MaxUint256);
      expect(await eerc20.connect(accounts[1]).transferFrom(accounts[0].address, accounts[1].address, 2)).to.emit(eerc20, 'Transfer');
    });
    it('Should revert if balance is lower than amount', async function () {
      await eerc20.approve(accounts[1].address, ethers.constants.MaxUint256);
      await expect(eerc20.connect(accounts[1]).transferFrom(accounts[0].address, accounts[1].address, ethers.constants.MaxUint256)).to.be.reverted;
    });
    it('Should revert if allowance is false', async function () {
      await expect(eerc20.connect(accounts[1]).transferFrom(accounts[0].address, accounts[1].address, 2)).to.be.reverted;
    });

    it('Should set correct balances', async function () {
      await eerc20.approve(accounts[1].address, ethers.constants.MaxUint256);
      const arg = 5,
        sellTax = 0;
      const { initialBalance, initialRecipientBalance } = await transferFromHelper(accounts[1], accounts[0].address, accounts[1].address, sellTax, arg);
      expect(await eerc20.balanceOf(accounts[1].address)).to.equal(initialRecipientBalance.add(arg));
    });
    it('Should set correct balances for normal accounts if sellTax is not 0', async function () {
      await eerc20.approve(accounts[1].address, ethers.constants.MaxUint256);
      const arg = 5,
        sellTax = 20;
      const { initialBalance, initialRecipientBalance } = await transferFromHelper(accounts[1], accounts[0].address, accounts[1].address, sellTax, arg);
      expect(await eerc20.balanceOf(accounts[1].address)).to.equal(initialRecipientBalance.add(arg));
    });
    it('Should set correct balances for sender and pool if sellTax is not 0', async function () {
      await eerc20.approve(accounts[1].address, ethers.constants.MaxUint256);
      await expect(eerc20.connect(accounts[2]).addPool(accounts[1].address)).not.to.be.reverted;
      const arg = 1000,
        sellTax = 20;
      const { initialBalance, initialRecipientBalance } = await transferFromHelper(accounts[1], accounts[0].address, accounts[1].address, sellTax, arg);
      const fee = (arg * sellTax) / 1000;
      expect(await eerc20.balanceOf(accounts[1].address)).to.equal(initialRecipientBalance.add(arg).sub(fee));
    });
    it('Should send correct fee to treasury on sell if sellTax is not 0', async function () {
      await eerc20.approve(accounts[1].address, ethers.constants.MaxUint256);
      await expect(eerc20.connect(accounts[2]).addPool(accounts[1].address)).not.to.be.reverted;
      const initialTreasuryBalance = await eerc20.balanceOf(accounts[3].address);
      const arg = 1000,
        sellTax = 20;
      await transferFromHelper(accounts[1], accounts[0].address, accounts[1].address, sellTax, arg);
      const fee = (arg * sellTax) / 1000;
      expect(await eerc20.balanceOf(accounts[3].address)).to.equal(initialTreasuryBalance.add(fee));
    });
    it('Should ignore sellTax if sender is FoundingEvent and if sellTax is not 0', async function () {
      await eerc20.connect(accounts[4]).approve(accounts[1].address, ethers.constants.MaxUint256);
      const arg = 1000,
        sellTax = 50;
      await expect(eerc20.connect(accounts[2]).addPool(accounts[1].address)).not.to.be.reverted;
      const initialTreasuryBalance = await eerc20.balanceOf(accounts[3].address);
      await transferFromHelper(accounts[1], accounts[4].address, accounts[1].address, sellTax, arg);
      expect(await eerc20.balanceOf(accounts[3].address)).to.equal(initialTreasuryBalance);
    });
    it('Should ignore sellTax if sender is LiquidityManager and if sellTax is not 0', async function () {
      await eerc20.transfer(accounts[2].address, 100000);
      await eerc20.connect(accounts[2]).approve(accounts[1].address, ethers.constants.MaxUint256);
      const arg = 1000,
        sellTax = 50;
      await expect(eerc20.connect(accounts[2]).addPool(accounts[1].address)).not.to.be.reverted;
      const initialTreasuryBalance = await eerc20.balanceOf(accounts[3].address);
      await transferFromHelper(accounts[1], accounts[2].address, accounts[1].address, sellTax, arg);
      expect(await eerc20.balanceOf(accounts[3].address)).to.equal(initialTreasuryBalance);
    });
  });

  describe('transferBatch()', function () {
    beforeEach('deploy fixture', async () => {
      const fixture = await loadFixture(EERC20Fixture);
      eerc20 = fixture.eerc20;
      accounts = fixture.accounts;
    });

    it('Should successfully transferBatch', async function () {
      await transferBatchHelper(accounts[0], accounts, 1);
    });
    it('Should emit Transfer events', async function () {
      let { addresses, initialValues, amounts } = await transferBatchHelper(accounts[0], accounts, 1);
      //////
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
      let { addresses, initialValues, amounts } = await transferBatchHelper(accounts[0], accounts, 1);
      for (let n = 1; n < addresses.length; n++) {
        expect(await eerc20.balanceOf(accounts[n].address)).to.equal(initialValues[n].add(ethers.BigNumber.from(amounts[n])));
      }
    });
    it('Should ignore sellTax', async function () {
      await eerc20.setSellTax(50);
      const initialTreasuryBalance = await eerc20.balanceOf(accounts[3].address);
      let { addresses, initialValues, amounts } = await transferBatchHelper(accounts[0], accounts, 1);
      for (let n = 1; n < addresses.length; n++) {
        expect(await eerc20.balanceOf(accounts[n].address)).to.equal(initialValues[n].add(ethers.BigNumber.from(amounts[n])));
      }
      expect(await eerc20.balanceOf(accounts[3].address)).to.equal(initialTreasuryBalance.add(amounts[3]));
    });
  });
});

describe('EERC20Proxied', function () {
  describe('transfer()', function () {
    beforeEach('deploy fixture', async () => {
      const fixture = await loadFixture(EERC20ProxiedFixture);
      eerc20 = fixture.eerc20Proxied;
      accounts = fixture.accounts;
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
  });
  describe('transferFrom()', function () {
    beforeEach('deploy fixture', async () => {
      const fixture = await loadFixture(EERC20ProxiedFixture);
      eerc20 = fixture.eerc20Proxied;
      accounts = fixture.accounts;
    });
    it('Should successfully transferFrom', async function () {
      await eerc20.approve(accounts[1].address, ethers.constants.MaxUint256);
      const tx1 = await eerc20.connect(accounts[1]).transferFrom(accounts[0].address, accounts[1].address, 2);
      const receipt1 = await tx1.wait();
      const tx2 = await eerc20.connect(accounts[1]).transferFrom(accounts[0].address, accounts[1].address, 2);
      const receipt2 = await tx2.wait();
      await expect(receipt1.status).to.equal(1);
      await expect(receipt2.status).to.equal(1);
      console.log('         first attempt gas:' + receipt1.cumulativeGasUsed);
      console.log('         second attempt gas:' + receipt2.cumulativeGasUsed);
    });
  });
  describe('transferBatch()', function () {
    beforeEach('deploy fixture', async () => {
      const fixture = await loadFixture(EERC20ProxiedFixture);
      eerc20 = fixture.eerc20Proxied;
      accounts = fixture.accounts;
    });
    it('Should successfully transferBatch', async function () {
      await transferBatchHelper(accounts[0], accounts, 1);
    });
  });
});

describe('ERC20', function () {
  describe('transfer()', async function () {
    beforeEach('deploy fixture', async () => {
      const fixture = await loadFixture(erc20Fixture);
      erc20 = fixture.erc20;
      accounts = fixture.accounts;
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
      const fixture = await loadFixture(erc20Fixture);
      erc20 = fixture.erc20;
      accounts = fixture.accounts;
    });
    it('Should successfully transferFrom', async function () {
      await erc20.approve(accounts[1].address, ethers.constants.MaxUint256);
      const tx1 = await erc20.connect(accounts[1]).transferFrom(accounts[0].address, accounts[1].address, 2);
      const receipt1 = await tx1.wait();
      const tx2 = await erc20.connect(accounts[1]).transferFrom(accounts[0].address, accounts[1].address, 2);
      const receipt2 = await tx2.wait();
      await expect(receipt1.status).to.equal(1);
      await expect(receipt2.status).to.equal(1);
      console.log('         first attempt gas:' + receipt1.cumulativeGasUsed);
      console.log('         second attempt gas:' + receipt2.cumulativeGasUsed);
    });
  });
});

async function failToSetGovernance(arg, caller) {
  const initialValue = await eerc20.sellTax();
  await expect(eerc20.connect(caller).setSellTax(arg)).to.be.reverted;
  expect(await eerc20.sellTax()).to.equal(initialValue);
}

async function failToMint(arg, signer) {
  const initialValue = await eerc20.totalSupply();
  await expect(eerc20.connect(signer).mint(accounts[0].address, arg)).to.be.reverted;
  expect(await eerc20.totalSupply()).to.equal(initialValue);
}

async function transferHelper(sender, recipient, sellTax, arg) {
  await eerc20.setSellTax(sellTax);
  const initialBalance = await eerc20.balanceOf(sender.address);
  const initialRecipientBalance = await eerc20.balanceOf(recipient.address);
  const tx = await eerc20.connect(sender).transfer(recipient.address, arg);
  const receipt = await tx.wait();
  expect(receipt.status).to.equal(1);
  expect(await eerc20.balanceOf(sender.address)).to.equal(initialBalance.sub(arg));
  return { initialBalance, initialRecipientBalance };
}

async function transferFromHelper(caller, sender, recipient, sellTax, arg) {
  await eerc20.setSellTax(sellTax);
  const initialBalance = await eerc20.balanceOf(sender);
  const initialRecipientBalance = await eerc20.balanceOf(recipient);
  const tx = await eerc20.connect(caller).transferFrom(sender, recipient, arg);
  const receipt = await tx.wait();
  expect(await eerc20.balanceOf(sender)).to.equal(initialBalance.sub(arg));
  await expect(receipt.status).to.equal(1);
  return { initialBalance, initialRecipientBalance };
}

async function transferBatchHelper(sender, recipients, power) {
  let addresses = [];
  let amounts = [];
  let initialValues = [];
  let totalAmount = 0;
  for (let n = 0; n < recipients.length; n++) {
    addresses.push(recipients[n].address);
    amounts.push(n ** power);
    initialValues.push(await eerc20.balanceOf(recipients[n].address));
    totalAmount += n ** power;
  }
  let initialBalance = await eerc20.balanceOf(sender.address);
  const tx = await eerc20.connect(sender).transferBatch(addresses, amounts);
  const receipt = await tx.wait();
  console.log('         first attempt gas:' + receipt.cumulativeGasUsed);
  await expect(receipt.status).to.equal(1);
  expect(await eerc20.balanceOf(sender.address)).to.equal(initialBalance.sub(totalAmount));
  return { addresses, initialValues, amounts };
}
