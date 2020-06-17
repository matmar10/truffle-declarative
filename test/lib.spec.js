  'use strict';

/* global before, describe, it */
const BN = require('bn.js');
const Promise = require('bluebird');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const chaiBN = require('chai-bn');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

chai.use(chaiBN(BN));
chai.use(chaiAsPromised);

const Runner = require('./../');

const deployedAddress = '0xCfEB869F69431e42cdB54A4F4f105C19C080A601';

describe('lib', function () {
  this.timeout(10000);
  let inputs;
  let playbooks;
  let runner;
  let metacoin;
  let results;
  before(async function() {
    inputs = yaml.safeLoad(fs.readFileSync(path.join(__dirname, 'inputs.yml'), 'utf8'));
    playbooks = [
      yaml.safeLoad(fs.readFileSync(path.join(__dirname, 'playbooks/0-deploy.playbook.yml'), 'utf8')),
      yaml.safeLoad(fs.readFileSync(path.join(__dirname, 'playbooks/1-send.playbook.yml'), 'utf8')),
    ];
    runner = new Runner({
      workingDirectory: __dirname,
    });
    results = await runner.read(playbooks, { $inputs: inputs });
  });

  it('runs deploy scripts with linking', function() {
    chai.expect(results[0][0]).to.deep.include({
      address: '0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab',
      transactionHash: '0xd7bc5dc32543a0a6064954f96435a29191fb5dcd6324ff57862ab1aa3b2aa69a',
    });
    chai.expect(results[0][1]).to.be.undefined;
    chai.expect(results[0][2]).to.deep.include({
      address: '0x5b1869D9A4C187F2EAa108f3062412ecf0526b24',
      transactionHash: '0xeb78e9989818b34486c63920b5509146a4acd08e42b2a40f05130a56a8eabf90',
    });
    chai.expect(results[0][3]).to.be.undefined;
    chai.expect(results[0][4]).to.deep.include({
      address: '0xCfEB869F69431e42cdB54A4F4f105C19C080A601',
      transactionHash: '0xef60815c5bd48d46763d6278f48b1dee662e585be268682a33772405809afae5',
    });
  });

  it('runs instance methods', function() {
    chai.expect(results[1]).to.deep.include([
      { description: 'Send to address',
        contract: 'MetaCoin',
        at: '$deployed.metacoin',
        run: 'sendCoin',
        inputs:
         [ { receiver: inputs.address1,
             amount: 1000 },
           { from: '$inputs.address0' } ],
        outputs: {} },
      { description: 'Send to address',
        contract: 'MetaCoin',
        at: '$deployed.metacoin',
        run: 'sendCoin',
        inputs:
         [ { receiver: inputs.address2,
             amount: 1000 },
           { from: '$inputs.address0' } ],
        outputs: {} },
      { description: 'Send to address',
        contract: 'MetaCoin',
        at: '$deployed.metacoin',
        run: 'sendCoin',
        inputs:
         [ { receiver: inputs.address3,
             amount: 1000 },
           { from: '$inputs.address0' } ],
        outputs: {} },
      { description: 'Send to address',
        contract: 'MetaCoin',
        at: '$deployed.metacoin',
        run: 'sendCoin',
        inputs:
         [ { receiver: inputs.address4,
             amount: 1000 },
           { from: '$inputs.address0' } ],
        outputs: {} },
      { description: 'Send to address',
        contract: 'MetaCoin',
        at: '$deployed.metacoin',
        run: 'sendCoin',
        inputs:
         [ { receiver: inputs.address5,
             amount: 1000 },
           { from: '$inputs.address0' } ],
        outputs: {} },
      { description: 'Send to address',
        contract: 'MetaCoin',
        at: '$deployed.metacoin',
        run: 'sendCoin',
        inputs:
         [ { receiver: inputs.address6,
             amount: 1000 },
           { from: '$inputs.address0' } ],
        outputs: {} },
      { description: 'Send to address',
        contract: 'MetaCoin',
        at: '$deployed.metacoin',
        run: 'sendCoin',
        inputs:
         [ { receiver: inputs.address7,
             amount: 1000 },
           { from: '$inputs.address0' } ],
        outputs: {} },
      { description: 'Send to address',
        contract: 'MetaCoin',
        at: '$deployed.metacoin',
        run: 'sendCoin',
        inputs:
         [ { receiver: inputs.address8,
             amount: 1000 },
           { from: '$inputs.address0' } ],
        outputs: {} },
      { description: 'Send to address',
        contract: 'MetaCoin',
        at: '$deployed.metacoin',
        run: 'sendCoin',
        inputs:
         [ { receiver: inputs.address9,
             amount: 1000 },
           { from: '$inputs.address0' } ],
        outputs: {} }
    ]);
  });

  it('applies output mapping', async function() {
    const results = await runner.read([{
      contract: 'MetaCoin',
      run: 'getBalanceInEth',
      at: deployedAddress,
      inputs: [{
        holder: inputs.address5
      }],
    }, {
      contract: 'MetaCoin',
      run: 'getBalance',
      at: deployedAddress,
      inputs: [{
        holder: inputs.address5
      }],
    }]);
    await chai.expect(results[0][0]).to.be.a('string').that.equals('2000');
    await chai.expect(results[1][0]).to.be.a.bignumber.that.equals(new BN('1000'));
  });
});
