'use strict';

const objectMapper = require('object-mapper');
const uniq = require('lodash.uniq');

const assertValidateOptions = require('./assert-valid-options');
const getInputTransformer = require('./types');
const schema = require('./../schemas/command');

class Command {
  constructor(definition) {
    definition.inputs = Array.isArray(definition.inputs) ?
      definition.inputs : [];
    definition.outputs = 'undefined' !== typeof definition.outputs ?
      definition.outputs : {};

    assertValidateOptions(schema, definition, 'Command');

    if (-1 === Command.staticMethods.indexOf(definition.run)) {
      this.isStatic = false;
    } else {
      this.isStatic = true;
    }

    this.keys = Object.keys(definition);
    this.keys.forEach((key) => {
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
          const subInput = input[subInputKey];
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
      return outputMap.forEach(subOutputMap => this.writeOutputs(result, state, subOutputMap));
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
        targetKeys.forEach((targetKey) => {
          targetKey = 'object' === typeof targetKey ?
            targetKey.key : targetKey;
          const targetValue = objectMapper.getKeyValue(mappedOutput, targetKey);
          objectMapper.setKeyValue(state, targetKey, targetValue);
        });
      }
      return;
    }
    if ('string' === typeof outputMap) {
      // TODO: decide what to do in the event of an overwrite
      // const existingValue = objectMapper.getKeyValue(state, outputMap);
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
    artifact.inputs.forEach((inputDefinition) => {
      const tryNames = [inputDefinition.name];
      // try to match param ~> _param
      const prefixMatches = inputDefinition.name.match(/^_+/);
      if (prefixMatches) {
        const [prefix] = prefixMatches;
        const prefixStripped = inputDefinition.name.replace(prefix, '');
        tryNames.push(prefixStripped);
      }
      let value;
      tryNames.forEach((nameToTry) => {
        value = input[nameToTry];
      });
      if ('undefined' === typeof value) {
        throw new Error(`Missing argument ${inputDefinition.name} (tried: ${tryNames.join(', ')})`);
      }
      const transform = getInputTransformer(inputDefinition.type, this.types);
      const transformedValue = transform(value);
      sorted.push(transformedValue);
    });
    return sorted;
  }

  getOutputTypeFromAbi(artifact) {
    if (!artifact) {
      return;
    }
    if ('constructor' === artifact.type) {
      return 'contract';
    }
    if (!Array.isArray(artifact.outputs)) {
      return;
    }
    const [output] = artifact.outputs;
    if (!output) {
      return;
    }
    return output.type;
  }

  isWeb3Argument(inputs, index, artifact, sorted) {
    const numArgsProvided = inputs.length;
    const expectedNumArgsForMethod = artifact.inputs.length;
    // given {n} expected args for method, only {n+1} argument can be web3
    if (expectedNumArgsForMethod && sorted.length < expectedNumArgsForMethod) {
      return false;
    }
    // only final argument can be web3
    if (index !== numArgsProvided - 1) {
      return false;
    }
    // web3 argument must be object, e.g. { gas: 3e5, from: '...' }
    const input = inputs[index];
    if ('object' !== typeof input) {
      return false;
    }
    // web3 argument may only contain these valid options
    const validWeb3 = [
      'to',
      'from',
      'gas',
      'gasPrice',
      'nonce',
      'value',
      'data',
    ];
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
    this.keys.forEach((key) => {
      output[key] = this[key];
    });
    return output;
  }
}

Command.isFilePlaybook = function (definition) {
  return 'string' === typeof definition.playbook;
};

Command.applyRegexToInput = function (input, state) {
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

Command.getMatchedInputForRegex = function (regex, input, state) {
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
Command.noArtifactMethods = ['new', 'sendTransaction'];
Command.staticMethods = ['at', 'link', 'new'];

module.exports = Command;
