const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers')
const { expect } = require('chai')

async function EERC20Fixture() {
  const accounts = await ethers.getSigners()
  const EERC20 = await ethers.getContractFactory('EERC20')
  const eerc20Contract = await EERC20.deploy(accounts[2].address, accounts[3].address, accounts[4].address)
  //const eerc20Contract = await EERC20.deploy()
  //await eerc20Contract.init(accounts[2].address, accounts[3].address, accounts[4].address)
  return { eerc20Contract, accounts }
}

async function erc20Fixture() {
  const accounts = await ethers.getSigners()
  const EERC20 = await ethers.getContractFactory('ERC20')
  const erc20 = await EERC20.deploy('unlockTime', '{ value: lockedAmount }')
  return { erc20, accounts }
}

let eerc20Contract = {},
  accounts = []

describe('EERC20', function () {
  describe('transfer()', function () {
    beforeEach('deploy fixture', async () => {
      const _ = await loadFixture(EERC20Fixture)
      eerc20Contract = _.eerc20Contract
      accounts = _.accounts
    })
    it('Should successfully transfer', async function () {
      const tx = await eerc20Contract.transfer(accounts[1].address, 1)
      const receipt = await tx.wait()

      const tx1 = await eerc20Contract.transfer(accounts[1].address, 1)
      const receipt1 = await tx1.wait()
      await expect(receipt.status).to.equal(1)
      await expect(receipt1.status).to.equal(1)
      console.log('         first attempt gas:' + receipt.cumulativeGasUsed)
      console.log('         second attempt gas:' + receipt1.cumulativeGasUsed)
    })
  })
  describe('transferFrom()', function () {
    beforeEach('deploy fixture', async () => {
      const _ = await loadFixture(EERC20Fixture)
      eerc20Contract = _.eerc20Contract
      accounts = _.accounts
    })
    it('Should successfully transferFrom', async function () {
      console.log(accounts[1].address)
      const tx = await eerc20Contract.approve(accounts[1].address, ethers.constants.MaxUint256)
      const receipt = await tx.wait()

      const tx1 = await eerc20Contract.connect(accounts[1]).transferFrom(accounts[0].address, accounts[1].address, 2)

      const receipt1 = await tx1.wait()

      const tx2 = await eerc20Contract.connect(accounts[1]).transferFrom(accounts[0].address, accounts[1].address, 2)

      const receipt2 = await tx2.wait()

      await expect(receipt.status).to.equal(1)
      await expect(receipt1.status).to.equal(1)
      await expect(receipt2.status).to.equal(1)
      //console.log("         first attempt gas:" + receipt.cumulativeGasUsed);
      console.log('         first attempt gas:' + receipt1.cumulativeGasUsed)
      console.log('         second attempt gas:' + receipt2.cumulativeGasUsed)
    })
  })
  describe('transferBatch()', function () {
    beforeEach('deploy fixture', async () => {
      const _ = await loadFixture(EERC20Fixture)
      eerc20Contract = _.eerc20Contract
      accounts = _.accounts
    })
    it('Should successfully transferBatch', async function () {
      let addresses = []
      let amounts = []
      accounts.forEach((el, n) => {
        addresses.push(el.address)
        amounts.push(n)
        n++
      })
      const tx = await eerc20Contract.transferBatch(addresses, amounts)
      const receipt = await tx.wait()
      console.log('         first attempt gas:' + receipt.cumulativeGasUsed)

      const tx1 = await eerc20Contract.transferBatch(addresses, amounts)
      const receipt1 = await tx1.wait()
      console.log('         second attempt gas:' + receipt1.cumulativeGasUsed)
      await expect(receipt.status).to.equal(1)
      await expect(receipt1.status).to.equal(1)
    })
    it('Should set correct balance', async function () {
      let addresses = []
      let amounts = []
      accounts.forEach((el, n) => {
        addresses.push(el.address)
        amounts.push(n)
        n++
      })
      let initialBalance = await eerc20Contract.balanceOf(accounts[0].address)
      const tx = await eerc20Contract.transferBatch(addresses, amounts)
      const receipt = await tx.wait()
      console.log('         first attempt gas:' + receipt.cumulativeGasUsed)

      const tx1 = await eerc20Contract.transferBatch(addresses, amounts)
      const receipt1 = await tx1.wait()
      console.log('         second attempt gas:' + receipt1.cumulativeGasUsed)
      expect(await eerc20Contract.balanceOf(accounts[0].address)).to.equal(initialBalance.sub(380))
      for (let n = 1; n < addresses.length; n++) {
        expect(await eerc20Contract.balanceOf(accounts[n].address)).to.equal(amounts[n] * 2)
      }
      await expect(receipt.status).to.equal(1)
      await expect(receipt1.status).to.equal(1)
    })
  })
})

describe('ERC20', function () {
  describe('transferFrom()', async function () {
    beforeEach('deploy fixture', async () => {
      const _ = await loadFixture(erc20Fixture)
      erc20 = _.erc20
      accounts = _.accounts
    })
    it('Should successfully transfer', async function () {
      const tx = await erc20.transfer(accounts[1].address, 1)
      const receipt = await tx.wait()
      const tx1 = await erc20.transfer(accounts[1].address, 1)
      const receipt1 = await tx1.wait()
      await expect(receipt.status).to.equal(1)
      await expect(receipt1.status).to.equal(1)
      console.log('         first attempt gas:' + receipt.cumulativeGasUsed)
      console.log('         second attempt gas:' + receipt1.cumulativeGasUsed)
    })
  })
  describe('transferFrom()', async function () {
    beforeEach('deploy fixture', async () => {
      const _ = await loadFixture(erc20Fixture)
      erc20 = _.erc20
      accounts = _.accounts
    })
    it('Should successfully transferFrom', async function () {
      const tx = await erc20.approve(accounts[1].address, ethers.constants.MaxUint256)
      const receipt = await tx.wait()

      const tx1 = await erc20.connect(accounts[1]).transferFrom(accounts[0].address, accounts[1].address, 2)

      const receipt1 = await tx1.wait()

      const tx2 = await erc20.connect(accounts[1]).transferFrom(accounts[0].address, accounts[1].address, 2)

      const receipt2 = await tx2.wait()

      await expect(receipt.status).to.equal(1)
      await expect(receipt1.status).to.equal(1)
      await expect(receipt2.status).to.equal(1)
      //console.log("         first attempt gas:" + receipt.cumulativeGasUsed);
      console.log('         first attempt gas:' + receipt1.cumulativeGasUsed)
      console.log('         second attempt gas:' + receipt2.cumulativeGasUsed)
    })
  })
})
