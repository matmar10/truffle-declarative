'use strict';

const path = require('path');
const Runner = require('./');

const state = {
  $inputs: {
    "fiatExchangeAccount": "0xc10c15ad37024f724e0c7efb3a284125efb69890",
    "managementAccount": "0x1f9c410d5562bb6590b8f891f2e26311f9a6ef8c",
    "operationsAccount": "0x739b62a44357115c483098e33eb119a388a793a1",
    "fiatCurrencyCode": "IDR",
    "tokenName": "BMT Bina Ummah Mudaraba I",
    "tokenSymbol": "BLS:BM1",
    "fiatMaximumAmount": 7000000000,
    "fiatMinimumInvestmentAmount": 10000000,
    "fiatPerEthAmount": 1735653,
    "maturityLengthDays": 365,
    "investors": [
      {
        "account": "0x4a378afbc608073d4520c91d70d06cb79a0a31c5",
        "amount": 87320000000000000000
      },
      {
        "account": "0xf793db07d9952ff75d5371cceb98c4380277503f",
        "amount": 72430000000000000000
      }
    ],
    "dividendAmounts": [
      1730000000000000000,
      1700000000000000000,
      1710000000000000000,
      1750000000000000000,
      1760000000000000000,
      1790000000000000000,
      1400000000000000000,
      2000000000000000000,
      2100000000000000000,
      1300000000000000000,
      2000000000000000000,
      1800000000000000000
    ],
    "repaymentAmount": 159750000000000000000
  },
  $outputs: {},
  $contracts: {},
  $deployed: {}
};

const runner = new Runner({
  scriptDirectory: __dirname,
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
    const results = await runner.read([
      'examples/example-2/0-deploy.playbook.yml',
      [{
        "description": "Make investments for all investors",
        "for": "$inputs.investors",
        "each": [
          {
            "contract": "Token",
            "at": "$deployed.token",
            "run": "setInvestorWhitelist",
            "inputs": [
              {
                "addr": "$item.account",
                "value": true
              },
              {
                "from": "$inputs.managementAccount"
              }
            ]
          },
          {
            "contract": "Token",
            "at": "$deployed.token",
            "run": "sendTransaction",
            "inputs": [
              {
                "from": "$item.account",
                "value": "$item.amount"
              }
            ]
          }
        ]
      }, {
        "description": "Do something",
        "contract": "Token",
        "run": "balanceOf",
        "at": "$deployed.token",
        "inputs": ["$inputs.managementAccount"],
        "outputs": ["$inputs.balanceInvestor"]
      }]
    ], state);
  } catch (err) {
    console.error('Failed with error:', err);
  }
})();
