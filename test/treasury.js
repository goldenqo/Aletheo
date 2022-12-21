const { expect } = require('chai');
const { loadFixture, time } = require('@nomicfoundation/hardhat-network-helpers');
const { treasuryInitializedFixture } = require('./fixtures/treasuryFixtures.js');

let treasury,
  eerc20,
  foundingEvent,
  staking,
  wbnb,
  busd = {},
  accounts = [];

describe('TREASURY', function () {
  beforeEach('deploy fixture', async () => {
    [treasury, eerc20, wbnb, busd, accounts, foundingEvent] = await loadFixture(treasuryInitializedFixture);
    staking = accounts[10];
  });
  describe('init()', function () {
    it('Initializes state variables correctly', async function () {
      expect(await treasury.posterRate(), 'unexpected posterRate').to.equal(1000);
      expect(await treasury.baseRate(), 'unexpected baseRate').to.equal(ethers.BigNumber.from('9500000000000000000000000000000000'));
      expect(await treasury._governance(), 'unexpected governance').to.equal(accounts[0].address);
      expect(await treasury._letToken(), 'unexpected letToken').to.equal(eerc20.address);
      expect(await treasury._foundingEvent(), 'unexpected foundingEvent').to.equal(foundingEvent.address);
      expect(await treasury._staking(), 'unexpected staking').to.equal(staking.address);
    });
  });

  describe('setGovernance()', function () {
    it('Sets governance if called by governance', async function () {
      await expect(treasury.setGovernance(accounts[1].address)).not.to.be.reverted;
      expect(await treasury._governance(), 'unexpected governance').to.equal(accounts[1].address);
    });
    it('Fails to set governance if called by not governance', async function () {
      await expect(treasury.connect(accounts[2]).setGovernance(accounts[1].address)).to.be.reverted;
    });
  });

  describe('setAggregator()', function () {
    it('Sets aggregator if called by governance', async function () {
      await expect(treasury.setAggregator(accounts[1].address)).not.to.be.reverted;
      expect(await treasury._aggregator(), 'unexpected aggregator').to.equal(accounts[1].address);
    });
    it('Fails to set aggregator if called by not governance', async function () {
      await expect(treasury.connect(accounts[2]).setAggregator(accounts[1].address)).to.be.reverted;
    });
  });

  describe('setPosterRate()', function () {
    it('Sets posterRate if called by governance', async function () {
      const arg = 100;
      await expect(treasury.setPosterRate(arg)).not.to.be.reverted;
      expect(await treasury.posterRate(), 'unexpected posterRate').to.equal(arg);
    });
    it('Fails to set posterRate if called by not governance', async function () {
      await expect(treasury.connect(accounts[2]).setPosterRate(100)).to.be.reverted;
    });
    it('Fails to set posterRate if called by governance and value is above than 2000', async function () {
      await expect(treasury.connect(accounts[2]).setPosterRate(29999)).to.be.reverted;
    });
    it('Fails to set posterRate if called by governance and value is below than 100', async function () {
      await expect(treasury.connect(accounts[2]).setPosterRate(1)).to.be.reverted;
    });
  });

  describe('setBaseRate()', function () {
    it('Sets baseRate if called by governance', async function () {
      const arg = ethers.BigNumber.from('30000000000000');
      await expect(treasury.setBaseRate(arg)).not.to.be.reverted;
      expect(await treasury.baseRate(), 'unexpected baseRate').to.equal(arg);
    });
    it('Fails to set baseRate if called by not governance', async function () {
      await expect(treasury.connect(accounts[2]).setBaseRate(ethers.BigNumber.from('30000000000000'))).to.be.reverted;
    });
    it('Fails to set baseRate if called by governance and value is above previous baseRate', async function () {
      const initial = await treasury.baseRate();
      await expect(treasury.connect(accounts[2]).setBaseRate(initial.add(1))).to.be.reverted;
    });
    it('Fails to set baseRate if called by governance and value is below than 1e13', async function () {
      await expect(treasury.connect(accounts[2]).setBaseRate(1)).to.be.reverted;
    });
  });

  describe('addBeneficiary()', function () {
    it('Adds beneficiary if called by governance', async function () {
      const initial = await treasury.totBenEmission();
      const arg = ethers.BigNumber.from('30000000000000');
      const arg2 = ethers.BigNumber.from('30000000');
      await expect(treasury.addBeneficiary(accounts[0].address, arg, arg2)).not.to.be.reverted;
      expect((await treasury.bens(accounts[0].address)).amount, 'unexpected amount').to.equal(arg);
      expect((await treasury.bens(accounts[0].address)).lastClaim, 'unexpected lastClaim').to.equal(await time.latestBlock());
      expect((await treasury.bens(accounts[0].address)).emission, 'unexpected emission').to.equal(arg2);
      expect(await treasury.totBenEmission(), 'unexpected totBenEmission').to.equal(initial.add(arg2));
    });
    it('Fails to addBeneficiary if called by not governance', async function () {
      const arg = ethers.BigNumber.from('30000000000000');
      await expect(treasury.connect(accounts[2]).addBeneficiary(accounts[0].address, arg, 1)).to.be.reverted;
    });
    it('Fails to addBeneficiary if called by governance and amount is below current amount', async function () {
      const arg = ethers.BigNumber.from('30000000000000');
      const arg2 = ethers.BigNumber.from('30000000');
      await expect(treasury.addBeneficiary(accounts[0].address, arg, arg2)).not.to.be.reverted;
      await expect(treasury.addBeneficiary(accounts[0].address, arg.div(2), arg2)).to.be.reverted;
    });
    it('Fails to addBeneficiary if called by governance and emission is below current emission', async function () {
      const arg = ethers.BigNumber.from('30000000000000');
      const arg2 = ethers.BigNumber.from('30000000');
      await expect(treasury.addBeneficiary(accounts[0].address, arg, arg2)).not.to.be.reverted;
      await expect(treasury.addBeneficiary(accounts[0].address, arg, arg2.div(2))).to.be.reverted;
    });
    it('Fails if totBenEmission is above 1e22 and called by governance', async function () {
      const arg = ethers.BigNumber.from('30000000000000');
      const arg2 = ethers.BigNumber.from('300000000000000000000000000');
      await expect(treasury.addBeneficiary(accounts[0].address, arg, arg2)).to.be.reverted;
    });
  });

  describe('addAirdropBulk()', function () {
    it('Adds airdrops bulk if called by governance', async function () {
      const arg = ethers.BigNumber.from('30000000000000');
      await expect(treasury.addAirdropBulk([accounts[0].address], [arg])).not.to.be.reverted;
      expect((await treasury.airdrops(accounts[0].address)).amount, 'unexpected airdrops[address].amount').to.equal(arg);
      expect((await treasury.airdrops(accounts[0].address)).lastClaim, 'unexpected airdrops[address].lastClaim').to.equal(await time.latestBlock());
    });
    it('Fails to addAirdropBulk if called by not governance', async function () {
      await expect(treasury.connect(accounts[2]).addAirdropBulk([accounts[0].address], [ethers.BigNumber.from('30000000000000')])).to.be.reverted;
    });
    it('Fails to addAirdropBulk if called by governance and arg arrays lengths do not match', async function () {
      await expect(treasury.addAirdropBulk([accounts[0].address], [ethers.BigNumber.from('30000000000000'), 5])).to.be.reverted;
    });
    it('Fails to addAirdropBulk if called by governance and emission if one of the amounts is higher than 20000e18', async function () {
      await expect(treasury.addAirdropBulk([accounts[0].address, accounts[1].address], [ethers.BigNumber.from('30000000000000000000000000000'), 5]))
        .to.be.reverted;
    });
  });

  describe('addPosters()', function () {
    beforeEach('deploy fixture', async () => {
      await treasury.setAggregator(accounts[9].address);
    });
    it('Adds posters if called by aggregator', async function () {
      const arg = ethers.BigNumber.from('30000000000000');
      await expect(treasury.connect(accounts[9]).addPosters([accounts[0].address], [arg])).not.to.be.reverted;
      expect((await treasury.posters(accounts[0].address)).unapprovedAmount, 'unexpected unapprovedAmount').to.equal(arg);
    });
    it('Should fail to addPosters if called by not aggregator', async function () {
      await expect(treasury.connect(accounts[2]).addPosters([accounts[0].address], [ethers.BigNumber.from('30000000000000')])).to.be.reverted;
    });
    it('Should fail to addPosters if called by aggregator and arg arrays lengths do not match', async function () {
      await expect(treasury.connect(accounts[9]).addPosters([accounts[0].address], [ethers.BigNumber.from('30000000000000'), 5])).to.be.reverted;
    });
    it('Should fail to addPosters if called by aggregator and emission of one of the amounts is higher than 2000e18', async function () {
      await expect(
        treasury
          .connect(accounts[9])
          .addPosters([accounts[0].address, accounts[1].address], [ethers.BigNumber.from('30000000000000000000000000000'), 5])
      ).to.be.reverted;
    });
  });

  describe('editUnapprovedPosters()', function () {
    beforeEach('deploy fixture', async () => {
      await treasury.setAggregator(accounts[9].address);
    });
    it('Edits unapprovedPosters if called by governance', async function () {
      const arg = ethers.BigNumber.from('30000000000000');
      await expect(treasury.editUnapprovedPosters([accounts[0].address], [arg])).not.to.be.reverted;
      expect((await treasury.posters(accounts[0].address)).unapprovedAmount).to.equal(arg);
    });
    it('Fails to editUnapprovedPosters if called by not governance', async function () {
      await expect(treasury.connect(accounts[2]).editUnapprovedPosters([accounts[0].address], [ethers.BigNumber.from('30000000000000')])).to.be
        .reverted;
    });
    it('Fails to editUnapprovedPosters if called by governance and arg arrays lengths do not match', async function () {
      await expect(treasury.editUnapprovedPosters([accounts[0].address], [ethers.BigNumber.from('30000000000000'), 5])).to.be.reverted;
    });
    it('Fails to editUnapprovedPosters if called by governance and emission if one of the amounts is higher than 2000e18', async function () {
      await expect(
        treasury.editUnapprovedPosters([accounts[0].address, accounts[1].address], [ethers.BigNumber.from('30000000000000000000000000000'), 5])
      ).to.be.reverted;
    });
  });

  describe('approvePosters()', function () {
    beforeEach('deploy fixture', async () => {
      await treasury.setAggregator(accounts[9].address);
    });
    it('Approves posters if called by governance', async function () {
      const arg = 15;
      await treasury.connect(accounts[9]).addPosters([accounts[0].address], [arg]);
      await expect(treasury.connect(accounts[0]).approvePosters([accounts[0].address])).not.to.be.reverted;
      expect((await treasury.posters(accounts[0].address)).amount, 'unexpected posters[address].amount').to.equal(arg);
      expect((await treasury.posters(accounts[0].address)).unapprovedAmount, 'unexpected unapprovedAmount').to.equal(0);
    });
    it('Sets lastClaim to block.number if it was zero and if called by governance', async function () {
      await treasury.connect(accounts[9]).addPosters([accounts[0].address], [15]);
      await expect(treasury.approvePosters([accounts[0].address])).not.to.be.reverted;
      expect((await treasury.posters(accounts[0].address)).lastClaim, 'unexpected lastClaim').to.equal(await time.latestBlock());
    });
    it('Adds to totalPosterRewards', async function () {
      const initial = await treasury.totalPosterRewards();
      await treasury.connect(accounts[9]).addPosters([accounts[0].address], [15]);
      await expect(treasury.approvePosters([accounts[0].address])).not.to.be.reverted;
      expect(await treasury.totalPosterRewards(), 'unexpected totalPosterRewards').to.equal(initial.add(15));
    });
    it('Fails if called by not governance', async function () {
      await treasury.connect(accounts[9]).addPosters([accounts[0].address], [15]);
      await expect(treasury.connect(accounts[2]).approvePosters([accounts[0].address])).to.be.reverted;
    });
  });

  describe('getStakingRewards()', function () {
    it('Gets staking rewards if called by staking', async function () {
      const initial = await eerc20.balanceOf(accounts[0].address);
      await expect(treasury.connect(staking).getStakingRewards(accounts[0].address, 15)).not.to.be.reverted;
      expect(await eerc20.balanceOf(accounts[0].address), 'unexpected let balance').to.equal(initial.add(15));
    });
    it('Fails if called by not staking', async function () {
      await expect(treasury.getStakingRewards(accounts[0].address, 15)).to.be.reverted;
    });
  });
});
