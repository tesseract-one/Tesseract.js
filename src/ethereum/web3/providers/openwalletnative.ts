import { IWeb3Provider, Web3ProviderOptions } from '../types'
import { Web3OpenWalletProvider } from './openwallet'

export class Web3NativeOpenWalletProvider {
  // Simple fallback to OpenWallet provider for now
  public static create(options: Web3ProviderOptions): Promise<IWeb3Provider> {
    return options.openWallet.isNative
      ? Web3OpenWalletProvider.create(options)
      : Promise.reject(new Error("Can't be created"))
  }
}
