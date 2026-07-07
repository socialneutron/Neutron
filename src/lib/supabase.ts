import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

let realClient: SupabaseClient | null = null

if (supabaseUrl && supabaseAnonKey) {
  realClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
    realtime: { params: { eventsPerSecond: 10 } },
  })
}

// ── In-memory database for mock mode ──────────────────────
const tables: Record<string, any[]> = {
  // Core content
  posts: [
    {
      id: 'post-1', post_code: 1, author_id: 'user-1',
      title: 'AI safety alignment: New breakthrough in reward modeling',
      body: 'Just read a fascinating paper from DeepMind on scalable oversight. They demonstrated that constitutional AI can reduce reward hacking by 87% in long-horizon tasks. This is huge for deploying LLMs in high-stakes environments.\n\nKey takeaways:\n• Iterative feedback loops dramatically improve alignment\n• Sparse rewards still a challenge\n• Human-in-the-loop remains essential for edge cases',
      category: 'AI', category_color: '#00D2FF',
      tags: ['AI', 'Safety', 'DeepMind', 'Research'],
      image_url: '', likes_count: 142, comments_count: 28, reposts_count: 53, bookmarks_count: 67,
      is_repost: false, repost_of: null,
      created_at: new Date(Date.now() - 1800000).toISOString(),
      updated_at: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 'post-2', post_code: 2, author_id: 'user-2',
      title: 'Fed rate decision: What the markets are missing',
      body: 'Everyone is focused on the rate cut timing, but the real story is the balance sheet runoff. QT is draining liquidity at $95B/month and the reverse repo facility is nearly empty. This is a liquidity regime change that most retail investors are sleeping on.\n\nHistorical parallels suggest we could see a major volatility event within 60-90 days.',
      category: 'Financial Opportunities', category_color: '#34D399',
      tags: ['Markets', 'Fed', 'Liquidity', 'Macro'],
      image_url: '', likes_count: 89, comments_count: 34, reposts_count: 41, bookmarks_count: 55,
      is_repost: false, repost_of: null,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'post-3', post_code: 3, author_id: 'user-4',
      title: 'CRISPR breakthrough: First in-vivo gene editing for sickle cell shows 100% success in trial',
      body: 'Phase 2 results are in: all 12 patients show complete remission at 18-month follow-up. This is the first time in-vivo CRISPR editing has achieved 100% efficacy in a human trial.\n\nThe implications extend far beyond sickle cell — this platform could be adapted for dozens of genetic disorders.\n\nFull paper linked below.',
      category: 'Science', category_color: '#a855f7',
      tags: ['CRISPR', 'GeneEditing', 'Biotech', 'Breakthrough'],
      image_url: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=600&q=80',
      likes_count: 256, comments_count: 67, reposts_count: 134, bookmarks_count: 189,
      is_repost: false, repost_of: null,
      created_at: new Date(Date.now() - 7200000).toISOString(),
      updated_at: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 'post-4', post_code: 4, author_id: 'user-5',
      title: 'Artemis III: NASA announces new lunar landing sites near the south pole',
      body: 'NASA has identified 13 candidate landing regions near the lunar south pole for Artemis III. These regions were chosen for their scientific value and proximity to permanently shadowed areas that may contain water ice.\n\nThis mission will be humanity\'s first return to the Moon in over 50 years, and the first ever to explore the polar regions.',
      category: 'Space', category_color: '#f59e0b',
      tags: ['NASA', 'Artemis', 'Moon', 'Space'],
      image_url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=600&q=80',
      likes_count: 198, comments_count: 45, reposts_count: 78, bookmarks_count: 92,
      is_repost: false, repost_of: null,
      created_at: new Date(Date.now() - 14400000).toISOString(),
      updated_at: new Date(Date.now() - 14400000).toISOString(),
    },
    {
      id: 'post-5', post_code: 5, author_id: 'user-6',
      title: 'DeFi derivatives are about to eat traditional finance',
      body: 'The total value locked in decentralized derivatives protocols just hit an all-time high of $45B. With the introduction of real-world asset (RWA) collateral and institutional-grade oracles, DeFi is now capable of competing with CME and ICE on execution quality.\n\nKey protocols to watch:\n• Synthetix V3 with atomic swaps\n• dYdX Chain with 20ms latency\n• GMX with zero price impact on major pairs',
      category: 'Digital Assets', category_color: '#00D2FF',
      tags: ['DeFi', 'Derivatives', 'Crypto', 'RWAs'],
      image_url: '', likes_count: 167, comments_count: 52, reposts_count: 89, bookmarks_count: 73,
      is_repost: false, repost_of: null,
      created_at: new Date(Date.now() - 28800000).toISOString(),
      updated_at: new Date(Date.now() - 28800000).toISOString(),
    },
    {
      id: 'post-6', post_code: 6, author_id: 'demo-user-id',
      title: 'Building a real-time social feed with optimistic updates',
      body: 'In this post, I break down the architecture of Neutron\'s feed system — optimistic UI, rollback on failure, and real-time Supabase Realtime subscriptions. The key insight: treat your local state as the source of truth and sync with the server asynchronously.\n\nStack: React + Zustand + Supabase + Framer Motion\n\nFull architecture diagram attached.',
      category: 'Technology', category_color: '#7928CA',
      tags: ['React', 'Architecture', 'Supabase', 'UI'],
      image_url: '', likes_count: 73, comments_count: 21, reposts_count: 34, bookmarks_count: 41,
      is_repost: false, repost_of: null,
      created_at: new Date(Date.now() - 43200000).toISOString(),
      updated_at: new Date(Date.now() - 43200000).toISOString(),
    },
    {
      id: 'post-7', post_code: 7, author_id: 'user-3',
      title: 'NVIDIA Blackwell GPU demand is 3x supply — what this means for AI infra',
      body: 'Enterprise lead times for NVIDIA\'s Blackwell B200 are now stretching to 52+ weeks. Hyperscalers are placing $10B+ orders. The bottleneck isn\'t just fabrication — it\'s CoWoS advanced packaging capacity.\n\nMy estimate: AI infrastructure spending hits $500B by 2027. The winners will be those who secure supply chains now.',
      category: 'Technology', category_color: '#00D2FF',
      tags: ['NVIDIA', 'AI', 'Hardware', 'Infrastructure'],
      image_url: '', likes_count: 211, comments_count: 83, reposts_count: 145, bookmarks_count: 112,
      is_repost: false, repost_of: null,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'post-8', post_code: 8, author_id: 'user-1',
      title: 'The hidden cost of RAG: Why context windows aren\'t a silver bullet',
      body: 'Everyone is excited about 200K+ token context windows, but retrieval-augmented generation still has fundamental issues:\n\n1. Lost-in-the-middle effect degrades accuracy with large contexts\n2. Embedding quality varies wildly across domains\n3. Caching strategies are complex at scale\n\nThe solution? Hybrid approaches combining structured knowledge graphs with vector search.',
      category: 'AI', category_color: '#a855f7',
      tags: ['RAG', 'LLMs', 'AI', 'Engineering'],
      image_url: '', likes_count: 134, comments_count: 41, reposts_count: 62, bookmarks_count: 78,
      is_repost: false, repost_of: null,
      created_at: new Date(Date.now() - 172800000).toISOString(),
      updated_at: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: 'post-9', post_code: 9, author_id: 'user-7',
      title: 'Moon token to 100x — trust me bro',
      body: 'This is the next big thing. Don\'t miss out. Join our Discord for alpha calls.',
      category: 'Digital Assets', category_color: '#f59e0b',
      tags: ['Crypto', 'Memes', 'Alpha'],
      image_url: '', likes_count: 5, comments_count: 1, reposts_count: 0, bookmarks_count: 0,
      is_repost: false, repost_of: null,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date(Date.now() - 3600000).toISOString(),
    },
  ],
  media: [
    { id: 'media-1', owner_id: 'demo-user-id', storage_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80', file_type: 'image/jpeg', width: 1200, height: 800, duration: null, size: 245000, created_at: new Date().toISOString() },
    { id: 'media-2', owner_id: 'user-3', storage_url: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=600&q=80', file_type: 'image/jpeg', width: 1200, height: 800, duration: null, size: 312000, created_at: new Date().toISOString() },
    { id: 'media-3', owner_id: 'user-5', storage_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80', file_type: 'image/jpeg', width: 1200, height: 800, duration: null, size: 189000, created_at: new Date().toISOString() },
  ],
  stories: [],
  story_views: [],
  highlights: [],

  // Social graph
  follows: [],
  likes: [],
  comments: [],
  bookmarks: [],
  reposts: [],

  // Messaging
  conversations: [],
  messages: [],

  // Notifications
  notifications: [],

  // Auth & security
  sessions: [
    { id: 'session-1', user_id: 'demo-user-id', token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock', device: 'Chrome/Windows', ip: '192.168.1.1', created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 86400000).toISOString() },
  ],

  // Personalization
  user_interests: [
    { id: 'int-1', user_id: 'demo-user-id', category: 'Technology', score: 0.9 },
    { id: 'int-2', user_id: 'demo-user-id', category: 'Cryptocurrency', score: 0.85 },
    { id: 'int-3', user_id: 'demo-user-id', category: 'AI', score: 0.8 },
    { id: 'int-4', user_id: 'demo-user-id', category: 'Design', score: 0.6 },
    { id: 'int-5', user_id: 'user-1', category: 'AI', score: 0.95 },
    { id: 'int-6', user_id: 'user-1', category: 'Research', score: 0.9 },
    { id: 'int-7', user_id: 'user-2', category: 'Finance', score: 0.9 },
    { id: 'int-8', user_id: 'user-2', category: 'Markets', score: 0.85 },
    { id: 'int-9', user_id: 'user-5', category: 'Space', score: 0.95 },
    { id: 'int-10', user_id: 'user-5', category: 'Science', score: 0.85 },
    { id: 'int-11', user_id: 'user-6', category: 'DeFi', score: 0.9 },
    { id: 'int-12', user_id: 'user-6', category: 'Web3', score: 0.85 },
  ],

  // Analytics
  analytics_events: [],

  // Users
  users: [
    {
      id: 'demo-user-id',
      username: 'pratham',
      display_name: 'Pratham',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      banner_url: '',
      bio: 'Building high-performance dark-themed decentralized applications and state architectures.',
      website: '',
      location: 'Global',
      is_verified: false,
      followers_count: 842,
      following_count: 156,
      posts_count: 0,
      password_hash: '$2b$12$LJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5Gz0YdK0aK9v8Rc5s7F2q3S',
      last_login: new Date().toISOString(),
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'user-1', username: 'elena_vance', display_name: 'Dr. Elena Vance', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      banner_url: '', bio: 'AI safety researcher', website: '', location: 'SF', is_verified: false,
      followers_count: 12500, following_count: 340, posts_count: 45, password_hash: '$2b$12$KJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5Gz0YdK0aK9v8Rc5s7F2q3S', last_login: '2026-07-04T10:00:00Z', status: 'active', created_at: '2024-01-01T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
      id: 'user-2', username: 'mark_s', display_name: 'Mark S.', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      banner_url: '', bio: 'Macro investor', website: '', location: 'NYC', is_verified: false,
      followers_count: 8900, following_count: 210, posts_count: 67, password_hash: '$2b$12$MJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5Gz0YdK0aK9v8Rc5s7F2q3S', last_login: '2026-07-03T15:30:00Z', status: 'active', created_at: '2024-01-15T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
      id: 'user-3', username: 'tech_observer', display_name: 'TechObserver', avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
      banner_url: '', bio: 'Tech analyst', website: '', location: 'London', is_verified: false,
      followers_count: 3200, following_count: 180, posts_count: 23, password_hash: '$2b$12$NJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5Gz0YdK0aK9v8Rc5s7F2q3S', last_login: '2026-07-02T09:00:00Z', status: 'active', created_at: '2024-02-01T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
      id: 'user-4', username: 'james_okoye', display_name: 'Dr. James Okoye', avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      banner_url: '', bio: 'Geneticist | CRISPR researcher', website: '', location: 'Lagos', is_verified: false,
      followers_count: 15600, following_count: 420, posts_count: 89, password_hash: '$2b$12$OJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5Gz0YdK0aK9v8Rc5s7F2q3S', last_login: '2026-07-04T08:00:00Z', status: 'active', created_at: '2023-11-01T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
      id: 'user-5', username: 'priya_sharma', display_name: 'Priya Sharma', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      banner_url: '', bio: 'Space exploration journalist', website: '', location: 'Mumbai', is_verified: false,
      followers_count: 22100, following_count: 510, posts_count: 112, password_hash: '$2b$12$PJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5Gz0YdK0aK9v8Rc5s7F2q3S', last_login: '2026-07-04T06:00:00Z', status: 'active', created_at: '2023-09-15T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
      id: 'user-6', username: 'aria_t', display_name: 'Aria Takahashi', avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
      banner_url: '', bio: 'DeFi strategist', website: '', location: 'Tokyo', is_verified: false,
      followers_count: 7800, following_count: 290, posts_count: 56, password_hash: '$2b$12$QJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5Gz0YdK0aK9v8Rc5s7F2q3S', last_login: '2026-07-04T12:00:00Z', status: 'active', created_at: '2024-03-01T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
      id: 'user-7', username: 'crypto_anon', display_name: 'CryptoAnon', avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
      banner_url: '', bio: 'Crypto enthusiast', website: '', location: 'Unknown', is_verified: false,
      followers_count: 1200, following_count: 300, posts_count: 3, password_hash: '$2b$12$RJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5Gz0YdK0aK9v8Rc5s7F2q3S', last_login: '2026-07-01T00:00:00Z', status: 'active', created_at: '2025-06-01T00:00:00Z', updated_at: new Date().toISOString(),
    },
  ],
}

type Query = {
  table: string
  selectCols: string[]
  joins: { field: string; refTable: string; refKey: string; localKey: string }[]
  filters: { col: string; op: string; value: any }[]
  orders: { col: string; dir: 'asc' | 'desc' }[]
  rangeFrom: number
  rangeTo: number
  limitCount: number
  insertData: any | null
  deleteMode: boolean
  updateData: any | null
  upsertData: any | null
  orClause: string | null
  countConfig: { count: 'exact'; head: boolean } | null
}

function createQuery(table: string): Query {
  return {
    table,
    selectCols: ['*'],
    joins: [],
    filters: [],
    orders: [],
    rangeFrom: 0,
    rangeTo: 0,
    limitCount: 0,
    insertData: null,
    deleteMode: false,
    updateData: null,
    upsertData: null,
    orClause: null,
    countConfig: null,
  }
}

function resolveJoins(rows: any[], joins: Query['joins']): any[] {
  if (!joins.length) return rows
  return rows.map(row => {
    const result = { ...row }
    for (const j of joins) {
      const refValue = row[j.localKey]
      if (refValue == null) {
        result[j.field] = null
        continue
      }
      const refTable = tables[j.refTable]
      if (!refTable) { result[j.field] = null; continue }
      const refRow = refTable.find(r => r.id === refValue)
      result[j.field] = refRow || null
    }
    return result
  })
}

function applyFilters(rows: any[], filters: Query['filters']): any[] {
  return rows.filter(row => {
    for (const f of filters) {
      const val = row[f.col]
      switch (f.op) {
        case 'eq': if (val !== f.value) return false; break
        case 'neq': if (val === f.value) return false; break
        case 'in': if (!(f.value as any[])?.includes(val)) return false; break
        case 'is': if (val !== f.value && !(val == null && f.value == null)) return false; break
        case 'ilike': if (!String(val).toLowerCase().includes(String(f.value).toLowerCase().replace(/%/g, ''))) return false; break
      }
    }
    return true
  })
}

function applyOrders(rows: any[], orders: Query['orders']): any[] {
  if (!orders.length) return rows
  return [...rows].sort((a, b) => {
    for (const o of orders) {
      const va = a[o.col], vb = b[o.col]
      if (va == null && vb == null) continue
      if (va == null) return 1
      if (vb == null) return -1
      let cmp = 0
      if (typeof va === 'string' && typeof vb === 'string') cmp = va.localeCompare(vb)
      else if (va < vb) cmp = -1
      else if (va > vb) cmp = 1
      if (cmp !== 0) return o.dir === 'desc' ? -cmp : cmp
    }
    return 0
  })
}

function resolveSelect(columns: string[], row: any): any {
  if (columns.length === 1 && columns[0] === '*') return row
  const result: any = {}
  for (const col of columns) {
    if (col.includes(':')) {
      const [alias, expr] = col.split(':')
      if (expr) result[alias] = row[alias]
    } else {
      result[col] = row[col]
    }
  }
  return result
}

function parseJoinSelect(col: string): { field: string; refTable: string; refKey: string; localKey: string } | null {
  // Match: field:table(*) or field:table!constraint(*) or field:table.field(*) etc.
  const m = col.match(/^(\w+):(\w+)(?:\.(\w+))?(?:!(\w+))?(?:\([^)]*\))?$/)
  if (!m) return null
  const [, field, refTable, refField, constraint] = m
  // Derive local key from constraint name (e.g. posts_author_id_fkey → author_id)
  let localKey = `${field}_id`
  if (constraint) {
    const parts = constraint.split('_')
    if (parts.length >= 3 && parts[parts.length - 1] === 'fkey') {
      localKey = parts.slice(1, -1).join('_')
    }
  }
  return { field, refTable, refKey: refField || constraint || field, localKey }
}

function createMockClient(): SupabaseClient {
  let tableName = ''
  let query: Query | null = null

  const getOrCreateQuery = () => {
    if (!query) query = createQuery(tableName)
    return query
  }

  function executeQuery(resolve: ((v: any) => void) | null): any {
    const q = query || createQuery(tableName)
    let rows = tables[q.table] ? [...tables[q.table]] : []

    if (q.countConfig) {
      rows = applyFilters(rows, q.filters)
      if (q.orClause) {
        const conditions = q.orClause.split(',')
        rows = rows.filter(row => conditions.some(cond => {
          const m = cond.match(/^(\w+)\.(\w+)\.(.+)$/)
          if (!m) return false
          const val = row[m[1]]
          const target = m[3].replace(/%/g, '').toLowerCase()
          switch (m[2]) {
            case 'ilike': return String(val || '').toLowerCase().includes(target)
            case 'eq': return String(val) === target
            default: return false
          }
        }))
      }
      const result = { data: null, error: null, count: rows.length, status: 200, statusText: 'OK' }
      if (resolve) resolve(result)
      return result
    }

    if (q.deleteMode) {
      const beforeCount = rows.length
      const toDelete = applyFilters(rows, q.filters)
      tables[q.table] = tables[q.table]?.filter(r => !toDelete.includes(r)) || []
      const result = { data: null, error: null, count: beforeCount - toDelete.length, status: 200, statusText: 'OK' }
      if (resolve) resolve(result)
      return result
    }

    if (q.insertData) {
      const newRow = { id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ...q.insertData, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      if (!tables[q.table]) tables[q.table] = []
      tables[q.table].push(newRow)
      const joined = resolveJoins([newRow], q.joins)
      const projected = joined.map(r => resolveSelect(q.selectCols, r))
      const result = { data: projected, error: null, count: 1, status: 201, statusText: 'Created' }
      if (resolve) resolve(result)
      return result
    }

    if (q.updateData) {
      const updated = applyFilters(rows, q.filters)
      for (const r of updated) Object.assign(r, q.updateData, { updated_at: new Date().toISOString() })
      const result = { data: updated, error: null, count: updated.length, status: 200, statusText: 'OK' }
      if (resolve) resolve(result)
      return result
    }

    if (q.upsertData) {
      const existing = applyFilters(rows, q.filters)
      if (existing.length) {
        for (const r of existing) Object.assign(r, q.upsertData, { updated_at: new Date().toISOString() })
        const result = { data: existing, error: null, count: existing.length, status: 200, statusText: 'OK' }
        if (resolve) resolve(result)
        return result
      }
      const newRow = { id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ...q.upsertData, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      if (!tables[q.table]) tables[q.table] = []
      tables[q.table].push(newRow)
      const result = { data: [newRow], error: null, count: 1, status: 201, statusText: 'Created' }
      if (resolve) resolve(result)
      return result
    }

    rows = applyFilters(rows, q.filters)
    if (q.orClause) {
      const conditions = q.orClause.split(',')
      rows = rows.filter(row => {
        return conditions.some(cond => {
          const m = cond.match(/^(\w+)\.(\w+)\.(.+)$/)
          if (!m) return false
          const [, col, op, rawVal] = m
          const val = row[col]
          const target = rawVal.replace(/%/g, '').toLowerCase()
          switch (op) {
            case 'ilike': return String(val || '').toLowerCase().includes(target)
            case 'eq': return String(val) === target
            default: return false
          }
        })
      })
    }
    rows = applyOrders(rows, q.orders)
    if (q.rangeTo > 0) rows = rows.slice(q.rangeFrom, q.rangeTo + 1)
    else if (q.limitCount > 0) rows = rows.slice(0, q.limitCount)
    const joined = resolveJoins(rows, q.joins)
    const projected = joined.map(r => resolveSelect(q.selectCols, r))
    const result = { data: projected, error: null, count: projected.length, status: 200, statusText: 'OK' }
    if (resolve) resolve(result)
    return result
  }

  const chainable: any = new Proxy({}, {
    get(_, prop: string) {
      if (prop === 'then') {
        return (resolve: (v: any) => void) => executeQuery(resolve)
      }
      if (prop === 'single') {
        return () => {
          const result = executeQuery(null)
          if (result.error || !result.data || result.data.length === 0) {
            return Promise.resolve({ data: null, error: { message: 'No rows found' }, count: 0, status: 406 })
          }
          return Promise.resolve({ data: result.data[0], error: null, count: 1, status: 200, statusText: 'OK' })
        }
      }
      if (prop === 'maybeSingle') {
        return () => {
          const result = executeQuery(null)
          if (!result.data || result.data.length === 0) {
            return Promise.resolve({ data: null, error: null, count: 0, status: 200, statusText: 'OK' })
          }
          return Promise.resolve({ data: result.data[0], error: null, count: 1, status: 200, statusText: 'OK' })
        }
      }

      if (prop === 'select') {
        return function(this: any, ...args: any[]) {
          const cols = args[0] || '*'
          const opts = args[1] || {}
          const q = getOrCreateQuery()
          if (opts.count) q.countConfig = opts
          if (cols.includes('*,')) {
            const parts = (cols as string).split(/\*,\s*/)
            q.selectCols = ['*']
            for (let i = 1; i < parts.length; i++) {
              const parsed = parseJoinSelect(parts[i])
              if (parsed) q.joins.push({ field: parsed.field, refTable: parsed.refTable, refKey: parsed.refKey, localKey: parsed.localKey })
            }
          } else if (cols.includes('!')) {
            const parsed = parseJoinSelect(cols as string)
            if (parsed) {
              if (!q.selectCols.includes('*')) q.selectCols = ['*']
              q.joins.push({ field: parsed.field, refTable: parsed.refTable, refKey: parsed.refKey, localKey: parsed.localKey })
            } else {
              q.selectCols = (cols as string).split(',').map(s => s.trim())
            }
          } else {
            q.selectCols = (cols as string).split(',').map(s => s.trim())
          }
          return chainable
        }
      }
      if (prop === 'insert') return (data: any) => { getOrCreateQuery().insertData = data; return chainable }
      if (prop === 'update') return (data: any) => { getOrCreateQuery().updateData = data; return chainable }
      if (prop === 'delete') return () => { getOrCreateQuery().deleteMode = true; return chainable }
      if (prop === 'upsert') return (data: any) => { getOrCreateQuery().upsertData = data; return chainable }
      if (prop === 'eq') return (col: string, val: any) => { getOrCreateQuery().filters.push({ col, op: 'eq', value: val }); return chainable }
      if (prop === 'neq') return (col: string, val: any) => { getOrCreateQuery().filters.push({ col, op: 'neq', value: val }); return chainable }
      if (prop === 'in') return (col: string, vals: any[]) => { getOrCreateQuery().filters.push({ col, op: 'in', value: vals }); return chainable }
      if (prop === 'is') return (col: string, val: any) => { getOrCreateQuery().filters.push({ col, op: 'is', value: val }); return chainable }
      if (prop === 'or') return (clause: string) => { getOrCreateQuery().orClause = clause; return chainable }
      if (prop === 'order') return (col: string, opts?: { ascending?: boolean }) => { getOrCreateQuery().orders.push({ col, dir: opts?.ascending !== false ? 'asc' : 'desc' }); return chainable }
      if (prop === 'range') return (from: number, to: number) => { const q = getOrCreateQuery(); q.rangeFrom = from; q.rangeTo = to; return chainable }
      if (prop === 'limit') return (n: number) => { getOrCreateQuery().limitCount = n; return chainable }
      return chainable
    },
  })

  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: () => Promise.resolve({ data: {}, error: { message: 'No Supabase configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env' } }),
      signUp: () => Promise.resolve({ data: {}, error: { data: { message: 'No Supabase configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env' } } }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: (table: string) => { tableName = table; query = null; return chainable },
    channel: () => ({ on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }), subscribe: () => ({ unsubscribe: () => {} }) }),
    rpc: async (_fn: string, _params: any) => {
      if (_fn === 'increment_count' || _fn === 'decrement_count') {
        const { table_name, column_name, row_id } = _params || {}
        if (table_name && column_name && row_id && tables[table_name]) {
          const target = tables[table_name].find(r => r.id === row_id)
          if (target) {
            const delta = _fn === 'increment_count' ? 1 : -1
            target[column_name] = (target[column_name] || 0) + delta
          }
        }
      }
      return { data: null, error: null }
    },
    removeChannel: () => Promise.resolve({ error: null }),
  } as any
}

export const supabase: SupabaseClient = realClient || createMockClient()
export const isSupabaseConfigured = !!realClient

export default supabase
