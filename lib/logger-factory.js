'use strict';

const merge = require('deepmerge');
const path = require('path');
const winston = require('winston');

const assertValidateOptions = require('./assert-valid-options');

let logger;

function buildLogger(options) {
  assertValidateOptions(buildLogger.schema, options, 'buildLogger');

  if (options.logger) {
    return options.logger;
  }

  if (!logger) {
    const transports = [new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    })];

    if (options.logFile) {
      transports.push(new winston.transports.File({
        filename: options.logFile,
      }));
    }

    logger = winston.createLogger({
      level: options.logLevel || 'info',
      format: winston.format.combine(
        winston.format.json(),
      ),
      transports: transports
    });
  }

  options.logger = logger;

  return logger;
};

buildLogger.schema = {
  oneOf: [{
    type: 'object',
    properties: {
      logger: {
        type: 'object'
      }
    },
    required: ['logger']
  }, {
    type: 'object',
    properties: {
      logFile: {
        type: 'string'
      }
    },
    required: ['logFile']
  }, {
    type: 'object',
    properties: {
      logLevel: {
        type: 'string'
      }
    },
    required: []
  }],
  additionalProperties: true
};

module.exports = buildLogger;
