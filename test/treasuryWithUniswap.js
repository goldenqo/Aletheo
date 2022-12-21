const { expect } = require('chai');
const { loadFixture, time, mine, setBalance } = require('@nomicfoundation/hardhat-network-helpers');
const { treasuryWithUniswapAndFoundingEventNotConcludedFixture } = require('./fixtures/treasuryFixtures.js');
const { ethers } = require('hardhat');
const { ONE, ONE_THOUSAND, TEN_THOUSAND, TEN_MILLION } = require('./constants.js');

let treasury,
  eerc20,
  wbnb,
  busd,
  foundingEvent,
  staking,
  router,
  factory,
  letBNBpool,
  pool,
  bnbBUSDPool = {},
  accounts = [];
const provider = ethers.provider;

async function calculateRateLocally() {
  let rate;
  const wbnbSize = ethers.BigNumber.from(wbnb.address);
  const eerc20Size = ethers.BigNumber.from(eerc20.address);
  const [token0, token1] = wbnbSize.gt(eerc20Size) ? [eerc20.address, wbnb.address] : [wbnb.address, eerc20.address];
  const reserves = await letBNBpool.getReserves();
  const [reserveToken, reserveBUSD] = wbnb.address == token0 ? [reserves[0], reserves[1]] : [reserves[1], reserves[0]];
  const price = ethers.BigNumber.from(ONE).mul(reserveToken).div(reserveBUSD);
  const baseRate = await treasury.baseRate();
  const timestamp = (await provider.getBlock(await provider.getBlockNumber())).timestamp;
  const timeSecs = ethers.BigNumber.from(timestamp).sub(1609459200);
  if (price.gt(ethers.BigNumber.from(ONE))) {
    const sqPrice = price;
    rate = baseRate.div(price).div(timeSecs);
  } else {
    rate = baseRate.div(ONE).div(timeSecs);
  }
  return rate;
}

