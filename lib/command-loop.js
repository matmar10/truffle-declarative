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

  iterable(state) {
    return Array.isArray(this.for) ?
      this.for : Command.applyRegexToInput(this.for, state);
  }

  count(state) {
    const numberOfItems = this.iterable(state).length;
    const numberPerItem = this.each.length || 1;
    return numberOfItems * numberPerItem;
  }

  commands(state) {
    const iterable = this.iterable(state);
    const commands = [];

    const buildCommand = (item, definition) => {
      return traverse(definition).map(function (input) {
        if (!this.isLeaf) {
          return;
        }

        for (let i = 0; i < CommandLoop.itemRegex.length; i++) {
          const re = CommandLoop.itemRegex[i];
          const result = Command.getMatchedInputForRegex(re, input, {
            $item: item
          });
          if ('undefined' === typeof result) {
            continue;
          }

          // true flag means don't traverse further into
          // see https://github.com/substack/js-traverse
          this.update(result, true);
          break;
        }
      });
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

CommandLoop.isCommandLoop = function(definition) {
  return definition instanceof CommandLoop || (
    'object' === typeof definition &&
    definition.for &&
    definition.each
  );
};

CommandLoop.itemRegex = [
  /^\$item\..*/,
  // allow raw item not object
  /^\$item/,
];

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