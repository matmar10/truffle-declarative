'use strict';

const traverse = require('traverse');

const assertValidateOptions = require('./assert-valid-options');
const Command = require('./command');
const schema = require('./../schemas/command-loop');

class CommandLoop {
  constructor(definition) {
    assertValidateOptions(schema, definition, 'CommandLoop');
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

    const buildCommand = (item, definition) => traverse(definition).map(function (input) {
      if (!this.isLeaf) {
        return;
      }

      for (let i = 0; i < CommandLoop.itemRegex.length; i++) {
        const re = CommandLoop.itemRegex[i];
        const result = Command.getMatchedInputForRegex(re, input, {
          $item: item,
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

    iterable.forEach((item) => {
      const commandList = Array.isArray(this.each) ?
        this.each : [this.each];
      commandList.forEach((definition) => {
        const command = buildCommand(item, definition);
        commands.push(command);
      });
    });

    return commands;
  }
}

CommandLoop.isCommandLoop = function (definition) {
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

module.exports = CommandLoop;
