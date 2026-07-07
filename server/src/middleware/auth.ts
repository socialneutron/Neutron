import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config'
import { UnauthorizedError } from '../utils/errors'
import type { JwtPayload } from '../types'

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or invalid authorization header'))
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret) as JwtPayload
    if (decoded.type !== 'access') {
      return next(new UnauthorizedError('Invalid token type'))
    }
    req.user = {
      userId: decoded.sub,
      email: decoded.email,
      username: decoded.username,
    }
    next()
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new UnauthorizedError('Access token expired'))
    }
    return next(new UnauthorizedError('Invalid access token'))
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return next()
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret) as JwtPayload
    if (decoded.type === 'access') {
      req.user = {
        userId: decoded.sub,
        email: decoded.email,
        username: decoded.username,
      }
    }
  } catch {
    // Silently continue without auth
  }
  next()
}
