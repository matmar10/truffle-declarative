'use strict';

/* global before, describe, it */
const BN = require('bn.js');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const chaiBN = require('chai-bn');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

chai.use(chaiBN(BN));
chai.use(chaiAsPromised);

const Runner = require('./../');

const contracts = require('./expected/contracts');
const transfers = require('./expected/transfers');
const inputs = yaml.safeLoad(fs.readFileSync(path.join(__dirname, 'inputs.yml'), 'utf8'));
const playbooks = [
  yaml.safeLoad(fs.readFileSync(path.join(__dirname, 'playbooks/*.playbook.yml'), 'utf8')),
];
const runner = new Runner({
  workingDirectory: __dirname,
});

describe('lib', function () {
  this.timeout(10000);
  let results;
  before(async function () {
    results = await runner.read(playbooks, { $inputs: inputs });
  });

  it('runs deploy scripts with linking', function () {
    chai.expect(results[0][0]).to.deep.include({
      address: '0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab',
      transactionHash: '0xfe7e5d6fc8c281606f40f70837dc136704ace71496dce852bc6d93dcce3bcb48',
    });
    chai.expect(results[0][1]).to.be.undefined;
    chai.expect(results[0][2]).to.deep.include({
      address: '0x5b1869D9A4C187F2EAa108f3062412ecf0526b24',
      transactionHash: '0x13577c27c01a67f2b3bde64f7a0913524a112fb0148a2773a93ac1c8830f1edf',
    });
    chai.expect(results[0][3]).to.be.undefined;
    chai.expect(results[0][4]).to.deep.include({
      address: '0xCfEB869F69431e42cdB54A4F4f105C19C080A601',
      transactionHash: '0xca05a744bf8515a1618936dc689a988c22e6f056af6289d7e6f2934024f65ecb',
    });
  });

  it('runs instance methods', function () {
    chai.expect(results[1]).to.deep.include(transfers);
  });

  it('applies output mapping', async function () {
    const results = await runner.read([{
      contract: 'MetaCoin',
      run: 'getBalanceInEth',
      at: contracts.MetaCoin,
      inputs: [{
        holder: inputs.address5,
      }],
    }, {
      contract: 'MetaCoin',
      run: 'getBalance',
      at: contracts.MetaCoin,
      inputs: [{
        holder: inputs.address5,
      }],
    }]);
    await chai.expect(results[0][0]).to.be.a('string').that.equals('2000');
    await chai.expect(results[1][0]).to.be.a.bignumber.that.equals(new BN('1000'));
  });

  it('applies type mapping', async function () {
    const results = await runner.read([{
      contract: 'MetaCoin',
      run: 'version',
      at: contracts.MetaCoin,
    }]);
    await chai.expect(results[0][0]).to.be.a('string').that.equals(String(inputs.version));
  });

  it('merges $inputs and $deployed', async function () {
    await chai.expect(runner.read([{
      contract: 'MetaCoin',
      run: 'getBalance',
      at: '$deployed.MetaCoin',
      inputs: [{
        holder: '$inputs.address5',
      }],
    }], {
      address5: inputs.address5,
      $deployed: contracts,
    })).to.be.fulfilled;
    await chai.expect(runner.read([{
      contract: 'MetaCoin',
      run: 'getBalance',
      at: '$deployed.MetaCoin',
      inputs: [{
        holder: '$inputs.address5',
      }],
    }], {
      $deployed: contracts,
      $inputs: {
        address5: inputs.address5,
      },
    })).to.be.fulfilled;
    await chai.expect(runner.read([{
      contract: 'MetaCoin',
      run: 'getBalance',
      at: '$deployed.MetaCoin',
      inputs: [{
        holder: '$inputs.address5',
      }],
    }], {
      MetaCoin: contracts.MetaCoin,
      address5: inputs.address5,
    })).to.be.rejected;
  });
});
