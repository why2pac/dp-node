declare class DPJobError {
  constructor(err: Error | string)
  name: string
  code?: string
  stack: string
  message: string
  originalError?: Error
}
export = DPJobError
