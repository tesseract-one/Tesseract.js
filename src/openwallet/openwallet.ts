import { IProvider, IRequest, API, HasApiRequest } from './types'

export class OpenWallet {
  public provider?: IProvider

  public static defaultProviders: Array<IProvider> = []

  constructor(providers: Array<IProvider>) {
    for (const provider of providers) {
      if (provider.isActive) {
        this.provider = provider
        break
      }
    }
    if (this.provider) {
      this.provider.start()
    }
  }

  get hasOpenWallet(): boolean {
    return !!this.provider
  }

  get isNative(): boolean {
    return !!this.provider && this.provider!.isNative
  }

  public version(): Promise<string> {
    return this.provider!.version()
  }

  public hasApi(api: API, subApi?: string): Promise<boolean> {
    const message: HasApiRequest = {
      type: "OPENWALLET_HAS_API",
      request: { type: subApi ? `${api}_${subApi}` : api }
    }
    return this.send(message)
  }

  public send<R, P extends IRequest<string, any, R>>(message: P): Promise<R> {
    return this.provider!.send(message)
  }
}