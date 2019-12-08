'use strict';

const Promise = require('bluebird');
const chalk = require('chalk');
const glob = require('glob');
const merge = require('deepmerge');
const path = require('path');
const objectMapper = require('object-mapper');
const ora = require('ora');
const validate = require('jsonschema').validate;
const TruffleContract = require('@truffle/contract');
const winston = require('winston');

const Command = require('./command');
const CommandLoop = require('./command-loop');
const AbiReader = require('./abi-reader');
const ScriptReader = require('./script-reader');
const ProviderAware = require('./provider-aware');
// const buildLogger = require('./logger-factory');
const CommandResultTransport = require('./logger-command-result-transport');

const defaults = {
  closeOnFinish: true,
  resultDir: null,
  networkName: 'development',
  workingDirectory: path.join(__dirname, '/../../../'),
};

const wait = (time) => {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
};

class Runner extends ProviderAware {

  constructor(options = {}) {
    const opts = merge(defaults, options);
    super(opts);
    this.options = opts;
    this.abiReader = new AbiReader(opts);
    this.scriptReader = new ScriptReader(options);
    this.methodArtifacts = {};

    const networkInfo = this.truffleConfig.networks[this.truffleConfig.network];
    this.commandResultTransport = new CommandResultTransport({
      level: 'succeed',
      network: networkInfo.network_id,
      resultDir: this.options.resultDir || this.options.workingDirectory,
    });
    this.commandLogger = winston.createLogger({
      levels: {
        fail: 0,
        succeed: 1,
        debug: 2,
      },
      transports: [this.commandResultTransport]
    });
  }

  getCommandEmoji(command) {
    switch (command.run) {
      case 'new':
        return '🎁';
      case 'link':
        return '⛓';
      default:
        return '🧾';
    }
  }

  getTransactionHash(output) {
    if (!output) {
      return undefined;
    }
    if (output.tx) {
      return output.tx;
    }
    if (output.transactionHash) {
      return output.transactionHash;
    }
    if (output.receipt && output.receipt.transactionHash) {
      return output.receipt.transactionHash;
    }
    return undefined;
  }

  getCommandMessage(command) {
    const emoji = this.getCommandEmoji(command);
    return command.description ?
      `${emoji}\t${command.description} [${command.contract}.${command.run}]` :
      `${emoji}\t${command.contract}.${command.run}`;
  }

  async read(globPaths, state) {
    const scripts = this.scriptReader.read(globPaths);
    this.spinner = this.spinner || ora();
    return await Promise.map(scripts, async (commands) => {
      this.spinner.info(`Running: ${commands.filename}...`);
      const result = await this.run(commands, state);
      this.spinner.succeed(`Script: ${commands.filename}`);
      return result;
    }, { concurrency: 1 });
  }

  async run(command, state) {
    this.spinner = this.spinner || ora();

    if (Array.isArray(command)) {
      this.spinner.start(`📡 Running ${command.length} commands...`);
      try {
        const results = [];
        await Promise.each(command, async (individualCommand, i) => {
          this.spinner.prefixText = `${i+1} of ${command.length}`;
          const result = await this.run(individualCommand, state);
          results[i] = result;
          await wait(this.options.delay);
          return result;
        });
        this.closeOnFinish(state);
        return results;
      } catch (err) {
        this.closeOnFinish(state, err);
        return Promise.reject(err);
      }
    }

    try {
      // just in case some items are not defined
      this.initState(state);

      if (!(command instanceof Command)) {
        if (command.for && command.each) {
          const commandLoop = new CommandLoop(command);
          const commands = commandLoop.commands(state);
          console.log('COMMANDS:', commands);
          return this.run(commands, state);
        }
        command = new Command(command);
      }

      this.spinner.start(this.getCommandMessage(command));

      const Contract = this.getContract(command.contract, state);
      let target;
      if (command.isStatic) {
        target = Contract;
      } else {
        const at = Command.applyRegexToInput(command.at, state);
        target = await Contract.at(at);
      }
      const inputs = command.getInputs(state);
      const method = target[command.run];
      if (!method) {
        throw new TypeError(`No method ${command.run} found on contract ${command.contract}`);
      }

      // constructor and other arguments can be "named" arguments
      // and the ABI will be used to figure out the correct order
      let sortedInputs = inputs;
      if (inputs.length && ('new' === command.run ||  !command.isStatic)) {
        const artifact = this.getArtifactForMethod(command.contract, command.run);
        if (artifact) {
          sortedInputs = command.sortInputsUsingAbi(inputs, artifact);
        }
      }

      // special case needed for linking
      if ('link' === command.run) {
        await target.detectNetwork();
      }

      const activeHandlesBefore = process._getActiveHandles();
      const output = await method.apply(target, sortedInputs);
      const activeHandlesAfter = process._getActiveHandles();
      this.removeDanglingHandles(activeHandlesBefore, activeHandlesAfter);

      const messagePrefix = this.getCommandMessage(command);
      const transactionHash = this.getTransactionHash(output);
      const address = output ? output.address : undefined;

      const result = {
        address,
        command,
        transactionHash,
      };

      command.writeOutputs(result, state);

      let message;
      if ('new' === command.run) {
        // this is required to cover for truffle's magic special sauce
        // under the hood of the 'deployer' object
        // https://github.com/trufflesuite/truffle/blob/develop/packages/deployer/src/deployment.js
        target.address = result.address;
        target.transactionHash = result.transactionHash;
        message = `${messagePrefix} at ${chalk.green(result.address)}\n\t\t(transaction: ${chalk.cyan(result.transactionHash)})`
      } else if (result.transactionHash) {
        message = `${messagePrefix}\n\t\t(transaction: ${chalk.cyan(result.transactionHash)})`;
      } else {
        message = messagePrefix;
      }

      this.commandLogger.succeed(message, result);
      this.spinner.succeed(message);

      return output;
    } catch (error) {
      const message = this.getCommandMessage(command);
      this.spinner.fail(`${message} FAILED\n\t\t${error}`);
      this.commandLogger.fail(message, {
        command,
        error
      });
      return Promise.reject(error);
    }
  }

  closeOnFinish(state, err) {
    if (this.options.closeOnFinish) {
      // close underlying provider, if applicable
      this.close();
    }
    if (this.spinner) {
      this.spinner.prefixText = '';
      if (err) {
        this.spinner.info(`Wrote results to file: ${chalk.yellow(this.commandResultTransport.filename)}`);
      } else {
        this.spinner.succeed(`Wrote results to file: ${chalk.yellow(this.commandResultTransport.filename)}`);
      }
      this.spinner.stop();
    }
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

    if (-1 === Command.noArtifactMethods.indexOf(methodName)) {
      throw new Error(`No arifact found for ${contractName}.${methodName}`);
    }

    return false;
  }

  initState(state = {}) {
    state.$inputs = state.$inputs || {};
    state.$outputs = state.$outputs || {};
    state.$contracts = state.$contracts || {};
    state.$deployed = state.$deployed || {};
  }

  removeDanglingHandles(before, after) {
    if (after.length <= before.length) {
      return;
    }
    let i = 0;
    after.forEach(handle => {
      if (-1 !== before.indexOf(handle)) {
        // existing handle before method, ignore
        return;
      }
      if (handle.removeAllListeners) {
        // dangling event listener
        handle.removeAllListeners();
      }
      if (handle.unref) {
        // dangling timer
        handle.unref();
      }
    });
  }

}

module.exports = Runner;
