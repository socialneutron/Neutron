import { queryMany } from '../database'
import { getTopInterests, findSimilarUsers } from './interestService'

const SCORE_WEIGHTS = {
  likeWeight: 30,
  saveWeight: 50,
  shareWeight: 60,
  watchWeight: 20,
  commentWeight: 25,
  repostWeight: 40,
}

const FRESHNESS_BOOST_MINUTES = 60
const FRESHNESS_MAX_BOOST = 15
const DIVERSITY_INTERVAL = 3
const CANDIDATE_LIMIT = 5000
const FILTERED_LIMIT = 500
const RANKED_LIMIT = 100
const PAGE_SIZE = 30
const CACHE_TTL_MINUTES = 5

export async function getExploreFeed(
  userId: string,
  cursor?: string,
  limit: number = PAGE_SIZE,
) {
  const interests = await getTopInterests(userId, 30)
  const similarUserIds = await findSimilarUsers(userId, 50)

  const candidates = await generateCandidates(userId, interests, similarUserIds)
  const filtered = await applyQualityFilter(candidates)
  const ranked = await rankPosts(userId, filtered, interests)
  const diversified = await applyDiversity(ranked)
  const final = diversified.slice(0, RANKED_LIMIT)

  const posts = await paginatePosts(final, cursor, limit)

  return {
    posts,
    next_cursor: posts.length === limit ? posts[posts.length - 1].id : null,
    has_more: posts.length === limit,
  }
}

async function generateCandidates(
  userId: string,
  interests: Array<{ category: string; score: number }>,
  similarUserIds: string[],
): Promise<any[]> {
  const conditions: string[] = ["p.visibility = 'public'", 'p.is_spam = FALSE']
  const params: any[] = []
  let paramIdx = 1

  if (interests.length > 0) {
    const topTags = interests.slice(0, 10).map(i => i.category)
    const tagConditions = topTags.map((_, i) => {
      params.push(topTags[i])
      return `$${paramIdx++}`
    })
    conditions.push(`(p.tags && ARRAY[${tagConditions.join(',')}] OR EXISTS (SELECT 1 FROM post_tags pt WHERE pt.post_id = p.id AND pt.tag = ANY($${paramIdx - tagConditions.length}::varchar[])))`)
  }

  if (similarUserIds.length > 0) {
    const simPlaceholders = similarUserIds.map((_, i) => `$${paramIdx++}`)
    params.push(...similarUserIds)
    conditions.push(`(p.author_id = ANY(ARRAY[${simPlaceholders.join(',')}]::uuid[]) OR ${conditions[conditions.length - 1]})`)
  }

  conditions.push(`p.id NOT IN (SELECT post_id FROM explore_events WHERE user_id = $${paramIdx} AND event_type IN ('skip', 'unlike'))`)
  params.push(userId)
  paramIdx++

  const sql = `
    SELECT p.id, p.title, p.body, p.image_url, p.media_url, p.media_type,
      p.tags, p.likes_count, p.comments_count, p.reposts_count, p.saves_count,
      p.shares_count, p.view_count, p.avg_watch_ratio, p.created_at,
      p.author_id, u.username, u.display_name, u.profile_picture, u.is_verified,
      cs.quality_score,
      EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 60 AS age_minutes
    FROM posts p
    JOIN users u ON u.id = p.author_id
    LEFT JOIN creator_scores cs ON cs.user_id = p.author_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY p.likes_count DESC, p.created_at DESC
    LIMIT $${paramIdx}
  `
  params.push(CANDIDATE_LIMIT)

  return await queryMany(sql, params)
}

async function applyQualityFilter(candidates: any[]): Promise<any[]> {
  return candidates.filter(c => {
    if (c.is_duplicate) return false
    if (c.quality_score !== null && c.quality_score < 20) return false
    return true
  }).slice(0, FILTERED_LIMIT)
}

async function rankPosts(
  userId: string,
  candidates: any[],
  interests: Array<{ category: string; score: number }>,
): Promise<any[]> {
  const scored = candidates.map(c => {
    const interestBoost = computeInterestBoost(c.tags || [], c.id, interests)
    const freshnessBoost = computeFreshnessBoost(c.age_minutes)
    const qualityMultiplier = computeQualityMultiplier(c.quality_score)
    const predictionScore = computePredictionScore(c)
    const diversityPenalty = 0

    const score = (
      predictionScore.like * SCORE_WEIGHTS.likeWeight +
      predictionScore.save * SCORE_WEIGHTS.saveWeight +
      predictionScore.share * SCORE_WEIGHTS.shareWeight +
      predictionScore.watch * SCORE_WEIGHTS.watchWeight +
      predictionScore.comment * SCORE_WEIGHTS.commentWeight +
      predictionScore.repost * SCORE_WEIGHTS.repostWeight +
      interestBoost +
      freshnessBoost
    ) * qualityMultiplier - diversityPenalty

    return { ...c, _score: Math.max(0, score), _prediction: predictionScore }
  })

  return scored.sort((a, b) => b._score - a._score)
}

