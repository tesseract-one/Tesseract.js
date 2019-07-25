import { Ethereum } from '@tesseractjs/openwallet-ethereum'
import { JsonRPCRequest, JsonRPCResponse, Callback } from 'web3/providers'
import { IEthereumNodeSubscribeRequest, IEthereumNodeRequest, NodeSubscriptionType } from '@tesseractjs/openwallet-ethereum'

export class OpenWalletNodeProvider {
  private ethereum: Ethereum
  private netId: number
  private subscriptions: { [key: string]: NodeSubscriptionType<IEthereumNodeSubscribeRequest<any[], any>> } = {}
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
        promise = subscription.unsubscribe({
          networkId: this.netId,
          method: 'eth_unsubscribe',
          params: [subscription.response]
        })
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
      .catch(error => {
        console.log('REQUEST ERROR:', error)
        callback(null, { id: payload.id, jsonrpc: payload.jsonrpc, error, result: null })
      })
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
}