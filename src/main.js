
import ElectrumClient from 'electrum-client';
import Transaction from './transaction';

let inputs = [
  {
    "address": "DQD44a6m4u8rvngXMczDSf7C6gtsJBHsvt",
    "txtid": "4ae59f827e62a7224a305334420d5a574f02c975a5098092e520001d7135ea73",
    "value": 0.2
  }
];

const pubkey = '02be14282fe266c5740b09abf6b5c5c8873c101afcf6dd7917961f3ff2de4104f9';
const privateKey = '6Kfo8ouxqHuiY5bd2hKWsdeSV3csHCe6Ahrn4K3XGj6s9YhdXy4';

let tx = new Transaction(privateKey);
tx
  .from(inputs)
  .to("D95upq8MqqRDGhQgCv1L92bi2ccqR3NP77", 0.1)
  .sign();


const raw = tx.getSignedHex()

console.log(`RAW TX: ${raw}:`);

const main = async () => {
    console.log('begin connection');
    const ecl = new ElectrumClient(50001, "electrum-verge.xyz", 'tcp')
    await ecl.connect()
    try{
        const ver = await ecl.server_version("2.7.11", "1.0")
        console.log(ver)
        const balance = await ecl.blockchainAddress_getBalance(inputs[0].address)
        console.log("balance", balance);
        const unspent = await ecl.blockchainAddress_listunspent(inputs[0].address)
        console.log("unspent", unspent);
        const transaction = await ecl.blockchainTransaction_getDecoded(inputs[0].txtid)
        console.log("transaction", transaction);
        const broadcast = await ecl.blockchainTransaction_broadcast(raw);
        console.log(broadcast);
    }catch(e){
        console.log(e)
    }
    await ecl.close()
}
main().catch(console.log)

