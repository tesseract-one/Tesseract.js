
import { OpenWallet } from './openwallet'
import { TesseractModule, Tesseract } from '@tesseractjs/core'
import { CallbackURLProvider, NativeProvider } from './providers'
import { Network, IRequest, API, ISubscribeResponseMessage, IUnsubscribeRequestMessage } from './types'
import { 
  KeychainPlugin, IKeychainRequest, NodePlugin,
  INodeRequest, INodeSubscribeRequest, NodeSubscriptionType
} from './api'

declare module '@tesseractjs/core' {
  interface TesseractModule {
    OpenWallet: OpenWallet
  }
}

OpenWallet.defaultProviders.push(new NativeProvider())
OpenWallet.defaultProviders.push(CallbackURLProvider.instance())

OpenWallet.addPlugin('Keychain', openWallet => new KeychainPlugin(openWallet))
OpenWallet.addPlugin('Node', openWallet => new NodePlugin(openWallet))

TesseractModule.addPlugin('OpenWallet', () => new OpenWallet(OpenWallet.defaultProviders))

export {
  OpenWallet, Network, IRequest, API, IKeychainRequest,
  INodeRequest, INodeSubscribeRequest, Tesseract, TesseractModule,
  ISubscribeResponseMessage, NodeSubscriptionType, IUnsubscribeRequestMessage
}
export { Subscription, SubscriptionType } from './subscription'
export default OpenWallet