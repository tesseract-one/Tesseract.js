import { IWeb3Provider, Web3ProviderOptions } from '../../types'
import { Ethereum } from '@tesseractjs/openwallet-ethereum'
import { Provider, JsonRPCRequest, JsonRPCResponse, Callback, WebsocketProvider } from 'web3/providers'
import { getChainId, promisifiedSend } from '../../rpc'
import { OpenWalletNodeProvider } from './node'
import { HANDLERS } from './handlers'


export class Web3OpenWalletProvider implements IWeb3Provider {
  hasClientWallet: boolean = true
  supportsSubscriptions: boolean

  private ethereum: Ethereum
  private provider: Provider

  private netId: number
  private chainId: Promise<string>

  get connected(): boolean {
    return (<any>this.provider).connected
  }

  constructor(netId: number, supportsSubscriptions: boolean, ethereum: Ethereum, provider: Provider) {
    this.netId = netId
    this.chainId = getChainId(provider)
    this.provider = provider
    this.supportsSubscriptions = supportsSubscriptions
    this.ethereum = ethereum
  }

  send(payload: JsonRPCRequest, callback: Callback<JsonRPCResponse>): void {
    this.chainId
      .then(chainId => {
        const handler = HANDLERS[payload.method]
        if (handler) {
          return handler(this.ethereum, payload, this.netId, chainId, this.provider)
            .then(result => ({ jsonrpc: payload.jsonrpc, id: payload.id, result } as JsonRPCResponse))
        }
        return promisifiedSend(this.provider, payload)
      })
      .then(response => {
        if (response.error) throw response.error
        callback(null, response)
      })
      .catch(err => callback(err))
  }

  on(type: string, callback: (message?: any) => any): void {
    if (!this.supportsSubscriptions) { throw new Error('Subscriptions is not supported') }
    (<WebsocketProvider>this.provider).on(type, callback)
  }

  removeListener(type: string, callback: (message?: any) => any): void {
    if (!this.supportsSubscriptions) { throw new Error('Subscriptions is not supported') }
    (<WebsocketProvider>this.provider).removeListener(type, callback)
  }

  reset() {
    if ((<any>this.provider).reset) {
      (<any>this.provider).reset()
    }
  }

  private static async createNative(ethereum: Ethereum, netId: number): Promise<Web3OpenWalletProvider> {
    if (!await ethereum.Node.canSend()) { throw new Error('Node API is not supported') }
    const supportedNetworks = await ethereum.Node.supportedNetworks()
    if (supportedNetworks.indexOf(netId) < 0) { throw new Error('Network is not supported: ' + netId)}
    const supportsSubscriptions = await ethereum.Node.canSubscribe()
    return new Web3OpenWalletProvider(netId, supportsSubscriptions, ethereum, new OpenWalletNodeProvider(ethereum, netId))
  }

  public static async create({ openWallet, provider, netId }: Web3ProviderOptions): Promise<IWeb3Provider> {
    const ethereum = new Ethereum(openWallet)
    if (!openWallet.hasOpenWallet) { throw new Error('OpenWallet is not supported') }
    if (!await ethereum.isKeychainInstalled()) { throw new Error('OpenWallet does not support Ethereum keychain') }
    try {
      return await this.createNative(ethereum, netId)
    } catch {
      if (provider) {
        const supportsSubscriptions = typeof (<any>provider).on === 'function'
        return new Web3OpenWalletProvider(netId, supportsSubscriptions, ethereum, provider)
      }
      throw new Error('Doesn\'t have any provider')
    }
  }
}
