'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const inputs = yaml.safeLoad(fs.readFileSync(path.join(__dirname, '/../inputs.yml'), 'utf8'));

module.exports = [
  {
    description: 'Send to address',
    contract: 'MetaCoin',
    at: '$deployed.metacoin',
    run: 'sendCoin',
    inputs:
     [{
       receiver: inputs.addresses[1],
       amount: 1000,
     },
     { from: '$inputs.addresses[0]' }],
    outputs: {},
  },
  {
    description: 'Send to address',
    contract: 'MetaCoin',
    at: '$deployed.metacoin',
    run: 'sendCoin',
    inputs:
     [{
       receiver: inputs.addresses[2],
       amount: 1000,
     },
     { from: '$inputs.addresses[0]' }],
    outputs: {},
  },
  {
    description: 'Send to address',
    contract: 'MetaCoin',
    at: '$deployed.metacoin',
    run: 'sendCoin',
    inputs:
     [{
       receiver: inputs.addresses[3],
       amount: 1000,
     },
     { from: '$inputs.addresses[0]' }],
    outputs: {},
  },
  {
    description: 'Send to address',
    contract: 'MetaCoin',
    at: '$deployed.metacoin',
    run: 'sendCoin',
    inputs:
     [{
       receiver: inputs.addresses[4],
       amount: 1000,
     },
     { from: '$inputs.addresses[0]' }],
    outputs: {},
  },
  {
    description: 'Send to address',
    contract: 'MetaCoin',
    at: '$deployed.metacoin',
    run: 'sendCoin',
    inputs:
     [{
       receiver: inputs.addresses[5],
       amount: 1000,
     },
     { from: '$inputs.addresses[0]' }],
    outputs: {},
  },
  {
    description: 'Send to address',
    contract: 'MetaCoin',
    at: '$deployed.metacoin',
    run: 'sendCoin',
    inputs:
     [{
       receiver: inputs.addresses[6],
       amount: 1000,
     },
     { from: '$inputs.addresses[0]' }],
    outputs: {},
  },
  {
    description: 'Send to address',
    contract: 'MetaCoin',
    at: '$deployed.metacoin',
    run: 'sendCoin',
    inputs:
     [{
       receiver: inputs.addresses[7],
       amount: 1000,
     },
     { from: '$inputs.addresses[0]' }],
    outputs: {},
  },
  {
    description: 'Send to address',
    contract: 'MetaCoin',
    at: '$deployed.metacoin',
    run: 'sendCoin',
    inputs:
     [{
       receiver: inputs.addresses[8],
       amount: 1000,
     },
     { from: '$inputs.addresses[0]' }],
    outputs: {},
  },
  {
    description: 'Send to address',
    contract: 'MetaCoin',
    at: '$deployed.metacoin',
    run: 'sendCoin',
    inputs:
     [{
       receiver: inputs.addresses[9],
       amount: 1000,
     },
     { from: '$inputs.addresses[0]' }],
    outputs: {},
  },
];
