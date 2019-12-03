'use strict';

const assert = require('assert');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const yaml = require('js-yaml');
const util = require('util');
const Transport = require('winston-transport');

const outputKeys = ['address', 'message', 'transactionHash', 'error'];

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
    this.startTime = this.getFormattedDate(date);
    this.filename = path.join(this.resultDir, `${this.startTime}.yml`);
    this.touch(date);
  }

  log(info, callback) {
    const subject = info.command.toJSON();
    const status = 'succeed' === info.level ? 'success' : 'error';
    subject.result = { status };
    outputKeys.forEach(key => {
      if (info[key]) {
        subject.result[key] = info[key];
      }
    });
    const output = yaml.safeDump([subject]);
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

  getFormattedDate(date) {
    return date.getFullYear() + "-" + ('0' + (date.getMonth() + 1)).slice(-2) + "-" + ('0' + date.getDate()).slice(-2) + "-" + ('0' + date.getHours()).slice(-2) + "-" + ('0' + date.getMinutes()).slice(-2) + "-" + ('0' + date.getSeconds()).slice(-2);
  }

  touch(date) {
    try {
      fs.utimesSync(this.filename, date, date);
    } catch (err) {
      fs.closeSync(fs.openSync(this.filename, 'w'));
    }
  }
};

module.exports = CommandResultTransport;
