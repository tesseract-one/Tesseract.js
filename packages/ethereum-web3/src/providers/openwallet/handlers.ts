import { Ethereum, Transaction } from '@tesseractjs/openwallet-ethereum'
import { Provider, JsonRPCRequest } from 'web3/providers'
import { promisifiedSend, getTransactionCount, estimateGas, getGasPrice } from '../../rpc'
import { Web3, eth, Jsonrpc } from '../../libs'

function buildSignedTransaction(tx: Transaction, signature: string): string {
  const [v, r, s] = eth.account.decodeSignature(signature)
  const rlpData = [
    eth.bytes.fromNat(tx.nonce), eth.bytes.fromNat(tx.gasPrice),
    eth.bytes.fromNat(tx.gas), tx.to ? tx.to.toLowerCase() : '0x',
    eth.bytes.fromNat(tx.value), tx.data ? tx.data : '0x', v, r, s
  ]
  return eth.RLP.encode(rlpData)
}

export const HANDLERS: {
  [method: string]: (
    eth: Ethereum, request: JsonRPCRequest, netId: number, chainId: string, provider: Provider
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
  }

HANDLERS['personal_sign'] = function (eth, request, netId) {
  return eth.signData(request.params[1], request.params[0], netId)
}

HANDLERS['eth_sign'] = function (eth, request, netId) {
  return eth.signData(request.params[0], request.params[1], netId)
}

HANDLERS['eth_sendTransaction'] = async function (eth, request, netId, chainId, provider) {
  const tx: Transaction = request.params[0]
  if (!tx.nonce) { tx.nonce = await getTransactionCount(provider, tx.from) }
  if (!tx.gasPrice) { tx.gasPrice = Web3.utils.toHex(await getGasPrice(provider)) }
  if (!tx.gas) { tx.gas = Web3.utils.toHex((await estimateGas(provider, tx)).muln(1.3)) }
  const oldData = tx.data
  tx.data = tx.data ? btoa(String.fromCharCode(...Web3.utils.hexToBytes(tx.data))) : ''
  const signature = await eth.signTx(tx, netId, chainId)
  tx.data = oldData
  const sendRawReq = Jsonrpc.toPayload('eth_sendRawTransaction', [buildSignedTransaction(tx, signature)])
  const response = await promisifiedSend(provider, sendRawReq) 
  if (response.error) throw response.error
  return response
}