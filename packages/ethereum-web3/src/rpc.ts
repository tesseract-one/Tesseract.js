import { JsonRPCRequest, JsonRPCResponse, Provider } from 'web3/providers'
import { Transaction } from '@tesseractjs/openwallet-ethereum'
import Web3 from 'web3'
import BN from 'bn.js'

interface IJsonRpc {
  messageId: number

  toPayload(method: string, params: any[]): JsonRPCRequest
  isValidResponse(response: JsonRPCResponse): boolean
  toBatchPayload(messages: Array<{ method: string, params: any[] }>): JsonRPCRequest[]
}

export const Jsonrpc: IJsonRpc = require('web3-core-requestmanager/src/jsonrpc')

export function promisifiedSend(provider: Provider, request: JsonRPCRequest): Promise<JsonRPCResponse> {
  return new Promise((resolve, reject) => {
    provider.send(request, (error: Error | null, response?: JsonRPCResponse) => {
      if (error) { reject(error) } else { resolve(response) }
    })
  })
}

export function getNetId(provider: Provider): Promise<number> {
  const request = Jsonrpc.toPayload('net_version', [])
  return promisifiedSend(provider, request)
    .then(response => {
      if (response.error) { throw response.error }
      return Web3.utils.hexToNumber(response.result)
    })
}

export function getChainId(provider: Provider): Promise<string> {
  const request = Jsonrpc.toPayload('eth_chainId', [])
  return promisifiedSend(provider, request)
    .then(response => {
      if (response.error) { throw response.error }
      return response.result
    })
}

export function estimateGas(provider: Provider, tx: Transaction): Promise<BN> {
  const request = Jsonrpc.toPayload('eth_estimateGas', [tx])
  return promisifiedSend(provider, request)
    .then(response => {
      if (response.error) { throw response.error }
      return Web3.utils.toBN(response.result)
    })
}

export function getGasPrice(provider: Provider): Promise<BN> {
  const request = Jsonrpc.toPayload('eth_gasPrice', [])
  return promisifiedSend(provider, request)
    .then(response => {
      if (response.error) { throw response.error }
      return Web3.utils.toBN(response.result)
    })
}

export function getTransactionCount(provider: Provider, address: string): Promise<string> {
  const request = Jsonrpc.toPayload('eth_getTransactionCount', [address, 'pending'])
  return promisifiedSend(provider, request)
    .then(response => {
      if (response.error) { throw response.error }
      return response.result
    })
}