'use strict';

const glob = require('glob');
const fs = require('fs');
const path = require('path');

const assertValidateOptions = require('./assert-valid-options');

class AbiReader {
  constructor(options = {}) {
    this.options = options;
    this.artifacts = {};

    assertValidateOptions(AbiReader.schema, this.options, 'AbiReader');

    if ('string' === this.options.contracts) {
      this.contractsGlobPath = this.options.contracts;
    } else {
      this.contractsGlobPath = path.join(this.options.workingDirectory, 'build/contracts/*.json');
    }

    if ('object' === typeof this.options.contracts) {
      if (Array.isArray(this.options.contracts)) {
        this.options.contracts.forEach((contract) => {
          if (!contract.contractName) {
            throw new Error('Not a truffle contract: expected contractName property');
          }
          this.artifacts[contract.contractName] = contract;
        });
      } else {
        this.artifacts = this.options.contracts;
      }
    }
  }

  getArtifact(contractName) {
    if (!Object.keys(this.artifacts).length) {
      this.artifacts = this.read();
    }
    if (!this.artifacts[contractName]) {
      throw new Error(`No artifact found for contract name ${contractName}`);
    }
    return this.artifacts[contractName];
  }

  read() {
    const files = glob.sync(this.contractsGlobPath);
    if (!files.length) {
      throw new Error(`No contracts found in directory: ${this.contractsGlobPath}`);
    }

    const result = {};
    files.forEach((file) => {
      const contract = fs.readFileSync(file, 'utf8');
      const parsed = JSON.parse(contract);
      if (!parsed.contractName) {
        throw new Error(`Expected property contractName in parsed JSON for file: '${file}'`);
      }
      result[parsed.contractName] = parsed;
    });

    return result;
  }
}

AbiReader.schema = {
  '$schema': 'http://json-schema.org/draft-07/schema#',
  'descripton': 'Options for abi-reader',
  'title': 'ABIReader Options',
  'type': 'object',
  'additionalProperties': true,
  'properties': {
    'workingDirectory': {
      'description': 'Base directory to search for truffle config and contracts',
      'type': 'string',
    },
    'contracts': {
      'oneOf': [{
        'description': 'A glob pattern to where contract ABI files are stored. Defaults to: \'[workingDirectory]/build/contracts/*.json\'',
        'type': 'string',
      }, {
        'description': 'An array of glob patterns pointing to where contract ABI files are stored',
        'type': 'array',
        'items': {
          'description': 'A glob pattern to where contract ABI files are stored. Defaults to: \'[workingDirectory]/build/contracts/*.json\'',
          'type': 'string',
        },
      }, {
        'description': 'A hash of contract name and the pre-loaded ABI. Use if you don\'t need automatic contract detection and loading',
        'type': 'object',
        'additionalProperties': true,
      }],
    },
  },
};

module.exports = AbiReader;
