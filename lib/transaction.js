'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var isArray = require('lodash/isArray');

var isUndefined = require('lodash/isUndefined');

var _signSerialize = require('./signSerialize');

var serialize = _signSerialize.serialize;
var sign = _signSerialize.sign;

var getKeysFromPrivate = require('./privateKey');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var COINS = 1000000;
var CENT = 10000;
// Value used for fee estimation (satoshis per kilobyte)
var FEE_PER_KB = 100000;
// Safe upper bound for change address script size in bytes
var MIN_RELAY_TX_FEE = 10 * CENT;
var MIN_TXOUT_AMOUNT = MIN_RELAY_TX_FEE;
var ERRORS = {
  signed: 'Transaction already signed',
  notFunds: 'Not enough funds',
  invalidUnspentValue: 'Unable to calculate the unspent value.',
  valueTooSmall: 'Send amount too small, min value allow ' + MIN_TXOUT_AMOUNT
};

var Transaction = function () {
  function Transaction(nTime) {
    _classCallCheck(this, Transaction);

    this.keysByAddress = {};
    this.nTime = Number(nTime || Math.floor(new Date().getTime() / 1000));
    this.raw = undefined;
    this.inputs = [];
    this.outputs = [];
    this.oChangeTo = undefined;
    this.fee = undefined;
  }

  _createClass(Transaction, [{
    key: 'checkSigned',
    value: function checkSigned() {
      if (!isUndefined(this.raw)) {
        throw ERRORS.signed;
      }
    }
  }, {
    key: 'checkFunds',
    value: function checkFunds() {
      var unspendValue = this.getUnspentValue();
      if (this.getUnspentValue() < 0) {
        throw ERRORS.notFunds;
      }

      var fee = this.getFee();
      var changeAmount = unspendValue - fee;
      if (changeAmount < 0) {
        throw new Error(ERRORS.notFunds + '. \nFEE=' + fee + ' \nUNSPENTVALUE=' + unspendValue + ' \nMISSING=' + Math.abs(changeAmount));
      }
    }
  }, {
    key: 'checkOutputsTotal',
    value: function checkOutputsTotal() {
      if (Transaction.getTotal(this.outputs) < MIN_TXOUT_AMOUNT) {
        throw ERRORS.valueTooSmall;
      }
    }
  }, {
    key: 'addChangeOutput',
    value: function addChangeOutput() {
      var fee = this.getFee();

      if (isUndefined(this.oChangeTo)) {
        fee = this.getUnspentValue();
      } else {
        var changeAmount = this.getUnspentValue() - fee;
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
  }, {
    key: 'prepareInputs',
    value: function prepareInputs(privateKeys) {
      var _this = this;

      privateKeys.forEach(function (privateKey) {
        var keys = getKeysFromPrivate(privateKey);
        _this.keysByAddress[keys.address] = keys;
      });

      this.inputs = this.inputs.map(function (input) {
        var keys = _this.keysByAddress[input.address];
        return _extends({}, input, {
          x_pubkeys: [keys.pub],
          pubkeys: [keys.pub]
        });
      });
    }
  }, {
    key: 'prepareTransaction',
    value: function prepareTransaction() {
      var _this2 = this;

      // 1. calculate fee, change and update outputs
      this.addChangeOutput();
      // 2. add signature
      this.inputs = this.inputs.map(function (input, i) {
        var forSig = serialize(_this2.inputs, _this2.outputs, i, _this2.nTime);
        return _extends({}, input, {
          signatures: [sign(forSig, _this2.keysByAddress[input.address])]
        });
      });
    }
  }, {
    key: 'getUnspentValue',
    value: function getUnspentValue() {
      var inputs = Transaction.getTotal(this.inputs);
      var outputs = Transaction.getTotal(this.outputs);
      var result = inputs - outputs;
      if (Number.isNaN(result)) {
        throw new Error(ERRORS.invalidUnspentValue);
      }
      return result;
    }
  }, {
    key: 'estimatedSize',
    value: function estimatedSize() {
      return Number(serialize(this.inputs, this.outputs, -1, this.nTime).length / 2);
    }
  }, {
    key: 'estimatedFee',
    value: function estimatedFee() {
      var estimatedSize = this.estimatedSize();
      var fee = Math.ceil(estimatedSize / 1000) * FEE_PER_KB;
      if (fee < MIN_RELAY_TX_FEE) {
        fee = MIN_RELAY_TX_FEE;
      }
      return fee;
    }
  }, {
    key: 'getFee',
    value: function getFee() {
      if (!isUndefined(this.fee)) {
        return this.fee;
      }

      return this.estimatedFee();
    }
  }, {
    key: 'from',
    value: function from(utxo) {
      var _this3 = this;

      this.checkSigned();
      var utxoList = isArray(utxo) ? utxo : [utxo];

      utxoList.forEach(function (input) {
        _this3.inputs.push({
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
  }, {
    key: 'to',
    value: function to(address, value) {
      this.checkSigned();
      if (!this.outputs.length) {
        this.outputs.push({
          address: address,
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
  }, {
    key: 'changeTo',
    value: function changeTo(address) {
      this.checkSigned();
      this.oChangeTo = address;
      return this;
    }
  }, {
    key: 'sign',
    value: function sign(privateKeys) {
      this.checkSigned();
      var privateKeyList = isArray(privateKeys) ? privateKeys : [privateKeys];
      this.prepareInputs(privateKeyList);
      this.checkFunds();
      this.prepareTransaction(privateKeyList);

      this.raw = serialize(this.inputs, this.outputs, undefined, this.nTime);
      return this;
    }
  }, {
    key: 'getRaw',
    value: function getRaw() {
      return this.raw;
    }
  }, {
    key: 'setFee',
    value: function setFee(fee) {
      this.fee = Transaction.valueFromUser(fee);
      return this;
    }
  }], [{
    key: 'valueFromUser',
    value: function valueFromUser(amount) {
      return amount * COINS;
    }
  }, {
    key: 'valueForUser',
    value: function valueForUser(amount) {
      return amount / COINS;
    }
  }, {
    key: 'getTotal',
    value: function getTotal(array) {
      var reducer = function reducer(accumulator, item) {
        return accumulator + item.value;
      };
      return array.reduce(reducer, 0);
    }
  }]);

  return Transaction;
}();

module.exports = Transaction;