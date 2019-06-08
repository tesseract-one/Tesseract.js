import { IWeb3Provider, Web3ProviderOptions } from '../types'
import { WebsocketProvider, HttpProvider, HttpProviderOptions } from 'web3-providers'


type Provider = (HttpProvider | WebsocketProvider) & IWeb3Provider

export class Web3FallbackProvider implements ProxyHandler<Provider> {
  
  public has(target: Provider, p: PropertyKey): boolean {
    switch (p) {
      case 'fallback': return true
      default: return Reflect.has(target, p)
    }
  }

  public get(target: Provider, p: PropertyKey, receiver: any): any {
    switch (p) {
      case 'fallback': return true
      default: return Reflect.get(target, p, receiver)
    }
  }

  public set(target: Provider, p: PropertyKey, value: any, receiver: any): boolean {
    switch (p) {
      case 'fallback': return false
      default: return Reflect.set(target, p, value, receiver)
    }
  }

  public ownKeys(target: Provider): PropertyKey[] {
    return Reflect.ownKeys(target).concat(['fallback'])
  }

  public static create({ rpcUrl, options }: Web3ProviderOptions): Promise<IWeb3Provider> {
    return Promise.resolve().then(() => {
      var provider: HttpProvider | WebsocketProvider
      if (rpcUrl.startsWith('ws')) {
        provider = new WebsocketProvider(rpcUrl, options)
      } else if (rpcUrl.startsWith('http')) {
        provider = new HttpProvider(rpcUrl, options as HttpProviderOptions)
      } else {
        throw new Error('Bad rpc url: ' + rpcUrl)
      }
      return new Proxy(provider as Provider, new Web3FallbackProvider()) 
    })
  }
}