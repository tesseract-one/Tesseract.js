import Web3JS from 'web3'
import { Web3ModuleOptions } from 'web3-core'
import { OpenWallet } from '@tesseract/openwallet'
import { IWeb3Provider, IWeb3ProviderFactory } from './types'
import { HttpProviderOptions, WebsocketProviderOptions } from 'web3-providers'


export class Web3 extends Web3JS {
  public static defaultProviders: Array<IWeb3ProviderFactory> = []

  public hasWallet: boolean

  public static create(
    providers: Array<IWeb3ProviderFactory>,
    openWallet: OpenWallet,
    rpcUrl: string,
    options?: Web3ModuleOptions,
    rpcOptions?: HttpProviderOptions | WebsocketProviderOptions
  ): Promise<Web3> {
    const factoryOptions = { openWallet, rpcUrl, options: rpcOptions }
    const reducer: (index: number) => Promise<IWeb3Provider> = (index) => {
      if (index >= providers.length) { throw new Error("Can't find proper provider") }
      return providers[index].create(factoryOptions)
        .catch(() => reducer(index+1))
    }

    return reducer(0).then(provider => new Web3(provider, options))     
  }

  constructor(
    provider: IWeb3Provider,
    options?: Web3ModuleOptions
  ) {
    super(provider, undefined, options)
    this.hasWallet = !provider.fallback
  }
}