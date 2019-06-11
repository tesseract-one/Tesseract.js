import { IWeb3Provider, Web3ProviderOptions } from '../types'
import { OpenWallet } from '@tesseractjs/openwallet'
import { Ethereum } from '@tesseractjs/openwallet-ethereum'
import { HttpProvider, WebsocketProvider, HttpProviderOptions } from 'web3-providers'

type Provider = (HttpProvider | WebsocketProvider) & IWeb3Provider
type SendMethod = (method: string, parameters: any[]) => Promise<any>

const HANDLERS: {
  [method: string]: (
    eth: Ethereum, method: string, parameters: any[], netId: number, chainId: string, provider: Provider
  ) => Promise<any>
} = {}

HANDLERS['eth_accounts'] = HANDLERS['eth_requestAccounts'] = HANDLERS['eth_coinbase'] = 
  function (eth, method, _, netId) {
    switch(method) {
      case 'eth_accounts': return eth.accounts(netId)
      case 'eth_requestAccounts': return eth.accounts(netId)
      case 'eth_coinbase': return eth.accounts(netId).then(accounts => accounts[0])
      default: return Promise.reject('Wrong method: ' + method)
    }
  }

HANDLERS['eth_signTypedData'] = HANDLERS['eth_signTypedData_v3'] =
  HANDLERS['personal_signTypedData'] = HANDLERS['personal_signTypedData_v3'] =
  function (eth, _, parameters, netId) {
    return eth.signTypedData(parameters[0], parameters[1], netId)
  }

HANDLERS['personal_sign'] = function (eth, _, parameters, netId) {
  return eth.signData(parameters[1], parameters[0], netId)
}

HANDLERS['eth_sign'] = function (eth, _, parameters, netId) {
  return eth.signData(parameters[0], parameters[1], netId)
}

HANDLERS['eth_sendTransaction'] = function (eth, _, params, netId, chainId, provider) {
  return eth
    .signTx(params[0], netId, chainId)
    .then(signed => provider.send('eth_sendRawTransaction', [signed]))
}

export class Web3OpenWalletProvider implements ProxyHandler<Provider> {
  public fallback: boolean
  public ethereum: Ethereum

  public netId?: number
  public chainId?: string

  constructor(openWallet: OpenWallet) {
    this.ethereum = new Ethereum(openWallet)
    this.fallback = false
  }

  public has(target: Provider, p: PropertyKey): boolean {
    switch (p) {
      case 'fallback': return true
      case 'ethereum': return true
      default: return Reflect.has(target, p)
    }
  }

  public get(target: Provider, p: PropertyKey, receiver: any): any {
    switch (p) {
      case 'fallback': return this.fallback
      case 'ethereum': return this.ethereum
      case 'send': return this._wrapSend(target)
      default: return Reflect.get(target, p, receiver)
    }
  }

  public set(target: Provider, p: PropertyKey, value: any, receiver: any): boolean {
    switch (p) {
      case 'fallback': return false
      case 'ethereum':
        this.ethereum = value
        return true
      default: return Reflect.set(target, p, value, receiver)
    }
  }

  public ownKeys(target: Provider): PropertyKey[] {
    return Reflect.ownKeys(target).concat(['fallback', 'ethereum'])
  }

  private _getNetId(provider: Provider): Promise<number> {
    if (this.netId) {
      return Promise.resolve(this.netId)
    }
    return provider.send('net_version', []).then(version => this.netId = parseInt(version, 10))
  }

  private _getChainId(provider: Provider): Promise<string> {
    if (this.chainId) {
      return Promise.resolve(this.chainId)
    }
    return provider.send('eth_chainId', []).then(chainId => this.chainId = chainId)
  }

  private _wrapSend(target: Provider): SendMethod {
    return (method, parameters) => {
      let handler = HANDLERS[method]
      return handler
        ? Promise.all([this._getChainId(target), this._getNetId(target)])
          .then(([chainId, netId]) => handler(this.ethereum, method, parameters, netId, chainId, target)) 
        : target.send(method, parameters)
    }
  }

  public static create({ openWallet, rpcUrl, options }: Web3ProviderOptions): Promise<IWeb3Provider> {
    return Promise.resolve(openWallet.hasOpenWallet)
      .then(has => has ? openWallet.Ethereum.isKeychainInstalled() : false)
      .then(has => {
        if (!has) { throw new Error("Can't be created") }
      })
      .then(() => {
        var provider: HttpProvider | WebsocketProvider
        if (rpcUrl.startsWith('ws')) {
          provider = new WebsocketProvider(rpcUrl, options)
        } else if (rpcUrl.startsWith('http')) {
          provider = new HttpProvider(rpcUrl, options as HttpProviderOptions)
        } else {
          throw new Error('Bad rpc url: ' + rpcUrl)
        }
        return new Proxy(provider as Provider, new Web3OpenWalletProvider(openWallet))
      })
  }
}
