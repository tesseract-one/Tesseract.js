
import { IKeychainRequest } from  '@tesseractjs/openwallet'
import { HexString, Quantity, Transaction } from '@tesseractjs/ethereum'


export interface IAccountRequest extends IKeychainRequest<"get_account", HexString> {
  networkId: number
}

export interface ISignTxRequest extends IKeychainRequest<"sign_transaction", HexString> {
  networkId: number
  nonce: Quantity
  from: HexString
  to?: HexString
  gas: Quantity
  gasPrice: Quantity
  value: Quantity
  data: HexString
  chainId: Quantity
}

export interface ISignDataRequest extends IKeychainRequest<"sign", HexString> {
  networkId: number
  account: HexString
  data: HexString
}

export interface ISignTypedDataRequest extends IKeychainRequest<"sign_typed_data", HexString> {
  networkId: number
  account: HexString
  data: object
}

export { HexString, Quantity, Transaction }