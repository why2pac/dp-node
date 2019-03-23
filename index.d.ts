import Knex = require('knex')
import * as expressCore from 'express-serve-static-core'
import DPError = require('./types/misc/dp_error')
import DPJobError = require('./types/misc/dp_error')
import { ModuleLoadizable, LoadedProxy, NonFunctionType } from './types/loader'
import { Controller } from './types/controller';

declare global {
  namespace Express {
    interface Application {
      dp?: DpNode.DpInstance
    }
  }
  namespace NodeJS {
    interface Global {
      isTest: boolean
      DP_TEST_PORT?: number
    }
  }
  var isTest: boolean
  var DP_TEST_PORT: number
}

type Lazy<T> = T | (() => T)
type Defer<T> = T | (T extends Promise<any> ? never : Promise<T>)
type Some<T> = T | T[]

declare namespace DpNode {
  export type Body = string
  export interface RenderOptions {
    doNotMinify?: boolean
  }
  export class DPError {
    constructor(msg: Error | string, req: expressCore.Request)
    name: string
    code?: string
    stack: string
    message: string
    originalError?: Error
    req: expressCore.Request
  }
  export class DPJobError {
    constructor(err: Error | string)
    name: string
    code?: string
    stack: string
    message: string
    originalError?: Error
  }
  export type DPWebError = DPError | Error
  export interface ControllerDelegateBase<M extends ModuleLoadizable<any>, H extends ModuleLoadizable<any>> extends Controller {
    model: LoadedProxy<M>
    helper: LoadedProxy<H>
  }
  type KnexBindings = Knex.RawBuilder extends ((sql: string, bindings: infer R) => any) ? R : never
  type TranFunc<T extends Array<any>> = (...args: T) => [string, KnexBindings]
  export interface ModelDelegate {
    knex: Knex
    row<T extends Array<any>>(query: string, params: KnexBindings, dsn: string): Promise<T | {}>
    rows<T>(query: string, params: KnexBindings, dsn: string): Promise<T | null>
    tran<T>(blocks: [TranFunc<[]>], dsn: string): Promise<[T]>
    tran<T,U>(blocks: [TranFunc<[]>, TranFunc<[T]>], dsn: string): Promise<[T,U]>
    tran<T,U,V>(blocks: [TranFunc<[]>, TranFunc<[T]>, TranFunc<[T,U]>], dsn: string): Promise<[T,U,V]>
    tran<T,U,V,W>(blocks: [TranFunc<[]>, TranFunc<[T]>, TranFunc<[T,U]>, TranFunc<[T,U,V]>], dsn: string): Promise<[T,U,V,W]>
    tran<T,U,V,W,X>(blocks: [TranFunc<[]>, TranFunc<[T]>, TranFunc<[T,U]>, TranFunc<[T,U,V]>, TranFunc<[T,U,V,W]>], dsn: string): Promise<[T,U,V,W,X]>
    tran<T,U,V,W,X,Y>(blocks: [TranFunc<[]>, TranFunc<[T]>, TranFunc<[T,U]>, TranFunc<[T,U,V]>, TranFunc<[T,U,V,W]>, TranFunc<[T,U,V,W,X,Y]>], dsn: string): Promise<[T,U,V,W,X,Y]>
    tran<T,U,V,W,X,Y,Z>(blocks: [TranFunc<[]>, TranFunc<[T]>, TranFunc<[T,U]>, TranFunc<[T,U,V]>, TranFunc<[T,U,V,W]>, TranFunc<[T,U,V,W,X,Y]>, TranFunc<[T,U,V,W,X,Y,Z]>], dsn: string): Promise<[T,U,V,W,X,Y,Z]>
    execute<T extends Array<any>>(query: string, params: KnexBindings): Promise<T | {}>
    paginate<T, U>(knex: Knex.QueryInterface, page: number, rpp: number, resultMap?: (value: T, index: number, array: T[]) => U): U[]
    grouping(prefixes: string | string[]): <T extends object>(row: T) => T
    grouping<T extends object>(prefixes: string | string[], row: T): T
  }
  export interface ModelDelegateBase<M extends ModuleLoadizable<any>, H extends ModuleLoadizable<any>> extends ModelDelegate {
    model: LoadedProxy<M>
    helper: LoadedProxy<H>
  }
  export interface HelperDelegateBase<H extends ModuleLoadizable<any>> {
    helper: LoadedProxy<H>
  }
  export type MFunc = expressCore.RequestHandler | expressCore.ErrorRequestHandler
  export type HRet = void | boolean | Body
  type Defer<T> = T | (T extends Promise<any> ? never : Promise<T>)
  export interface Router<C, P = HRet> {
    route(
      method: string,
      path: string,
      delegate: string,
      middlewares: MFunc[],
      middlewaresEnd: MFunc[],
      controllerPrefix: HandlerMethod<C, undefined, P>,
      controllerSuffix: HandlerMethod<C, HRet>,
      controllerErrorHandler: HandlerMethod<C, DPWebError>
    ): void
  }
  export interface Options {
    mode: 'web' | 'job'
    debug: boolean
    apppath: string
    controller: string
    view: string
    minifyRemoveLineBreakWhitespace: boolean
    requestSizeLimit: string /* XXX */
    errorLogging: boolean
    error?(controller: Controller, error: DPWebError, statusCode: number): Promise<false | undefined>
    viewHelpers: {
      [name: string]: (...args: any[]) => string /* handlebars */
    }
    redirectNakedToWWW?: boolean
    compression?: boolean
    enhanceSecurity?: boolean
    cookieEnabled?: boolean
    preMiddlewares?: expressCore.RequestHandlerParams | expressCore.RequestHandlerParams[]
    session?: {
      secret: string
      volatility: boolean
      ttl: boolean
    }
    cookie?: {
      secret: string
      volatility: boolean
      ttl: boolean
    }
    databaseDsn?: string[]
    static?: string | string[]
    port?: number
  }
  export interface ModelHelper<M, H> {
    model: M
    helper: H
  }
  export interface DpInstance {
    app: expressCore.Application
  }

  export interface HandlerPlainMethod<C, D = undefined, R = HRet> {
    (this: C, data: D): Defer<R>
  }
  export interface HandlerArrowMethod<C, D = undefined, R = HRet> {
    (this: unknown, controller: C, data: D): Defer<R>
    prototype?: void | boolean | number | string | symbol | bigint
  }
  export type HandlerMethod<C, D = undefined, R = HRet> = HandlerPlainMethod<C, D, R> | HandlerArrowMethod<C, D, R>
  export interface ControllerLoadizable<C, P> {
    [key: string]: HandlerMethod<C, P> | NonFunctionType
  }
  type Config = any
}

declare function DpNode<T extends DpNode.Options>(options: T): (
  'job' extends T['mode'] ? ReturnType<import('./lib/job')> : never
) | ('web' extends T['mode'] ? DpNode.DpInstance : never);

export = DpNode;
