'use strict';

const assert = require('assert');
const fs = require('fs');
const merge = require('deepmerge');
const mkdirp = require('mkdirp');
const objectMapper = require('object-mapper');
const path = require('path');
const yaml = require('js-yaml');
const stripAnsi = require('strip-ansi');
const util = require('util');
const Transport = require('winston-transport');

//
// Inherit from `winston-transport` so you can take advantage
// of the base functionality and `.exceptions.handle()`.
//
class CommandResultTransport extends Transport {
  constructor(opts) {
    super(opts);

    assert(opts.network, 'Requires option `network`');
    assert(opts.resultDir, 'Requires option `resultDir`');

    this.resultDir = path.join(opts.resultDir, opts.network);
    mkdirp.sync(this.resultDir);

    const date = new Date();
    this.startTime = CommandResultTransport.getFormattedDate(date);
    this.filename = path.join(this.resultDir, `${this.startTime}.yml`);
    this.touch(date);
  }

  log(info, callback) {
    let output;
    if ('debug' === info.level) {
      output = `\n# ${info.message}\n\n`;
    } else {
      const command = info.command && info.command.toJSON ?
        info.command.toJSON() :
        info.command;
      const meta = objectMapper(info, CommandResultTransport.mapping);
      const subject = merge(command, meta);
      output = yaml.safeDump([subject]);
    }
    fs.appendFile(this.filename, output, (err) => {
      if (err) {
        this.emit('error', err);
        callback(err);
        return;
      }
      this.emit('logged', info);
      callback();
    });
  }

  touch(date) {
    try {
      fs.utimesSync(this.filename, date, date);
    } catch (err) {
      fs.closeSync(fs.openSync(this.filename, 'w'));
    }
  }

};

CommandResultTransport.getFormattedDate = function(date) {
  return date.getFullYear() + "-" + ('0' + (date.getMonth() + 1)).slice(-2) + "-" + ('0' + date.getDate()).slice(-2) + "-" + ('0' + date.getHours()).slice(-2) + "-" + ('0' + date.getMinutes()).slice(-2) + "-" + ('0' + date.getSeconds()).slice(-2);
};

CommandResultTransport.stripEmoji = function(str) {
  return str.replace(/([\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
};

CommandResultTransport.mapping = {
  'level': [{
    key: 'result.status',
    transform: function(value) {
      switch (value) {
        case 'fail': return 'error';
        case 'succeed': return 'success';
        default: return value;
      }
    }
  }, {
    key: 'result.succeeded',
    transform: (value) => 'succeed' === value
  }],
  'address': 'result.address',
  'message': {
    key: 'result.message',
    transform: function (value) {
      return value ? stripAnsi(CommandResultTransport.stripEmoji(value)).trim() : value;
    }
  },
  'transactionHash': 'result.transactionHash',
  'error.message': 'result.error.message',
  'error.name': 'result.error.name',
  'error.stack': 'result.error.stack',
  'error.reason': 'result.error.reason',
  'error.code': 'result.error.code',
  'error.arg': 'result.error.arg',
  'error.coderType': 'result.error.coderType',
  'error.value': 'result.error.value',
  'error.hijackedStack': 'result.error.hijackedStack'
};

module.exports = CommandResultTransport;
