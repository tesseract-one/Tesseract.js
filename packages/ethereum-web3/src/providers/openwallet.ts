import { IWeb3Provider, Web3ProviderOptions } from '../types'
import { Ethereum } from '@tesseractjs/openwallet-ethereum'
import { Provider, JsonRPCRequest, JsonRPCResponse, Callback, WebsocketProvider } from 'web3/providers'
import { Jsonrpc, getChainId, promisifiedSend } from '../rpc'
import { Subscription } from '@tesseractjs/openwallet';
import { IEthereumNodeSubscribeRequest, IEthereumNodeRequest } from '@tesseractjs/openwallet-ethereum'

const HANDLERS: {
  [method: string]: (
    eth: Ethereum, request: JsonRPCRequest, netId: number, chainId: string, provider: Provider
  ) => Promise<any>
} = {}

HANDLERS['eth_accounts'] = HANDLERS['eth_requestAccounts'] = HANDLERS['eth_coinbase'] = 
  function (eth, request, netId) {
    switch(request.method) {
      case 'eth_accounts': return eth.accounts(netId)
      case 'eth_requestAccounts': return eth.accounts(netId)
      case 'eth_coinbase': return eth.accounts(netId).then(accounts => accounts[0])
      default: return Promise.reject('Wrong method: ' + request.method)
    }
  }

HANDLERS['eth_signTypedData'] = HANDLERS['eth_signTypedData_v3'] =
  HANDLERS['personal_signTypedData'] = HANDLERS['personal_signTypedData_v3'] =
  function (eth, request, netId) {
    return eth.signTypedData(request.params[0], request.params[1], netId)
  }

HANDLERS['personal_sign'] = function (eth, request, netId) {
  return eth.signData(request.params[1], request.params[0], netId)
}

HANDLERS['eth_sign'] = function (eth, request, netId) {
  return eth.signData(request.params[0], request.params[1], netId)
}

HANDLERS['eth_sendTransaction'] = function (eth, request, netId, chainId, provider) {
  return eth
    .signTx(request.params[0], netId, chainId)
    .then(signed => {
      const request = Jsonrpc.toPayload('eth_sendRawTransaction', [signed])
      return promisifiedSend(provider, request)
    })
}

class OpenWalletNodeProvider {
  private ethereum: Ethereum
  private netId: number
  private subscriptions: { [key: string]: Subscription<any, any, any, any> } = {}
  private subscribers: { [key: string]: Array<(message?: any) => void> } = {}

  constructor(ethereum: Ethereum, netId: number) {
    this.ethereum = ethereum
    this.netId = netId
  }

  private emit(type: string, message?: any) {
    const subscribers = this.subscribers[type]
    if (subscribers) {
      for (const subs of subscribers) {
        subs(message)
      }
    }
  }

  send(payload: JsonRPCRequest, callback: Callback<JsonRPCResponse>): void {
    let promise: Promise<any> | undefined
    if (payload.method.endsWith('_subscribe')) {
      const request = {
        networkId: this.netId,
        ...payload
      } as IEthereumNodeSubscribeRequest<any, any[]>
      promise = this.ethereum.Node.subscribe(request)
        .then(subscription => {
          const subscriptionId = subscription.response
          this.subscriptions[subscriptionId] = subscription
          subscription.on('message', message => {
            this.emit('data', message)
          })
          subscription.on('unsubscribed', () => {
            delete this.subscriptions[subscriptionId]
          })
          return subscription.response
        })
    } else if (payload.method.endsWith('_unsubscribe')) {
      const subscription = this.subscriptions[payload.params[0]]
      if (subscription) {
        promise = subscription.unsubscribe([subscription.response])
      } else {
        promise = Promise.reject({ type: "NOT_FOUND", code: 32000 })
      }
    } else {
      const request: IEthereumNodeRequest<string, any> = {
        networkId: this.netId,
        ...payload
      }
      promise = this.ethereum.Node.send(request)
    }
    promise!
      .then(response => callback(null, { id: payload.id, jsonrpc: payload.jsonrpc, result: response }))
      .catch(error => callback(null, { id: payload.id, jsonrpc: payload.jsonrpc, error }))
  }

  on(type: string, callback: (message?: any) => void): void {
    const subs = this.subscribers[type] || []
    subs.push(callback)
    this.subscribers[type] = subs
  }

  removeListener(type: string, callback: (message?: any) => any): void {
    const subs = this.subscribers[type] || []
    const index = subs.indexOf(callback)
    if (index >= 0) {
      subs.splice(index, 1)
    }
    this.subscribers[type] = subs
  }

  reset() {
    this.subscribers = {}
    for (const id in this.subscriptions) {
      const subs = this.subscriptions[id]
      subs.unsubscribe([subs.response])
    }
    this.subscriptions = {}
  }
}

export class Web3OpenWalletProvider implements IWeb3Provider {
  hasClientWallet: boolean = true
  supportsSubscriptions: boolean

  private ethereum: Ethereum
  private provider: Provider

  private netId: number
  private chainId: Promise<string>

  get connected(): boolean {
    return (<any>this.provider).connected
  }

  constructor(netId: number, supportsSubscriptions: boolean, ethereum: Ethereum, provider: Provider) {
    this.netId = netId
    this.chainId = getChainId(provider)
    this.provider = provider
    this.supportsSubscriptions = supportsSubscriptions
    this.ethereum = ethereum
  }

  send(payload: JsonRPCRequest, callback: Callback<JsonRPCResponse>): void {
    this.chainId
      .then(chainId => {
        const handler = HANDLERS[payload.method]
        if (handler) {
          return handler(this.ethereum, payload, this.netId, chainId, this.provider)
            .then(response => ({ jsonrpc: payload.jsonrpc, id: payload.id, result: response }))
            .catch(error => ({ jsonrpc: payload.jsonrpc, id: payload.id, error }))
        }
        return promisifiedSend(this.provider, payload)
      })
      .then(response => callback(null, response))
      .catch(err => callback(err))
  }

  on(type: string, callback: (message?: any) => any): void {
    if (!this.supportsSubscriptions) { throw new Error('Subscriptions is not supported') }
    (<WebsocketProvider>this.provider).on(type, callback)
  }

  removeListener(type: string, callback: (message?: any) => any): void {
    if (!this.supportsSubscriptions) { throw new Error('Subscriptions is not supported') }
    (<WebsocketProvider>this.provider).removeListener(type, callback)
  }

  reset() {
    if ((<any>this.provider).reset) {
      (<any>this.provider).reset()
    }
  }

  private static async createNative(ethereum: Ethereum, netId: number): Promise<Web3OpenWalletProvider> {
    if (!await ethereum.Node.canSend()) { throw new Error('Node API is not supported') }
    const supportedNetworks = await ethereum.Node.supportedNetworks()
    if (supportedNetworks.indexOf(netId) < 0) { throw new Error('Network is not supported: ' + netId)}
    const supportsSubscriptions = await ethereum.Node.canSubscribe()
    return new Web3OpenWalletProvider(netId, supportsSubscriptions, ethereum, new OpenWalletNodeProvider(ethereum, netId))
  }

  public static async create({ openWallet, provider, netId }: Web3ProviderOptions): Promise<IWeb3Provider> {
    const ethereum = new Ethereum(openWallet)
    try {
      return await this.createNative(ethereum, netId)
    } catch {
      if (provider) {
        const supportsSubscriptions = typeof (<any>provider).on === 'function'
        return new Web3OpenWalletProvider(netId, supportsSubscriptions, ethereum, provider)
      }
      throw new Error('Doesn\'t have any provider')
    }
  }
}
