// let Buffer = require('buffer').Buffer;
import coinstring from 'coinstring';
import crypto from 'crypto';
import { Buffer } from 'buffer';
import { ec as ECSDA } from 'elliptic';

String.prototype.rtrim = function () {
  return this.replace(/\s*$/g, "")
}

String.prototype.reverse = function () {
  let array = this.split("");
  array.reverse();
  return array.join('');
}

String.prototype.hexDecode = function () {
  var j;
  var hexes = this.match(/.{1,4}/g) || [];
  var back = "";
  for (j = 0; j < hexes.length; j++) {
    back += String.fromCharCode(parseInt(hexes[j], 16));
  }

  return back;
}

//AKA var_int
export const encodingLength = (number) => (
  number < 0xfd ? intToHex(number)
    : number <= 0xffff ? ['fd', intToHex(number, 2)].join('')
      : number <= 0xffffffff ? ['fe', intToHex(number, 6)].join('')
        : ['ff', intToHex(number, 8)].join('')
)

function OPpush(number) {
  return (
    number < 0x4c ? intToHex(number)
      : number <= 0xff ? ['4c', intToHex(number)].join('')
        : number <= 0xffff ? ['4d', intToHex(number, 2)].join('')
          : ['4e', intToHex(number, 4)].join('')
  )
}

export const pushScript = x => [OPpush(x.length / 2), x].join('');

export const intToHex = (i, length = 1) => {
  let s = (i).toString(16);
  let a = Array(2 * length - s.length).fill("0");
  a.push(s)
  s = a.join('')
  let buffer = new Buffer(s, "hex");
  return buffer.reverse().toString('hex');
}

export const getReverseHexFromString = str => {
  let buffer = new Buffer(str, "hex");
  return buffer.reverse().toString('hex');
}

export const inputScript = (txin, i, forSig) => {
  const getScriptFromSignatures = sigList => sigList.map(x => pushScript(x)).join('');

  const num_sig = 1;
  const address = txin['address'];
  const x_signatures = txin['signatures'];
  const signatures = x_signatures.filter(sig => !!sig)
  const isComplete = signatures.length === num_sig
  let script = ''

  if ([-1, undefined].includes(forSig)) {
    let pubkeys = txin['pubkeys'];
    let sigList;
    if (forSig === -1) {
      const initialSig = Array(0x48).fill("00").join('')
      sigList = Array(num_sig).fill(initialSig);
    } else if (isComplete) {
      sigList = signatures.map(sig => `${sig}01`);
    } else {
      throw ('Error')
    }
    script = getScriptFromSignatures(sigList);
    script += pushScript(pubkeys[0]);
  } else if (forSig === i) {
    script = payScript('address', address);
  }

  return script;
}

export const bcAddressToHash160 = address => {
  const base58 = coinstring.decode(address);
  const type = base58[0];
  const hash160 = base58.slice(1, 25);
  return [type, hash160.toString('hex')];
}

export const payScript = (output_type, address) => {
  if (output_type == 'script') {
    return address.encode('hex')
  }
  let script = '';
  const [addrtype, hash_160] = bcAddressToHash160(address)
  if (addrtype == 30) {
    script = '76a9'
    script += pushScript(hash_160)
    script += '88ac'
  } else if (addrtype == 33) {
    script = 'a9'
    script += pushScript(hash_160)
    script += '87'
  } else {
    throw ('No address type found');
  }

  return script
}

export const serialize = (inputs, outputs, forSig, nTime) => {
  const version = intToHex(1, 4);
  const sequence = 'ffffffff';
  const _time = nTime ? nTime : Math.floor((new Date()).getTime() / 1000);
  const time = intToHex(_time, 4);
  const inputsAmount = encodingLength(inputs.length);
  let hexResult = version + time + inputsAmount;
  inputs.forEach((input, i) => {
    const prevoutHash = getReverseHexFromString(input['prevout_hash']);
    const prevoutN = intToHex(input['prevout_n'], 4);
    const script = inputScript(input, i, forSig);
    const encodingLen = encodingLength(script.length / 2);

    hexResult += prevoutHash + prevoutN + encodingLen + script + sequence;
  });

  hexResult += encodingLength(outputs.length);
  outputs.forEach((output, i) => {
    const amount = intToHex(output.value, 8);
    const script = payScript('address', output.address);
    const encodingLen = encodingLength(script.length / 2);

    hexResult += amount + encodingLen + script;
  });

  hexResult += intToHex(0, 4);

  if (![undefined, -1].includes(forSig)) {
    // SIGHASH_ALL 0x01
    hexResult += intToHex(1, 4);
  }

  return hexResult;

}

const sha256 = function (buf) {
  return crypto.createHash('sha256').update(buf).digest();
};

const sha256sha256 = function (buf) {
  return sha256(sha256(buf));
};

export const signHex = (hex, keys) => {
  const key = keys.key;
  let hexBuffer = new Buffer(hex, "hex");
  const forSig = sha256sha256(hexBuffer);
  const signature = key.sign(forSig);
  const derSign = signature.toDER('hex');
  if (!key.verify(forSig, derSign)) {
    throw ('Invalid signature');
  }

  return derSign;
}

export const getKeysFromPrivate = privateKey => {
  const ec = new ECSDA('secp256k1');
  const key = ec.keyFromPrivate(privateKey, 'hex');
  return {
    xPubKey: key.getPublic(false, 'hex'),
    pubKey: key.getPublic(true, 'hex'),
    private: key.getPrivate('hex'),
    key: key
  };
}
