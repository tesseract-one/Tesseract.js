import { OpenWallet } from '@tesseractjs/openwallet'
import { Provider, JsonRPCRequest, JsonRPCResponse, Callback, HttpProvider, WebsocketProvider } from 'web3/providers'

export interface HttpProviderOptions {
  keepAlive?: boolean
  timeout?: number
  headers?: { [key: string]: string }
}

export interface WebsocketProviderOptions {
  timeout?: number
  headers?: { [key: string]: string }
  protocol?: string
  clientConfig?: string
}

export type HttpProviderConstructor = new (options?: HttpProviderOptions) => HttpProvider
export type WebsocketProviderConstructor = new (options?: WebsocketProviderOptions) => WebsocketProvider

export interface IWeb3Provider {
  hasClientWallet: boolean

  supportsSubscriptions: boolean

  connected: boolean

  send(payload: JsonRPCRequest, callback: Callback<JsonRPCResponse>): void;

  on(type: string, callback: (message?: any) => any): void;
  removeListener(type: string, callback: (message?: any) => any): void;
  reset(): void
}

export type Web3ProviderOptions = {
  openWallet: OpenWallet
  netId: number
  provider?: Provider
}

export interface IWeb3ProviderFactory {
  create(options: Web3ProviderOptions): Promise<IWeb3Provider>
}