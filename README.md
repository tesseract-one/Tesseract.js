# Tesseract dApps Platform SDK for JavaScript
[![GitHub license](https://img.shields.io/badge/license-Apache%202.0-lightgrey.svg)](https://raw.githubusercontent.com/tesseract-one/Tesseract.js/master/LICENSE)
[![Build Status](https://travis-ci.com/tesseract-one/Tesseract.js.svg?branch=master)](https://travis-ci.com/tesseract-one/Tesseract.js)
[![GitHub release](https://img.shields.io/github/release/tesseract-one/Tesseract.js.svg)](https://github.com/tesseract-one/Tesseract.js/releases)
[![npm version](https://img.shields.io/npm/v/%40tesseractjs/core.svg)](https://www.npmjs.com/package/%40tesseractjs/core)

## Getting started

To use this library compatible wallet should be installed on the mobile device.

We released our own [Tesseract Wallet](https://itunes.apple.com/us/app/tesseract-wallet/id1459505103) as reference wallet implementation.
Install it on your device to check provided examples.

### Installation

```sh
npm install --save @tesseractjs/ethereum-web3 web3
```

This command will install latest Tesseract Ethereum Web3 library and Web3.js

#### Web3 Initialization
```js
import { Tesseract, Network } from '@tesseractjs/ethereum-web3';

// Configuring RPC urls for the library. They will be used in mobile browsers or in read-only mode.
Tesseract.Ethereum.Web3.rpcUrls = {
  [Network.Main]: 'https://mainnet.infura.io/v3/{API-KEY}'
}

// Creating Web3 instance. Try to reuse existing instance of Web3 in your app.
const web3 = await Tesseract.Ethereum.Web3(Network.Main);
```

### Hello Tesseract, hello Web3.

Let's try to get Ethereum account balance.

```js
import { Tesseract, Network } from '@tesseractjs/ethereum-web3';

// Configuring RPC urls for the library. They will be used in mobile browsers or in read-only mode.
Tesseract.Ethereum.Web3.rpcUrls = {
  [Network.Main]: 'https://mainnet.infura.io/v3/{API-KEY}'
}

// Creating Web3 instance. Try to reuse existing instance of Web3 in your app.
const web3 = await Tesseract.Ethereum.Web3(Network.Main);

// We can use read-only methods if Tesseract can't connect to a Wallet.
if (!web3.hasClientWallet) {
    console.log("Web3 doesn't have client wallet. Can work in read-only mode");
    return;
}

// Obtaining account from the Wallet
const accounts = await web3.eth.getAccounts();

// Obtaining balance from the network
const balance = await web3.eth.getBalance(accounts[0]);

// Printing
console.log("Account:", accounts[0], "has balance:", balance);
```

### More Examples

For more examples and Web3 documentation check [Web3.js](https://github.com/ethereum/web3.js) library used inside.

## Ideology behind

[Tesseract dApps Platform](https://tesseract.one) emerged from one simple vision - dApps should not store Private Keys inside.

With this vision we created Mobile-first platform. It allows app developers to write Native dApps and leave all key storage security tasks to Wallet developers.

We started with open protocol, which describes Wallet <-> dApp communication. It's called [Open Wallet](https://github.com/tesseract-one/OpenWalletProtocol).

This SDK can interact with any Wallet which implemented this protocol. Ask your preferred Wallet to implement it :)

## Author

 - [Tesseract Systems, Inc.](mailto:info@tesseract.one)
   ([@tesseract_one](https://twitter.com/tesseract_one))

## License

`Tesseract.js` is available under the Apache 2.0 license. See [the LICENSE file](https://raw.githubusercontent.com/tesseract-one/Tesseract.js/master/LICENSE) for more information.
