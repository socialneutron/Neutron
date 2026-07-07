import jwt, { type SignOptions } from 'jsonwebtoken'
import { v4 as uuid } from 'uuid'
import { config } from '../config'
import type { JwtPayload, User } from '../types'

export function generateAccessToken(user: Pick<User, 'id' | 'email' | 'username'>): string {
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    username: user.username,
    type: 'access',
  }
  return jwt.sign(payload as object, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn as any,
  })
}

export function generateRefreshToken(user: Pick<User, 'id' | 'email' | 'username'>, rememberMe = false): string {
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    username: user.username,
    type: 'refresh',
  }
  return jwt.sign(payload as object, config.jwt.refreshSecret, {
    expiresIn: (rememberMe ? config.jwt.rememberExpiresIn : config.jwt.refreshExpiresIn) as any,
  })
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.refreshSecret) as JwtPayload
}

export function generateEmailVerificationToken(): string {
  return uuid()
}

export function generatePasswordResetToken(): string {
  return uuid()
}

export function getRefreshTokenExpiry(rememberMe = false): Date {
  const ms = rememberMe
    ? parseDuration(config.jwt.rememberExpiresIn)
    : parseDuration(config.jwt.refreshExpiresIn)
  return new Date(Date.now() + ms)
}

function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/)
  if (!match) return 7 * 24 * 60 * 60 * 1000
  const value = parseInt(match[1], 10)
  switch (match[2]) {
    case 's': return value * 1000
    case 'm': return value * 60 * 1000
    case 'h': return value * 60 * 60 * 1000
    case 'd': return value * 24 * 60 * 60 * 1000
    default: return 7 * 24 * 60 * 60 * 1000
  }
}
