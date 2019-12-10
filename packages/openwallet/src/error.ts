import { IOpenWallet } from './interface'
import { isNodeJs, isIOS, isAndroid } from './helpers'

const popupId = 'tesseract-wallet-is-not-installed-popup'
const popupStyleId = 'tesseract-wallet-is-not-installed-popup-style'

const popupStyle = `
  <style id="${popupStyleId}" type="text/css">
    #${popupId} {
      position: fixed;
      z-index: 2000;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      display: block;
      background-color: rgba(11, 15, 44, 0.64);
      overflow: auto;
      animation: ${popupId}-fadeIn .3s ease;
    }
    #${popupId} .container {
      position: fixed;
      padding: 16px;
      z-index: 999;
      top: 50%;
      left: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 24px;
      background-color: #fff;
      transform: translate(-50%,-50%);
      overflow: hidden;
    }
    #${popupId} .content {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    @keyframes ${popupId}-fadeIn {
      0% {
        opacity: 0;
      }
      100% {
        opacity: 1;
      }
    }
  </style>
`

const storeUrls = {
  iOS: "https://apps.apple.com/us/app/id1459505103",
  android: null,
  unknown: null
}

const popupHtml = `
  <div id="${popupId}">
    <div class="container">
      {{body}}
      <button class="close-button">OK</button>
    </div>
  </div>
`

const iOSHtml = `
  <div class="content">
    <p>Wallet is not installed.</p>
    <button class="store-button">
      Go to AppStore
    </button>
  </div>
`

const androidHtml = `
  <div class="content">
    <p>Wallet is not installed.</p>
    <p>Android is not supported yet.</p>
    <p>We are working on it!</p>
  </div>
`

const unknowPlatformHtml = `
  <div class="content">
    <p>Wallet is not installed.</p>
    <p>Platform is not supported</p>
  </div>
`

function close() {
  document.getElementById(popupId)!.remove();
}

function openUrl(url: string) {
  close()
  window.open(url, "_blank")
}

export function walletIsNotInstalledDefaultErrorHandler(openWallet: IOpenWallet) {
  console.error("Wallet is not installed. Provider: ", openWallet.provider!.constructor.name)

  if (!isNodeJs) {
    if (!document.getElementById(popupStyleId)) {
      document.head.insertAdjacentHTML('beforeend', popupStyle.trim())
    }
    if (!document.getElementById(popupId)) {
      const body = isIOS
        ? iOSHtml
        : isAndroid ? androidHtml : unknowPlatformHtml
      const html = popupHtml.replace("{{body}}", body.trim()).trim()
      document.body.insertAdjacentHTML('beforeend', html)

      const popup = document.getElementById(popupId)!

      const closeButton = popup.getElementsByClassName('close-button')[0] as HTMLElement
      if (closeButton) {
        closeButton.onclick = close
      }

      const appStoreButton = document.getElementsByClassName('store-button')[0] as HTMLElement
      if (appStoreButton) {
        const url = storeUrls[isIOS ? "iOS" : isAndroid ? "android" : "unknown"];
        appStoreButton.onclick = () => url && openUrl(url)
      }
    }
  }
}