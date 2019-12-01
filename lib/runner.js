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
    this.methodArtifacts = {};
  }

  async run(command, state) {
    if (Array.isArray(command)) {
      const results = [];
      await Promise.each(command, async (individualCommand, i) => {
        const result = await this.run(individualCommand, state);
        results[i] = result;
        return result;
      });
      return results;
    }

    // just in case some items are not defined
    this.initState(state);

    if (!(command instanceof Command)) {
      command = new Command(command);
    }
    console.log(command.description);

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

    let sortedInputs = inputs;
    if (inputs.length && ('new' === command.run ||  !command.isStatic)) {
      const artifact = this.getArtifactForMethod(command.contract, command.run);
      if (artifact) {
        sortedInputs = command.sortInputsUsingAbi(inputs, artifact);
        console.log('--- SORTED ----');
        console.log(sortedInputs)
      }
    }

    // special case needed for linking
    if ('link' === command.run) {
      await target.detectNetwork();
    }

    const output = await method.apply(target, sortedInputs);
    command.writeOutputs(output, state);

    // this is required to cover for truffle's magic special sauce
    // under the hood of the 'deployer' object
    // https://github.com/trufflesuite/truffle/blob/develop/packages/deployer/src/deployment.js
    if ('new' === command.run) {
      target.address = output.address;
      target.transactionHash = output.transactionHash;
    }

    return output;
  }

  getContract(contractName, state = {}) {
    if (state.$contracts && state.$contracts[contractName]) {
      return state.$contracts[contractName];
    }
    const artifact = this.abiReader.getArtifact(contractName);
    const Contract = TruffleContract(artifact);
    Contract.setProvider(this.getProvider(this.options));
    state.$contracts = state.$contracts || {};
    state.$contracts[contractName] = Contract;
    return Contract;
  }

  getArtifactForMethod(contractName, methodName) {
    this.methodArtifacts[contractName] = this.methodArtifacts[contractName] || {};
    if (this.methodArtifacts[contractName][methodName]) {
      return this.methodArtifacts[contractName][methodName];
    }

    const artifact = this.abiReader.getArtifact(contractName);
    if (!artifact) {
      throw new Error(`No arifact found for ${contractName}`);
    }

    for (let i = 0; i < artifact.abi.length; i++) {
      const method = artifact.abi[i];
      if (methodName === method.name || ('new' === methodName && 'constructor' === method.type)) {
        this.methodArtifacts[contractName][methodName] = method;
        return this.methodArtifacts[contractName][methodName];
      }
    }

    if ('new' === methodName) {
      return false;
    }
    throw new Error(`No arifact found for ${contractName}.${methodName}`);
  }

  initState(state = {}) {
    state.$inputs = state.$inputs || {};
    state.$outputs = state.$outputs || {};
    state.$contracts = state.$contracts || {};
    state.$deployed = state.$deployed || {};
  }
}

module.exports = Runner;
