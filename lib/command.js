'use strict';

const assert = require('assert');
const merge = require('deepmerge');
const objectMapper = require('object-mapper');
const uniq = require('lodash.uniq');
const validate = require('jsonschema').validate;
const Web3 = require('web3');

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

  writeOutputs(result, state, outputMap = null) {
    outputMap = outputMap || this.outputs;
    if (Array.isArray(outputMap)) {
      return outputMap.forEach((subOutputMap) => {
        return this.writeOutputs(output, state, subOutputMap);
      });
    }
    if ('object' === typeof outputMap) {
      // deeply set target properties without losing referential
      // or prototypical integrity
      // e.g. big numbers (BN) ~> plain object will break
      // and web3 will barf
      const mappedOutput = objectMapper(result, outputMap);
      for (const sourceKey in outputMap) {
        const targetKeys = Array.isArray(outputMap[sourceKey]) ?
          outputMap[sourceKey] : [outputMap[sourceKey]];
        targetKeys.forEach(targetKey => {
          targetKey = 'object' === typeof targetKey ?
            targetKey.key : targetKey;
          const targetValue = objectMapper.getKeyValue(mappedOutput, targetKey);
          objectMapper.setKeyValue(state, targetKey, targetValue);
        });
      }
      return;
    }
    if ('string' === typeof outputMap) {
      const existingValue = objectMapper.getKeyValue(state, outputMap);
      objectMapper.setKeyValue(state, outputMap, result);
      return;
    }
    throw new TypeError(`Unexpected type '${typeof outputMap}' for output object map (array, object, or string expected): `);
  }

  sortInputsUsingAbi(inputs, artifact) {
    let sorted = [];
    inputs.forEach((input, index) => {
      if (this.isWeb3Argument(inputs, index, artifact, sorted)) {
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

  getOutputTypeFromAbi(artifact) {
    let type;
    if(artifact.outputs) {
      artifact.outputs.forEach(definition => {
          type = definition.type;
      });
      return type;
    }
    return false;
  }

  // inputs, index, artifact
  isWeb3Argument(inputs, index, artifact, sorted) {
    const numArgs = inputs.length;
    const expectedNumArgs = artifact.inputs.length;
    // given {n} expected args for method, only {n+1} argument can be web3
    if (sorted.length + index <= expectedNumArgs) {
      return false;
    }
    // given {n} actual args, only {n}th argument can be web3
    if (index + 1 !== numArgs) {
      return false;
    }
    const input = inputs[index];
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
