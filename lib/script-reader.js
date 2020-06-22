'use strict';

const glob = require('glob');
const fs = require('fs');
const merge = require('deepmerge');
const path = require('path');
const yaml = require('js-yaml');

const assertValidateOptions = require('./assert-valid-options');

class ScriptReader {
  constructor(options = {}) {
    this.options = options;
    this.options.parsers = merge(ScriptReader.parsers, this.options.parsers || {});
    assertValidateOptions(ScriptReader.schema, options, 'ScriptReader');
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

ScriptReader.coerceRelativePath = function (arg, workingDirectory) {
  if (Array.isArray(arg)) {
    return arg.map(val => ScriptReader.coerceRelativePath(val, workingDirectory));
  }
  return path.isAbsolute(arg) ?
    arg : path.join(workingDirectory, arg);
};

ScriptReader.readFiles = function (globs = [], options = {}) {
  options.fn = options.fn || function () {};
  options.workingDirectory = options.workingDirectory || __dirname;
  options.scriptDirectory = options.scriptDirectory || path.join(__dirname, '/../');

  let files = [];
  if (!Array.isArray(globs)) {
    globs = [globs];
  }

  const tryPath = (path, base) => {
    const absolutePath = ScriptReader.coerceRelativePath(path, base);
    return glob.sync(absolutePath);
  };

  globs.forEach((pathToTry) => {
    // bare directory
    if (fs.existsSync(pathToTry) && fs.lstatSync(pathToTry).isDirectory()) {
      pathToTry = `${pathToTry}/**/*`;
    }

    const filesUsingWorkingDirectory = tryPath(pathToTry, options.workingDirectory);
    if (filesUsingWorkingDirectory.length) {
      files = files.concat(filesUsingWorkingDirectory);
      return;
    }

    const filesUsingScriptDir = tryPath(pathToTry, options.scriptDirectory);
    if (filesUsingScriptDir.length) {
      files = files.concat(filesUsingScriptDir);
      return;
    }

    const filesUsingScriptAndWorkingDirectory = tryPath(pathToTry, path.join(options.workingDirectory, options.scriptDirectory));
    if (filesUsingScriptAndWorkingDirectory.length) {
      files = files.concat(filesUsingScriptAndWorkingDirectory);
      return;
    }
  });
  return files;
};

ScriptReader.parseFile = function (filename, options = {}) {
  const ext = options.extension || path.extname(filename);
  const parsers = options.parsers || ScriptReader.parsers;
  const lookupByStrippedExtension = (ext) => {
    const content = fs.readFileSync(filename, 'utf8');
    const minusDot = ext.substring(1);
    const fn = parsers[minusDot];
    return fn(content);
  };
  switch (ext) {
    case '.js':
      return require(filename);
    case '.json':
    case '.yml':
    case '.yaml':
      return lookupByStrippedExtension(ext);
    default:
      throw new TypeError(`Could not determine how to parse file based on extension '${ext}'`);
  }
};

ScriptReader.parseFiles = function (globs = [], options) {
  const files = ScriptReader.readFiles(globs, options);
  const results = {};
  files.forEach((filename) => {
    const content = ScriptReader.parseFile(filename, {
      extension: options.extension,
      parsers: options.parsers,
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

ScriptReader.schema = {
  type: 'object',
  properties: {
    parsers: {
      type: 'object',
      required: ['json', 'yml', 'yaml'],
    },
    scriptDirectory: {
      type: 'string',
    },
    workingDirectory: {
      type: 'string',
    },
  },
  required: ['parsers', 'scriptDirectory', 'workingDirectory'],
  additionalProperties: true,
};

module.exports = ScriptReader;
