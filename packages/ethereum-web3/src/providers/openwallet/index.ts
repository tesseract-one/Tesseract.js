import { ITesseractWeb3Provider, TesseractWeb3ProviderOptions, AnyWeb3Provider, IWeb3Provider } from '../../types'
import { Ethereum } from '@tesseractjs/openwallet-ethereum'
import { JsonRpcPayload, JsonRpcResponse } from 'web3-core-helpers'
import { getChainId, promisifiedSend } from '../../rpc'
import { OpenWalletNodeProvider } from './node'
import { HANDLERS } from './handlers'


export class Web3OpenWalletProvider implements ITesseractWeb3Provider {
  hasClientWallet: boolean = true
  
  private ethereum: Ethereum
  private provider: AnyWeb3Provider

  private netId: number
  private chainId: Promise<string>

  get connected(): boolean {
    return this.provider.connected
  }

  supportsSubscriptions(): boolean {
    return this.provider.supportsSubscriptions()
  }

  constructor(netId: number, ethereum: Ethereum, provider: AnyWeb3Provider) {
    this.netId = netId
    this.chainId = getChainId(provider)
    this.provider = provider
    this.ethereum = ethereum
  }

  send(payload: JsonRpcPayload, callback: (error: Error | null, result?: JsonRpcResponse) => void): void {
    this.chainId
      .then(chainId => {
        const handler = HANDLERS[payload.method]
        if (handler) {
          return handler(this.ethereum, payload, this.netId, chainId, this.provider)
            .then(result => ({ jsonrpc: payload.jsonrpc, id: payload.id, result } as JsonRpcResponse))
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
    if (!this.supportsSubscriptions()) { throw new Error('Subscriptions is not supported') }
    (<IWeb3Provider>this.provider).on(type, callback)
  }

  removeListener(type: string, callback: (message?: any) => any): void {
    if (!this.supportsSubscriptions()) { throw new Error('Subscriptions is not supported') }
    (<IWeb3Provider>this.provider).removeListener(type, callback)
  }

  reset() {
    if (typeof (<any>this.provider).reset === 'function') {
      (<any>this.provider).reset()
    }
  }

  private static async createNative(ethereum: Ethereum, netId: number): Promise<Web3OpenWalletProvider> {
    const provider = await OpenWalletNodeProvider.create(ethereum, netId)
    return new Web3OpenWalletProvider(netId, ethereum, provider)
  }

  public static async create({ openWallet, provider, netId }: TesseractWeb3ProviderOptions): Promise<ITesseractWeb3Provider> {
    const ethereum = new Ethereum(openWallet)
    if (!openWallet.hasOpenWallet) { throw new Error('OpenWallet is not supported') }
    if (!await ethereum.isKeychainInstalled()) { throw new Error('OpenWallet does not support Ethereum keychain') }
    try {
      return await this.createNative(ethereum, netId)
    } catch {
      if (!provider) { throw new Error('Doesn\'t have any provider') }
      return new Web3OpenWalletProvider(netId, ethereum, provider)
    }
  }
}
