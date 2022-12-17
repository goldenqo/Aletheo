async function wbnbFixture() {
  const WBNB = await ethers.getContractFactory('WBNB');
  const wbnb = await WBNB.deploy();
  return wbnb;
}

module.exports = {
  wbnbFixture,
};
