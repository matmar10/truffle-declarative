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
  this.timeout(5000);
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

  it('runs deploy scripts with linking', async function() {
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

  it('runs instance methods', async function() {
    chai.expect(results[1]).to.deep.include([
      { description: 'Send to address',
        contract: 'MetaCoin',
        at: '$deployed.metacoin',
        run: 'sendCoin',
        inputs:
         [ { receiver: '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0',
             amount: 1000 },
           { from: '$inputs.address0' } ],
        outputs: {} },
      { description: 'Send to address',
        contract: 'MetaCoin',
        at: '$deployed.metacoin',
        run: 'sendCoin',
        inputs:
         [ { receiver: '0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b',
             amount: 1000 },
           { from: '$inputs.address0' } ],
        outputs: {} },
      { description: 'Send to address',
        contract: 'MetaCoin',
        at: '$deployed.metacoin',
        run: 'sendCoin',
        inputs:
         [ { receiver: '0xE11BA2b4D45Eaed5996Cd0823791E0C93114882d',
             amount: 1000 },
           { from: '$inputs.address0' } ],
        outputs: {} },
      { description: 'Send to address',
        contract: 'MetaCoin',
        at: '$deployed.metacoin',
        run: 'sendCoin',
        inputs:
         [ { receiver: '0xd03ea8624C8C5987235048901fB614fDcA89b117',
             amount: 1000 },
           { from: '$inputs.address0' } ],
        outputs: {} },
      { description: 'Send to address',
        contract: 'MetaCoin',
        at: '$deployed.metacoin',
        run: 'sendCoin',
        inputs:
         [ { receiver: '0x95cED938F7991cd0dFcb48F0a06a40FA1aF46EBC',
             amount: 1000 },
           { from: '$inputs.address0' } ],
        outputs: {} },
      { description: 'Send to address',
        contract: 'MetaCoin',
        at: '$deployed.metacoin',
        run: 'sendCoin',
        inputs:
         [ { receiver: '0x3E5e9111Ae8eB78Fe1CC3bb8915d5D461F3Ef9A9',
             amount: 1000 },
           { from: '$inputs.address0' } ],
        outputs: {} },
      { description: 'Send to address',
        contract: 'MetaCoin',
        at: '$deployed.metacoin',
        run: 'sendCoin',
        inputs:
         [ { receiver: '0x28a8746e75304c0780E011BEd21C72cD78cd535E',
             amount: 1000 },
           { from: '$inputs.address0' } ],
        outputs: {} },
      { description: 'Send to address',
        contract: 'MetaCoin',
        at: '$deployed.metacoin',
        run: 'sendCoin',
        inputs:
         [ { receiver: '0xACa94ef8bD5ffEE41947b4585a84BdA5a3d3DA6E',
             amount: 1000 },
           { from: '$inputs.address0' } ],
        outputs: {} },
      { description: 'Send to address',
        contract: 'MetaCoin',
        at: '$deployed.metacoin',
        run: 'sendCoin',
        inputs:
         [ { receiver: '0x1dF62f291b2E969fB0849d99D9Ce41e2F137006e',
             amount: 1000 },
           { from: '$inputs.address0' } ],
        outputs: {} }
    ]);
  });
});
