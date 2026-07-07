import { Request, Response, NextFunction } from 'express'
import * as authService from '../services/authService'

export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.signup(req.body)
    res.status(201).json({ success: true, data: result })
  } catch (err) { next(err) }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.login(
      req.body,
      req.headers['user-agent'],
      req.ip
    )
    res.json({ success: true, data: result })
  } catch (err) { next(err) }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body
    await authService.logout(req.user!.userId, refreshToken)
    res.json({ success: true, data: { message: 'Logged out successfully' } })
  } catch (err) { next(err) }
}

export async function logoutAll(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.logoutAll(req.user!.userId)
    res.json({ success: true, data: { message: 'Logged out of all sessions' } })
  } catch (err) { next(err) }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.refreshAccessToken(req.body.refreshToken)
    res.json({ success: true, data: result })
  } catch (err) { next(err) }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.forgotPassword(req.body.email)
    res.json({ success: true, data: result })
  } catch (err) { next(err) }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.resetPassword(req.body.token, req.body.password)
    res.json({ success: true, data: result })
  } catch (err) { next(err) }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.verifyEmail(req.body.token)
    res.json({ success: true, data: result })
  } catch (err) { next(err) }
}
