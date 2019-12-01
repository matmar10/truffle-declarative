'use strict';

const TruffleConfig = require('@truffle/config');
const TruffleProvider = require('@truffle/provider');
const merge = require('deepmerge');
const Web3 = require('web3');

class ProviderAware {

  constructor(options) {
    this.options = options;
  }

  getWeb3() {
    return new Web3(this.getProvider(this.options));
  }

  getProvider() {
    if (this.options.provider) {
      return this.options.provider;
    }
    const truffleOptions = merge({
      network: this.options.networkName,
      workingDirectory: this.options.workingDirectory,
    }, this.options);
    const truffleConfig = TruffleConfig.detect(truffleOptions);
    return TruffleProvider.create(truffleConfig);
  }
}

module.exports = ProviderAware;
