import { TesseractModule } from '@tesseract/core'
import { Ethereum } from './ethereum'
import "@tesseract/openwallet"
import "@tesseract/openwallet-ethereum"

declare module '@tesseract/core' {
  interface TesseractModule {
    Ethereum: Ethereum
  }
}

TesseractModule.addPlugin("Ethereum", (tesseract) => {
  return new Ethereum(tesseract.OpenWallet)
})

export { Ethereum }