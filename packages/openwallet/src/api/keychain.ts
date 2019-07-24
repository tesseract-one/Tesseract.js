import { IRequest, Network, API } from '../types'
import { OpenWallet } from '../openwallet';

export interface IKeychainRequest<Method extends string, Response> {
  method: Method
  __TS_RESPONSE?: Response
}

declare module '../openwallet' {
  interface OpenWallet {
    Keychain: KeychainPlugin
  }
}

export class KeychainPlugin {
  private openWallet: OpenWallet

  constructor(openWallet: OpenWallet) {
    this.openWallet = openWallet
  }

  hasWallet(net: Network): Promise<boolean> {
    return this.openWallet.hasApi(API.Keychain, net.id)
  }

  send<Req extends IKeychainRequest<string, any>>(net: Network, request: Req): Promise<NonNullable<Req['__TS_RESPONSE']>> {
    const owReq = {
      type: `OPENWALLET_${API.Keychain}_${net.id}`,
      request
    }
    return this.openWallet.send<IRequest<string, Req, NonNullable<Req['__TS_RESPONSE']>>>(owReq)
  }
}
