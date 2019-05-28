import { Tesseract } from '../tesseract'
import { Ethereum } from './ethereum'
import '../openwallet'

declare module '../tesseract' {
  interface TesseractModule {
    Ethereum: Ethereum
  }
}

var _ETHEREUM_INSTANCE: Ethereum | undefined = undefined

Object.defineProperty(Tesseract, "Ethereum", {
  get(): Ethereum {
    if (!_ETHEREUM_INSTANCE) {
      _ETHEREUM_INSTANCE = new Ethereum(this.OpenWallet)
    }
    return _ETHEREUM_INSTANCE!
  },
  writable: false
})

export { Ethereum }