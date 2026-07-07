import { Request, Response, NextFunction } from 'express'
import * as authService from '../services/authService'

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.getProfile(req.user!.userId)
    res.json({ success: true, data: result })
  } catch (err) { next(err) }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.updateProfile(req.user!.userId, req.body)
    res.json({ success: true, data: result })
  } catch (err) { next(err) }
}
