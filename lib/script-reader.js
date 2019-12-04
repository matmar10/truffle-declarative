'use strict';

const assert = require('assert');
const glob = require('glob');
const fs = require('fs');
const merge = require('deepmerge');
const path = require('path');
const yaml = require('js-yaml');

class ScriptReader {

  constructor(options = {}) {
    this.options = options;
    this.parsers = merge(ScriptReader.parsers, options.parsers || {});
  }

  read(scriptsPaths = []) {
    const paths = scriptsPaths || this.options.scriptsPaths;
    assert(Array.isArray(paths), 'Requires array `scriptsPaths argument`');

    let files = [];
    paths.forEach(path => {
      const newFiles = glob.sync(path);
      files = merge(files, newFiles);
    });
    if (!files.length) {
      throw new Error(`No contracts found in directories for glob patterns: ${paths.join(',')}`);
    }

    return files.map(filename => this.parseFile(filename));
  }

  parseFile(filename, ext) {
    return ScriptReader.parseFile(filename, ext, this.parsers);
  }
}

ScriptReader.parseFile = function(filename, ext, parsers) {
  ext = ext || path.extname(filename);
  parsers = parsers || ScriptReader.parsers;
  switch (ext) {
    case '.js':
      return require(filename);
    case '.json':
    case '.yml':
    case '.yaml':
      const content = fs.readFileSync(filename, 'utf8');
      const minusDot = ext.substring(1);
      const fn = parsers[minusDot];
      return fn(content);
    default:
      throw new TypeError(`Could not determine how to parse file based on extension '${ext}'`);
  }
}

ScriptReader.parsers = {
  json: JSON.parse,
  yml: yaml.safeLoad,
  yaml: yaml.safeLoad,
};

module.exports = ScriptReader;
