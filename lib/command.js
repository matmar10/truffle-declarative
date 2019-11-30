'use strict';

const merge = require('deepmerge');
const objectMapper = require('object-mapper');
const validate = require('jsonschema').validate;

class Command {

  constructor(definition) {
    validate(definition, Command.schema);
    this.keys = Object.keys(definition);
    this.keys.forEach(key => {
      this[key] = definition[key];
    });
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

}

Command.regex = {
  $contracts: /^\$contracts\..*/,
  $inputs: /^\$inputs\..*/,
  $outputs: /^\$outputs\..*/,
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

module.exports = Command;
