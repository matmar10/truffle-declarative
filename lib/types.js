'use strict';

const merge = require('deepmerge');
const Web3 = require('Web3');

function noop(val) {
  return val;
}

function parseBool(val) {
  return Boolean(val);
}

const defaults = {
  // input => {
  //   source type => conversion method
  // }
  address: {
    string: noop,
  },
  bool: {
    string: parseBool,
  },
  string: {
    string: noop,
  },
  uint: { string: Web3.utils.toBN },
  uint8: { string: Web3.utils.toBN },
  uint16: { string: Web3.utils.toBN },
  uint24: { string: Web3.utils.toBN },
  uint32: { string: Web3.utils.toBN },
  uint40: { string: Web3.utils.toBN },
  uint48: { string: Web3.utils.toBN },
  uint56: { string: Web3.utils.toBN },
  uint64: { string: Web3.utils.toBN },
  uint72: { string: Web3.utils.toBN },
  uint80: { string: Web3.utils.toBN },
  uint88: { string: Web3.utils.toBN },
  uint96: { string: Web3.utils.toBN },
  uint104: { string: Web3.utils.toBN },
  uint112: { string: Web3.utils.toBN },
  uint120: { string: Web3.utils.toBN },
  uint128: { string: Web3.utils.toBN },
  uint136: { string: Web3.utils.toBN },
  uint144: { string: Web3.utils.toBN },
  uint152: { string: Web3.utils.toBN },
  uint160: { string: Web3.utils.toBN },
  uint168: { string: Web3.utils.toBN },
  uint176: { string: Web3.utils.toBN },
  uint184: { string: Web3.utils.toBN },
  uint192: { string: Web3.utils.toBN },
  uint200: { string: Web3.utils.toBN },
  uint208: { string: Web3.utils.toBN },
  uint216: { string: Web3.utils.toBN },
  uint224: { string: Web3.utils.toBN },
  uint232: { string: Web3.utils.toBN },
  uint240: { string: Web3.utils.toBN },
  uint248: { string: Web3.utils.toBN },
  uint256: { string: Web3.utils.toBN },
  int: { string: Web3.utils.toBN },
  int8: { string: Web3.utils.toBN },
  int16: { string: Web3.utils.toBN },
  int24: { string: Web3.utils.toBN },
  int32: { string: Web3.utils.toBN },
  int40: { string: Web3.utils.toBN },
  int48: { string: Web3.utils.toBN },
  int56: { string: Web3.utils.toBN },
  int64: { string: Web3.utils.toBN },
  int72: { string: Web3.utils.toBN },
  int80: { string: Web3.utils.toBN },
  int88: { string: Web3.utils.toBN },
  int96: { string: Web3.utils.toBN },
  int104: { string: Web3.utils.toBN },
  int112: { string: Web3.utils.toBN },
  int120: { string: Web3.utils.toBN },
  int128: { string: Web3.utils.toBN },
  int136: { string: Web3.utils.toBN },
  int144: { string: Web3.utils.toBN },
  int152: { string: Web3.utils.toBN },
  int160: { string: Web3.utils.toBN },
  int168: { string: Web3.utils.toBN },
  int176: { string: Web3.utils.toBN },
  int184: { string: Web3.utils.toBN },
  int192: { string: Web3.utils.toBN },
  int200: { string: Web3.utils.toBN },
  int208: { string: Web3.utils.toBN },
  int216: { string: Web3.utils.toBN },
  int224: { string: Web3.utils.toBN },
  int232: { string: Web3.utils.toBN },
  int240: { string: Web3.utils.toBN },
  int248: { string: Web3.utils.toBN },
  int256: { string: Web3.utils.toBN },
  bytes1: { string: Web3.utils.utf8ToHex },
  bytes2: { string: Web3.utils.utf8ToHex },
  bytes3: { string: Web3.utils.utf8ToHex },
  bytes4: { string: Web3.utils.utf8ToHex },
  bytes5: { string: Web3.utils.utf8ToHex },
  bytes6: { string: Web3.utils.utf8ToHex },
  bytes7: { string: Web3.utils.utf8ToHex },
  bytes8: { string: Web3.utils.utf8ToHex },
  bytes9: { string: Web3.utils.utf8ToHex },
  bytes10: { string: Web3.utils.utf8ToHex },
  bytes11: { string: Web3.utils.utf8ToHex },
  bytes12: { string: Web3.utils.utf8ToHex },
  bytes13: { string: Web3.utils.utf8ToHex },
  bytes14: { string: Web3.utils.utf8ToHex },
  bytes15: { string: Web3.utils.utf8ToHex },
  bytes16: { string: Web3.utils.utf8ToHex },
  bytes17: { string: Web3.utils.utf8ToHex },
  bytes18: { string: Web3.utils.utf8ToHex },
  bytes19: { string: Web3.utils.utf8ToHex },
  bytes20: { string: Web3.utils.utf8ToHex },
  bytes21: { string: Web3.utils.utf8ToHex },
  bytes22: { string: Web3.utils.utf8ToHex },
  bytes23: { string: Web3.utils.utf8ToHex },
  bytes24: { string: Web3.utils.utf8ToHex },
  bytes25: { string: Web3.utils.utf8ToHex },
  bytes26: { string: Web3.utils.utf8ToHex },
  bytes27: { string: Web3.utils.utf8ToHex },
  bytes28: { string: Web3.utils.utf8ToHex },
  bytes29: { string: Web3.utils.utf8ToHex },
  bytes30: { string: Web3.utils.utf8ToHex },
  bytes31: { string: Web3.utils.utf8ToHex },
  bytes32: { string: Web3.utils.utf8ToHex },
};

module.exports = function (targetType, types) {
  const transformers = merge(defaults, types);
  const transformersForSourceTypes = transformers[targetType];
  if (!transformersForSourceTypes) {
    throw new Error(`Unsupported input type: ${targetType}`);
  }

  // handle special case where we assume the alias for these to override
  // all length specific versions of the same type
  if (targetType.match('bytes') && types.bytes) {
    return types.bytes;
  }
  if (targetType.match('int') && types.int) {
    return types.int;
  }
  if (targetType.match('uint') && types.uint) {
    return types.uint;
  }

  return function (value) {
    const inputType = typeof value;
    const fn = transformersForSourceTypes[inputType];
    return fn ? fn(value) : value;
  };
};
