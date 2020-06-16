'use strict';

const Ajv = require('ajv');

module.exports = function assertValidateOptions(schema, options) {
  const ajv = new Ajv({ allErrors: true });
  const valid = ajv.validate(schema, options);
  if (!valid) {
    throw new Ajv.ValidationError(ajv.errors);
  }
};
