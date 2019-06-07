import { OpenWallet } from '@tesseract/openwallet'

export interface EthereumPluginFactory<T> {
  (instance: Ethereum): T
}

export interface EthereumMethodPluginFactory {
  (proto: Ethereum): void
}

export class Ethereum {
  public openWallet: OpenWallet

  constructor(openWallet: OpenWallet) {
    this.openWallet = openWallet
  }

  public static addPlugin<T>(prop: string, factory: EthereumPluginFactory<T>) {
    Object.defineProperty(this.prototype, prop, {
      get(): T {
        if (!this.plugins[prop]) {
          this.plugins[prop] = factory(this)
        }
        return this.plugins[prop]
      }
    })
  }

  public static addMethodPlugin(factory: EthereumMethodPluginFactory) {
    factory(this.prototype)
  }
}