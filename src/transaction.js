import isArray from 'lodash/isArray';
import isUndefined from 'lodash/isUndefined';
import {
  serialize,
  sign
} from './signSerialize';

import getKeysFromPrivate from './privateKey';

const COINS = 1000000;
const CENT = 10000;
// Value used for fee estimation (satoshis per kilobyte)
const FEE_PER_KB = 100000;
// Safe upper bound for change address script size in bytes
const MIN_RELAY_TX_FEE = 10 * CENT;
const MIN_TXOUT_AMOUNT = MIN_RELAY_TX_FEE;
const ERRORS = {
  signed: 'Transaction already signed',
  notFunds: 'Not enough funds',
  invalidUnspentValue: 'Unable to calculate the unspent value.',
  valueTooSmall: `Send amount too small, min value allow ${MIN_TXOUT_AMOUNT}`
};

export default class Transaction {
  constructor(nTime) {
    this.keysByAddress = {};
    this.nTime = Number(nTime || Math.floor((new Date()).getTime() / 1000));
    this.raw = undefined;
    this.inputs = [];
    this.outputs = [];
    this.oChangeTo = undefined;
    this.fee = undefined;
  }

  static valueFromUser(amount) {
    return amount * COINS;
  }

  static valueForUser(amount) {
    return amount / COINS;
  }

  static getTotal(array) {
    const reducer = (accumulator, item) => accumulator + item.value;
    return array.reduce(reducer, 0);
  }

  checkSigned() {
    if (!isUndefined(this.raw)) {
      throw (ERRORS.signed);
    }
  }

  checkFunds() {
    const unspendValue = this.getUnspentValue();
    if (this.getUnspentValue() < 0) {
      throw (ERRORS.notFunds);
    }

    const fee = this.getFee();
    const changeAmount = unspendValue - fee;
    if (changeAmount < 0) {
      throw new Error(`${ERRORS.notFunds}. \nFEE=${fee} \nUNSPENTVALUE=${unspendValue} \nMISSING=${Math.abs(changeAmount)}`);
    }
  }

  checkOutputsTotal() {
    if (Transaction.getTotal(this.outputs) < MIN_TXOUT_AMOUNT) {
      throw (ERRORS.valueTooSmall);
    }
  }

  addChangeOutput() {
    let fee = this.getFee();

    if (isUndefined(this.oChangeTo)) {
      fee = this.getUnspentValue();
    } else {
      let changeAmount = this.getUnspentValue() - fee;
      if (changeAmount > 0) {
        this.outputs.push({
          address: this.oChangeTo,
          value: changeAmount
        });

        // recompute fee including change output and check
        // if change amount is greater than 0
        fee = this.getFee();

        // remove change output in order to get the correct unspent amount
        this.outputs.pop();

        changeAmount = this.getUnspentValue() - this.getFee();
        if (changeAmount > 0) {
          this.outputs.push({
            address: this.oChangeTo,
            value: changeAmount
          });
        }
      }
    }

    this.fee = fee;
  }

  prepareInputs(privateKeys) {
    privateKeys.forEach((privateKey) => {
      const keys = getKeysFromPrivate(privateKey);
      this.keysByAddress[keys.address] = keys;
    });

    this.inputs = this.inputs.map((input) => {
      const keys = this.keysByAddress[input.address];
      return {
        ...input,
        ...{
          x_pubkeys: [keys.pub],
          pubkeys: [keys.pub]
        }
      };
    });
  }

  prepareTransaction() {
    // 1. calculate fee, change and update outputs
    this.addChangeOutput();
    // 2. add signature
    this.inputs = this.inputs.map((input, i) => {
      const forSig = serialize(this.inputs, this.outputs, i, this.nTime);
      return {
        ...input,
        ...{
          signatures: [sign(forSig, this.keysByAddress[input.address])]
        }
      };
    });
  }

  getUnspentValue() {
    const inputs = Transaction.getTotal(this.inputs);
    const outputs = Transaction.getTotal(this.outputs);
    const result = inputs - outputs;
    if (Number.isNaN(result)) {
      throw new Error(ERRORS.invalidUnspentValue);
    }
    return result;
  }

  estimatedSize() {
    return Number(serialize(this.inputs, this.outputs, -1, this.nTime).length / 2);
  }

  estimatedFee() {
    const estimatedSize = this.estimatedSize();
    let fee = Math.ceil(estimatedSize / 1000) * FEE_PER_KB;
    if (fee < MIN_RELAY_TX_FEE) {
      fee = MIN_RELAY_TX_FEE;
    }
    return fee;
  }

  getFee() {
    if (!isUndefined(this.fee)) {
      return this.fee;
    }

    return this.estimatedFee();
  }

  from(utxo) {
    this.checkSigned();
    const utxoList = isArray(utxo) ? utxo : [utxo];

    utxoList.forEach((input) => {
      this.inputs.push({
        signatures: [],
        address: input.address,
        prevout_n: input.vout || 0,
        prevout_hash: input.txid,
        value: Transaction.valueFromUser(input.value || input.amount),
        pubkeys: [],
        x_pubkeys: [],
        coinbase: false,
        num_sig: 1
      });
    });

    return this;
  }

  to(address, value) {
    this.checkSigned();
    if (!this.outputs.length) {
      this.outputs.push({
        address,
        value: Transaction.valueFromUser(value)
      });
      try {
        this.checkOutputsTotal();
      } catch (error) {
        this.outputs.pop();
        throw error;
      }
    }

    return this;
  }

  changeTo(address) {
    this.checkSigned();
    this.oChangeTo = address;
    return this;
  }

  sign(privateKeys) {
    this.checkSigned();
    const privateKeyList = isArray(privateKeys) ? privateKeys : [privateKeys];
    this.prepareInputs(privateKeyList);
    this.checkFunds();
    this.prepareTransaction(privateKeyList);

    this.raw = serialize(this.inputs, this.outputs, undefined, this.nTime);
    return this;
  }

  getRaw() {
    return this.raw;
  }

  setFee(fee) {
    this.fee = Transaction.valueFromUser(fee);
    return this;
  }
}
