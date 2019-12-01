'use strict';

const path = require('path');
const Runner = require('./');

const state = {
  $inputs: {
    trustee: '0x1f9c410d5562bb6590b8f891f2e26311f9a6ef8c'
  },
  $outputs: {},
  $contracts: {},
  $deployed: {}
};

const tasks = [{
  description: 'Deploy a new SafeMathLib',
  contract: 'SafeMathLib',
  run: 'new',
  inputs: [{
    from: '$inputs.trustee'
  }],
  outputs: '$deployed.safeMathLib'
}, {
  description: 'Link Token to SafeMathLib',
  contract: 'Token',
  run: 'link',
  inputs: ['$contracts.SafeMathLib']
}, {
  description: 'Link Profits to SafeMathLib',
  contract: 'Profits',
  run: 'link',
  inputs: ['$contracts.SafeMathLib']
}, {
  description: 'Deploy a new Token',
  contract: 'Token',
  run: 'new',
  inputs: [{
    fiatCurrencyCode: 'IDR',
    tokenName: 'BMT Bina Ummah Mudaraba I',
    tokenSymbol: 'BLS:BM1',
    fiatMaximumAmount: 7000000000,
    fiatMinimumInvestmentAmount: 10000000,
    fiatPerEthAmount: 1735653,
    maturityLengthDays: 365,
    fiatExchangeAccount: '0xc10c15ad37024f724e0c7efb3a284125efb69890',
    managementAccount: '0x1f9c410d5562bb6590b8f891f2e26311f9a6ef8c',
    operationsAccount: '0x739b62a44357115c483098e33eb119a388a793a1',
  }, {
    from: '$inputs.trustee',
  }],
  outputs: ['$deployed.token']
}];

const runner = new Runner({
  networkName: 'development',
  workingDirectory: path.join(__dirname, '/../../Blossom/smartsukuk-dual-mudaraba')
});

(async () => {
  try {
    const results = await runner.run(tasks, state);
    // console.log('State:', state);
    console.log('Results:', results);
  } catch (err) {
    console.error('Failed with error:', err);
  }

})();
