'use strict';

const merge = require('deepmerge');
const objectMapper = require('object-mapper');
const validate = require('jsonschema').validate;

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
    this.inputs = this.inputs || [];
    this.outputs = this.outputs || {};
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
