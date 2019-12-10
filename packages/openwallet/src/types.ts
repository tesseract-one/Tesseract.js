
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

export enum ErrorType {
  walletIsNotInstalled = "WALLET_IS_NOT_INSTALLED",
  notSupported = "NOT_SUPPORTED",
  wrongMessageId = "WRONG_MESSAGE_ID",
  timeout = "TIMEOUT"
}

export interface IRequest<Type extends string, Request, Response> {
  type: Type
  request: Request
  __TS_RESPONSE?: Response
}

export interface ISubscribeRequestMessage<Message, UMessage extends IUnsubscribeRequestMessage, UResponse> {
  __TS_MESSAGE?: Message
  __TS_UMESSAGE?: UMessage
  __TS_URESPONSE?: UResponse
}

export interface ISubscribeResponseMessage {
  owSubscriptionId: string
}

export interface IUnsubscribeRequestMessage extends ISubscribeResponseMessage {}

export interface ISubscribeRequest<
    API extends string,
    Request extends ISubscribeRequestMessage<any, any, any>,
    Response extends ISubscribeResponseMessage
> extends IRequest<API, Request, Response> {}

export interface IUnsubscribeRequest<
  API extends string, 
  Request extends IUnsubscribeRequestMessage,
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

  unsubscribe<Request extends IUnsubscribeRequest<string, IUnsubscribeRequestMessage, any>>(
    request: Request
  ): Promise<NonNullable<Request['__TS_RESPONSE']>>

  send<Request extends IRequest<string, any, any>>(request: Request): Promise<NonNullable<Request['__TS_RESPONSE']>>
}

export type HasApiResponse = boolean
export type HasApiRequest = IRequest<"OPENWALLET_HAS_API", { type: API | string }, HasApiResponse>
