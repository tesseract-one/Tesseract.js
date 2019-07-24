import { 
  IProvider, IRequest, API, HasApiRequest,
  ISubscribeRequest, ISubscribeRequestMessage
} from './types'
import { Subscription, SubscriptionType } from './subscription'

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

  public version(): Promise<string> {
    return this.provider!.version()
  }

  public async subscribe<Request extends ISubscribeRequest<string, ISubscribeRequestMessage<any, any, any>, any>>(
    request: Request
  ): Promise<SubscriptionType<Request>> {
    if (!this.provider!.supportsSubscriptions) {
      return Promise.reject({type: 'NOT_SUPPORTED', message: 'API is not supported'})
    }
    var subscription: SubscriptionType<Request> | undefined
    const response = await this.provider!.subscribe(request, (m) => subscription!.emit('message', m))
    subscription = new Subscription(request.type, response, this.provider!)
    return subscription
  }

  public hasApi(api: API, subApi?: string): Promise<boolean> {
    const message: HasApiRequest = {
      type: "OPENWALLET_HAS_API",
      request: { type: subApi ? `${api}_${subApi}` : api }
    }
    return this.send(message)
      .then(() => true)
      .catch(err => {
        if (err.type !== 'NOT_SUPPORTED') { throw err }
        return false
      })
  }

  public send<P extends IRequest<string, any, any>>(message: P): Promise<NonNullable<P['__TS_RESPONSE']>> {
    return this.provider!.send(message)
  }

  public static addPlugin<P extends keyof OpenWallet>(prop: P, factory: OpenWalletPluginFactory<OpenWallet[P]>) {
    const self = this
    Object.defineProperty(this.prototype, prop, {
      get(): OpenWallet[P] {
        if (!self.plugins[prop]) {
          self.plugins[prop] = factory(this)
        }
        return self.plugins[prop]
      }
    })
  }
}