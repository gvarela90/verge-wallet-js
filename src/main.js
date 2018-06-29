import Transaction from './transaction';
let inputs = [
  {
    "address": "D95upq8MqqRDGhQgCv1L92bi2ccqR3NP77",
    "txtid": "c0f303f942ec355b5302e122f5daac9a52fd5411a7e916b0377596cf22727738",
    "value": 7.5
  }
];


const pubkey = '02be14282fe266c5740b09abf6b5c5c8873c101afcf6dd7917961f3ff2de4104f9';
const privateKey = '17e30544ee1aaa861e761a2ef2dbdff903cb026abaa9aa1b86894123d9f082ef';



// example with change
let tx = new Transaction(privateKey);
tx
.from(inputs)
.to("DQD44a6m4u8rvngXMczDSf7C6gtsJBHsvt", 0.2)
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