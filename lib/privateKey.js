'use strict';

var bitcore = require('bitcore-lib');

var _elliptic = require('elliptic');

var ECSDA = _elliptic.ec;


var coinData = {
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
        wif: 0x9e
      },
      bip44_id: 265
    }
  }
};

module.exports = function (privateKey) {
  var coin = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'verge';

  bitcore.Networks.add(coinData[coin].mainnet.network_data);
  var ec = new ECSDA('secp256k1');
  var vergePrivateKey = bitcore.PrivateKey(privateKey, 'verge/mainnet');
  var address = vergePrivateKey.toAddress();

  var key = ec.keyFromPrivate(privateKey, 'hex');
  return {
    xPub: key.getPublic(false, 'hex'),
    pub: key.getPublic(true, 'hex'),
    private: key.getPrivate('hex'),
    wif: vergePrivateKey.toWIF(),
    address: address,
    key: key
  };
};