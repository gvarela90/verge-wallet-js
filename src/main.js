import Transaction from './transaction';
let inputs = [
  {
    "signatures": [

    ],
    "address": "D9ZVWNQrxncYjWYzoxZyTybJM2MocidUCQ",
    "prevout_n": 0,
    "txtid": "0ed15d0a5338038f6af32bc3472cfb408383a90abe39cbd6c6acbb04f2076d27",
    "value": 500000
  }
];


const pubkey = '03ac078054517087ef36f0e18f10b398511981449319df869225bf6fc05847cf8c';
const privateKey = 'QSLrmXmAzPHPwjTp9Qzmk4FGsjLfbWVeFjZhacejr6mdbLHtBCnR';



// example with change
let tx = new Transaction(pubkey, privateKey);
tx
.from(inputs).to("DF6wLSFAsFry7TEB1G7KETW4cNJNP3uH1j", 350000)
.changeTo('D9ZVWNQrxncYjWYzoxZyTybJM2MocidUCQ')
.sign();

console.log(tx.getSignedHex());

console.log('\n');
// example without change, the difference between 500,000 and 35000 goes to fee
let tx2 = new Transaction(pubkey, privateKey);
tx2
.from(inputs).to("DF6wLSFAsFry7TEB1G7KETW4cNJNP3uH1j", 350000)
.sign();

console.log(tx2.getSignedHex());