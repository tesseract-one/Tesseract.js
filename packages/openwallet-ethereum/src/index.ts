import { Network, API, OpenWallet } from '@tesseract/openwallet'
import { 
  HexString, Quantity, IAccountRequest, ISignTxRequest,
  Transaction, ISignDataRequest, ISignTypedDataRequest
} from  './types'

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

declare module '@tesseract/openwallet' { 
  namespace Network {
    export var Ethereum: Network
  }
}

Network.Ethereum = new Network("ETHEREUM")

declare module '@tesseract/openwallet' {
  interface OpenWallet {
    Ethereum: Ethereum
  }
}

OpenWallet.addPlugin("Ethereum", (openWallet) => {
  return new Ethereum(openWallet)
})
