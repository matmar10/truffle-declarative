'use strict';


const TruffleConfig = require('@truffle/config');
const TruffleContract = require('@truffle/contract');
const TruffleProvider = require('@truffle/provider');
const merge = require('deepmerge');
const ora = require('ora');
const path = require('path');
const AbiReader = require('./lib/abi-reader');

/**
 * Waits `n` blocks after a tx is mined, firing a pseudo
 * 'confirmation' event for each one.
 * @private
 * @param  {Number} blocksToWait
 * @param  {Object} receipt
 * @param  {Object} interfaceAdapter
 * @return {Promise}             Resolves after `blockToWait` blocks
 */
async function _waitBlocks(blocksToWait, state, interfaceAdapter) {
  const self = this;
  let currentBlock = await interfaceAdapter.getBlockNumber();

  return new Promise(accept => {
    let blocksHeard = 0;

    const poll = setInterval(async () => {
      const newBlock = await interfaceAdapter.getBlockNumber();

      if (newBlock > currentBlock) {
        blocksHeard = newBlock - currentBlock + blocksHeard;
        currentBlock = newBlock;

        const eventArgs = {
          contractName: state.contractName,
          receipt: state.receipt,
          num: blocksHeard,
          block: currentBlock
        };

        await self.emitter.emit("confirmation", eventArgs);
      }

      if (blocksHeard >= blocksToWait) {
        clearInterval(poll);
        accept();
      }
    }, 500);
  });
}

async function _hashCb(parent, state, hash) {
  const eventArgs = {
    contractName: state.contractName,
    transactionHash: hash
  };
  state.transactionHash = hash;
  await parent.emitter.emit('transactionHash', eventArgs);
  this.removeListener('transactionHash', parent._hashCb);
}

(async () => {
  try {

    const reader = new AbiReader({
      workingDirectory: path.join(__dirname, '/../../Blossom/smartsukuk-dual-mudaraba')
    });

    const artifact = reader.getArtifact('SafeMathLib');

    const truffleConfig = TruffleConfig.detect({
      network: 'development',
      workingDirectory: path.join(__dirname, '/../../Blossom/smartsukuk-dual-mudaraba')
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
      from: '0x1f9c410d5562bb6590b8f891f2e26311f9a6ef8c'
    });

    const safeMathLib = await promiEvent;

    spinner.succeed(`Deployed at ${safeMathLib.address}`);
    // promiEvent.removeAllListeners();

    const postHandles = process._getActiveHandles();
    console.log('Remaining handles: ', {
      pre: preHandles.length,
      post: postHandles.length
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
