import {
  intToHex,
  encodingLength,
  getReverseHexFromString,
  bcAddressToHash160,
  inputScript,
  payScript,
  serialize,
  signHex,
  createSignedTransaction
} from './helpers';
//"3045022044976c70874739a3a24e64e7a7fced7d58cfc732adf26e3ff2c1cd2eeb2a102a022100cdbf3a4badfd7f42002bd2834b3417f73e4e1a372e81b428cc5246be9636e15d"
let inputs = [
  {
    "signatures": [

    ],
    "address": "D9ZVWNQrxncYjWYzoxZyTybJM2MocidUCQ",
    "prevout_n": 0,
    "txtid": "0ed15d0a5338038f6af32bc3472cfb408383a90abe39cbd6c6acbb04f2076d27",
    "value": 50000
  }
];

const _to = [{
  "address": "DF6wLSFAsFry7TEB1G7KETW4cNJNP3uH1j",
  "amount": 200
}, {
  "address": "D9ZVWNQrxncYjWYzoxZyTybJM2MocidUCQ",
  "amount": 4800
}]

const pubkey = '03ac078054517087ef36f0e18f10b398511981449319df869225bf6fc05847cf8c';
const privateKey = 'QSLrmXmAzPHPwjTp9Qzmk4FGsjLfbWVeFjZhacejr6mdbLHtBCnR';
// const xpubke = 'ff0488b21e0000000000000000008f21d7a6efcde6f62a6d85635dea90f99753e3e76190901f69f83d63a90958c503f7ae4a2c967e5d8bb29451898ce995cd734f1f024d1ddc132ec2498b24f81f5800000000'
// const version = intToHex(1, 4);
// const time = intToHex(Math.floor(Date.now() / 1000), 4)
// const inputs = encodingLength(1)
// const prevoutHash = getReverseHexFromString('0ed15d0a5338038f6af32bc3472cfb408383a90abe39cbd6c6acbb04f2076d27');
// const prevoutN = intToHex(0, 4);


// console.log(bcAddressToHash160('DF6wLSFAsFry7TEB1G7KETW4cNJNP3uH1j'));
// console.log(bcAddressToHash160('D9ZVWNQrxncYjWYzoxZyTybJM2MocidUCQ'));

// console.log(intToHex(1, 4))  // 01000000
// console.log(intToHex(1529908971, 4))
// console.log(prevoutHash);
// console.log(prevoutN);
// console.log(inputScript(_inputs[0], undefined))
// console.log(payScript('address', 'DF6wLSFAsFry7TEB1G7KETW4cNJNP3uH1j'))
// console.log(payScript('address', 'D9ZVWNQrxncYjWYzoxZyTybJM2MocidUCQ'))

/*
const x_pubkey = "ff0488b21e0000000000000000008f21d7a6efcde6f62a6d85635dea90f99753e3e76190901f69f83d63a90958c503f7ae4a2c967e5d8bb29451898ce995cd734f1f024d1ddc132ec2498b24f81f5800000000";

const pubkey = '03ac078054517087ef36f0e18f10b398511981449319df869225bf6fc05847cf8c';

 */



console.log(createSignedTransaction(
  inputs, _to, pubkey, privateKey
))
//  inputs = inputs.map( input => {
//    input = {
//      ...input,
//      ...{
//        pubkeys: [pubkey],
//        coinbase: false,
//        num_sig: 1
//      }
//    };
//   return input;
//  })

//  inputs.forEach( (input, i) => {
//   const forSig = serialize(inputs, _to, i);
//   input['signatures'] = [signHex(forSig, privateKey)];
//  });

// //  console.log(inputs);
// const hex = serialize(inputs, _to, undefined);
// //  const hex = "01000000a97a325b01276d07f204bbacc6d6cb39be0aa9838340fb2c47c32bf36a8f0338530a5dd10e000000001976a914307da8919a8822c4a9439e748e091c060b8e224f88acffffffff02c8000000000000001976a9146d48be315809d4b09c41ea49d5b7515e584d04b788ac88c20000000000001976a914307da8919a8822c4a9439e748e091c060b8e224f88ac0000000001000000"

//  console.log(signHex(hex, privateKey));