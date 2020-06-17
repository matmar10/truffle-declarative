'use strict';

const Web3 = require('web3');

module.exports = {
  types: {
    uint8: (val) => Web3.utils.BN(val).toString()
  },
  mapping: {
    getBalanceInEth: {
      key: 'balanceInEth',
      transform: (val) => Web3.utils.BN(val).toString()
    }
  }
};
