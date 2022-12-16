require('@nomicfoundation/hardhat-toolbox')
require('@openzeppelin/hardhat-upgrades')
//require('@tovarishfin/hardhat-yul')

module.exports = {
  solidity: {
    compilers: [
      {
        version: '0.8.16',
        settings: {
          optimizer: {
            enabled: true,
            runs: 6284, //6284
          },
        },
      },
      {
        version: '0.7.6',
        settings: {
          optimizer: {
            enabled: true,
            runs: 6284,
          },
        },
      },
    ],
  },
}
