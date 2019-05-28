import { IWeb3Provider } from '../types'
import { HttpProvider, IpcProvider, WebsocketProvider, Web3EthereumProvider, CustomProvider } from 'web3-providers'

type AnyProvider = (HttpProvider | IpcProvider | WebsocketProvider | Web3EthereumProvider | CustomProvider) & IWeb3Provider

export class Web3NativeProvider implements ProxyHandler<AnyProvider> {

  public has(target: AnyProvider, p: PropertyKey): boolean {
    switch (p) {
      case 'fallback': return true
      default: return Reflect.has(target, p)
    }
  }

  public get(target: AnyProvider, p: PropertyKey, receiver: any): any {
    switch (p) {
      case 'fallback': return false
      default: return Reflect.get(target, p, receiver)
    }
  }

  public set(target: AnyProvider, p: PropertyKey, value: any, receiver: any): boolean {
    switch (p) {
      case 'fallback': return false
      default: return Reflect.set(target, p, value, receiver)
    }
  }

  public ownKeys(target: AnyProvider): PropertyKey[] {
    return Reflect.ownKeys(target).concat(['fallback'])
  }

  public static create(): Promise<IWeb3Provider> {
    if ((<any>window).ethereum) {
      return (<Promise<void>>(<any>window).ethereum.enable())
        .then(() => new Proxy((<any>window).ethereum, new Web3NativeProvider()))
    }
    if ((<any>window).web3 && (<any>window).web3.currentProvider) {
      return Promise.resolve(new Proxy((<any>window).web3.currentProvider, new Web3NativeProvider()))
    }
    return Promise.reject(new Error("Can't create provider"))
  }
}