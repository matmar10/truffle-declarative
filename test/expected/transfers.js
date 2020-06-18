'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const inputs = yaml.safeLoad(fs.readFileSync(path.join(__dirname, 'inputs.yml'), 'utf8'));

module.exports = [
  {
    description: 'Send to address',
    contract: 'MetaCoin',
    at: '$deployed.metacoin',
    run: 'sendCoin',
    inputs:
     [{
       receiver: inputs.address1,
       amount: 1000,
     },
     { from: '$inputs.address0' }],
    outputs: {},
  },
  {
    description: 'Send to address',
    contract: 'MetaCoin',
    at: '$deployed.metacoin',
    run: 'sendCoin',
    inputs:
     [{
       receiver: inputs.address2,
       amount: 1000,
     },
     { from: '$inputs.address0' }],
    outputs: {},
  },
  {
    description: 'Send to address',
    contract: 'MetaCoin',
    at: '$deployed.metacoin',
    run: 'sendCoin',
    inputs:
     [{
       receiver: inputs.address3,
       amount: 1000,
     },
     { from: '$inputs.address0' }],
    outputs: {},
  },
  {
    description: 'Send to address',
    contract: 'MetaCoin',
    at: '$deployed.metacoin',
    run: 'sendCoin',
    inputs:
     [{
       receiver: inputs.address4,
       amount: 1000,
     },
     { from: '$inputs.address0' }],
    outputs: {},
  },
  {
    description: 'Send to address',
    contract: 'MetaCoin',
    at: '$deployed.metacoin',
    run: 'sendCoin',
    inputs:
     [{
       receiver: inputs.address5,
       amount: 1000,
     },
     { from: '$inputs.address0' }],
    outputs: {},
  },
  {
    description: 'Send to address',
    contract: 'MetaCoin',
    at: '$deployed.metacoin',
    run: 'sendCoin',
    inputs:
     [{
       receiver: inputs.address6,
       amount: 1000,
     },
     { from: '$inputs.address0' }],
    outputs: {},
  },
  {
    description: 'Send to address',
    contract: 'MetaCoin',
    at: '$deployed.metacoin',
    run: 'sendCoin',
    inputs:
     [{
       receiver: inputs.address7,
       amount: 1000,
     },
     { from: '$inputs.address0' }],
    outputs: {},
  },
  {
    description: 'Send to address',
    contract: 'MetaCoin',
    at: '$deployed.metacoin',
    run: 'sendCoin',
    inputs:
     [{
       receiver: inputs.address8,
       amount: 1000,
     },
     { from: '$inputs.address0' }],
    outputs: {},
  },
  {
    description: 'Send to address',
    contract: 'MetaCoin',
    at: '$deployed.metacoin',
    run: 'sendCoin',
    inputs:
     [{
       receiver: inputs.address9,
       amount: 1000,
     },
     { from: '$inputs.address0' }],
    outputs: {},
  },
];
