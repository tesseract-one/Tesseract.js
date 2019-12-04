import { OpenWallet } from '@tesseractjs/openwallet'
import { HttpProvider, WebsocketProvider } from 'web3-core'
export {
  HttpProviderOptions, WebsocketProviderOptions
} from 'web3-core-helpers'

import { JsonRpcPayload, JsonRpcResponse } from 'web3-core-helpers'

export enum Network {
  Main = 1,
  Ropsten = 3,
  Rinkeby = 4,
  Kovan = 42
}

export interface IWeb3Provider {
  connected: boolean

  supportsSubscriptions(): boolean;

  send(payload: JsonRpcPayload, callback: (error: Error | null, result?: JsonRpcResponse) => void): void;

  on(type: string, callback: (message?: any) => any): void;
  removeListener(type: string, callback: (message?: any) => any): void;
  
  reset(): void
}

export type AnyWeb3Provider = HttpProvider | WebsocketProvider | IWeb3Provider

export interface ITesseractWeb3Provider extends IWeb3Provider {
  hasClientWallet: boolean
}

export type TesseractWeb3ProviderOptions = {
  openWallet: OpenWallet
  netId: number
  provider?: AnyWeb3Provider
}

export interface ITesseractWeb3ProviderFactory {
  create(options: TesseractWeb3ProviderOptions): Promise<ITesseractWeb3Provider>
}