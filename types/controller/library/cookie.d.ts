import { Request, Response, CookieOptions } from 'express-serve-static-core'
import { Config } from '../../..'

interface Cookie {
  set(this: unknown, req: Request, res: Response, key: string, val: string, opts: CookieOptions): boolean | void
  get(this: unknown, req: Request, res: Response, key: string, unsafe: boolean): string | null | undefined
}
declare function Cookie(config: Config): Cookie

export = Cookie;
