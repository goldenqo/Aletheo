require('@nomicfoundation/hardhat-toolbox');
require('hardhat-tracer');
module.exports = {
  solidity: {
    compilers: [
      {
        version: '0.8.16',
        settings: {
          optimizer: {
            enabled: true,
            runs: 62840, //6284
          },
        },
      },
      {
        version: '0.7.6',
        settings: {
          optimizer: {
            enabled: true,
            runs: 62840,
          },
        },
      },
      {
        version: '0.6.6',
        settings: {
          optimizer: {
            enabled: true,
            runs: 62840,
          },
        },
      },
      {
        version: '0.4.18',
        settings: {
          optimizer: {
            enabled: true,
            runs: 62840, //6284
          },
        },
      },
      {
        version: '0.5.16',
        settings: {
          optimizer: {
            enabled: true,
            runs: 62840, //6284
          },
        },
      },
    ],
  },
};
