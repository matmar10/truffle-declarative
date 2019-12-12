'use strict';

const assert = require('assert');
const glob = require('glob');
const fs = require('fs');
const merge = require('deepmerge');
const path = require('path');
const yaml = require('js-yaml');

class ScriptReader {

  constructor(options = {}) {
    assert(options.workingDirectory, 'Requires option `workingDirectory`');
    this.options = options;
    this.options.parsers = merge(ScriptReader.parsers, this.options.parsers || {});
  }

  read(scriptsPaths = []) {
    scriptsPaths = Array.isArray(scriptsPaths) ?
      scriptsPaths : [scriptsPaths];
    const contentsByFilename = ScriptReader.parseFiles(scriptsPaths, this.options);

    const files = Object.keys(contentsByFilename);
    if (!files.length) {
      throw new Error(`No files found in directories for glob pattern(s): "${scriptsPaths.join('","')}";\nFiles found were:\n\t- ${files.join('\n\t- ')}`);
    }

    return Object.keys(contentsByFilename).map((filename) => {
      const content = contentsByFilename[filename];
      content.filename = filename;
      return content;
    });
  }

  merge(scriptsPaths = []) {
    scriptsPaths = Array.isArray(scriptsPaths) ?
      scriptsPaths : [scriptsPaths];

    const contentsByFilename = ScriptReader.parseFiles(scriptsPaths, this.options);

    let result = {};
    for (const filename in contentsByFilename) {
      const content = contentsByFilename[filename];
      result = merge(result, content);
    }

    return result;
  }
}

ScriptReader.coerceRelativePath = function(arg, workingDirectory) {
  if (Array.isArray(arg)) {
    return arg.map(val => ScriptReader.coerceRelativePath(val, workingDirectory));
  }
  return path.isAbsolute(arg) ?
    arg : path.join(workingDirectory, arg);
};

ScriptReader.readFiles = function(globs = [], options = {}) {
  options.fn = options.fn || function() {};
  options.workingDirectory = options.workingDirectory || __dirname;
  options.scriptDir = options.scriptDir || path.join(__dirname, '/../');

  let files = [];
  if (!Array.isArray(globs)) {
    globs = [globs];
  }

  const tryPath = (path, base) => {
    const absolutePath = ScriptReader.coerceRelativePath(path, base);
    return glob.sync(absolutePath);
  };

  globs.forEach(path => {
    const filesUsingWorkingDirectory = tryPath(path, options.workingDirectory);
    if (filesUsingWorkingDirectory.length) {
      files = merge(files, filesUsingWorkingDirectory);
      return;
    }
    const filesUsingScriptDir = tryPath(path, options.scriptDir);
    files = merge(files, filesUsingScriptDir);
  });

  return files;
};

ScriptReader.parseFile = function(filename, options = {}) {
  const ext = options.extension || path.extname(filename);
  const parsers = options.parsers || ScriptReader.parsers;
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
};

ScriptReader.parseFiles = function(globs = [], options) {
  const files = ScriptReader.readFiles(globs, options);
  const results = {};
  const contents = files.map(filename => {
    const content = ScriptReader.parseFile(filename, {
      extension: options.extension,
      parsers: options.parsers
    });
    if (options.fn) {
      options.fn(content);
    }
    results[filename] = content;
  });
  return results;
};

ScriptReader.parsers = {
  json: JSON.parse,
  yml: yaml.safeLoad,
  yaml: yaml.safeLoad,
};

module.exports = ScriptReader;
