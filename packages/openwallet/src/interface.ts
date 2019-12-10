import { IProvider, ISubscribeRequest, ISubscribeRequestMessage, API, IRequest } from "./types"
import { SubscriptionType } from './subscription'

export interface IOpenWallet {
  readonly provider?: IProvider
  readonly hasOpenWallet: boolean

  walletIsNotInstalledErrorHandler: (openWallet: IOpenWallet) => void

  version(): Promise<string>

  hasApi(api: API, subApi?: string): Promise<boolean>

  send<P extends IRequest<string, any, any>>(message: P): Promise<NonNullable<P['__TS_RESPONSE']>>

  subscribe<Request extends ISubscribeRequest<string, ISubscribeRequestMessage<any, any, any>, any>>(
    request: Request
  ): Promise<SubscriptionType<Request>>
}