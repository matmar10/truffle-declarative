'use strict';

module.exports = {
  type: 'object',
  allOf: [{
    $ref: '#/definitions/AbstractCommand',
  }],
  definitions: {
    AbstractCommand: {
      allOf: [{
        $ref: '#/definitions/CommandBase',
      }],
      anyOf: [{
        type: 'object',
        properties: {
          playbook: {
            title: 'Path to a playbook',
            type: 'string',
          },
        },
        required: ['playbook'],
      }, {
        allOf: [{
          required: ['contract', 'run'],
        }],
        anyOf: [{
          $ref: '#/definitions/ContractInstanceMethodCommand',
        }, {
          $ref: '#/definitions/ContractStaticMethodCommand',
        }],
      }],
    },

    CommandBase: {
      type: 'object',
      properties: {
        description: {
          title: 'Human readible description of what this command does',
          type: 'string',
        },
        contract: {
          title: 'Name of a contract interface loaded via truffle',
          type: 'string',
        },
        at: {
          title: 'Address of the contract instance to run this method on',
          type: 'string',
          oneOf: [{
            pattern: '^0x[a-fA-F0-9]{40}$',
          }, {
            pattern: '^\\$(contracts|inputs|outputs|deployed).*',
          }],
        },
        run: {
          title: 'Method name to run against the contract',
          type: 'string',
        },
        inputs: {
          title: 'List of inputs to pass to the method',
          type: 'array',
        },
        outputs: {
          title: 'Object mapping of output value to saved properties on the $outputs variable',
          oneOf: [{
            type: 'object',
          }, {
            type: 'string',
          }],
        },
      },
    },

    // ex: MetaCoin.sendCoin()
    ContractInstanceMethodCommand: {
      title: 'Command representing instance method call of a deployed contract',
      type: 'object',
      required: ['contract', 'run', 'inputs', 'outputs', 'at'],
      allOf: [{
        $ref: '#/definitions/CommandBase',
      }],
    },

    // ex: MetaCoin.link()
    ContractStaticMethodCommand: {
      description: 'Command representing static method call of a contract interface',
      type: 'object',
      required: ['contract', 'run', 'inputs', 'outputs'],
      allOf: [{
        $ref: '#/definitions/CommandBase',
      }],
    },

  },
};
