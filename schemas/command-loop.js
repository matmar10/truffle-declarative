'use strict';

module.exports = {
  type: 'object',
  properties: {
    description: {
      title: 'Human readible description of what this command does',
      type: 'string',
    },
    for: {
      title: 'A list of items or a reference to list of items in the state',
      oneOf: [{
        type: 'array',
      }, {
        type: 'string',
      }],
    },
  },
  required: ['for', 'each'],
};
