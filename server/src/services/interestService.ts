import { v4 as uuid } from 'uuid'
import { query, queryOne, queryMany } from '../database'
import type { ExploreEventType } from '../types'

const ACTION_SCORES: Record<string, number> = {
  view: 1,
  dwell_3s: 3,
  click: 3,
  dwell_10s: 5,
  like: 10,
  watch_25: 4,
  watch_50: 8,
  watch_75: 12,
  watch_complete: 15,
  save: 20,
  share: 25,
  repost: 20,
  comment: 15,
  skip: -8,
  unlike: -10,
  unsave: -20,
}

export async function recordAction(
  userId: string,
  postId: string,
  eventType: string,
  metadata: Record<string, any> = {},
) {
  await query(
    `INSERT INTO explore_events (id, user_id, post_id, event_type, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [uuid(), userId, postId, eventType, JSON.stringify(metadata)],
  )

  const scoreChange = ACTION_SCORES[eventType] || 0
  if (scoreChange !== 0) {
    const tags = await queryMany(
      'SELECT tag, score FROM post_tags WHERE post_id = $1',
      [postId],
    )

    for (const t of tags) {
      const weightedChange = Math.round(scoreChange * t.score)
      if (weightedChange === 0) continue

      await query(
        `INSERT INTO user_interests (id, user_id, category, score)
         VALUES ($1, $2, $3, GREATEST(0, $4))
         ON CONFLICT (user_id, category)
         DO UPDATE SET score = GREATEST(0, user_interests.score + $4), updated_at = NOW()`,
        [uuid(), userId, t.tag, weightedChange],
      )
    }
  }

  if (eventType === 'skip') {
    const tags = await queryMany(
      'SELECT tag FROM post_tags WHERE post_id = $1',
      [postId],
    )
    for (const t of tags) {
      await query(
        `INSERT INTO user_interests (id, user_id, category, score)
         VALUES ($1, $2, $3, GREATEST(0, $4))
         ON CONFLICT (user_id, category)
         DO UPDATE SET score = GREATEST(0, user_interests.score + $4), updated_at = NOW()`,
        [uuid(), userId, t.tag, -5],
      )
    }
  }

  if (['like', 'save', 'share', 'watch_complete', 'repost', 'comment'].includes(eventType)) {
    await queryOne(`
      UPDATE creator_scores
      SET ${eventType === 'like' ? 'total_likes' : eventType === 'share' ? 'total_shares' : eventType === 'repost' ? 'total_shares' : eventType === 'comment' ? 'total_likes' : 'total_likes'}
      = ${eventType === 'like' ? 'total_likes' : eventType === 'share' ? 'total_shares' : eventType === 'repost' ? 'total_shares' : eventType === 'comment' ? 'total_likes' : 'total_likes'} + 1
      WHERE user_id = (SELECT author_id FROM posts WHERE id = $1)
    `, [postId])
  }

  return { recorded: true, score_change: scoreChange }
}

export async function getInterestProfile(userId: string) {
  const interests = await queryMany(
    'SELECT category, score FROM user_interests WHERE user_id = $1 ORDER BY score DESC',
    [userId],
  )

  const tags = await queryMany(
    `SELECT pt.tag, COUNT(*)::int AS action_count
     FROM explore_events ee
     JOIN post_tags pt ON pt.post_id = ee.post_id
     WHERE ee.user_id = $1 AND ee.event_type IN ('like', 'save', 'share', 'watch_complete')
     GROUP BY pt.tag
     ORDER BY action_count DESC
     LIMIT 20`,
    [userId],
  )

  return { interests, recent_tags: tags }
}

export async function updateInterestScore(userId: string, category: string, delta: number) {
  await query(
    `INSERT INTO user_interests (id, user_id, category, score)
     VALUES ($1, $2, $3, GREATEST(0, $4))
     ON CONFLICT (user_id, category)
     DO UPDATE SET score = GREATEST(0, user_interests.score + $4), updated_at = NOW()`,
    [uuid(), userId, category, delta],
  )
}

export async function getTopInterests(userId: string, limit = 10) {
  const rows = await queryMany(
    'SELECT category, score FROM user_interests WHERE user_id = $1 ORDER BY score DESC LIMIT $2',
    [userId, limit],
  )
  return rows.map(r => ({ category: r.category, score: r.score }))
}

export async function findSimilarUsers(userId: string, limit = 50) {
  const cached = await queryMany(
    `SELECT su.similar_user_id AS id, u.username, u.profile_picture, su.similarity
     FROM similar_users su
     JOIN users u ON u.id = su.similar_user_id
     WHERE su.user_id = $1
     ORDER BY su.similarity DESC
     LIMIT $2`,
    [userId, limit],
  )
  if (cached.length >= limit * 0.5) return cached.map(r => r.id)

  const myInterests = await getTopInterests(userId, 20)
  if (myInterests.length === 0) return []

  const myCategories = myInterests.map(i => i.category)
  const placeholders = myCategories.map((_, i) => `$${i + 2}`).join(',')

  const similar = await queryMany(`
    SELECT ui.user_id AS id, SUM(LEAST(ui.score, mi.score)) AS similarity
    FROM user_interests ui
    JOIN user_interests mi ON mi.category = ui.category AND mi.user_id = $1
    WHERE ui.category IN (${placeholders}) AND ui.user_id != $1
    GROUP BY ui.user_id
    ORDER BY similarity DESC
    LIMIT $2
  `, [userId, ...myCategories, limit])

  const maxSim = similar.length > 0 ? Math.max(...similar.map(s => parseFloat(s.similarity))) : 1

  for (const s of similar) {
    const normSim = maxSim > 0 ? parseFloat(s.similarity) / maxSim : 0
    await query(
      `INSERT INTO similar_users (id, user_id, similar_user_id, similarity)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, similar_user_id)
       DO UPDATE SET similarity = $4, updated_at = NOW()`,
      [uuid(), userId, s.id, Math.min(normSim, 1)],
    )
  }

  return similar.map(s => s.id)
}

export async function submitPostTags(postId: string, tags: Array<{ tag: string; score: number; source?: string }>) {
  for (const t of tags) {
    await query(
      `INSERT INTO post_tags (id, post_id, tag, score, source)
       VALUES ($1, $2, $3, $4, $5)`,
      [uuid(), postId, t.tag.toLowerCase(), Math.min(Math.max(t.score, 0), 1), t.source || 'ai'],
    )
  }
}

export async function extractTagsFromPost(postId: string, title: string, body: string, hashtags: string[]) {
  const tags: Array<{ tag: string; score: number; source: string }> = []

  const titleWords = (title || '').toLowerCase().split(/\s+/).filter(w => w.length > 3)
  const bodyWords = (body || '').toLowerCase().split(/\s+/).filter(w => w.length > 3)

  const freq: Record<string, number> = {}
  for (const w of titleWords) { freq[w] = (freq[w] || 0) + 3 }
  for (const w of bodyWords) { freq[w] = (freq[w] || 0) + 1 }

  for (const h of hashtags) {
    tags.push({ tag: h.toLowerCase().replace(/^#/, ''), score: 1.0, source: 'hashtag' })
  }

  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10)
  for (const [word, count] of sorted) {
    const score = Math.min(count / (titleWords.length || 1), 1)
    if (!tags.find(t => t.tag === word)) {
      tags.push({ tag: word, score, source: 'ai' })
    }
  }

  if (tags.length > 0) await submitPostTags(postId, tags)
  return tags
}
