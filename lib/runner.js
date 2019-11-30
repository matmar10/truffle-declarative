'use strict';

class Runner {

  constructor(options) {
    this.options = options;
  }

  getArtifact(contractName) {
    if (!Object.keys(this.artifacts).length) {
      this.artifacts = abiReader(this.options);
    }
    if (!this.artifacts[contractName]) {
      throw new Error(`No artifact found for contract name ${contractName}`);
    }
    return this.artifacts[contractName];
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
