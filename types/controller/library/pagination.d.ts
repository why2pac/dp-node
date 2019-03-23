import { Request, Response } from 'express-serve-static-core'

declare namespace paginator {
  interface Options {
    count: number
    page: number
    rpp: number
  }
}

declare const paginator: {
  (req: Request, res: Response, opts: [ number, object, number, number ],
   addOpts?: paginator.Options | null | undefined): string
  (req: Request, res: Response, opts?: paginator.Options | null | undefined): string
}

export = paginator
