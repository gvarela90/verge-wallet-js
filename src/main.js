import Transaction from "./transaction";

const privateKey = ['ca7cb395f7baffabf2023dcaebedf8a14196748a6bbf149acdf89df868c6f5ae'];
// D95upq8MqqRDGhQgCv1L92bi2ccqR3NP77:b9f373f8e1b8824f6f0cf65315bcbe2d11154b10014150ce572c050b05dacfd5
// DQD44a6m4u8rvngXMczDSf7C6gtsJBHsvt:ca7cb395f7baffabf2023dcaebedf8a14196748a6bbf149acdf89df868c6f5ae
// D8CxB96MkFz25jSrvhaf8M4MCx9XovpMr5:5f3da7ee0ceed5d51258b3f8661ebff58ddabc7f69c50c482875cc641f3978e8
// DQYQLYum6wstk4Lq1uTvFxSTosa6fcHLrL:1a326896e5db6aa3459d9a4eb4219205677ef81f12645a111d6c243f18855aed

let inputs = [
  {
    txid: "7d15c4e2c35a911b5ae7df2e7775107907f2b68ae08d686b698cf38fe32f57dd",
    vout: 1,
    amount: 10.1,
    address: "DQD44a6m4u8rvngXMczDSf7C6gtsJBHsvt"
  },
];

let tx = new Transaction()
  .from(inputs)
  .to("D95upq8MqqRDGhQgCv1L92bi2ccqR3NP77", 1)
  .changeTo("DQD44a6m4u8rvngXMczDSf7C6gtsJBHsvt")
  .fee(0.5)
  .sign(privateKey);

const x = tx.getSignedHex();

// console.log(tx._getFee())
console.log(`VERGEd decoderawtransaction ${x}`);
console.log("\n");
console.log(`VERGEd sendrawtransaction ${x}`);
