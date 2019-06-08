import { IProvider, IRequest, API, HasApiRequest } from './types'

export interface OpenWalletPluginFactory<T> {
  (openWallet: OpenWallet): T
}

export interface OpenWalletMethodPluginFactory {
  (proto: OpenWallet): void
}

export class OpenWallet {
  public provider?: IProvider

  public static defaultProviders: Array<IProvider> = []
  public static plugins: { [name: string]: any; } = {}

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

  public static addPlugin<T>(prop: string, factory: OpenWalletPluginFactory<T>) {
    const self = this
    Object.defineProperty(this.prototype, prop, {
      get(): T {
        if (!self.plugins[prop]) {
          self.plugins[prop] = factory(this)
        }
        return self.plugins[prop]
      }
    })
  }

  public static addMethodPlugin(factory: OpenWalletMethodPluginFactory) {
    factory(this.prototype)
  }
}