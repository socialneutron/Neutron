import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'
import { BadRequestError } from '../utils/errors'

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source])
    if (!result.success) {
      const firstError = result.error.errors[0]
      throw new BadRequestError(firstError.message)
    }
    req[source] = result.data
    next()
  }
}
