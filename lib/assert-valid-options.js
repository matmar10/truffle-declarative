'use strict';

const Ajv = require('ajv');
const util = require('util');

module.exports = function assertValidateOptions(schema, options, identifier) {
  const ajv = new Ajv({ allErrors: true });
  const valid = ajv.validate(schema, options);
  if (!valid) {
    const err = new Error(`Invalid options for ${identifier}`);
    err.errors = ajv.errors;
    console.error(util.inspect(ajv.errors, {
      depth: 10,
    }));
    throw err;
  }
};
