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

describe('cli', function () {
  let inputs;
  let runner;
  let metacoin;
  before(async function () {
    inputs = yaml.safeLoad(fs.readFileSync(path.join(__dirname, 'inputs.yml'), 'utf8'));
    runner = new Runner({
      workingDirectory: __dirname,
    });
    metacoin = await runner.contractAt('MetaCoin', deployedAddress);
  });

  it('runs deploy scripts with linking', async function () {
    const values = await runner.mapper.map('MetaCoin', deployedAddress);
    chai.expect(values).to.have.property('name', 'Fancy MetaCoin Example');
  });

  it('runs instance methods', async function () {
    const addresses = Array.from(Array(10).keys()).map(i => `address${i}`);
    await Promise.each(addresses, async (addressName) => {
      const address = inputs[addressName];
      const balance = await metacoin.getBalance(address);
      chai.expect(balance).to.be.a.bignumber.that.equals(new BN(1000));
    });
  });
});
