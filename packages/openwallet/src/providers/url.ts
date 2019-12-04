import { IProvider, IRequest, ISubscribeRequest, IUnsubscribeRequest, Version, API } from '../types'

const isNodeJs = (typeof process === 'object') && (typeof process.versions.node !== 'undefined')
const iOS = !isNodeJs && /iPad|iPhone|iPod/.test(window.navigator.platform)

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
  supportsSubscriptions: boolean

  private static defaultTimeout: number = 300
  private static popupWaitingTimeout: number = 5

  private requestId: number
  private isWorking: boolean

  private sendTimeout?: any
  private messageQueue: Array<QueueMessage>
  
  private _version: string = Version.v1
  private unsupportedApis = [ API.Node ]

  public static instance(): CallbackURLProvider {
    if (!_INSTANCE) {
      _INSTANCE = new CallbackURLProvider()
    }
    return _INSTANCE
  }

  private constructor() {
    this.isActive = iOS
    this.supportsSubscriptions = false
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
      // base64url encoding with stripped padding https://tools.ietf.org/html/rfc4648#page-7
      let base64 = hash
        .substr("#openwallet-".length)
        .replace(/-/g, '+')
        .replace(/_/g, '/')
      if (base64.length % 4 > 0) {
        base64 += '='.repeat(4 - base64.length % 4)
      }
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

    // base64url encoding with stripped padding https://tools.ietf.org/html/rfc4648#page-7
    const data = btoa(JSON.stringify(message.message))
      .replace(/=+$/, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
    const api = message.type.toLowerCase().replace(/_/g, '-')

    this.sendTimeout = setTimeout(this.sendTimeoutHandler.bind(this), CallbackURLProvider.popupWaitingTimeout*1000)

    window.location.href = `${api}://?message=${data}&callback=${this.currentUrl()}`
  }

  private currentUrl() {
    return window.location.href.split("#")[0]
  }

  private hasApi(api: string, resolve: (has: any) => void, reject: (err: any) => void) {
    if (this.unsupportedApis.find(uApi => api.startsWith(uApi.toUpperCase()))) {
      reject({type: 'NOT_SUPPORTED', message: 'API is not supported'})
    } else {
      resolve(true)
    }
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

  send<Req extends IRequest<string, any, any>>(request: Req): Promise<NonNullable<Req['__TS_RESPONSE']>> {
    const id = ++this.requestId;
    return new Promise((resolve, reject) => {
      if (request.type === 'OPENWALLET_HAS_API') {
        this.hasApi(request.request.type, resolve, reject)
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

  subscribe<Req extends ISubscribeRequest<string, any, any>>(
    _request: Req, _listener: (message: NonNullable<Req['request']['__TS_MESSAGE']>) => void
  ): Promise<NonNullable<Req['__TS_RESPONSE']>> {
    throw new Error('NOT_SUPPORTED')
  }

  unsubscribe<Req extends IUnsubscribeRequest<string, any, any>>(
    _request: Req
  ): Promise<NonNullable<Req['__TS_RESPONSE']>> {
    throw new Error('NOT_SUPPORTED')
  }
}