describe('TREASURY WITH UNISWAP', function () {
  beforeEach('deploy fixture', async () => {
    [treasury, eerc20, wbnb, busd, accounts, foundingEvent, staking, router, factory, bnbBUSDPool] = await loadFixture(
      treasuryWithUniswapAndFoundingEventNotConcludedFixture
    );
    await setBalance(accounts[0].address, ethers.utils.parseEther(TEN_MILLION));
    let toDeposit = ethers.BigNumber.from(ONE).mul('49999');
    await foundingEvent.connect(accounts[0]).depositBNB({ value: toDeposit });
    await foundingEvent.connect(accounts[0]).triggerLaunch();
    pool = await (await ethers.getContractFactory('UniswapV2Pair')).connect(accounts[19]).deploy();
    const poolAddress = await factory.getPair(wbnb.address, eerc20.address);
    letBNBpool = await pool.attach(poolAddress);
  });
  describe('getRate()', function () {
    it('Gets current rewards rate', async function () {
      await setBalance(accounts[0].address, ethers.utils.parseEther(TEN_MILLION));
      let baseDeposit = ethers.BigNumber.from(ONE).mul('49999');
      let mod = 10;
      let toDeposit = baseDeposit.div(mod);
      let trade = 0;
      while (trade < 9) {
        await setBalance(accounts[0].address, ethers.utils.parseEther(ONE_THOUSAND));
        await router.swapExactETHForTokens(0, [wbnb.address, eerc20.address], accounts[0].address, ONE_THOUSAND, { value: toDeposit });
        const rand = Math.floor(Math.random() * 2) + 2;
        toDeposit = toDeposit.mul(9).div(10);
        toDeposit = toDeposit.div(rand);
        const rate = await calculateRateLocally();
        const rateReturned = await treasury.getRate();
        expect(rateReturned, "rates don't match").to.equal(rate);
        trade++;
      }
    });
  });
  describe('claimBenRewards()', function () {
    it('Claims beneficiary rewards', async function () {
      const n = 0;
      await treasury.addBeneficiary(accounts[n].address, TEN_THOUSAND, TEN_THOUSAND);
      await mine(100000);
      const initial = await eerc20.balanceOf(accounts[n].address);
      const lastClaim = (await treasury.bens(accounts[n].address)).lastClaim;
      const amount = (await treasury.bens(accounts[n].address)).amount;
      const tx = treasury.connect(accounts[n]).claimBenRewards();
      await expect(tx, 'claimBenRewards() failed for beneficiary').not.to.be.reverted;
      const receipt = await (await tx).wait();
      const blockNumber = await provider.getBlockNumber();
      const rate = await calculateRateLocally();
      const benRate = rate.mul(TEN_THOUSAND).div(TEN_THOUSAND);
      const toClaim = ethers.BigNumber.from(blockNumber).sub(lastClaim).mul(benRate);

      expect(
        ethers.BigNumber.from(await eerc20.balanceOf(accounts[n].address)).sub(initial),
        'unexpected beneficiary balance after rewards claiming'
      ).to.equal(toClaim);

      const currentAmount = (await treasury.bens(accounts[n].address)).amount;
      expect(toClaim, 'unexpected bens[accounts[' + n + '].address].amount standing after rewards claiming').to.equal(amount.sub(currentAmount));

      expect(receipt.blockNumber, 'unexpected bens[accounts[' + n + '].address].lastClaim after rewards claiming').to.equal(
        (await treasury.bens(accounts[n].address)).lastClaim
      );
    });
    it('Reverts if not beneficiary', async () => {
      await expect(treasury.connect(accounts[1]).claimBenRewards()).to.be.reverted;
    });
  });

  describe('claimAirdrop()', function () {
    it('Claims airdrop of 1 token on first claim', async function () {
      await treasury.addAirdropBulk([accounts[0].address], [ONE_THOUSAND]);
      await mine(2000);
      let initialRecipientBalance = await eerc20.balanceOf(accounts[0].address);
      let initialTreasuryBalance = await eerc20.balanceOf(treasury.address);
      let lastClaim = (await treasury.airdrops(accounts[0].address)).lastClaim;
      let amount = (await treasury.airdrops(accounts[0].address)).amount;
      const initialAirdropEmissions = await treasury.totalAirdropEmissions();
      const tx = treasury.connect(accounts[0]).claimAirdrop();
      await expect(tx, 'claimAirdrop() failed for airdrop recipient').not.to.be.reverted;
      const receipt = await (await tx).wait();
      lastClaim = (await treasury.airdrops(accounts[0].address)).lastClaim;
      let toClaim = ethers.BigNumber.from(ONE);
      let currentAmount = (await treasury.airdrops(accounts[0].address)).amount;

      expect(initialAirdropEmissions.add(1), 'emission wasnt included').to.equal(await treasury.totalAirdropEmissions());
      expect(true, 'emission wasnt included').to.equal((await treasury.airdrops(accounts[0].address)).emissionIncluded);
      expect(toClaim, 'unexpected recipient balance').to.equal((await eerc20.balanceOf(accounts[0].address)).sub(initialRecipientBalance));
      expect(toClaim, 'unexpected treasury balance').to.equal(initialTreasuryBalance.sub(await eerc20.balanceOf(treasury.address)));
      expect(toClaim, 'unexpected current amount').to.equal(amount.sub(currentAmount));
      expect(receipt.blockNumber, 'unexpected lastClaim block.number').to.equal((await treasury.airdrops(accounts[0].address)).lastClaim);
    });
    it('Claims airdrop according to emission on consequent claims', async function () {
      await treasury.addAirdropBulk([accounts[0].address], [ONE_THOUSAND]);
      await treasury.connect(accounts[0]).claimAirdrop();
      await mine('0xfffffffffff');
      initialRecipientBalance = await eerc20.balanceOf(accounts[0].address);
      initialTreasuryBalance = await eerc20.balanceOf(treasury.address);
      lastClaim = (await treasury.airdrops(accounts[0].address)).lastClaim;
      amount = (await treasury.airdrops(accounts[0].address)).amount;
      const rate = await calculateRateLocally();
      let airdropRate = rate.div(await treasury.totalAirdropEmissions());
      if (airdropRate.gt('20000000000000')) {
        airdropRate = ethers.BigNumber.from('20000000000000');
      }
      const tx1 = await treasury.connect(accounts[0]).claimAirdrop();
      const blockNumber = (await (await tx1).wait()).blockNumber;
      toClaim = ethers.BigNumber.from(blockNumber).sub(lastClaim);
      toClaim = toClaim.mul(airdropRate);
      currentAmount = (await treasury.airdrops(accounts[0].address)).amount;
      const receipt1 = await tx1.wait();
      expect(toClaim, 'unexpected recipient balance').to.equal((await eerc20.balanceOf(accounts[0].address)).sub(initialRecipientBalance));
      expect(toClaim, 'unexpected treasury balance').to.equal(initialTreasuryBalance.sub(await eerc20.balanceOf(treasury.address)));
      expect(toClaim, 'unexpected current amount').to.equal(amount.sub(currentAmount));
      expect(receipt1.blockNumber, 'unexpected lastClaim block.number').to.equal((await treasury.airdrops(accounts[0].address)).lastClaim);
    });
    it('Reverts if not eligible for airdrop', async () => {
      await expect(treasury.connect(accounts[1]).claimAirdrop()).to.be.reverted;
    });
  });

  describe('claimAirdrop()', function () {
    it('Claims airdrop of 1 token on first claim', async function () {
      await treasury.addAirdropBulk([accounts[0].address], [ONE_THOUSAND]);
      await mine(2000);
      let initialRecipientBalance = await eerc20.balanceOf(accounts[0].address);
      let initialTreasuryBalance = await eerc20.balanceOf(treasury.address);
      let lastClaim = (await treasury.airdrops(accounts[0].address)).lastClaim;
      let amount = (await treasury.airdrops(accounts[0].address)).amount;
      const initialAirdropEmissions = await treasury.totalAirdropEmissions();
      const tx = treasury.connect(accounts[0]).claimAirdrop();
      await expect(tx, 'claimAirdrop() failed for airdrop recipient').not.to.be.reverted;
      const receipt = await (await tx).wait();
      lastClaim = (await treasury.airdrops(accounts[0].address)).lastClaim;
      let toClaim = ethers.BigNumber.from(ONE);
      let currentAmount = (await treasury.airdrops(accounts[0].address)).amount;

      expect(initialAirdropEmissions.add(1), 'emission wasnt included').to.equal(await treasury.totalAirdropEmissions());
      expect(true, 'emission wasnt included').to.equal((await treasury.airdrops(accounts[0].address)).emissionIncluded);
      expect(toClaim, 'unexpected recipient balance').to.equal((await eerc20.balanceOf(accounts[0].address)).sub(initialRecipientBalance));
      expect(toClaim, 'unexpected treasury balance').to.equal(initialTreasuryBalance.sub(await eerc20.balanceOf(treasury.address)));
      expect(toClaim, 'unexpected current amount').to.equal(amount.sub(currentAmount));
      expect(receipt.blockNumber, 'unexpected lastClaim block.number').to.equal((await treasury.airdrops(accounts[0].address)).lastClaim);
    });
    it('Claims airdrop according to emission on consequent claims', async function () {
      await treasury.addAirdropBulk([accounts[0].address], [ONE_THOUSAND]);
      await treasury.connect(accounts[0]).claimAirdrop();
      await mine('0xfffffffffff');
      initialRecipientBalance = await eerc20.balanceOf(accounts[0].address);
      initialTreasuryBalance = await eerc20.balanceOf(treasury.address);
      lastClaim = (await treasury.airdrops(accounts[0].address)).lastClaim;
      amount = (await treasury.airdrops(accounts[0].address)).amount;
      const rate = await calculateRateLocally();
      let airdropRate = rate.div(await treasury.totalAirdropEmissions());
      if (airdropRate.gt('20000000000000')) {
        airdropRate = ethers.BigNumber.from('20000000000000');
      }
      const tx1 = await treasury.connect(accounts[0]).claimAirdrop();
      const blockNumber = (await (await tx1).wait()).blockNumber;
      toClaim = ethers.BigNumber.from(blockNumber).sub(lastClaim);
      toClaim = toClaim.mul(airdropRate);
      currentAmount = (await treasury.airdrops(accounts[0].address)).amount;
      const receipt1 = await tx1.wait();
      expect(toClaim, 'unexpected recipient balance').to.equal((await eerc20.balanceOf(accounts[0].address)).sub(initialRecipientBalance));
      expect(toClaim, 'unexpected treasury balance').to.equal(initialTreasuryBalance.sub(await eerc20.balanceOf(treasury.address)));
      expect(toClaim, 'unexpected current amount').to.equal(amount.sub(currentAmount));
      expect(receipt1.blockNumber, 'unexpected lastClaim block.number').to.equal((await treasury.airdrops(accounts[0].address)).lastClaim);
    });
    it('Reverts if not eligible for airdrop', async () => {
      await expect(treasury.connect(accounts[1]).claimAirdrop()).to.be.reverted;
    });
  });
});
