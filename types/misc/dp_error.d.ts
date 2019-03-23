import * as expressCore from 'express-serve-static-core'

declare class DPError {
  constructor(msg: Error | string, req: expressCore.Request)
  name: string
  code?: string
  stack: string
  message: string
  originalError?: Error
  req: expressCore.Request
}
export = DPError;