function computeInterestBoost(
  postTags: string[],
  postId: string,
  interests: Array<{ category: string; score: number }>,
): number {
  let boost = 0
  const interestMap = new Map(interests.map(i => [i.category, i.score]))

  if (Array.isArray(postTags)) {
    for (const tag of postTags) {
      const score = interestMap.get(tag.toLowerCase()) || 0
      boost += score * 0.01
    }
  }

  return Math.min(boost, 50)
}

function computeFreshnessBoost(ageMinutes: number): number {
  if (ageMinutes < 10) return FRESHNESS_MAX_BOOST
  if (ageMinutes < 30) return FRESHNESS_MAX_BOOST * 0.6
  if (ageMinutes < 60) return FRESHNESS_MAX_BOOST * 0.3
  if (ageMinutes < 120) return FRESHNESS_MAX_BOOST * 0.1
  return 0
}

function computeQualityMultiplier(qualityScore: number | null): number {
  if (qualityScore === null) return 0.7
  if (qualityScore >= 80) return 1.2
  if (qualityScore >= 60) return 1.0
  if (qualityScore >= 40) return 0.8
  return 0.5
}

function computePredictionScore(post: any) {
  const total = Math.max(post.likes_count + post.saves_count + post.shares_count + post.comments_count + post.reposts_count, 1)

  return {
    like: Math.min(post.likes_count / Math.max(total, 1), 1),
    save: Math.min(post.saves_count / Math.max(total, 1) * 1.5, 1),
    share: Math.min(post.shares_count / Math.max(total, 1) * 1.2, 1),
    watch: Math.min(post.avg_watch_ratio || 0.5, 1),
    comment: Math.min(post.comments_count / Math.max(total, 1) * 1.5, 1),
    repost: Math.min(post.reposts_count / Math.max(total, 1) * 1.3, 1),
  }
}

async function applyDiversity(ranked: any[]): Promise<any[]> {
  if (ranked.length === 0) return ranked

  const result: any[] = []
  const usedCategories = new Set<string>()
  const buckets: Record<string, any[]> = {}

  for (const post of ranked) {
    const cat = Array.isArray(post.tags) && post.tags.length > 0
      ? post.tags[0].toLowerCase()
      : 'general'
    if (!buckets[cat]) buckets[cat] = []
    buckets[cat].push(post)
  }

  const categories = Object.keys(buckets)
  let catIndex = 0
  let remaining = ranked.length

  while (result.length < Math.min(ranked.length, RANKED_LIMIT)) {
    const cat = categories[catIndex % categories.length]
    const post = buckets[cat]?.shift()
    if (post) {
      result.push(post)
    }
    catIndex++
    if (categories.every(c => !buckets[c] || buckets[c].length === 0)) break
  }

  return result
}

async function paginatePosts(posts: any[], cursor?: string, limit: number = PAGE_SIZE) {
  let startIdx = 0
  if (cursor) {
    const idx = posts.findIndex(p => p.id === cursor)
    if (idx !== -1) startIdx = idx + 1
  }

  const page = posts.slice(startIdx, startIdx + limit)

  return page.map(p => ({
    id: p.id,
    title: p.title || '',
    body: p.body || '',
    image_url: p.image_url || '',
    media_url: p.media_url || '',
    media_type: p.media_type || '',
    tags: p.tags || [],
    likes_count: p.likes_count || 0,
    comments_count: p.comments_count || 0,
    reposts_count: p.reposts_count || 0,
    saves_count: p.saves_count || 0,
    shares_count: p.shares_count || 0,
    view_count: p.view_count || 0,
    created_at: p.created_at,
    author: {
      id: p.author_id,
      username: p.username || '',
      display_name: p.display_name || p.username || '',
      avatar_url: p.profile_picture || '',
      is_verified: p.is_verified || false,
    },
    score: Math.round(p._score || 0),
  }))
}

