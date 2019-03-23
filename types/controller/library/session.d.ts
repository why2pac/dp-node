import { Request, Response } from 'express-serve-static-core'
import { Config } from '../../..'

interface Session {
  engine: any,
  id(this: unknown, req: Request, res: Response, renewOrSet: boolean | string): string
  set(this: unknown, req: Request, res: Response, key: string, val: string, ttl: number): boolean | void
  get(this: unknown, req: Request, res: Response, key: string, ttl: number): string | null | undefined
  del(this: unknown, req: Request, res: Response, key: string): boolean | void
  ttl(this: unknown, req: Request, res: Response, key: string): number | null | undefined
  expire(this: unknown, req: Request, res: Response, key: string, ttl: boolean): boolean | void
}
declare function Session(config: Config): Session

export = Session;
