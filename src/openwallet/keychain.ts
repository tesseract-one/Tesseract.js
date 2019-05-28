import { OpenWallet } from './openwallet'
import { IRequest, Network, API } from './types'

export interface IKeychainRequest<Method extends string, Response> {
  method: Method
  __TS_RESPONSE?: Response
}

declare module './openwallet' {
  interface OpenWallet {
    keychain<Res, Req extends IKeychainRequest<string, Res>>(net: Network, request: Req): Promise<Res>
  }
}

OpenWallet.prototype.keychain = function<Res, Req extends IKeychainRequest<string, Res>>(net: Network, request: Req) {
  const owReq = {
    type: `OPENWALLET_${API.Keychain}_${net}`,
    request
  }
  return this.send<Res, IRequest<string, Req, Res>>(owReq)
}