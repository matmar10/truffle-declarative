'use strict';

const Promise = require('bluebird');
const merge = require('deepmerge');
const objectMapper = require('object-mapper');
const validate = require('jsonschema').validate;

const Command = require('./command');
const AbiReader = require('./abi-reader');
const ProviderAware = require('./provider-aware');

const TruffleContract = require('@truffle/contract');

class Runner extends ProviderAware {

  constructor(options = {}) {
    super(options);
    this.abiReader = new AbiReader(options);
  }

  async run(command, state) {
    if (Array.isArray(command)) {
      const results = await Promise.map(command, (individualCommand) => {
        return this.run(individualCommand, state);
      }, { concurrency: 1 });
      return results;
    }
    
    // just in case some items are not defined
    this.initState(state);

    if (!(command instanceof Command)) {
      command = new Command(command);
    }
    const Contract = this.getContract(command.contract, state);
    let target;
    if (command.isStatic) {
      target = Contract;
    } else {
      target = await Contract.at(command.at);
    }
    const inputs = command.getInputs(state);
    const method = target[command.run];
    if (!method) {
      throw new TypeError(`No method ${command.run} found on contract ${command.contract}`);
    }
    if ('link' === command.run) {
      await target.detectNetwork();
    }
    const output = await method.apply(target, inputs);
    command.writeOutputs(output, state);
    return output;
  }

  getContract(name, state = {}) {
    if (state.$contracts && state.$contracts[name]) {
      return state.$contracts[name];
    }
    const artifact = this.abiReader.getArtifact(name);
    const Contract = TruffleContract(artifact);
    Contract.setProvider(this.getProvider(this.options));
    state.$contracts = state.$contracts || {};
    state.$contracts[name] = Contract;
    return Contract;
  }

  initState(state = {}) {
    state.$inputs = state.$inputs || {};
    state.$outputs = state.$outputs || {};
    state.$contracts = state.$contracts || {};
    state.$deployed = state.$deployed || {};
  }
}

module.exports = Runner;
