
import { Web3 } from './web3'
import { Ethereum } from '../ethereum'
import { Web3ModuleOptions } from 'web3-core'
import { HttpProviderOptions, WebsocketProviderOptions } from 'web3-providers'

import { 
  Web3FallbackProvider, Web3NativeOpenWalletProvider,
  Web3NativeProvider, Web3OpenWalletProvider
} from './providers'

declare module '../ethereum' {
  interface Ethereum {
    Web3(
      rpcUrl: string,
      options?: Web3ModuleOptions,
      rpcOptions?: HttpProviderOptions | WebsocketProviderOptions
    ): Promise<Web3>
  }
}

Ethereum.addMethodPlugin((proto) => {
  proto.Web3 = function(rpcUrl, options, rpcOptions) {
    return Web3.create(Web3.defaultProviders, this.openWallet, rpcUrl, options, rpcOptions)
  }
})

Web3.defaultProviders.push(Web3NativeOpenWalletProvider)
Web3.defaultProviders.push(Web3NativeProvider)
Web3.defaultProviders.push(Web3OpenWalletProvider)
Web3.defaultProviders.push(Web3FallbackProvider)


export { Web3, Web3FallbackProvider, Web3NativeOpenWalletProvider, Web3NativeProvider, Web3OpenWalletProvider }