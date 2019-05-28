import { IProvider, IRequest} from './types'

export interface INativeOpenWalletProvider {  
  version: string

  send<Response, Request extends IRequest<string, any, Response>>(request: Request): Promise<Response>
}

export class NativeProvider implements IProvider {
  private openWallet?: INativeOpenWalletProvider

  isActive: boolean
  isNative: boolean

  constructor() {
    this.isNative = true
    this.openWallet = (<any>window).openwallet
    this.isActive = this.openWallet != undefined
  }

  start() {}

  version(): Promise<string> {
    return Promise.resolve(this.openWallet!.version)
  }
  
  send<Response, Request extends IRequest<string, any, Response>>(request: Request): Promise<Response> {
    return this.openWallet!.send(request)
  }
}