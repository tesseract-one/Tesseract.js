import { IWeb3Provider, Web3ProviderOptions } from '../types'
import { Provider } from 'web3/providers'
import { getNetId } from '../rpc'

type AnyProvider = Provider & IWeb3Provider

export class Web3NativeProvider implements ProxyHandler<AnyProvider> {

  public has(target: AnyProvider, p: PropertyKey): boolean {
    switch (p) {
      case 'hasClientWallet': return true
      case 'supportsSubscriptions': return true
      default: return Reflect.has(target, p)
    }
  }

  public get(target: AnyProvider, p: PropertyKey, receiver: any): any {
    switch (p) {
      case 'hasClientWallet': return true
      case 'supportsSubscriptions': return Reflect.get(target, 'on', receiver) !== undefined
      default: return Reflect.get(target, p, receiver)
    }
  }

  public set(target: AnyProvider, p: PropertyKey, value: any, receiver: any): boolean {
    switch (p) {
      case 'hasClientWallet': return false
      case 'supportsSubscriptions': return false
      default: return Reflect.set(target, p, value, receiver)
    }
  }

  public ownKeys(target: AnyProvider): PropertyKey[] {
    return Reflect.ownKeys(target).concat(['hasClientWallet', 'supportsSubscriptions'])
  }

  private static async _fromProvider(provider: Provider, netId: number): Promise<IWeb3Provider> {
    const rpcNetId = await getNetId(provider)
    if (netId !== rpcNetId) { throw new Error('Provider has different netId') }
    return new Proxy(provider as AnyProvider, new Web3NativeProvider())
  }

  public static async create({ netId }: Web3ProviderOptions): Promise<IWeb3Provider> {
    if (!window) { throw new Error('Will work only in browser') }
    if ((<any>window).ethereum) {
      await (<any>window).ethereum.enable()
      return await this._fromProvider((<any>window).ethereum, netId)
    }
    if ((<any>window).web3 && (<any>window).web3.currentProvider) {
      return await this._fromProvider((<any>window).web3.currentProvider, netId)
    }
    throw new Error("Can't create provider")
  }
}