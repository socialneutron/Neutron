import bcrypt from 'bcryptjs'
import { v4 as uuid } from 'uuid'
import { config } from '../config'
import { queryOne, queryMany, query } from '../database'
import {
  generateAccessToken,
  generateRefreshToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
} from './tokenService'
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from './emailService'
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  EmailNotVerifiedError,
  AccountLockedError,
  BadRequestError,
} from '../utils/errors'
import type { User, Session } from '../types'

export async function signup(data: { username: string; email: string; password: string }) {
  const existingByEmail = await queryOne('SELECT id FROM users WHERE email = $1', [data.email])
  if (existingByEmail) throw new ConflictError('An account with this email already exists')

  const existingByUsername = await queryOne('SELECT id FROM users WHERE username = $1', [data.username])
  if (existingByUsername) throw new ConflictError('This username is already taken')

  const passwordHash = await bcrypt.hash(data.password, config.security.bcryptSaltRounds)
  const user = await queryOne(
    `INSERT INTO users (id, username, email, password_hash) VALUES ($1, $2, $3, $4)
     RETURNING id, username, email, email_verified, account_status, created_at`,
    [uuid(), data.username, data.email, passwordHash]
  )

  const verificationToken = generateEmailVerificationToken()
  await query(
    `INSERT INTO email_verifications (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)`,
    [uuid(), user.id, verificationToken, new Date(Date.now() + 24 * 60 * 60 * 1000)]
  )

  await sendVerificationEmail(data.email, data.username, verificationToken)

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      emailVerified: user.email_verified,
      accountStatus: user.account_status,
      createdAt: user.created_at,
    },
    message: 'Account created. Please check your email to verify your account.',
  }
}

export async function login(data: { emailOrUsername: string; password: string; rememberMe: boolean }, userAgent?: string, ipAddress?: string) {
  const user = await queryOne(
    'SELECT * FROM users WHERE email = $1 OR username = $1',
    [data.emailOrUsername]
  )

  if (!user) throw new UnauthorizedError('Invalid email/username or password')

  if (user.account_status === 'locked') {
    if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
      const minutesLeft = Math.ceil((new Date(user.lockout_until).getTime() - Date.now()) / 60000)
      throw new AccountLockedError(`Account is locked. Try again in ${minutesLeft} minute(s).`)
    }
    await query(
      'UPDATE users SET account_status = $1, failed_login_attempts = $2, lockout_until = $3 WHERE id = $4',
      ['active', 0, null, user.id]
    )
  }

  const passwordValid = await bcrypt.compare(data.password, user.password_hash)
  if (!passwordValid) {
    const attempts = (user.failed_login_attempts || 0) + 1
    if (attempts >= config.security.accountLockoutThreshold) {
      const lockoutUntil = new Date(Date.now() + config.security.accountLockoutDurationMs)
      await query(
        'UPDATE users SET account_status = $1, failed_login_attempts = $2, lockout_until = $3 WHERE id = $4',
        ['locked', attempts, lockoutUntil, user.id]
      )
      throw new AccountLockedError(`Account locked due to too many failed attempts. Try again later.`)
    }
    await query('UPDATE users SET failed_login_attempts = $1 WHERE id = $2', [attempts, user.id])
    throw new UnauthorizedError('Invalid email/username or password')
  }

  if (!user.email_verified) {
    const newToken = generateEmailVerificationToken()
    await query(
      'INSERT INTO email_verifications (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)',
      [uuid(), user.id, newToken, new Date(Date.now() + 24 * 60 * 60 * 1000)]
    )
    await sendVerificationEmail(user.email, user.username, newToken)
    throw new EmailNotVerifiedError('Email not verified. A new verification email has been sent.')
  }

  await query(
    'UPDATE users SET failed_login_attempts = $1, last_login = $2 WHERE id = $3',
    [0, new Date(), user.id]
  )

  const accessToken = generateAccessToken(user)
  const refreshToken = generateRefreshToken(user, data.rememberMe)
  const expiresAt = getRefreshTokenExpiry(data.rememberMe)

  await query(
    'INSERT INTO sessions (id, user_id, refresh_token, user_agent, ip_address, expires_at) VALUES ($1, $2, $3, $4, $5, $6)',
    [uuid(), user.id, refreshToken, userAgent || '', ipAddress || '', expiresAt]
  )

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      profilePicture: user.profile_picture,
      bio: user.bio,
      emailVerified: user.email_verified,
      accountStatus: user.account_status,
      createdAt: user.created_at,
    },
    accessToken,
    refreshToken,
  }
}

