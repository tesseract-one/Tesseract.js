
import { OpenWallet } from './openwallet'
import { TesseractModule, Tesseract } from '@tesseractjs/core'
import { NativeProvider } from './native'
import { CallbackURLProvider } from './url'
import { Network, IRequest, API } from './types'
import { KeychainPlugin, IKeychainRequest } from './keychain'

declare module '@tesseractjs/core' {
  interface TesseractModule {
    OpenWallet: OpenWallet
  }
}

OpenWallet.defaultProviders.push(new NativeProvider())
OpenWallet.defaultProviders.push(CallbackURLProvider.instance())

OpenWallet.addMethodPlugin(KeychainPlugin)

TesseractModule.addPlugin('OpenWallet', () => new OpenWallet(OpenWallet.defaultProviders))

export { OpenWallet, Network, IRequest, API, IKeychainRequest, Tesseract, TesseractModule }