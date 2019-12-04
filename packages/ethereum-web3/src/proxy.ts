import { AnyWeb3Provider } from './types'

type Provider = AnyWeb3Provider

export class Web3ProviderProxy implements ProxyHandler<Provider> {
  public has(target: Provider, p: PropertyKey): boolean {
    switch (p) {
      case 'on': return target.supportsSubscriptions()
      default: return Reflect.has(target, p)
    }
  }

  public get(target: Provider, p: PropertyKey, receiver: any): any {
    switch (p) {
      case 'on': return target.supportsSubscriptions() ? Reflect.get(target, p, receiver) : undefined
      default: return Reflect.get(target, p, receiver)
    }
  }

  public ownKeys(target: Provider): PropertyKey[] {
    if (!target.supportsSubscriptions()) {
      const keys = Reflect.ownKeys(target)
      keys.splice(keys.indexOf('on'), 1)
      return keys
    }
    return Reflect.ownKeys(target)
  }
}