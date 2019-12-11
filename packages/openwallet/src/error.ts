import { IOpenWallet } from './interface'
import { isNodeJs, isIOS, isAndroid } from './helpers'

const popupId = 'tesseract-wallet-is-not-installed-popup'
const popupStyleId = 'tesseract-wallet-is-not-installed-popup-style'

const popupStyle = `
  <style id="${popupStyleId}" type="text/css">
    #${popupId} {
      position: fixed;
      z-index: 9999;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      display: block;
      background-color: rgba(0, 0, 0, 0.64);
      overflow: auto;
      animation: ${popupId}-fadeIn .3s ease;
    }
    #${popupId}.hide {
      animation: ${popupId}-fadeOut .3s ease;
    }
    #${popupId} .container {
      position: fixed;
      z-index: 999;
      top: 50%;
      left: 50%;
      width: 85vw;
      max-width: 400px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transform: translate(-50%,-50%);
      overflow: hidden;
    }
    #${popupId} .content {
      padding: 40px 24px;
      position: relative;
      border-radius: 24px;
      width: 100%;
      background-color: #fff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    #${popupId} .title {
      line-height: 28px;
      font-size: 24px;
      text-align: center;
    }
    #${popupId} .description {
      margin-top: 16px;
      padding: 0;
      line-height: 24px;
      font-size: 16px;
      text-align: center;
      opacity: .64;
    }
    #${popupId} .store-button-ios {
      overflow:hidden;
      margin-top: 24px;
      width:135px;
      height:40px;
      cursor: pointer;
    }
    #${popupId} .close-button {
      margin-top: 24px;
      cursor: pointer;
      width: 100%;
      height: 50px;
      border-radius: 12px;
      background-color: #fff;
      font-size: 18px;
      font-weight: 500;
      color: #000;
    }
    @keyframes ${popupId}-fadeIn {
      0% {
        opacity: 0;
      }
      100% {
        opacity: 1;
      }
    }
    @keyframes ${popupId}-fadeOut {
      0% {
        opacity: 1;
      }
      100% {
        opacity: 0;
      }
    }
  </style>
`

const storeUrls = {
  iOS: "https://apps.apple.com/us/app/tesseract-wallet/id1459505103?mt=8",
  android: null,
  unknown: null
}

const popupHtml = `
  <div id="${popupId}">
    <div class="container">
      {{body}}
      <button class="close-button">Close</button>
    </div>
  </div>
`

const iOSHtml = `
  <div class="content">
    <span class="title">Install Wallet</span>
    <p class="description">To use this dApp you have to install Tesseract protocol compatible wallet from the AppStore</p>
    <img
      src="https://linkmaker.itunes.apple.com/en-us/badge-lrg.svg?releaseDate=2019-05-01&kind=iossoftware&bubble=ios_apps"
      class="store-button store-button-ios"
    ></img>
  </div>
`

const androidHtml = `
  <div class="content">
    <span class="title">Install Wallet</span>
    <p class="description">Android is not supported yet.<br>We are working on it!</p>
  </div>
`

const unknowPlatformHtml = `
  <div class="content">
    <span class="title">Install Wallet</span>
    <p class="description">Sorry, your platform is not supported yet.</p>
  </div>
`

function close() {
  const popup = document.getElementById(popupId)!
  popup.addEventListener('animationend', function () { this.remove() })
  popup.classList.add('hide')
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