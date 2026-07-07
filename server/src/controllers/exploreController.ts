import { Request, Response, NextFunction } from 'express'
import * as exploreService from '../services/exploreService'
import * as interestService from '../services/interestService'

export async function getFeed(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await exploreService.getExploreFeed(
      req.user!.userId,
      req.query.cursor as string,
      parseInt(req.query.limit as string) || undefined,
    )
    res.json({ success: true, data: result })
  } catch (err) { next(err) }
}

export async function getExplorePage(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await exploreService.getExplorePageData(req.user!.userId)
    res.json({ success: true, data: result })
  } catch (err) { next(err) }
}

export async function getTrending(req: Request, res: Response, next: NextFunction) {
  try {
    const posts = await exploreService.getTrendingPosts(
      parseInt(req.query.limit as string) || undefined,
    )
    res.json({ success: true, data: { posts } })
  } catch (err) { next(err) }
}

export async function getTags(req: Request, res: Response, next: NextFunction) {
  try {
    const tags = await exploreService.getTrendingTags(
      parseInt(req.query.limit as string) || undefined,
    )
    res.json({ success: true, data: { tags } })
  } catch (err) { next(err) }
}

export async function getSuggestedUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const users = await exploreService.getSuggestedUsers(req.user!.userId)
    res.json({ success: true, data: { users } })
  } catch (err) { next(err) }
}

export async function search(req: Request, res: Response, next: NextFunction) {
  try {
    const { q, type } = req.query
    const result = await exploreService.searchExplore(
      q as string,
      req.user!.userId,
      type as string,
    )
    res.json({ success: true, data: result })
  } catch (err) { next(err) }
}

export async function recordAction(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await interestService.recordAction(
      req.user!.userId,
      req.body.post_id,
      req.body.event_type,
      req.body.metadata,
    )
    res.json({ success: true, data: result })
  } catch (err) { next(err) }
}

export async function getInterests(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await interestService.getInterestProfile(req.user!.userId)
    res.json({ success: true, data: result })
  } catch (err) { next(err) }
}
