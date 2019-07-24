import { IProvider, IRequest, ISubscribeRequest, IUnsubscribeRequest, ISubscribeResponseMessage } from '../types'

export interface INativeOpenWalletProvider {  
  version: string

  on(subscriptionId: string, listener: (message: any) => void): () => void
  send<Req extends IRequest<string, any, any>>(request: Req): Promise<NonNullable<Req['__TS_RESPONSE']>>
}

export class NativeProvider implements IProvider {
  private openWallet?: INativeOpenWalletProvider
  private subscriptions: { [api: string]: { [id: string]: () => void } }

  isActive: boolean
  supportsSubscriptions: boolean

  constructor() {
    this.openWallet = (<any>window).openwallet
    this.isActive = this.openWallet != undefined
    this.supportsSubscriptions = true
    this.subscriptions = {}
  }

  start() {}

  version(): Promise<string> {
    return Promise.resolve(this.openWallet!.version)
  }
  
  send<Req extends IRequest<string, any, any>>(request: Req): Promise<NonNullable<Req['__TS_RESPONSE']>> {
    return this.openWallet!.send(request)
  }

  async subscribe<Req extends ISubscribeRequest<string, any, ISubscribeResponseMessage>>(
    request: Req, listener: (message: NonNullable<Req['request']['__TS_MESSAGE']>) => void
  ): Promise<NonNullable<Req['__TS_RESPONSE']>> {
    const owReq: IRequest<string, Req['request'], NonNullable<Req['__TS_RESPONSE']>> = {
      type: request.type + '_SUBSCRIBE',
      request: request.request
    }
    const result = await this.openWallet!.send(owReq)
    const apiSubs = this.subscriptions[request.type] || {}
    apiSubs[result.owSubscriptionId] = this.openWallet!.on(result.owSubscriptionId, listener)
    this.subscriptions[request.type] = apiSubs
    return result
  }

  unsubscribe<Req extends IUnsubscribeRequest<string, ISubscribeResponseMessage, any>>(
    request: Req
  ): Promise<NonNullable<Req['__TS_RESPONSE']>> {
    const owReq: IRequest<string, Req['request'], NonNullable<Req['__TS_RESPONSE']>> = {
      type: request.type + '_UNSUBSCRIBE',
      request: request.request
    }
    const apiSubs = this.subscriptions[request.type] || {}
    const unsubscribe = apiSubs[request.request.owSubscriptionId]
    if (unsubscribe) { 
      delete apiSubs[request.request.owSubscriptionId]
      unsubscribe()
    }
    this.subscriptions[request.type] = apiSubs
    return this.openWallet!.send(owReq)
  }
}