// File with types for Web3 libraries. Will emit empty js

declare module 'web3-core-requestmanager/src/jsonrpc' {
  import { JsonRpcPayload, JsonRpcResponse } from 'web3-core-helpers'

  interface IJsonRpc {
    messageId: number
    
    toPayload(method: string, params: any[]): JsonRpcPayload
    isValidResponse(response: JsonRpcResponse): boolean
    toBatchPayload(messages: Array<{ method: string, params: any[] }>): JsonRpcPayload[]
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

