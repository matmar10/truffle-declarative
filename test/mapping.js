'use strict';

const Web3 = require('web3');

module.exports = {
  mapping: {
    getBalanceInEth: {
      key: 'balanceInEth',
      transform: (val) => Web3.utils.BN(val).toString()
    }
  }
};
