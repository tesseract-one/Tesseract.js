
import { OpenWallet } from './openwallet'
import { Tesseract } from '../tesseract'
import { NativeProvider } from './native'
import { CallbackURLProvider } from './url'
import { Network } from './types'

declare module '../tesseract' {
  interface TesseractModule {
    OpenWallet: OpenWallet
  }
}

var _OPENWALLET_INSTANCE: OpenWallet | undefined = undefined

Object.defineProperty(Tesseract, "OpenWallet", {
  get(): OpenWallet {
    if (!_OPENWALLET_INSTANCE) {
      _OPENWALLET_INSTANCE = new OpenWallet(OpenWallet.defaultProviders)
    }
    return _OPENWALLET_INSTANCE!
  }
})

OpenWallet.defaultProviders.push(new NativeProvider())
OpenWallet.defaultProviders.push(CallbackURLProvider.instance())

export { OpenWallet, Network }