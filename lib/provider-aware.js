'use strict';

const TruffleConfig = require('@truffle/config');
const TruffleProvider = require('@truffle/provider');
const merge = require('deepmerge');
const Web3 = require('web3');

class ProviderAware {

  constructor(options) {
    this.options = options;
    this.provider = this.options.provider || null;
  }

  getWeb3() {
    return new Web3(this.getProvider());
  }

  getProvider() {
    if (this.provider) {
      return this.provider;
    }
    const truffleOptions = merge({
      network: this.options.networkName,
      workingDirectory: this.options.workingDirectory,
    }, this.options);
    const truffleConfig = TruffleConfig.detect(truffleOptions);
    this.provider = TruffleProvider.create(truffleConfig);
    return this.provider;
  }

  close() {
    const provider = this.getProvider();
    if (provider && provider.close) {
      console.log('provider.close');
      provider.close();
    } else if (provider && provider.connection && provider.connection.close) {
      console.log('provider.connection.close');
      provider.connection.close();
    }
    const web3 = this.getWeb3();
    if (web3 && web3.currentProvider && web3.currentProvider.connection) {
      console.log('web3.currentProvider.connection.close');
      web3.currentProvider.connection.close();
    }
  }
}

module.exports = ProviderAware;
