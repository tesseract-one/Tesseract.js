import { Ethereum } from '@tesseractjs/openwallet-ethereum'
import { JsonRpcPayload, JsonRpcResponse } from 'web3-core-helpers'
import { IWeb3Provider } from '../../types'
import { IEthereumNodeSubscribeRequest, IEthereumNodeRequest, NodeSubscriptionType } from '@tesseractjs/openwallet-ethereum'
import { Jsonrpc } from '../../libs'

export class OpenWalletNodeProvider implements IWeb3Provider {
  private ethereum: Ethereum
  private netId: number
  private subscriptions: { [key: string]: NodeSubscriptionType<IEthereumNodeSubscribeRequest<any[], any>> } = {}
  private subscribers: { [key: string]: Array<(message?: any) => void> } = {}
  private _supportsSubscriptions: boolean

  connected: boolean = true
  
  supportsSubscriptions(): boolean {
    return this._supportsSubscriptions
  }

  constructor(ethereum: Ethereum, netId: number, supportsSubscriptions: boolean) {
    this.ethereum = ethereum
    this.netId = netId
    this._supportsSubscriptions = supportsSubscriptions
  }

  private emit(type: string, message?: any) {
    const subscribers = this.subscribers[type]
    if (subscribers) {
      for (const subs of subscribers) {
        subs(message)
      }
    }
  }

  send(payload: JsonRpcPayload, callback: (error: Error | null, result?: JsonRpcResponse) => void): void {
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
        promise = subscription.unsubscribe({
          networkId: this.netId,
          method: 'eth_unsubscribe',
          params: [subscription.response]
        })
      } else {
        promise = Promise.reject({type: 'METHOD_NOT_FOUND', message: "method not found: "+payload.method, code: -32000})
      }
    } else {
      const request: IEthereumNodeRequest<string, any> = {
        networkId: this.netId,
        ...payload
      }
      promise = this.ethereum.Node.send(request)
    }
    const id = typeof payload.id === 'number'
      ? payload.id
      : typeof payload.id === 'string' ? parseInt(payload.id, 10) : Jsonrpc.messageId++  
    promise!
      .then(result => callback(null, { id, jsonrpc: payload.jsonrpc, result }))
      .catch(error => callback(null, { id, jsonrpc: payload.jsonrpc, error }))
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
      subs.unsubscribe({
        networkId: this.netId,
        method: 'eth_unsubscribe',
        params: [subs.response]
      })
    }
    this.subscriptions = {}
  }

  static async create(ethereum: Ethereum, netId: number): Promise<OpenWalletNodeProvider> {
    if (!await ethereum.Node.canSend()) { throw new Error('Node API is not supported') }
    const supportedNetworks = await ethereum.Node.supportedNetworks()
    if (supportedNetworks.indexOf(netId) < 0) { throw new Error('Network is not supported: ' + netId)}
    const supportsSubscriptions = await ethereum.Node.canSubscribe()
    return new OpenWalletNodeProvider(ethereum, netId, supportsSubscriptions)
  }
}