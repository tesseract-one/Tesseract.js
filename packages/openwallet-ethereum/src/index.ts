import { Network, OpenWallet } from '@tesseractjs/openwallet'
import { 
  HexString, Quantity, IAccountRequest, ISignTxRequest,
  Transaction, ISignDataRequest, ISignTypedDataRequest
} from  './keychain'
import {
  IEthereumNodeRequest, IEthereumNodeNetworksRequest,
  IEthereumNodeSubscribeRequest, NodeSubscriptionType
} from './node'

class NodeApi {
  private openWallet: OpenWallet

  constructor(openWallet: OpenWallet) {
    this.openWallet = openWallet
  }

  canSend(): Promise<boolean> {
    return this.openWallet.Node.hasNode(Network.Ethereum)
  }

  canSubscribe(): Promise<boolean> {
    return this.openWallet.Node.hasSubscriptionApi(Network.Ethereum)
  }

  supportedNetworks(): Promise<Array<number>> {
    const req: IEthereumNodeNetworksRequest = {
      method: "opw_supportedNetworks",
      networkId: 0,
      params: []
    }
    return this.openWallet.Node.send(Network.Ethereum, req)
  }

  send<Req extends IEthereumNodeRequest<string, any>>(req: Req): Promise<NonNullable<Req['__TS_RESPONSE']>> {
    return this.openWallet.Node.send(Network.Ethereum, req)
  }

  subscribe<Req extends IEthereumNodeSubscribeRequest<Array<any>, any>>(req: Req): Promise<NodeSubscriptionType<Req>> {
    return this.openWallet.Node.subscribe(Network.Ethereum, req)
  }
}

export class Ethereum {
  private openWallet: OpenWallet

  Node: NodeApi

  constructor(openWallet: OpenWallet) {
    this.openWallet = openWallet
    this.Node = new NodeApi(openWallet)
  }

  isKeychainInstalled(): Promise<boolean> {
    return this.openWallet.Keychain.hasWallet(Network.Ethereum)
  }

  accounts(networkId: number): Promise<Array<HexString>> {
    const req: IAccountRequest = {
      method: "get_account",
      networkId
    }
    return this.openWallet.Keychain
      .send(Network.Ethereum, req)
      .then(account => [account])
  }

  signTx(tx: Transaction, networkId: number, chainId: Quantity): Promise<HexString> {
    const req: ISignTxRequest = {
      method: "sign_transaction",
      networkId, chainId,
      ...tx
    }
    return this.openWallet.Keychain.send(Network.Ethereum, req)
  }

  signData(account: HexString, data: HexString, networkId: number): Promise<HexString> {
    const req: ISignDataRequest = {
      method: "sign",
      account, data, networkId
    }
    return this.openWallet.Keychain.send(Network.Ethereum, req)
  }

  signTypedData(account: HexString, data: object, networkId: number): Promise<HexString> {
    const req: ISignTypedDataRequest = {
      method: "sign_typed_data",
      account, data, networkId
    }
    return this.openWallet.Keychain.send(Network.Ethereum, req)
  }
}

declare module '@tesseractjs/openwallet' { 
  namespace Network {
    export var Ethereum: Network
  }
}

Network.Ethereum = new Network("ETHEREUM")

declare module '@tesseractjs/openwallet' {
  interface OpenWallet {
    Ethereum: Ethereum
  }
}

OpenWallet.addPlugin("Ethereum", (openWallet) => new Ethereum(openWallet))

export { IEthereumNodeRequest, IEthereumNodeSubscribeRequest, IEthereumNodeNetworksRequest, NodeSubscriptionType }
export { OpenWallet, Network }
export { Tesseract } from '@tesseractjs/core'