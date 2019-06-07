

  export enum API {
    Keychain = "KEYCHAIN"
  }

  export class Network extends String {}

  export enum Version {
    v1 = "1.0"
  }

  //export type BasicErrorTypes = "NOT_SUPPORTED" | "CANCELLED_BY_USER" | "WRONG_PARAMETERS" | "UNKNOWN_ERROR"

  export interface IRequest<Type extends string, Request, Response> {
    type: Type
    request: Request
    __TS_RESPONSE?: Response
  }
  
  export interface IProvider {
    isActive: boolean
    isNative: boolean

    start(): void    
    version(): Promise<string>
    send<Response, Request extends IRequest<string, any, Response>>(request: Request): Promise<Response>
  }

  export type HasApiResponse = boolean
  export type HasApiRequest = IRequest<"OPENWALLET_HAS_API", { type: API | string }, HasApiResponse>

