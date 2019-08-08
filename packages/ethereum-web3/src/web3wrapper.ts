import { Web3 as Web3JS, WebsocketProvider, HttpProvider } from './libs'
import { OpenWallet } from '@tesseractjs/openwallet'
import { 
  IWeb3Provider, IWeb3ProviderFactory, HttpProviderOptions, WebsocketProviderOptions
} from './types'
import { Web3ProviderProxy } from './proxy'
import { Provider } from 'web3/providers'
import { getNetId } from './rpc'

export class Web3 extends Web3JS {
  public hasClientWallet: boolean

  public static async create(
    providers: Array<IWeb3ProviderFactory>,
    openWallet: OpenWallet,
    netId?: number,
    rpcUrl?: string,
    rpcOptions?: HttpProviderOptions | WebsocketProviderOptions
  ): Promise<Web3> {
    let provider: Provider | undefined = undefined

    if (rpcUrl) {
      let rpcNetId: number | undefined = undefined
      
      provider = rpcUrl.startsWith('http')
        ? new HttpProvider(rpcUrl, rpcOptions)
        : new WebsocketProvider(rpcUrl, rpcOptions)
      
      try {
        rpcNetId = await getNetId(provider)
      } catch(err) {
        console.log('Can\'t connect to URL', rpcUrl, err)
        provider = undefined
      }

      if (rpcNetId) {
        if (netId !== null && netId !== undefined && netId !== rpcNetId) { 
          throw new Error('RPC netId !== provided netId')
        }
        netId = rpcNetId
      }
    }
    if (netId === null && netId === undefined) { throw Error('netId is undefined. Provide netId or rpcUrl') }

    const factoryOptions = { openWallet, netId: netId!, provider }

    const reducer: (index: number) => Promise<IWeb3Provider> = (index) => {
      if (index >= providers.length) { throw new Error("Can't find proper provider") }
      return providers[index].create(factoryOptions)
        .catch(() => reducer(index+1))
    }

    return reducer(0).then(provider => new Web3(provider))     
  }

  constructor(
    provider: IWeb3Provider,
  ) {
    super(new Proxy(provider, new Web3ProviderProxy()))
    this.hasClientWallet = provider.hasClientWallet
  }
}