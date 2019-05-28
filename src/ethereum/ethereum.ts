import { OpenWallet } from '../openwallet'

export class Ethereum {
  public openWallet: OpenWallet

  constructor(openWallet: OpenWallet) {
    this.openWallet = openWallet
  }
}