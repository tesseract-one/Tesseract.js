import { Network, API } from './types'
import { IKeychainRequest, OpenWallet } from  './keychain'

var _ETHEREUM_INSTANCE: Ethereum | undefined = undefined

export type Quantity = string
export type HexString = string

export interface IAccountRequest extends IKeychainRequest<"get_account", HexString> {
  networkId: number
}

export interface ISignTxRequest extends IKeychainRequest<"sign_transaction", HexString> {
  networkId: number
  nonce: Quantity
  from: HexString
  to?: HexString
  gas: Quantity
  gasPrice: Quantity
  value: Quantity
  data: HexString
  chainId: Quantity
}

export interface ISignDataRequest extends IKeychainRequest<"sign", HexString> {
  networkId: number
  account: HexString
  data: HexString
}

export interface ISignTypedDataRequest extends IKeychainRequest<"sign_typed_data", HexString> {
  networkId: number
  account: HexString
  data: object
}

export type Transaction = {
  nonce: Quantity
  from: HexString
  to?: HexString
  gas: Quantity
  gasPrice: Quantity
  value: Quantity
  data: HexString
}

export class Ethereum {
  private openWallet: OpenWallet

  constructor(openWallet: OpenWallet) {
    this.openWallet = openWallet
  }

  isKeychainInstalled(): Promise<boolean> {
    return this.openWallet.hasApi(API.Keychain, Network.Ethereum.toString())
  }

  accounts(networkId: number): Promise<Array<HexString>> {
    const req: IAccountRequest = {
      method: "get_account",
      networkId
    }
    return this.openWallet
      .keychain<HexString, IAccountRequest>(Network.Ethereum, req)
      .then(account => [account])
  }

  signTx(tx: Transaction, networkId: number, chainId: Quantity): Promise<HexString> {
    const req: ISignTxRequest = {
      method: "sign_transaction",
      networkId, chainId,
      ...tx
    }
    return this.openWallet.keychain(Network.Ethereum, req)
  }

  signData(account: HexString, data: HexString, networkId: number): Promise<HexString> {
    const req: ISignDataRequest = {
      method: "sign",
      account, data, networkId
    }
    return this.openWallet.keychain(Network.Ethereum, req)
  }

  signTypedData(account: HexString, data: object, networkId: number): Promise<HexString> {
    const req: ISignTypedDataRequest = {
      method: "sign_typed_data",
      account, data, networkId
    }
    return this.openWallet.keychain(Network.Ethereum, req)
  }
}

declare module './openwallet' {
  interface OpenWallet {
    Ethereum: Ethereum
  }
}

declare module './types' { 
  namespace Network {
    export var Ethereum: Network
  }
}

Network.Ethereum = new Network("ETHEREUM")

Object.defineProperty(OpenWallet.prototype, "Ethereum", {
  get(): Ethereum {
    if (!_ETHEREUM_INSTANCE) {
      _ETHEREUM_INSTANCE = new Ethereum(this)
    }
    return _ETHEREUM_INSTANCE!
  }
})