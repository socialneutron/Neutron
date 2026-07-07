import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { AppError } from '../utils/errors'
import { logger } from '../utils/logger'

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    logger.warn({ code: err.code, statusCode: err.statusCode, message: err.message }, 'Operational error')
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    })
  }

  if (err instanceof ZodError) {
    logger.warn({ errors: err.errors }, 'Validation error')
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    })
  }

  logger.error({ err, message: err.message }, 'Unexpected error')
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  })
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
  })
}
