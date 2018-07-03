import bitcore from 'bitcore-lib';
import { ec as ECSDA } from 'elliptic';

const coinData = {
	verge: {
		mainnet: {
			network_data: {
				name: 'verge/mainnet',
				alias: 'verge livenet',
				pubkeyhash: 0x1e,
				privatekey: 0xb3,
				scripthash: 0x21,
				xpubkey: 0x0488B21e,
				xprivkey: 0x0488ade4,
				wif: 0x9e,
			},
			bip44_id: 265
		}
	}
}


export default (privateKey, coin = 'verge') => {
	bitcore.Networks.add(coinData[coin]["mainnet"].network_data);
	const ec = new ECSDA('secp256k1');
	const vergePrivateKey = bitcore.PrivateKey(privateKey, 'verge/mainnet');
	const address = vergePrivateKey.toAddress();

	const key = ec.keyFromPrivate(privateKey, 'hex');
	return {
		xPub: key.getPublic(false, 'hex'),
		pub: key.getPublic(true, 'hex'),
		private: key.getPrivate('hex'),
		wif: vergePrivateKey.toWIF(),
		address: address,
		key: key
	};
};