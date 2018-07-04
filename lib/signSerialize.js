'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var coinstring = require('coinstring');

var crypto = require('crypto');

var _buffer = require('buffer');

var Buffer = _buffer.Buffer;

var privateKey = require('./privateKey');

var intToHex = function intToHex(i) {
  var length = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;

  var s = i.toString(16);
  var a = Array(2 * length - s.length).fill('0');
  a.push(s);
  s = a.join('');
  var buffer = Buffer.from(s, 'hex');
  return buffer.reverse().toString('hex');
};

// AKA var_int
var encodingLength = function encodingLength(number) {
  if (number < 0xfd) {
    return intToHex(number);
  }
  if (number <= 0xffff) {
    return ['fd', intToHex(number, 2)].join('');
  }
  if (number <= 0xffffffff) {
    return ['fe', intToHex(number, 6)].join('');
  }
  return ['ff', intToHex(number, 8)].join('');
};

var sha256 = function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest();
};

var sha256sha256 = function sha256sha256(buf) {
  return sha256(sha256(buf));
};

var pushScript = function pushScript(x) {
  var hex = void 0;
  var size = x.length / 2;

  if (size < 0x4c) {
    hex = intToHex(size);
  } else if (size <= 0xff) {
    hex = ['4c', intToHex(size)].join('');
  } else if (size <= 0xffff) {
    hex = ['4d', intToHex(size, 2)].join('');
  } else {
    hex = ['4e', intToHex(size, 4)].join('');
  }

  return [hex, x].join('');
};

var getReverseHexFromString = function getReverseHexFromString(str) {
  var buffer = Buffer.from(str, 'hex');
  return buffer.reverse().toString('hex');
};

var bcAddressToHash160 = function bcAddressToHash160(address) {
  var base58 = coinstring.decode(address);
  var type = base58[0];
  var hash160 = base58.slice(1, 25);
  return [type, hash160.toString('hex')];
};

var payScript = function payScript(outputType, address) {
  if (outputType === 'script') {
    return address.encode('hex');
  }
  var script = '';

  var _bcAddressToHash = bcAddressToHash160(address),
      _bcAddressToHash2 = _slicedToArray(_bcAddressToHash, 2),
      addrtype = _bcAddressToHash2[0],
      hash160 = _bcAddressToHash2[1];

  if (addrtype === 30) {
    script = '76a9';
    script += pushScript(hash160);
    script += '88ac';
  } else if (addrtype === 33) {
    script = 'a9';
    script += pushScript(hash160);
    script += '87';
  } else {
    throw new Error('No address type found');
  }

  return script;
};

var inputScript = exports.inputScript = function inputScript(txin, i, forSig) {
  /*
    forSig:
      -1   : do not sign, estimate length
       i>=0 : serialized tx for signing input i
       undefined : add all known signatures
  */
  var getScriptFromSignatures = function getScriptFromSignatures(sigList) {
    return sigList.map(function (x) {
      return pushScript(x);
    }).join('');
  };

  var numSig = 1;
  var address = txin.address;

  var xSignatures = txin.signatures;
  var signatures = xSignatures.filter(function (sig) {
    return !!sig;
  });
  var isComplete = signatures.length === numSig;
  var script = '';

  if ([-1, undefined].includes(forSig)) {
    var pubkeys = txin.pubkeys;

    var sigList = void 0;
    if (forSig === -1) {
      var initialSig = Array(0x48).fill('00').join('');
      sigList = Array(numSig).fill(initialSig);
    } else if (isComplete) {
      sigList = signatures.map(function (sig) {
        return sig + '01';
      });
    } else {
      throw new Error('Error');
    }
    script = getScriptFromSignatures(sigList);
    script += pushScript(pubkeys[0]);
  } else if (forSig === i) {
    script = payScript('address', address);
  }

  return script;
};

var serialize = exports.serialize = function serialize(inputs, outputs, forSig, nTime) {
  var version = intToHex(1, 4);
  var sequence = 'ffffffff';
  var time = nTime || Math.floor(new Date().getTime() / 1000);
  time = intToHex(time, 4);
  var inputsAmount = encodingLength(inputs.length);
  var hexResult = version + time + inputsAmount;
  inputs.forEach(function (input, i) {
    var prevoutHash = getReverseHexFromString(input.prevout_hash);
    var prevoutN = intToHex(input.prevout_n, 4);
    var script = inputScript(input, i, forSig);
    var encodingLen = encodingLength(script.length / 2);

    hexResult += prevoutHash + prevoutN + encodingLen + script + sequence;
  });

  hexResult += encodingLength(outputs.length);
  outputs.forEach(function (output) {
    var amount = intToHex(output.value, 8);
    var script = payScript('address', output.address);
    var encodingLen = encodingLength(script.length / 2);

    hexResult += amount + encodingLen + script;
  });

  hexResult += intToHex(0, 4);

  if (![undefined, -1].includes(forSig)) {
    // SIGHASH_ALL 0x01
    hexResult += intToHex(1, 4);
  }

  return hexResult;
};

var sign = exports.sign = function sign(hex, keys) {
  var key = keys.key;

  var hexBuffer = Buffer.from(hex, 'hex');
  var forSig = sha256sha256(hexBuffer);
  var signature = key.sign(forSig);
  var derSign = signature.toDER('hex');
  if (!key.verify(forSig, derSign)) {
    throw new Error('Invalid signature');
  }

  return derSign;
};

var getKeysFromPrivate = exports.getKeysFromPrivate = function getKeysFromPrivate(key) {
  return privateKey(key);
};