
import { Web3 } from './web3wrapper'
import { IWeb3ProviderFactory } from './types'
import { Ethereum } from '@tesseractjs/ethereum'
import { HttpProviderOptions, WebsocketProviderOptions, Network } from './types'

import { 
  Web3FallbackProvider,
  Web3NativeProvider, Web3OpenWalletProvider
} from './providers'

export type Web3RpcUrlInfo = string | { url: string, options?: HttpProviderOptions | WebsocketProviderOptions }

interface Web3Constructor {
  rpcUrls: { [key: number]: Web3RpcUrlInfo }
  providers: Array<IWeb3ProviderFactory>
  (
    rpcUrl: string,
    rpcOptions?: HttpProviderOptions | WebsocketProviderOptions
  ): Promise<Web3>
  (netId: Network | number): Promise<Web3>
}

declare module '@tesseractjs/ethereum' {
  interface Ethereum {
    Web3: Web3Constructor
  }
}

Ethereum.addPlugin("Web3", (ethereum) => {
  function web3Constructor(
    rpcUrlOrNetId: string | number,
    rpcOptions?: HttpProviderOptions | WebsocketProviderOptions
  ) {
    let netId: number | undefined
    let rpcUrl: string | undefined
    if (typeof rpcUrlOrNetId === 'string') {
      rpcUrl = rpcUrlOrNetId
    } else {
      netId = rpcUrlOrNetId
      const rpcInfo = ethereum.Web3.rpcUrls[netId]
      if (rpcInfo) {
        if (typeof rpcInfo === 'string') {
          rpcUrl = rpcInfo
        } else {
          rpcUrl = rpcInfo.url
          rpcOptions = rpcOptions || rpcInfo.options
        }
      }
    }
    return Web3.create(ethereum.Web3.providers, ethereum.openWallet, netId, rpcUrl, rpcOptions)
  }
  
  web3Constructor.rpcUrls = {} 
  web3Constructor.providers = [Web3NativeProvider, Web3OpenWalletProvider, Web3FallbackProvider]

  return web3Constructor
})

export { Web3, Web3FallbackProvider, Web3NativeProvider, Web3OpenWalletProvider, Ethereum, Network }
export { Tesseract } from '@tesseractjs/core'