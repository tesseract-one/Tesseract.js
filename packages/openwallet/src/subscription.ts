
import {
  IProvider, ISubscribeResponseMessage, ISubscribeRequest,
  ISubscribeRequestMessage, IUnsubscribeRequest, IUnsubscribeRequestMessage
} from './types'

type SubscriptionEvents = 'message' | 'unsubscribed'

export type SubscriptionType<
  Request extends ISubscribeRequest<string, ISubscribeRequestMessage<any, any, any>, any>
> =
  Subscription<
    NonNullable<Request['request']['__TS_MESSAGE']>,
    NonNullable<Request['__TS_RESPONSE']>,
    NonNullable<Request['request']['__TS_UMESSAGE']>,
    NonNullable<Request['request']['__TS_URESPONSE']>
  >

export class Subscription<
  Message, Response extends ISubscribeResponseMessage,
  URequest, UResponse
> {
  private events: { [key: string]: Array<(m?: any) => void> } = {}
  private provider: IProvider
  private api: string

  public isSubscribed: boolean
  readonly response: Response

  constructor(api: string, response: Response, provider: IProvider) {
    this.api = api
    this.response = response
    this.isSubscribed = true
    this.provider = provider
  }

  on(event: 'message', listener: (m: Message) => void): () => void
  on(event: 'unsubscribed', listener: () => void): () => void
  on(event: SubscriptionEvents, listener: ((m: Message) => void) | (() => void)): () => void {
    if (!this.isSubscribed) { throw new Error("Subscription is not active")}
    const evs = this.events[event] || []
    evs.push(listener)
    this.events[event] = evs
    return () => {
      const index = this.events[event].indexOf(listener)
      if (index >= 0) { this.events[event].splice(index, 1) }
    }
  }

  public emit(event: SubscriptionEvents, message?: Message) {
    (this.events[event] || []).forEach((listener) => listener(message))
  }

  async unsubscribe(request: URequest): Promise<UResponse> {
    if (!this.isSubscribed) { throw new Error("Subscription is not active")}

    const req: IUnsubscribeRequest<string, URequest & IUnsubscribeRequestMessage, UResponse> = {
      type: this.api,
      request: {
        owSubscriptionId: this.response.owSubscriptionId,
        ...request
      }
    }
    
    const result = await this.provider.unsubscribe(req)
    this.isSubscribed = false
    this.emit('unsubscribed')
    this.events = {}

    return result
  }
}