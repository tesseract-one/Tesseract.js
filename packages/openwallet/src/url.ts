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

export class CallbackURLProvider implements IProvider {
  isActive: boolean
  isNative: boolean

  private static defaultTimeout: number = 300

  private requestId: number
  private isWorking: boolean
  private callbacks: { [id: number]: (error?: OWError, result?: any) => void }
  private timeouts: Array<[number, number]>
  private _version: string

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
    this._version = Version.v1
    this.callbacks = {}
    this.timeouts = []
    this.requestId = 0
  }

  private onhashchange() {
    const hash = window.location.hash
    if (!hash.startsWith("#openwallet-")) { return }

    window.history.replaceState({}, document.title, this.currentUrl())

    var response: OWResponse
    try {
      const base64 = decodeURIComponent(hash.substr("#openwallet-".length))
      response = JSON.parse(atob(base64))
    } catch(error) {
      console.error("Response parsing error: ", error)
      return
    }
    this.response(response)
  }

  private response(response: OWResponse) {
    if (response.id === undefined || this.callbacks[response.id] === undefined ) {
      console.error("Unhandled response:", response)
      return
    }

    const callback = this.callbacks[response.id]
    delete this.callbacks[response.id]
    this.timeouts = this.timeouts.filter(val => val[0] !== response.id)
    callback(response.error, response.response)
  }

  private checkTimeout() {
    const time = Date.now() - CallbackURLProvider.defaultTimeout*1000
    const outdated = this.timeouts.filter(val => val[1] <= time)
    
    for (const [id] of outdated) {
      this.response({ id, version: this._version, error: { type: "TIMEOUT", message: "Request is timed out" } })
    }
  }

  private sendMessage(type: string, message: OWRequest) {
    if (type === "OPENWALLET_HAS_API") {
      setTimeout(() => { 
        this.response({ id: message.id, version: message.version, response: true })
      }, 0)
      return
    }

    this.timeouts.push([message.id, Date.now()])
    const data = encodeURIComponent(btoa(JSON.stringify(message)))
    const api = type.toLowerCase().replace(/_/g, '-')
    this.open(`${api}://?message=${data}&callback=${this.currentUrl()}`)
  }

  private open(url: string) {
    const a = document.createElement('a')
    a.setAttribute('target', '_blank')
    a.setAttribute('href', url)
    a.setAttribute('style', 'display: none;')
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  private currentUrl() {
    return window.location.href.split("#")[0]
  }

  start() {
    if (!this.isWorking) {
      this.isWorking = true
      window.onhashchange = this.onhashchange.bind(this)
      setInterval(this.checkTimeout.bind(this), 1000)
    }
  }

  version(): Promise<string> {
    return Promise.resolve(Version.v1)
  }

  send<Response, Request extends IRequest<string, any, Response>>(request: Request): Promise<Response> {
    const id = ++this.requestId;
    return new Promise((resolve, reject) => {
      const req: OWRequest = {
        id,
        version: this._version,
        request: request.request
      }
      this.callbacks[id] = (error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      }
      this.sendMessage(request.type, req)
    })
  }
}