export async function getTrendingPosts(limit = 10) {
  const rows = await queryMany(`
    SELECT p.id, p.title, p.body, p.image_url, p.media_url, p.media_type,
      p.tags, p.likes_count, p.comments_count, p.reposts_count, p.saves_count,
      p.shares_count, p.view_count, p.created_at,
      p.author_id, u.username, u.display_name, u.profile_picture, u.is_verified
    FROM posts p
    JOIN users u ON u.id = p.author_id
    WHERE p.visibility = 'public' AND p.is_spam = FALSE
    ORDER BY (p.likes_count * 2 + p.comments_count * 3 + p.shares_count * 4 + p.view_count * 0.5) DESC
    LIMIT $1
  `, [limit])

  return rows.map(p => ({
    id: p.id,
    title: p.title || '',
    body: p.body || '',
    image_url: p.image_url || '',
    tags: p.tags || [],
    likes_count: p.likes_count || 0,
    comments_count: p.comments_count || 0,
    reposts_count: p.reposts_count || 0,
    view_count: p.view_count || 0,
    created_at: p.created_at,
    author: {
      id: p.author_id,
      username: p.username || '',
      display_name: p.display_name || p.username || '',
      avatar_url: p.profile_picture || '',
      is_verified: p.is_verified || false,
    },
  }))
}

export async function getTrendingTags(limit = 20) {
  const rows = await queryMany(`
    SELECT pt.tag, COUNT(*)::int AS count
    FROM post_tags pt
    JOIN posts p ON p.id = pt.post_id
    WHERE p.visibility = 'public' AND p.is_spam = FALSE
      AND pt.created_at > NOW() - INTERVAL '7 days'
    GROUP BY pt.tag
    ORDER BY count DESC
    LIMIT $1
  `, [limit])

  return rows.map(r => ({
    tag: r.tag,
    count: r.count,
    post_count: r.count,
  }))
}

export async function getSuggestedUsers(userId: string, limit = 20) {
  const rows = await queryMany(`
    SELECT u.id, u.username, u.profile_picture, u.bio, u.is_verified,
      (SELECT COUNT(*)::int FROM follows WHERE following_id = u.id) AS followers_count
    FROM users u
    WHERE u.id != $1
      AND u.account_status = 'active'
      AND NOT EXISTS (SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = u.id)
    ORDER BY (SELECT COUNT(*) FROM follows WHERE following_id = u.id) DESC
    LIMIT $2
  `, [userId, limit])

  return rows.map(u => ({
    id: u.id,
    username: u.username,
    display_name: u.display_name || u.username,
    avatar_url: u.profile_picture || '',
    bio: u.bio || '',
    is_verified: u.is_verified || false,
    followers_count: u.followers_count || 0,
  }))
}

export async function getExplorePageData(userId: string) {
  const [feed, trending, tags, users] = await Promise.all([
    getExploreFeed(userId),
    getTrendingPosts(8),
    getTrendingTags(15),
    getSuggestedUsers(userId, 10),
  ])

  return {
    feed: feed.posts,
    feed_cursor: feed.next_cursor,
    trending,
    tags,
    suggested_users: users,
  }
}

export async function searchExplore(queryText: string, userId: string, type?: string, limit = 20) {
  const results: any = { posts: [], users: [] }

  if (!type || type === 'posts' || type === 'all') {
    const escaped = queryText.replace(/'/g, "''")
    results.posts = await queryMany(`
      SELECT p.id, p.title, p.body, p.image_url, p.tags, p.likes_count, p.comments_count,
        p.reposts_count, p.created_at,
        p.author_id, u.username, u.display_name, u.profile_picture, u.is_verified
      FROM posts p
      JOIN users u ON u.id = p.author_id
      WHERE p.visibility = 'public' AND p.is_spam = FALSE
        AND (to_tsvector('english', COALESCE(p.title, '') || ' ' || COALESCE(p.body, ''))
             @@ plainto_tsquery('english', $1)
             OR p.tags && ARRAY[$1::varchar])
      ORDER BY p.likes_count DESC
      LIMIT $2
    `, [queryText, limit])
  }

  if (!type || type === 'users' || type === 'all') {
    results.users = await queryMany(`
      SELECT id, username, profile_picture, bio, is_verified,
        (SELECT COUNT(*)::int FROM follows WHERE following_id = id) AS followers_count
      FROM users
      WHERE (username ILIKE $1 OR bio ILIKE $2)
        AND account_status = 'active'
      ORDER BY (SELECT COUNT(*) FROM follows WHERE following_id = id) DESC
      LIMIT $3
    `, [`%${queryText}%`, `%${queryText}%`, limit])
  }

  return results
}
