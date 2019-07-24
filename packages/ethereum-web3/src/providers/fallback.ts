import { IWeb3Provider, Web3ProviderOptions } from '../types'
import { WebsocketProvider, HttpProvider, } from 'web3/providers'


type Provider = (HttpProvider | WebsocketProvider) & IWeb3Provider

export class Web3FallbackProvider implements ProxyHandler<Provider> {
  
  public has(target: Provider, p: PropertyKey): boolean {
    switch (p) {
      case 'hasClientWallet': return true
      case 'supportsSubscriptions': return true
      default: return Reflect.has(target, p)
    }
  }

  public get(target: Provider, p: PropertyKey, receiver: any): any {
    switch (p) {
      case 'hasClientWallet': return false
      case 'supportsSubscriptions': return Reflect.get(target, 'on', receiver) !== undefined
      default: return Reflect.get(target, p, receiver)
    }
  }

  public set(target: Provider, p: PropertyKey, value: any, receiver: any): boolean {
    switch (p) {
      case 'hasClientWallet': return false
      case 'supportsSubscriptions': return false
      default: return Reflect.set(target, p, value, receiver)
    }
  }

  public ownKeys(target: Provider): PropertyKey[] {
    return Reflect.ownKeys(target).concat(['hasClientWallet', 'supportsSubscriptions'])
  }

  public static async create({ provider }: Web3ProviderOptions): Promise<IWeb3Provider> {
    if (!provider) { throw new Error('provider is undefined')}
    return new Proxy(provider as Provider, new Web3FallbackProvider()) 
  }
}