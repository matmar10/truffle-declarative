'use strict';

const TruffleConfig = require('@truffle/config');
const TruffleContract = require('@truffle/contract');
const TruffleProvider = require('@truffle/provider');
const ora = require('ora');
const path = require('path');
const AbiReader = require('./../lib/abi-reader');

(async () => {
  /* eslint no-console: 0 */
  try {
    const reader = new AbiReader({
      workingDirectory: path.join(__dirname, '/../../../Blossom/smartsukuk-dual-mudaraba'),
    });

    const artifact = reader.getArtifact('SafeMathLib');

    const truffleConfig = TruffleConfig.detect({
      network: 'development',
      workingDirectory: path.join(__dirname, '/../../../Blossom/smartsukuk-dual-mudaraba'),
    });

    const spinner = ora();
    spinner.start('Running...');
    const provider = TruffleProvider.create(truffleConfig);
    const Contract = TruffleContract(artifact);
    Contract.setProvider(provider);

    const preHandles = process._getActiveHandles();
    console.log('Remaining handles: ', preHandles.length);

    // const promiEvent = contract.new.apply(contract, newArgs);
    const promiEvent = Contract.new({
      from: '0x1f9c410d5562bb6590b8f891f2e26311f9a6ef8c',
    });

    const safeMathLib = await promiEvent;

    spinner.succeed(`Deployed at ${safeMathLib.address}`);
    // promiEvent.removeAllListeners();

    const postHandles = process._getActiveHandles();
    console.log('Remaining handles: ', {
      pre: preHandles.length,
      post: postHandles.length,
    });
    // postHandles.forEach(handle => {
    //   console.log('\n\n');
    //   if (-1 !== preHandles.indexOf(handle)) {
    //     return;
    //   }
    //   console.log(handle);
    //   if (handle.removeAllListeners) {
    //     handle.removeAllListeners();
    //     return;
    //   }
    //   if (handle.unref) {
    //     handle.unref();
    //     return;
    //   }
    //   console.log('\n\n');
    // });

    spinner.succeed('Shutdown OK.');

    spinner.stop();
  } catch (err) {
    console.error(err);
  }
})();
