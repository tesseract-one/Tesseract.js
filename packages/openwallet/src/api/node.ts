import { OpenWallet } from '../openwallet'
import { 
  IRequest, Network, API, ISubscribeRequestMessage,
  IUnsubscribeRequestMessage, ISubscribeRequest
} from '../types'
import { Subscription } from '../subscription'

export interface INodeRequest<Response> {
  __TS_RESPONSE?: Response
}

export interface INodeSubscribeRequest<Message, Response, UMessage, UResponse>
  extends ISubscribeRequestMessage<Message, UMessage & IUnsubscribeRequestMessage, UResponse> {
  __TS_RESPONSE?: Response
  __TS_NUMESSAGE?: UMessage
}

export type NodeSubscriptionType<Req extends INodeSubscribeRequest<any, any, any, any>> =
  Subscription<
    NonNullable<Req['__TS_MESSAGE']>,
    NonNullable<Req['__TS_RESPONSE']>,
    NonNullable<Req['__TS_NUMESSAGE']>,
    NonNullable<Req['__TS_URESPONSE']>
  >

declare module '../openwallet' {
  interface OpenWallet {
    Node: NodePlugin
  }
}

export class NodePlugin {
  private openWallet: OpenWallet

  constructor(openWallet: OpenWallet) {
    this.openWallet = openWallet
  }

  hasNode(net: Network): Promise<boolean> {
    return this.openWallet.hasApi(API.Node, net.id)
  }

  hasSubscriptionApi(net: Network): Promise<boolean> {
    return this.openWallet.hasApi(API.Node, net.id + '_SUBSCRIBE')
  }

  send<Req extends INodeRequest<any>>(net: Network, request: Req): Promise<NonNullable<Req['__TS_RESPONSE']>> {
    const owReq: IRequest<string, Req, NonNullable<Req['__TS_RESPONSE']>> = {
      type: `OPENWALLET_${API.Node}_${net.id}`,
      request
    }
    return this.openWallet.send(owReq)
  }

  subscribe<Req extends INodeSubscribeRequest<any, any, any, any>>(
    net: Network, request: Req
  ): Promise<NodeSubscriptionType<Req>> {
    const owReq: ISubscribeRequest<string, Req, NonNullable<Req['__TS_RESPONSE']>> = {
      type: `OPENWALLET_${API.Node}_${net.id}`,
      request
    }
    return this.openWallet.subscribe(owReq)
  }
}