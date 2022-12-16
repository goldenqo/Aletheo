require('@nomicfoundation/hardhat-toolbox')

module.exports = {
  solidity: {
    compilers: [
      {
        version: '0.8.16',
        settings: {
          optimizer: {
            enabled: true,
            runs: 628400, //6284
          },
        },
      },
      {
        version: '0.7.6',
        settings: {
          optimizer: {
            enabled: true,
            runs: 628400,
          },
        },
      },
    ],
  },
}
