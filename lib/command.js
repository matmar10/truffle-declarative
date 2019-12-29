'use strict';

const assert = require('assert');
const merge = require('deepmerge');
const objectMapper = require('object-mapper');
const uniq = require('lodash.uniq');
const validate = require('jsonschema').validate;

const getInputTransformer = require('./types');

class Command {

  constructor(definition) {

    definition.inputs = Array.isArray(definition.inputs) ?
      definition.inputs : [];
    definition.outputs = 'undefined' !== typeof definition.outputs ?
      definition.outputs : {};

    validate(definition, Command.schema, { throwError: true });
    if (-1 === Command.staticMethods.indexOf(definition.run)) {
      validate(definition, Command.schemaInstanceMethod, { throwError: true });
      this.isStatic = false;
    } else {
      validate(definition, Command.schemaStaticMethod, { throwError: true });
      this.isStatic = true;
    }

    this.keys = Object.keys(definition);
    this.keys.forEach(key => {
      this[key] = definition[key];
    });
    this.types = this.types || {};
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
          result[subInputKey] = Command.applyRegexToInput(subInput, state);
        }
      } else {
        result = Command.applyRegexToInput(input, state);
      }
      inputs[i] = result;
    });
    return inputs;
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
      const existingValue = objectMapper.getKeyValue(state, outputMap);
      const valueToSet = ('object' === typeof existingValue) ?
        merge(existingValue, output) : output;
      objectMapper.setKeyValue(state, outputMap, valueToSet);
    }
  }

  sortInputsUsingAbi(inputs, artifact) {
    let sorted = [];
    inputs.forEach((input, index) => {
      if (this.isWeb3Argument(input, index, inputs.length)) {
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

  isWeb3Argument(input, index, numArgs) {
    if (index + 1 !== numArgs) {
      return false;
    }
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

Command.applyRegexToInput = function(input, state) {
  for (const regexKey in Command.regex) {
    const re = Command.regex[regexKey];
    const result = Command.getMatchedInputForRegex(re, input, state);
    if ('undefined' === typeof result) {
      continue;
    }
    return result;
  }
  return input;
};

Command.getMatchedInputForRegex = function(regex, input, state) {
  const matches = regex.exec(input);
  if (matches) {
    const [stateKey] = matches;
    return objectMapper.getKeyValue(state, stateKey);
  }
  return undefined;
};

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
      oneOf: [{
        pattern: '^0x[a-fA-F0-9]{40}$'
      }, {
        pattern: '^\\$(contracts|inputs|outputs|deployed).*'
      }]
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
      oneOf: [{
        type: 'object'
      }, {
        type: 'string'
      }]
    }
  },
  required: ['contract', 'run']
};

Command.schemaInstanceMethod = {
  description: 'Command representing instance method call of a deployed contract',
  type: 'object',
  required: ['contract', 'run', 'at', 'inputs', 'outputs']
};

Command.schemaStaticMethod = {
  description: 'Command representing static method call of a contract interface',
  type: 'object',
  required: ['contract', 'run', 'inputs', 'outputs']
};

Command.noArtifactMethods = ['new', 'sendTransaction'];

Command.staticMethods = ['at', 'link', 'new'];


module.exports = Command;
