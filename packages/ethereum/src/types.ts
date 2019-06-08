export type Quantity = string
export type HexString = string

export type Transaction = {
  nonce: Quantity
  from: HexString
  to?: HexString
  gas: Quantity
  gasPrice: Quantity
  value: Quantity
  data: HexString
}