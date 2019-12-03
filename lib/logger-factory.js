'use strict';

const merge = require('deepmerge');
const path = require('path');
const winston = require('winston');

let logger;

module.exports = function buildLogger(options) {
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
