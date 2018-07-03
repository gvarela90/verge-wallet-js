import isArray from 'lodash/isArray';
import isUndefined from 'lodash/isUndefined';
import {
  intToHex,
  encodingLength,
  getReverseHexFromString,
  bcAddressToHash160,
  inputScript,
  payScript,
  serialize,
  signHex,
  getKeysFromPrivate,
  createSignedTransaction
} from './helpers';

const COINS = 1000000;
const CENT = 10000;
// Value used for fee estimation (satoshis per kilobyte)
const FEE_PER_KB = 100000;
// Safe upper bound for change address script size in bytes
const MIN_RELAY_TX_FEE = 10 * CENT;

const MIN_TXOUT_AMOUNT = MIN_RELAY_TX_FEE;

const ERRORS = {
  signed: 'Transaction already signed'
}

export default class Transaction {
  constructor(nTime) {
    this.keysByAddress = {};//getKeysFromPrivate(privateKey);
    this.nTime =  parseInt(nTime ? parseInt(nTime) : Math.floor((new Date()).getTime() / 1000));
    this.raw = undefined;
    this.inputs = [];
    this.outputs = [];
    this._to = {};
    this._changeTo = undefined;
    this._fee = undefined;
  }

  _valueFromUser(amount) {
    return amount * COINS;
  }

  _valueForUser(amount) {
    return amount / COINS;
  }

  _checkSigned() {
    if (!isUndefined(this.raw)) {
      throw (ERRORS.signed);
    }
  }

  _checkFunds() {
    const unspendValue = this._getUnspentValue();
    if (this._getUnspentValue() < 0) {
      throw ('Not enough funds');
    }

    let fee = this._getFee();
    const changeAmount = unspendValue - fee;
    if (changeAmount < 0){
      throw (`Not enough funds. \nFEE=${fee} \nUNSPENTVALUE=${unspendValue} \nMISSING=${Math.abs(changeAmount)}`);
    }


  }

  _checkOutputsTotal() {
    if (this._getTotal(this.outputs) < MIN_TXOUT_AMOUNT) {
      throw (`Send amount too small, min value allow ${MIN_TXOUT_AMOUNT}`);
    }
  }

  _addChangeOutput() {
    let fee = this._getFee();
    
    if (!isUndefined(this._changeTo)) {
      let changeAmount = this._getUnspentValue() - fee;
      if (changeAmount > 0) {
        this.outputs.push({
          address: this._changeTo,
          value: changeAmount
        });

        // recompute fee including change output and check 
        // if change amount is greater than 0
        fee = this._getFee();

        // remove change output in order to get the correct unspent amount
        this.outputs.pop();

        changeAmount = this._getUnspentValue() - this._getFee();
        if (changeAmount > 0) {
          this.outputs.push({
            address: this._changeTo,
            value: changeAmount
          });
        }
      }
    }
    this._fee = fee;
  }

  _prepareInputs(privateKeys){
    privateKeys.forEach(privateKey => { 
      const keys = getKeysFromPrivate(privateKey);
      this.keysByAddress[keys.address] = keys;
    });

    this.inputs.forEach((input, i) => {
      const keys = this.keysByAddress[input['address']];
      input['x_pubkeys'] = [keys.pub];
      input['pubkeys'] = [keys.pub];
    });
  }

  _prepareTransaction() {
    // 1. calculate fee, change and update outputs
    this._addChangeOutput();
    // 2. add signature
    this.inputs.forEach((input, i) => {
      const forSig = serialize(this.inputs, this.outputs, i, this.nTime);
      input['signatures'] = [signHex(forSig, this.keysByAddress[input['address']])];
    });
  }


  _getTotal(array) {
    const reducer = (accumulator, item) => accumulator + item.value;
    return array.reduce(reducer, 0)
  }

  _getUnspentValue() {
    const inputs = this._getTotal(this.inputs);
    const outputs = this._getTotal(this.outputs);
    return inputs - outputs;
  }

  _estimatedSize() {
    return parseInt(serialize(this.inputs, this.outputs, -1, this.nTime).length / 2);
  }

  _estimatedFee() {
    const estimatedSize = this._estimatedSize();
    let fee = Math.ceil(estimatedSize / 1000) * FEE_PER_KB;
    if (fee < MIN_RELAY_TX_FEE) {
      fee = MIN_RELAY_TX_FEE
    }
    return fee;
  }

  _getFee() {
    if (!isUndefined(this._fee)) {
      return this._fee;
    }

    // if (isUndefined(this._changeTo)) {
    //   return this._getUnspentValue();
    // }

    return this._estimatedFee();
  }

  from(utxo) {
    this._checkSigned();
    if (!isArray(utxo)) {
      utxo = [utxo];
    }

    utxo.forEach(input => {
      this.inputs.push({
        signatures: [],
        address: input.address,
        prevout_n: input.vout || 0,
        prevout_hash: input.txid,
        value: this._valueFromUser(input.value),
        pubkeys: [],
        x_pubkeys: [],
        coinbase: false,
        num_sig: 1
      });
    });

    return this;

  }
  to(address, value) {
    this._checkSigned();
    if (!this.outputs.length) {
      value = this._valueFromUser(value);
      this.outputs.push({
        address,
        value
      });
      try {
        this._checkOutputsTotal();
      } catch (error) {
        this.outputs.pop();
        throw error;
      }
    }

    return this;
  }
  changeTo(address) {
    this._checkSigned();
    this._changeTo = address;
    return this;
  }
  sign(privateKeys) {
    this._checkSigned();
    if (!isArray(privateKeys)) {
      privateKeys = [privateKeys];
    }
    this._prepareInputs(privateKeys);
    this._checkFunds();
    this._prepareTransaction(privateKeys);

    this.raw = serialize(this.inputs, this.outputs, undefined, this.nTime);
    return this;
  }
  getSignedHex() {
    return this.raw;
  }
  fee(fee) {
    this._fee = fee;
    return this;
  }
}