export async function logout(userId: string, refreshToken: string) {
  await query('DELETE FROM sessions WHERE user_id = $1 AND refresh_token = $2', [userId, refreshToken])
}

export async function logoutAll(userId: string) {
  await query('DELETE FROM sessions WHERE user_id = $1', [userId])
}

export async function refreshAccessToken(refreshToken: string) {
  const session = await queryOne(
    'SELECT * FROM sessions WHERE refresh_token = $1 AND expires_at > NOW()',
    [refreshToken]
  )
  if (!session) throw new UnauthorizedError('Invalid or expired refresh token')

  let payload
  try {
    payload = verifyRefreshToken(refreshToken)
  } catch {
    await query('DELETE FROM sessions WHERE id = $1', [session.id])
    throw new UnauthorizedError('Invalid refresh token')
  }

  const user = await queryOne('SELECT * FROM users WHERE id = $1', [payload.sub])
  if (!user) throw new UnauthorizedError('User not found')

  const newAccessToken = generateAccessToken(user)
  const newRefreshToken = generateRefreshToken(user)
  const expiresAt = getRefreshTokenExpiry()

  await query('DELETE FROM sessions WHERE id = $1', [session.id])
  await query(
    'INSERT INTO sessions (id, user_id, refresh_token, user_agent, ip_address, expires_at) VALUES ($1, $2, $3, $4, $5, $6)',
    [uuid(), user.id, newRefreshToken, session.user_agent, session.ip_address, expiresAt]
  )

  return { accessToken: newAccessToken, refreshToken: newRefreshToken }
}

export async function forgotPassword(email: string) {
  const user = await queryOne('SELECT id, email, username FROM users WHERE email = $1', [email])
  if (!user) return { message: 'If an account with that email exists, a reset link has been sent.' }

  const token = generatePasswordResetToken()
  await query(
    'INSERT INTO password_resets (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)',
    [uuid(), user.id, token, new Date(Date.now() + 15 * 60 * 1000)]
  )

  await sendPasswordResetEmail(user.email, token)
  return { message: 'If an account with that email exists, a reset link has been sent.' }
}

export async function resetPassword(token: string, newPassword: string) {
  const reset = await queryOne(
    'SELECT * FROM password_resets WHERE token = $1 AND expires_at > NOW() AND used = FALSE',
    [token]
  )
  if (!reset) throw new BadRequestError('Invalid or expired reset token')

  const passwordHash = await bcrypt.hash(newPassword, config.security.bcryptSaltRounds)
  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, reset.user_id])
  await query('UPDATE password_resets SET used = TRUE WHERE id = $1', [reset.id])
  await query('DELETE FROM sessions WHERE user_id = $1', [reset.user_id])

  return { message: 'Password has been reset successfully.' }
}

export async function verifyEmail(token: string) {
  const verification = await queryOne(
    'SELECT * FROM email_verifications WHERE token = $1 AND expires_at > NOW()',
    [token]
  )
  if (!verification) throw new BadRequestError('Invalid or expired verification token')

  await query('UPDATE users SET email_verified = TRUE WHERE id = $1', [verification.user_id])
  await query('DELETE FROM email_verifications WHERE id = $1', [verification.id])

  const user = await queryOne('SELECT id, username, email FROM users WHERE id = $1', [verification.user_id])
  if (user) await sendWelcomeEmail(user.email, user.username)

  return { message: 'Email verified successfully.' }
}

export async function getProfile(userId: string) {
  const user = await queryOne(
    `SELECT id, username, email, profile_picture, bio, email_verified, account_status, created_at, last_login
     FROM users WHERE id = $1`,
    [userId]
  )
  if (!user) throw new NotFoundError('User not found')
  return { user }
}

export async function updateProfile(userId: string, data: { username?: string; bio?: string; profile_picture?: string }) {
  if (data.username) {
    const existing = await queryOne(
      'SELECT id FROM users WHERE username = $1 AND id != $2',
      [data.username, userId]
    )
    if (existing) throw new ConflictError('Username is already taken')
  }

  const fields: string[] = []
  const values: any[] = []
  let paramIndex = 1

  if (data.username) { fields.push(`username = $${paramIndex++}`); values.push(data.username) }
  if (data.bio !== undefined) { fields.push(`bio = $${paramIndex++}`); values.push(data.bio) }
  if (data.profile_picture !== undefined) { fields.push(`profile_picture = $${paramIndex++}`); values.push(data.profile_picture) }

  if (fields.length === 0) throw new BadRequestError('No fields to update')

  values.push(userId)
  const user = await queryOne(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}
     RETURNING id, username, email, profile_picture, bio, email_verified, account_status, created_at, last_login`,
    values
  )

  return { user }
}
