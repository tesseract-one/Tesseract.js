import { AnyWeb3Provider } from './types'
import { JsonRpcPayload, JsonRpcResponse } from 'web3-core-helpers'
import { Transaction } from '@tesseractjs/openwallet-ethereum'
import { Web3, BN, Jsonrpc } from './libs'

export function promisifiedSend(provider: AnyWeb3Provider, request: JsonRpcPayload): Promise<JsonRpcResponse> {
  return new Promise((resolve, reject) => {
    provider.send(request, (error: Error | null, response?: JsonRpcResponse) => {
      if (error) { reject(error) } else { resolve(response) }
    })
  })
}

export function getNetId(provider: AnyWeb3Provider): Promise<number> {
  const request = Jsonrpc.toPayload('net_version', [])
  return promisifiedSend(provider, request)
    .then(response => {
      if (response.error) { throw response.error }
      return parseInt(response.result, 10)
    })
}

export function getChainId(provider: AnyWeb3Provider): Promise<string> {
  const request = Jsonrpc.toPayload('eth_chainId', [])
  return promisifiedSend(provider, request)
    .then(response => {
      if (response.error) { throw response.error }
      return response.result
    })
}

export function estimateGas(provider: AnyWeb3Provider, tx: Transaction): Promise<BN> {
  const request = Jsonrpc.toPayload('eth_estimateGas', [tx])
  return promisifiedSend(provider, request)
    .then(response => {
      if (response.error) { throw response.error }
      return Web3.utils.toBN(response.result)
    })
}

export function getGasPrice(provider: AnyWeb3Provider): Promise<BN> {
  const request = Jsonrpc.toPayload('eth_gasPrice', [])
  return promisifiedSend(provider, request)
    .then(response => {
      if (response.error) { throw response.error }
      return Web3.utils.toBN(response.result)
    })
}

export function getTransactionCount(provider: AnyWeb3Provider, address: string): Promise<string> {
  const request = Jsonrpc.toPayload('eth_getTransactionCount', [address, 'pending'])
  return promisifiedSend(provider, request)
    .then(response => {
      if (response.error) { throw response.error }
      return response.result
    })
}