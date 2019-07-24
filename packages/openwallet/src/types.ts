
export enum API {
  Keychain = "KEYCHAIN",
  Node = "NODE"
}

export class Network {
  id: string
  
  constructor(id: string) {
    this.id = id
  }
}

export enum Version {
  v1 = "1.0"
}

//export type BasicErrorTypes = "NOT_SUPPORTED" | "CANCELLED_BY_USER" | "WRONG_PARAMETERS" | "UNKNOWN_ERROR"

export interface IRequest<Type extends string, Request, Response> {
  type: Type
  request: Request
  __TS_RESPONSE?: Response
}

export interface ISubscribeRequestMessage<Message, UMessage extends ISubscribeResponseMessage, UResponse> {
  __TS_MESSAGE?: Message
  __TS_UMESSAGE?: UMessage
  __TS_URESPONSE?: UResponse
}

export interface ISubscribeResponseMessage {
  owSubscriptionId: string
}

export interface ISubscribeRequest<
    API extends string,
    Request extends ISubscribeRequestMessage<any, any, any>,
    Response extends ISubscribeResponseMessage
> extends IRequest<API, Request, Response> {}

export interface IUnsubscribeRequest<
  API extends string, 
  Request extends ISubscribeResponseMessage,
  Response
> extends IRequest<API, Request, Response> {}

export interface IProvider {
  isActive: boolean
  supportsSubscriptions: boolean
  
  start(): void    
  version(): Promise<string>

  subscribe<Request extends ISubscribeRequest<string, any, ISubscribeResponseMessage>>(
    request: Request, listener: (message: NonNullable<Request['request']['__TS_MESSAGE']>) => void
  ): Promise<NonNullable<Request['__TS_RESPONSE']>>

  unsubscribe<Request extends IUnsubscribeRequest<string, ISubscribeResponseMessage, any>>(
    request: Request
  ): Promise<NonNullable<Request['__TS_RESPONSE']>>

  send<Request extends IRequest<string, any, any>>(request: Request): Promise<NonNullable<Request['__TS_RESPONSE']>>
}

export type HasApiResponse = boolean
export type HasApiRequest = IRequest<"OPENWALLET_HAS_API", { type: API | string }, HasApiResponse>

