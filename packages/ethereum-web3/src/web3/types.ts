import { OpenWallet } from '@tesseract/openwallet'
import { AbstractMethod } from 'web3-core-method'
import { AbstractWeb3Module } from 'web3-core'
import { WebsocketProviderOptions, HttpProviderOptions } from 'web3-providers'

export interface IWeb3Provider {
  fallback: boolean

  host: string;

  supportsSubscriptions(): boolean;

  send(method: string, parameters: any[]): Promise<any>;

  sendBatch(methods: AbstractMethod[], moduleInstance: AbstractWeb3Module): Promise<any[]>;
}

export type Web3ProviderOptions = {
  rpcUrl: string,
  openWallet: OpenWallet,
  options?: HttpProviderOptions | WebsocketProviderOptions
}

export interface IWeb3ProviderFactory {
  create(options: Web3ProviderOptions): Promise<IWeb3Provider>
}