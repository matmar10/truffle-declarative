'use strict';

const TruffleDeclarative = require('./');

// const run = new TruffleDeclarative();

const Command = require('./lib/command');

const state = {
  $inputs: {
    address1: '0x1f9c410d5562bb6590b8f891f2e26311f9a6ef8c',
    gasPrice: 11e9
  },
  $outputs: {},
  $contracts: {
    SafeMathLib: { name: 'SafeMathLib' }
  }
};

[{
  description: 'Deploy a new version of SafeMathLib',
  contract: 'SafeMathLib',
  run: 'new',
  inputs: [{
    from: '$inputs.address1',
    gasPrice: '$inputs.gasPrice',
  }],
  outputs: ['safeMathLib', 'anotherThing', {
    address: 'some.deep.nested.property'
  }]
  // outputs: {
  //   address: '$outputs.safeMathLib'
  // }
// }, {
//   description: 'Link IDRP to new SafeMathLib',
//   contract: 'IDRP',
//   run: 'link',
//   inputs: ['$contracts.SafeMathLib', {
//     from: '0x1f9c410d5562bb6590b8f891f2e26311f9a6ef8c',
//   }],
//   outputs: {
//     address: 'idrp'
//   }
// }, {
//   description: 'Deploy new CouponStorage',
//   contract: 'CouponStorage',
//   run: 'new',
//   inputs: [{
//     safeMathLib: '$outputs.safeMathLib',
//     stableCoin: '$outputs.idrp',
//     initialSupply: 1e30,
//   }, {
//     from: '0x1f9c410d5562bb6590b8f891f2e26311f9a6ef8c',
//   }],
//   outputs: {
//     address: 'couponStorage'
//   }
// }, {
//   description: 'Check CouponStorage balance for wallet #1.',
//   contract: 'CouponStorage',
//   at: '$outputs.couponStorage',
//   run: 'balanceOf',
//   inputs: ['0x1f9c410d5562bb6590b8f891f2e26311f9a6ef8c'],
//   outputs: 'balanceOfWallet1'
}].forEach(item => {
  const c = new Command(item);
  const inputs = c.getInputs(state);
  c.writeOutputs({
    name: 'SomeContract',
    address: 'someaddress',
    doMethod: function() {
      console.log('Dodo!');
    }
  }, state);
  console.log(state);
  // console.log('Inputs: ', inputs);
});
