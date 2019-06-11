import { OpenWallet } from '@tesseractjs/openwallet'
import { TesseractModule, Tesseract } from '@tesseractjs/core'

export interface EthereumPluginFactory<T> {
  (instance: Ethereum): T
}

export interface EthereumMethodPluginFactory {
  (proto: Ethereum): void
}

export class Ethereum {
  public static plugins: { [name: string]: any; } = {}

  public openWallet: OpenWallet

  constructor(openWallet: OpenWallet) {
    this.openWallet = openWallet
  }

  public static addPlugin<T>(prop: string, factory: EthereumPluginFactory<T>) {
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

  public static addMethodPlugin(factory: EthereumMethodPluginFactory) {
    factory(this.prototype)
  }
}

declare module '@tesseractjs/core' {
  interface TesseractModule {
    Ethereum: Ethereum
  }
}

TesseractModule.addPlugin("Ethereum", (tesseract) => {
  return new Ethereum(tesseract.OpenWallet)
})

export { Tesseract, TesseractModule }
export * from './types'