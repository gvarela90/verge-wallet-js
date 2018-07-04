# Verge-js

A pure JavaScript Verge library.

## Installation
```bash
npm install git+https://github.com/Xourse/verge-wallet-js.git
```

## Usage
### Input fields specifications:
`amount` must be in verge amount not in satoshis nor bitcoins e.g. `1`, `5.5`, `10`.

### Private keys

Private keys must be an array of hex private keys (64 characters).
The private keys that must be included are the private keys corresponding to the addresses sent as input.

**Note:** `Sign` function must be the last function to be chained/called, since once this function is called verge-js starts to generate the raw transaction.

## Create transaction from 1 utxo

```javascript
const Transaction = require('verge-js');


const privateKeys = ['<private-key-for-address-input>'];

const inputs = [
  {
    txid: '<transaction-id>',
    vout: <vout>,
    amount: 5.5
    address: '<address>'
  },
];

try {
  const tx = new Transaction()
    .from(inputs)
    .to('<dst-address>', 2)
    .sign(privateKeys);
  const raw = tx.getRaw();
} catch (e) {
  console.log(e.message);
}
```

## Create transaction from N utxo

```javascript
const Transaction = require('verge-js');


const privateKeys = ['<private-key-for-address1-input>', '<private-key-for-address2-input>'];

const inputs = [
  {
    txid: '<transaction-id1>',
    vout: <vout>,
    amount: 5.5
    address: '<address1>'
  },
  {
    txid: '<transaction-id2>',
    vout: <vout>,
    amount: 10.3
    address: '<address2>'
  }
];

try {
  const tx = new Transaction()
    .from(inputs)
    .to('<dst-address>', 10.3)
    .sign(privateKeys);
  const raw = tx.getRaw();
} catch (e) {
  console.log(e.message);
}
```

## Create transaction using a change address

```javascript
const Transaction = require('verge-js');


const privateKeys = ['<private-key-for-address-input>'];

const inputs = [
  {
    txid: '<transaction-id>',
    vout: <vout>,
    amount: 5.5
    address: '<address>'
  },
];

try {
  const tx = new Transaction()
    .from(inputs)
    .to('<dst-address>', 2.4)
    .changeTo(<address-which-receive-the-change>)
    .sign(privateKeys);
  const raw = tx.getRaw();
} catch (e) {
  console.log(e.message);
}
```

## Create transaction using a customize fee

```javascript
const Transaction = require('verge-js');


const privateKeys = ['<private-key-for-address-input>'];

const inputs = [
  {
    txid: '<transaction-id>',
    vout: <vout>,
    amount: 10.9
    address: '<address>'
  },
];

try {
  const tx = new Transaction()
    .from(inputs)
    .to('<dst-address>', 7.2)
    .changeTo(<address-which-receive-the-change>)
    .setFee(1.5)
    .sign(privateKeys);
  const raw = tx.getRaw();
} catch (e) {
  console.log(e.message);
}
```

**Note:** Set a fee amount only works when a `changeTo` is used, since that when `changeTo` is not used the difference between inputs and outputs is taken as fee.

