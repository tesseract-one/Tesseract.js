import { IProvider, IRequest, Version } from './types'

const iOS = !!navigator && !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform)

var _INSTANCE: CallbackURLProvider | undefined = undefined

type OWResponse = {
  id: number,
  version: string,
  response?: any,
  error?: OWError
}

type OWError = {
  type: string,
  message: string
}

type OWRequest = {
  id: number,
  version: string,
  request: any
}

type QueueMessage = {
  type: string,
  message: OWRequest,
  time: number,
  callback: (error?: OWError, result?: any) => void
}

export class CallbackURLProvider implements IProvider {
  isActive: boolean
  isNative: boolean

  private static defaultTimeout: number = 300
  private static popupWaitingTimeout: number = 5

  private requestId: number
  private isWorking: boolean

  private sendTimeout?: any
  private messageQueue: Array<QueueMessage>
  
  private _version: string = Version.v1

  public static instance(): CallbackURLProvider {
    if (!_INSTANCE) {
      _INSTANCE = new CallbackURLProvider()
    }
    return _INSTANCE
  }

  private constructor() {
    this.isNative = false
    this.isActive = iOS
    this.isWorking = false
    this.messageQueue = []
    this.requestId = 0
  }

  private onHashChange() {
    const hash = window.location.hash
    if (!hash.startsWith("#openwallet-")) { return }

    window.history.replaceState({}, document.title, this.currentUrl())

    var response: OWResponse
    try {
      const base64 = decodeURIComponent(hash.substr("#openwallet-".length))
      response = JSON.parse(atob(base64))
    } catch(error) {
      console.error("Response parsing error: ", error)
      this.sendMessage()
      return
    }
    this.response(response)
  }

  private response(response: OWResponse) {
    if (this.messageQueue.length === 0) {
      console.error("Unhandled response:", response)
      return
    }
    if (this.messageQueue[0].message.id !== response.id ) {
      console.error("Wrong response:", response, "waiting for:", this.messageQueue[0].message.id)
      const failed = this.messageQueue.filter(m => m.message.id < response.id)
      this.messageQueue = this.messageQueue.filter(m => m.message.id >= response.id)
      for (const message of failed) {
        message.callback({type: 'WRONG_MESSAGE_ID', message: `Got wrong message id: ${response.id}`})
      }
      if (this.messageQueue.length === 0 || this.messageQueue[0]!.message.id !== response.id) {
        this.sendMessage()
        return
      }
    }

    const queueMessage = this.messageQueue.shift()!

    if (this.sendTimeout) {
      clearTimeout(this.sendTimeout)
      this.sendTimeout = undefined
    }
    
    queueMessage.callback(response.error, response.response)

    this.sendMessage()
  }

  private onVisibilityChange() {
    if (document.hidden && this.sendTimeout) {
      clearTimeout(this.sendTimeout)
      this.sendTimeout = undefined
    }
  }

  private sendTimeoutHandler() {
    this.sendTimeout = undefined
    const message = this.messageQueue.shift()!

    message.callback({type: 'NOT_INSTALLED', message: 'OpenWallet is not installed'})
  }

  private timeoutHandler() {
    const time = Date.now() - CallbackURLProvider.defaultTimeout*1000
    const timedOut = this.messageQueue.filter(m => m.time <= time)
    this.messageQueue = this.messageQueue.filter(m => m.time > time)

    for (const m of timedOut) {
      m.callback({type: 'TIMEOUT', message: 'Request is timed out'})
    }
  }

  private sendMessage() {
    if (this.messageQueue.length === 0) { return }
    const message = this.messageQueue[0]!

    const data = encodeURIComponent(btoa(JSON.stringify(message.message)))
    const api = message.type.toLowerCase().replace(/_/g, '-')

    this.sendTimeout = setTimeout(this.sendTimeoutHandler.bind(this), CallbackURLProvider.popupWaitingTimeout*1000)

    window.location.href = `${api}://?message=${data}&callback=${this.currentUrl()}`
  }

  private currentUrl() {
    return window.location.href.split("#")[0]
  }

  start() {
    if (!this.isWorking) {
      this.isWorking = true
      window.addEventListener('hashchange', this.onHashChange.bind(this), false)
      document.addEventListener('visibilitychange', this.onVisibilityChange.bind(this), false)
      setInterval(this.timeoutHandler.bind(this), 1000)
    }
  }

  version(): Promise<string> {
    return Promise.resolve(Version.v1)
  }

  send<Response, Request extends IRequest<string, any, Response>>(request: Request): Promise<Response> {
    const id = ++this.requestId;
    return new Promise((resolve, reject) => {
      if (request.type === 'OPENWALLET_HAS_API') {
        resolve(<any>true)
        return
      }

      const message: QueueMessage = {
        type: request.type,
        time: Date.now(),
        message: {
          id,
          version: this._version,
          request: request.request
        },
        callback(error, result) {
          if (error) {
            reject(error)
          } else {
            resolve(result)
          }
        }
      }

      this.messageQueue.push(message)
      if (this.messageQueue.length === 1) {
        this.sendMessage()
      }
    })
  }
}