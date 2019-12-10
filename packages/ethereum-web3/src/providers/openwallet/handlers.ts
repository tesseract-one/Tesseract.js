import { Ethereum, Transaction } from '@tesseractjs/openwallet-ethereum'
import { AnyWeb3Provider } from '../../types'
import { JsonRpcPayload } from 'web3-core-helpers'
import { promisifiedSend, getTransactionCount, estimateGas, getGasPrice } from '../../rpc'
import { Web3, eth, Jsonrpc, BN } from '../../libs'

function buildSignedTransaction(tx: Transaction, signature: string, chainId: BN): string {
  tx.data = tx.data || '0x'
  const rlpData = eth.transaction.signingData(tx)
  const rawTransaction = eth.RLP.decode(rlpData)
    .slice(0, 6)
    .concat(eth.account.decodeSignature(signature))
  const fixedV = Web3.utils.toBN(rawTransaction[6]).add(chainId.muln(2).addn(8))
  rawTransaction[6] = eth.bytes.fromNat(Web3.utils.toHex(fixedV))
  return eth.RLP.encode(rawTransaction)
}

export const HANDLERS: {
  [method: string]: (
    eth: Ethereum, request: JsonRpcPayload, netId: number, chainId: string, provider: AnyWeb3Provider
  ) => Promise<any>
} = {}

HANDLERS['eth_accounts'] = HANDLERS['eth_requestAccounts'] = HANDLERS['eth_coinbase'] = 
  function (eth, request, netId) {
    switch(request.method) {
      case 'eth_accounts': return eth.accounts(netId)
      case 'eth_requestAccounts': return eth.accounts(netId)
      case 'eth_coinbase': return eth.accounts(netId).then(accounts => accounts[0])
      default: return Promise.reject('Wrong method: ' + request.method)
    }
  }

HANDLERS['eth_signTypedData'] = HANDLERS['eth_signTypedData_v3'] =
  HANDLERS['personal_signTypedData'] = HANDLERS['personal_signTypedData_v3'] =
  function (eth, request, netId) {
    return eth.signTypedData(request.params[0], request.params[1], netId)
      .then(data => Web3.utils.asciiToHex(atob(data)))
  }

HANDLERS['personal_sign'] = function (eth, request, netId) {
  return eth.signData(request.params[1], request.params[0], netId)
    .then(data => Web3.utils.asciiToHex(atob(data)))
}

HANDLERS['eth_sign'] = function (eth, request, netId) {
  return eth.signData(request.params[0], request.params[1], netId)
    .then(data => Web3.utils.asciiToHex(atob(data)))
}

HANDLERS['eth_sendTransaction'] = async function (eth, request, netId, chainId, provider) {
  const tx: Transaction = request.params[0]
  if (!tx.nonce) { tx.nonce = await getTransactionCount(provider, tx.from) }
  if (!tx.gasPrice) { tx.gasPrice = Web3.utils.toHex(await getGasPrice(provider)) }
  if (!tx.gas) { tx.gas = Web3.utils.toHex((await estimateGas(provider, tx)).muln(1.3)) }
  const oldData = tx.data
  tx.data = tx.data ? btoa(String.fromCharCode(...Web3.utils.hexToBytes(tx.data))) : ''
  const signature = Web3.utils.asciiToHex(atob(await eth.signTx(tx, netId, chainId)))
  tx.data = oldData
  const sendRawReq = Jsonrpc.toPayload(
    'eth_sendRawTransaction',
    [buildSignedTransaction(tx, signature, Web3.utils.toBN(chainId))]
  )
  const response = await promisifiedSend(provider, sendRawReq) 
  if (response.error) throw response.error
  return response.result
}