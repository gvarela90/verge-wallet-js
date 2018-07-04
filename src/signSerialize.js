import coinstring from 'coinstring';
import crypto from 'crypto';
import { Buffer } from 'buffer';
import privateKey from './privateKey';

const intToHex = (i, length = 1) => {
  let s = i.toString(16);
  const a = Array(2 * length - s.length).fill('0');
  a.push(s);
  s = a.join('');
  const buffer = Buffer.from(s, 'hex');
  return buffer.reverse().toString('hex');
};

// AKA var_int
const encodingLength = (number) => {
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

const sha256 = buf => crypto.createHash('sha256').update(buf).digest();

const sha256sha256 = buf => sha256(sha256(buf));

const pushScript = (x) => {
  let hex;
  const size = x.length / 2;

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

const getReverseHexFromString = (str) => {
  const buffer = Buffer.from(str, 'hex');
  return buffer.reverse().toString('hex');
};

const bcAddressToHash160 = (address) => {
  const base58 = coinstring.decode(address);
  const type = base58[0];
  const hash160 = base58.slice(1, 25);
  return [type, hash160.toString('hex')];
};

const payScript = (outputType, address) => {
  if (outputType === 'script') {
    return address.encode('hex');
  }
  let script = '';
  const [addrtype, hash160] = bcAddressToHash160(address);
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

export const inputScript = (txin, i, forSig) => {
  /*
    forSig:
      -1   : do not sign, estimate length
       i>=0 : serialized tx for signing input i
       undefined : add all known signatures
  */
  const getScriptFromSignatures = sigList => sigList.map(x => pushScript(x)).join('');

  const numSig = 1;
  const { address } = txin;
  const xSignatures = txin.signatures;
  const signatures = xSignatures.filter(sig => !!sig);
  const isComplete = signatures.length === numSig;
  let script = '';

  if ([-1, undefined].includes(forSig)) {
    const { pubkeys } = txin;
    let sigList;
    if (forSig === -1) {
      const initialSig = Array(0x48)
        .fill('00')
        .join('');
      sigList = Array(numSig).fill(initialSig);
    } else if (isComplete) {
      sigList = signatures.map(sig => `${sig}01`);
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

export const serialize = (inputs, outputs, forSig, nTime) => {
  const version = intToHex(1, 4);
  const sequence = 'ffffffff';
  let time = nTime || Math.floor(new Date().getTime() / 1000);
  time = intToHex(time, 4);
  const inputsAmount = encodingLength(inputs.length);
  let hexResult = version + time + inputsAmount;
  inputs.forEach((input, i) => {
    const prevoutHash = getReverseHexFromString(input.prevout_hash);
    const prevoutN = intToHex(input.prevout_n, 4);
    const script = inputScript(input, i, forSig);
    const encodingLen = encodingLength(script.length / 2);

    hexResult += prevoutHash + prevoutN + encodingLen + script + sequence;
  });

  hexResult += encodingLength(outputs.length);
  outputs.forEach((output) => {
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
};

export const sign = (hex, keys) => {
  const { key } = keys;
  const hexBuffer = Buffer.from(hex, 'hex');
  const forSig = sha256sha256(hexBuffer);
  const signature = key.sign(forSig);
  const derSign = signature.toDER('hex');
  if (!key.verify(forSig, derSign)) {
    throw new Error('Invalid signature');
  }

  return derSign;
};

export const getKeysFromPrivate = key => privateKey(key);
