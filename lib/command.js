'use strict';

const merge = require('deepmerge');
const objectMapper = require('object-mapper');
const uniq = require('lodash.uniq');
const validate = require('jsonschema').validate;

const getInputTransformer = require('./types');

class Command {

  constructor(definition) {
    validate(definition, Command.schema);
    if (-1 === Command.statics.indexOf(definition.run)) {
      validate(definition, Command.schemaInstanceMethod);
      this.isStatic = false;
    } else {
      validate(definition, Command.schemaStaticMethod);
      this.isStatic = true;
    }
    this.keys = Object.keys(definition);
    this.keys.forEach(key => {
      this[key] = definition[key];
    });
    this.inputs = Array.isArray(this.inputs) ?
      this.inputs : [];
    this.outputs = this.outputs || {};
    this.types = this.types || {};
    this.keys.push('inputs', 'outputs');
    this.keys = uniq(this.keys);
  }

  getInputs(state) {
    const inputs = [];
    this.inputs.forEach((input, i) => {
      let result;
      if ('object' === typeof input) {
        result = {};
        for (const subInputKey in input) {
          const subInput = input[subInputKey] ;
          result[subInputKey] = this.applyRegexToInput(subInput, state);
        }
      } else {
        result = this.applyRegexToInput(input, state);
      }
      inputs[i] = result;
    });
    return inputs;
  }

  applyRegexToInput(input, state) {
    for (const regexKey in Command.regex) {
      const re = Command.regex[regexKey];
      const matches = re.exec(input);
      if (matches) {
        const [stateKey] = matches;
        return objectMapper.getKeyValue(state, stateKey);
      }
    }
    return input;
  }

  writeOutputs(output, state, outputMap = null) {
    outputMap = outputMap || this.outputs;
    if (Array.isArray(outputMap)) {
      return outputMap.forEach((subOutputMap) => {
        return this.writeOutputs(output, state, subOutputMap);
      });
    }
    if ('object' === typeof outputMap) {
      const result = objectMapper(output, outputMap);
      for (const resultKey in result) {
        state[resultKey] = merge(state[resultKey] || {}, result[resultKey]);
      }
    }
    if ('string' === typeof outputMap) {
      return objectMapper.setKeyValue(state, outputMap, output);
    }
  }

  sortInputsUsingAbi(inputs, artifact) {
    let sorted = [];
    inputs.forEach(input => {
      if (this.isWeb3Argument(input)) {
        sorted.push(input);
        return;
      }
      if ('object' === typeof input) {
        const sortedInputs = this.createSortedInputsFromAbi(input, artifact);
        sorted = sorted.concat(sortedInputs);
        return;
      }
      sorted.push(input);
    });

    return sorted;
  }

  createSortedInputsFromAbi(input, artifact) {
    // sort items using order defined by abi artifact
    const sorted = [];
    artifact.inputs.forEach(definition => {
      const value = input[definition.name];
      if ('undefined' === typeof value) {
        throw new Error(`Missing argument ${definition.name}`);
      }
      const transform = getInputTransformer(definition.type, this.types);
      const transformedValue = transform(value);
      sorted.push(transformedValue);
    });
    return sorted;
  }

  isWeb3Argument(input) {
    if ('object' !== typeof input) {
      return false;
    }
    const validWeb3 = ['to', 'from', 'gas', 'gasPrice', 'nonce', 'value', 'data'];
    const keys = Object.keys(input);
    for (let i = 0; i < keys.length; i++) {
      if (-1 === validWeb3.indexOf(keys[i])) {
        return false;
      }
    }
    return true;
  }

  toJSON() {
    const output = {};
    this.keys.forEach(key => {
      output[key] = this[key];
    });
    return output;
  }

}

Command.regex = {
  $contracts: /^\$contracts\..*/,
  $inputs: /^\$inputs\..*/,
  $outputs: /^\$outputs\..*/,
  $deployed: /^\$deployed\..*/,
};

Command.schema = {
  type: 'object',
  properties: {
    description: {
      title: 'Human readible description of what this command does',
      type: 'string'
    },
    contract: {
      title: 'Name of a contract interface loaded via truffle',
      type: 'string'
    },
    at: {
      title: 'Address of the contract instance to run this method on',
      type: 'string',
      pattern: '^0x[a-fA-F0-9]{40}$'
    },
    run: {
      title: 'Method name to run against the contract',
      type: 'string'
    },
    inputs: {
      title: 'List of inputs to pass to the method',
      type: 'array'
    },
    outputs: {
      title: 'Object mapping of output value to saved properties on the $outputs variable',
      type: 'object'
    }
  },
  required: ['contract', 'run']
};

Command.schemaInstanceMethod = {
  description: 'Command representing instance method call of a deployed contract',
  type: 'object',
  required: ['contract', 'run', 'at']
};

Command.schemaStaticMethod = {
  description: 'Command representing static method call of a contract interface',
  type: 'object',
  required: ['contract', 'run']
};

Command.statics = ['at', 'link', 'new'];

module.exports = Command;
