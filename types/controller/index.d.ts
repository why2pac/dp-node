import * as expressCore from 'express-serve-static-core'
import Session = require('./library/session')
import Cookie = require('./library/cookie')
import pagination = require('./library/pagination')
import DPError = require('../misc/dp_error')
import { Config } from '../..'

declare class Finisher {
  constructor(controller: Controller)
  notfound(this: Finisher, body: Body): void
  invalid(this: Finisher, body: Body): void
  unauthorized(this: Finisher, body: Body): void
  denied(this: Finisher, body: Body): void
  error(this: Finisher, body: Body): void
}

declare class RequestInfo {
  constructor(req: expressCore.Request)
  url(this: RequestInfo): string
  uri(this: RequestInfo): string
}

type Bound<T> = T extends ((req: any, res: any, ...args: infer A) => infer R) ? (...args: A) => R : unknown
type Body = string // TODO determine the right type

declare class Controller {
  constructor(
    config: Config,
    req: expressCore.Request,
    res: expressCore.Response,
    session: Session,
    cookie: Cookie)
  raw: { req: expressCore.Request, res: expressCore.Response }
  req: RequestInfo
  remoteIp(this: Controller, all: true): string[]
  remoteIp(this: Controller, all: false): string
  remoteIp(this: Controller, all: boolean): string | string[]
  session: { [K in keyof Session]: Bound<Session[K]> }
  cookie: { [K in keyof Cookie]: Bound<Cookie[K]> }
  params(this: Controller, key: string, url: boolean): string | null | undefined
  headers(this: Controller, key: string): string | undefined
  redirect(this: Controller, url: string, statusCode: number): void
  redirect(this: Controller, statusCode: number, url: string): void
  finish(this: Controller, body: Body): void
  finisher: Finisher
  finishWithCode(this: Controller, code: number, body: Body): void
  pagination: Bound<typeof pagination>
}

declare var dpController: {
  handler: {
    serverError<T extends Controller>(
      controller: T,
      req: expressCore.Request,
      res: expressCore.Response,
      err: DPError,
      statusCode: number): void
  },
  delegate(
    config: Config,
    req: expressCore.Request,
    res: expressCore.Response,
    session: Session,
    cookie: Cookie): Controller
}

type Controller_ = Controller
declare namespace dpController {
  export type Controller = Controller_
}

export = dpController
