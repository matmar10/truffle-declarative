'use strict';

const merge = require('deepmerge');
const Web3 = require('web3');

function noop(val) {
  return val;
}

const numberInputTypes = {
  bn: (val) => val.toString(),
  bignumber: (val) => val.toString(),
  date: (val) => Math.round(val.getTime() / 1000),
  string: Web3.utils.toBN
};

const bytesTypes = {
  string: Web3.utils.utf8ToHex
};

const defaults = {
  // input => {
  //   source type => conversion method
  // }
  address: {
    string: noop,
  },
  bool: {
    string: Boolean,
  },
  string: {
    string: noop,
  },
  uint: numberInputTypes,
  uint8: numberInputTypes,
  uint16: numberInputTypes,
  uint24: numberInputTypes,
  uint32: numberInputTypes,
  uint40: numberInputTypes,
  uint48: numberInputTypes,
  uint56: numberInputTypes,
  uint64: numberInputTypes,
  uint72: numberInputTypes,
  uint80: numberInputTypes,
  uint88: numberInputTypes,
  uint96: numberInputTypes,
  uint104: numberInputTypes,
  uint112: numberInputTypes,
  uint120: numberInputTypes,
  uint128: numberInputTypes,
  uint136: numberInputTypes,
  uint144: numberInputTypes,
  uint152: numberInputTypes,
  uint160: numberInputTypes,
  uint168: numberInputTypes,
  uint176: numberInputTypes,
  uint184: numberInputTypes,
  uint192: numberInputTypes,
  uint200: numberInputTypes,
  uint208: numberInputTypes,
  uint216: numberInputTypes,
  uint224: numberInputTypes,
  uint232: numberInputTypes,
  uint240: numberInputTypes,
  uint248: numberInputTypes,
  uint256: numberInputTypes,
  int: numberInputTypes,
  int8: numberInputTypes,
  int16: numberInputTypes,
  int24: numberInputTypes,
  int32: numberInputTypes,
  int40: numberInputTypes,
  int48: numberInputTypes,
  int56: numberInputTypes,
  int64: numberInputTypes,
  int72: numberInputTypes,
  int80: numberInputTypes,
  int88: numberInputTypes,
  int96: numberInputTypes,
  int104: numberInputTypes,
  int112: numberInputTypes,
  int120: numberInputTypes,
  int128: numberInputTypes,
  int136: numberInputTypes,
  int144: numberInputTypes,
  int152: numberInputTypes,
  int160: numberInputTypes,
  int168: numberInputTypes,
  int176: numberInputTypes,
  int184: numberInputTypes,
  int192: numberInputTypes,
  int200: numberInputTypes,
  int208: numberInputTypes,
  int216: numberInputTypes,
  int224: numberInputTypes,
  int232: numberInputTypes,
  int240: numberInputTypes,
  int248: numberInputTypes,
  int256: numberInputTypes,
  bytes1: bytesTypes,
  bytes2: bytesTypes,
  bytes3: bytesTypes,
  bytes4: bytesTypes,
  bytes5: bytesTypes,
  bytes6: bytesTypes,
  bytes7: bytesTypes,
  bytes8: bytesTypes,
  bytes9: bytesTypes,
  bytes10: bytesTypes,
  bytes11: bytesTypes,
  bytes12: bytesTypes,
  bytes13: bytesTypes,
  bytes14: bytesTypes,
  bytes15: bytesTypes,
  bytes16: bytesTypes,
  bytes17: bytesTypes,
  bytes18: bytesTypes,
  bytes19: bytesTypes,
  bytes20: bytesTypes,
  bytes21: bytesTypes,
  bytes22: bytesTypes,
  bytes23: bytesTypes,
  bytes24: bytesTypes,
  bytes25: bytesTypes,
  bytes26: bytesTypes,
  bytes27: bytesTypes,
  bytes28: bytesTypes,
  bytes29: bytesTypes,
  bytes30: bytesTypes,
  bytes31: bytesTypes,
  bytes32: bytesTypes,
};

module.exports = function (contractMethodType, typeTransformers) {
  const transformers = merge(defaults, typeTransformers);
  // override target type, if the global alias has been specified
  if (contractMethodType.match('bytes') && typeTransformers.bytes) {
    contractMethodType = 'bytes';
  } else if (contractMethodType.match('int') && typeTransformers.int) {
    contractMethodType = 'int';
  } else if (contractMethodType.match('uint') && typeTransformers.uint) {
    contractMethodType = 'uint';
  }

  const transformersForContractMethodType = transformers[contractMethodType];
  if (!transformersForContractMethodType) {
    throw new TypeError(`Unknown/unsupported type: ${contractMethodType}`);
  }

  return function (value) {

    // detect input type
    let inputType;
    if (value instanceof Date) {
      inputType = 'date';
    } else if (Web3.utils.isBN(value)) {
      inputType = 'bn';
    } else if (Web3.utils.isBigNumber(value)) {
      inputType = 'bignumber';
    } else {
      inputType = typeof value;
    }
    const fn = transformersForContractMethodType[inputType];
    return fn ? fn(value) : value;
  };
};
