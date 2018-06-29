import Transaction from './transaction';
let inputs = [
  {
    "address": "DQD44a6m4u8rvngXMczDSf7C6gtsJBHsvt",
    "txtid": "4ae59f827e62a7224a305334420d5a574f02c975a5098092e520001d7135ea73",
    "value": 0.2
  }
];


const pubkey = '02be14282fe266c5740b09abf6b5c5c8873c101afcf6dd7917961f3ff2de4104f9';
const privateKey = 'CA7CB395F7BAFFABF2023DCAEBEDF8A14196748A6BBF149ACDF89DF868C6F5AE';



// example with change
let tx = new Transaction(privateKey);
tx
.from(inputs)
.to("D95upq8MqqRDGhQgCv1L92bi2ccqR3NP77", 0.1)
// .changeTo('DGeCok4UnibsTa5Tz6mPmyv35KD6CzzrSS')
.sign();

console.log(tx.getSignedHex());
console.log('\n');
// example without change, the difference between 500,000 and 35000 goes to fee
// let tx2 = new Transaction(privateKey);
// tx2
// .from(inputs)
// .to("DQD44a6m4u8rvngXMczDSf7C6gtsJBHsvt", 350000)
// .sign();

// console.log(tx2.getSignedHex());
// console.log('\n');
// // example with change and fee
// let tx3 = new Transaction(privateKey);
// tx3
// .from(inputs)
// .to("DQD44a6m4u8rvngXMczDSf7C6gtsJBHsvt", 350000)
// .fee(50000)
// .changeTo('DGeCok4UnibsTa5Tz6mPmyv35KD6CzzrSS')
// .sign();

// console.log(tx3.getSignedHex());