import { OpenWallet } from '@tesseractjs/openwallet'
import { TesseractModule, Tesseract } from '@tesseractjs/core'

export interface EthereumPluginFactory<T> {
  (instance: Ethereum): T
}

export class Ethereum {
  public static plugins: { [name: string]: any; } = {}

  public openWallet: OpenWallet

  constructor(openWallet: OpenWallet) {
    this.openWallet = openWallet
  }

  public static addPlugin<P extends keyof Ethereum>(prop: P, factory: EthereumPluginFactory<Ethereum[P]>) {
    const self = this
    Object.defineProperty(this.prototype, prop, {
      get(): Ethereum[P] {
        if (!self.plugins[prop]) {
          self.plugins[prop] = factory(this)
        }
        return self.plugins[prop]
      }
    })
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
export default Ethereum
