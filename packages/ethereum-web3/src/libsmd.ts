// File with types for Web3 libraries. Will emit empty js

declare module 'web3-core-requestmanager/src/jsonrpc' {
  import { JsonRPCRequest, JsonRPCResponse } from 'web3/providers'

  interface IJsonRpc {
    messageId: number
    
    toPayload(method: string, params: any[]): JsonRPCRequest
    isValidResponse(response: JsonRPCResponse): boolean
    toBatchPayload(messages: Array<{ method: string, params: any[] }>): JsonRPCRequest[]
  }

  var Jsonrpc: IJsonRpc

  export = Jsonrpc
}

declare module 'eth-lib' {
  interface IAccount {
    decodeSignature(sig: string): [string, string, string]
  }

  interface IRLP {
    encode(data: any[]): string
  }

  interface IBytes {
    fromNat(nat: string): string
  }

  interface IEthLib {
    RLP: IRLP
    bytes: IBytes
    account: IAccount
  }

  var EthLib: IEthLib

  export = EthLib
}

declare module 'web3-providers-http' {
  import { HttpProvider } from 'web3/providers'

  interface Options {
    keepAlive?: boolean
    timeout?: number
    headers?: { [key: string]: string }
  }

  var Constructor: new (url: string, options?: Options) => HttpProvider

  export = Constructor
}

declare module 'web3-providers-ws' {
  import { WebsocketProvider } from 'web3/providers'

  interface Options {
    timeout?: number
    headers?: { [key: string]: string }
    protocol?: string
    clientConfig?: string
  }

  var Constructor: new (url: string, options?: Options) => WebsocketProvider

  export = Constructor
}
