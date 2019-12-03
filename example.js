'use strict';

const path = require('path');
const Runner = require('./');

const state = {
  $inputs: {
    trustee: '0x1f9c410d5562bb6590b8f891f2e26311f9a6ef8c',
    operations: '0x739b62a44357115c483098e33eb119a388a793a1',
    exchange: '0xc10c15ad37024f724e0c7efb3a284125efb69890',
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
  outputs: {
    address: '$deployed.safeMathLib'
  }
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
    fiatExchangeAccount: '$inputs.exchange',
    managementAccount: '$inputs.trustee',
    operationsAccount: '$inputs.operations',
  }, {
    from: '$inputs.trustee',
  }],
  outputs: {
    address: '$deployed.token'
  }
}, {
  description: 'Depoy a new Profits contract',
  contract: 'Profits',
  run: 'new',
  inputs: ['$deployed.token', {
    from: '$inputs.trustee',
    gas: 3e6,
    gasPrice: 2e9
  }],
  outputs: {
    address: '$deployed.profits'
  }
}, {
  description: 'Link Token to Profits',
  contract: 'Token',
  at: '$deployed.token',
  run: 'setProfitsContract',
  inputs: ['$deployed.profits', {
    from: '$inputs.trustee'
  }]
}, {
  description: 'Sample failing task',
  contract: 'Token',
  at: '$deployed.token',
  run: 'balanceOf',
  inputs: ['$inputs.trustee', {
    from: '$inputs.trustee'
  }]
}];

const runner = new Runner({
  workingDirectory: path.join(__dirname, '/../../Blossom/smartsukuk-dual-mudaraba')
});

// const task = {
//   description: 'Deploy a new SafeMathLib',
//   contract: 'SafeMathLib',
//   run: 'new',
//   inputs: [{
//     from: '$inputs.trustee'
//   }],
//   outputs: '$deployed.safeMathLib'
// };

(async () => {
  try {
    const results = await runner.run(tasks, state);
    // const results = await runner.run(task, state);
    // console.log('State:', state);
    // console.log('Results:', results);
    // console.log('Requests:');
    // console.log(process._getActiveRequests());
    // const handles = process._getActiveHandles();
    // console.log('Handles: ', handles.length);
    // handles.forEach(handle => {
    //   console.log(handle);
    // });
  } catch (err) {
    console.error('Failed with error:', err);
  }
})();
