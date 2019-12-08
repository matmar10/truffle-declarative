'use strict';

const assert = require('assert');
const merge = require('deepmerge');
const objectMapper = require('object-mapper');
const traverse = require('traverse');
const uniq = require('lodash.uniq');
const validate = require('jsonschema').validate;

const Command = require('./command');

class CommandLoop {

  constructor(definition) {
    validate(definition, CommandLoop.schema, { throwError: true });
    this.for = definition.for;
    this.each = definition.each;
  }

  commands(state) {
    const iterable = Array.isArray(this.for) ?
      this.for : Command.applyRegexToInput(this.for, state);

    const commands = [];

    const buildCommand = (item, definition) => {
      const newDef = traverse(definition).map(function (input) {
        if (this.isLeaf) {
          const result = Command.getMatchedInputForRegex(CommandLoop.itemRegex, input, {
            $item: item
          });
          if ('undefined' !== typeof result) {
            // true flag means don't traverse further into
            // see https://github.com/substack/js-traverse
            this.update(result, true);
          }
        }
      });
      return newDef;
    };

    iterable.forEach(item => {
      const commandList = Array.isArray(this.each) ?
        this.each : [this.each];
      commandList.forEach(definition => {
        const command = buildCommand(item, definition);
        commands.push(command);
      });
    });

    return commands;
  }
}

CommandLoop.itemRegex = /^\$item\..*/;

CommandLoop.schema = {
  type: 'object',
  properties: {
    description: {
      title: 'Human readible description of what this command does',
      type: 'string'
    },
    for: {
      title: 'A list of items or a reference to list of items in the state',
      oneOf: [{
        type: 'array',
      }, {
        type: 'string'
      }]
    },
    each: {
      title: 'Command or list of commands to apply to each item in the list',
      oneOf: [Command.schema, {
        type: 'array',
        items: Command.schema
      }]
    }
  },
  required: ['for', 'each']
};

module.exports = CommandLoop;
