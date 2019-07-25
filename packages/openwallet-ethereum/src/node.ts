
import { INodeRequest, INodeSubscribeRequest } from  '@tesseractjs/openwallet'
import { HexString, Quantity } from './keychain'

export { NodeSubscriptionType } from '@tesseractjs/openwallet'

export interface IEthereumNodeRequest<Method extends string, Response> extends INodeRequest<Response> {
  method: Method
  networkId: number
  params: Array<any>
}

export interface IEthereumNodeNetworksRequest extends IEthereumNodeRequest<'opw_supportedNetworks', Array<number>> {}

export interface IEthereumNodeUnsubscribeMessage {
  method: 'eth_unsubscribe'
  networkId: number
  params: [HexString]
}

export interface IEthereumNodeSubscriptionMessage<Result> {
  method: 'eth_subscription'
  params: {
    subscription: HexString
    result: Result
  }
}

export interface IEthereumNodeSubscribeRequest<Params extends Array<any>, Message> 
  extends INodeSubscribeRequest<IEthereumNodeSubscriptionMessage<Message>, HexString, IEthereumNodeUnsubscribeMessage, boolean> {
  method: 'eth_subscribe'
  networkId: number
  params: Params
}

export type IEthereumNodeSubscriptionNewHeadsResult = {
  difficulty: Quantity,
  extraData: HexString,
  gasLimit: Quantity,
  gasUsed: Quantity,
  logsBloom: HexString,
  miner: HexString,
  nonce: Quantity,
  number: Quantity,
  parentHash: HexString,
  receiptRoot: HexString,
  sha3Uncles: HexString,
  stateRoot: HexString,
  timestamp: Quantity,
  transactionsRoot: HexString
}

export type IEthereumNodeSubscriptionLogsParams = [
  'logs',
  { address?: HexString, topics?: Array<HexString> }
]

export type IEthereumNodeSubscribeLogsResult = {
  address: HexString
  blockHash: HexString
  blockNumber: Quantity
  data: HexString
  logIndex: HexString
  topics: Array<HexString>
  transactionHash: HexString
  transactionIndex: Quantity
}

export type IEthereumNodeSyncingResult = {
  syncing: boolean
  status: {
    startingBlock: number
    currentBlock: number
    highestBlock: number
    pulledStates: number
    knownStates: number
  }
}

export interface IEthereumNodeSubscribeNewHeads
  extends IEthereumNodeSubscribeRequest<['newHeads'], IEthereumNodeSubscriptionNewHeadsResult> {}

export interface IEthereumNodeSubscribeLogs
  extends IEthereumNodeSubscribeRequest<IEthereumNodeSubscriptionLogsParams, IEthereumNodeSubscribeLogsResult> {}

export interface IEthereumNodeSubscribeNewPendingTransactions
  extends IEthereumNodeSubscribeRequest<['newPendingTransactions'], HexString> {}

export interface IEthereumNodeSubscribeSyncing
  extends IEthereumNodeSubscribeRequest<['syncing'], IEthereumNodeSyncingResult> {}
