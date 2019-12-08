# truffle-declarative

Run complex playbooks of blockchain scripts using simple declarative syntax

## Command Line

```Bash

./node_modules/.bin/truffle-play 

```


## Programmatic

```JavaScript

const TruffleDeclarative = require('truffle-declarative');
const run = new TruffleDeclarative({
  output: 'results.yml',
  networkName: 'development',
  dryRun: true
});

const results = await run([{
  description: 'Deploy a new version of SafeMathLib',
  contract: 'SafeMathLib',
  run: 'new',
  inputs: [{
    from: '0x1f9c410d5562bb6590b8f891f2e26311f9a6ef8c',
    gasPrice: 11e9,
  }],
  outputs: {
    'address': 'safeMathLib'
  }
}, {
  description: 'Link IDRP to new SafeMathLib',
  contract: 'IDRP',
  run: 'link',
  inputs: ['$contracts.SafeMathLib', {
    from: '0x1f9c410d5562bb6590b8f891f2e26311f9a6ef8c',
  }],
  outputs: {
    'address': 'idrp'
  }
}, {
  description: 'Deploy new CouponStorage',
  contract: 'CouponStorage',
  run: 'new',
  inputs: [{    
    safeMathLib: '$outputs.safeMathLib',
    stableCoin: '$outputs.idrp',
    initialSupply: 1e30,
  }, {
    from: '0x1f9c410d5562bb6590b8f891f2e26311f9a6ef8c',
  }],
  outputs: {
    'address': 'couponStorage'
  }
}, {
  description: 'Check CouponStorage balance for wallet #1.',
  contract: 'CouponStorage',
  at: '$outputs.couponStorage',
  run: 'balanceOf',
  inputs: ['0x1f9c410d5562bb6590b8f891f2e26311f9a6ef8c'],
  outputs: 'balanceOfWallet1'
}]);
```
