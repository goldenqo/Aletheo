async function busdFixture() {
  const BUSD = await ethers.getContractFactory('BEP20TokenMock');
  const busd = await BUSD.deploy();
  return busd;
}

module.exports = {
  busdFixture,
};
