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
  likes: [],
  bookmarks: [],
  reposts: [],
  comments: [],
  posts: [],
  users: [
    {
      id: 'demo-user-id',
      username: 'pratham',
      display_name: 'Pratham',
      avatar_url: '',
      banner_url: '',
      bio: 'Building high-performance dark-themed decentralized applications and state architectures.',
      website: '',
      location: 'Global',
      is_verified: true,
      followers_count: 842,
      following_count: 156,
      posts_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'user-1', username: 'elena_vance', display_name: 'Dr. Elena Vance', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      banner_url: '', bio: 'AI safety researcher', website: '', location: 'SF', is_verified: true,
      followers_count: 12500, following_count: 340, posts_count: 45, created_at: '2024-01-01T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
      id: 'user-2', username: 'mark_s', display_name: 'Mark S.', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      banner_url: '', bio: 'Macro investor', website: '', location: 'NYC', is_verified: true,
      followers_count: 8900, following_count: 210, posts_count: 67, created_at: '2024-01-15T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
      id: 'user-3', username: 'tech_observer', display_name: 'TechObserver', avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
      banner_url: '', bio: 'Tech analyst', website: '', location: 'London', is_verified: false,
      followers_count: 3200, following_count: 180, posts_count: 23, created_at: '2024-02-01T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
      id: 'user-4', username: 'james_okoye', display_name: 'Dr. James Okoye', avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      banner_url: '', bio: 'Geneticist | CRISPR researcher', website: '', location: 'Lagos', is_verified: true,
      followers_count: 15600, following_count: 420, posts_count: 89, created_at: '2023-11-01T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
      id: 'user-5', username: 'priya_sharma', display_name: 'Priya Sharma', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      banner_url: '', bio: 'Space exploration journalist', website: '', location: 'Mumbai', is_verified: true,
      followers_count: 22100, following_count: 510, posts_count: 112, created_at: '2023-09-15T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
      id: 'user-6', username: 'aria_t', display_name: 'Aria Takahashi', avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
      banner_url: '', bio: 'DeFi strategist', website: '', location: 'Tokyo', is_verified: true,
      followers_count: 7800, following_count: 290, posts_count: 56, created_at: '2024-03-01T00:00:00Z', updated_at: new Date().toISOString(),
    },
  ],
}

function seedPosts() {
  if (tables.posts.length > 0) return
  const posts = [
    { id: 'fb-1', title: 'Why AGI safety should be a government priority',
      body: 'The rapid advancement of LLMs suggests we are closer to AGI than previously thought. We need international protocols for safety, transparency benchmarks, and coordinated research efforts to ensure alignment before capabilities outpace governance.',
      author_id: 'user-1', category: 'Digital Assets', category_color: '#00D2FF',
      tags: ['AI', 'Safety', 'Governance'], likes_count: 120, comments_count: 0, reposts_count: 12, bookmarks_count: 8,
      image_url: '', is_repost: false, repost_of: null,
      created_at: new Date(Date.now() - 600000).toISOString(), updated_at: new Date().toISOString() },
    { id: 'fb-2', title: 'The Macro case for Bitcoin in 2026',
      body: 'With global debt reaching record levels, the thesis for a decentralized store of value has never been stronger. Central banks are pivoting, inflation is sticky, and institutional adoption is accelerating faster than any asset class in history.',
      author_id: 'user-2', category: 'Financial Opportunities', category_color: '#f59e0b',
      tags: ['Bitcoin', 'Crypto', 'Macro'], likes_count: 340, comments_count: 0, reposts_count: 56, bookmarks_count: 120,
      image_url: '', is_repost: false, repost_of: null,
      created_at: new Date(Date.now() - 3600000).toISOString(), updated_at: new Date().toISOString() },
    { id: 'fb-3', title: '10 startups to watch in the fusion energy space',
      body: 'Fusion is no longer "30 years away". These companies are making real breakthroughs in magnetic confinement, laser ignition, and high-temperature superconductors that could reshape the global energy landscape within a decade.',
      author_id: 'user-3', category: 'Business Marketplace', category_color: '#7928CA',
      tags: ['Fusion', 'Energy', 'Startups'], likes_count: 560, comments_count: 0, reposts_count: 87, bookmarks_count: 200,
      image_url: '', is_repost: false, repost_of: null,
      created_at: new Date(Date.now() - 7200000).toISOString(), updated_at: new Date().toISOString() },
    { id: 'fb-4', title: 'CRISPR 3.0: Gene editing enters its precision era',
      body: 'Base editing and prime editing are moving beyond lab demonstrations into clinical trials. The latest generation of CRISPR tools can now target individual nucleotides with near-zero off-target effects, opening the door to curing hundreds of genetic diseases.',
      author_id: 'user-4', category: 'Creative Assets', category_color: '#34D399',
      tags: ['Biotech', 'CRISPR', 'Medicine'], likes_count: 890, comments_count: 0, reposts_count: 145, bookmarks_count: 310,
      image_url: '', is_repost: false, repost_of: null,
      created_at: new Date(Date.now() - 10800000).toISOString(), updated_at: new Date().toISOString() },
    { id: 'fb-5', title: 'SpaceX Starship: Mars colonization timeline updated',
      body: 'After the latest successful orbital flight and precision landing, SpaceX has updated its Mars mission timeline. The first crewed mission is now targeted for 2028, with cargo missions beginning in 2026. The implications for resource extraction and interplanetary commerce are staggering.',
      author_id: 'user-5', category: 'Physical Products', category_color: '#ef4444',
      tags: ['SpaceX', 'Mars', 'Colonization'], likes_count: 1200, comments_count: 0, reposts_count: 210, bookmarks_count: 540,
      image_url: '', is_repost: false, repost_of: null,
      created_at: new Date(Date.now() - 14400000).toISOString(), updated_at: new Date().toISOString() },
    { id: 'fb-6', title: 'DeFi yield farming in 2026: What actually works',
      body: 'After the bear market cleaned out speculative protocols, the surviving DeFi platforms are offering sustainable yields backed by real revenue. Here is a data-driven analysis of the top 5 strategies that are generating consistent returns without excessive risk.',
      author_id: 'user-6', category: 'Financial Opportunities', category_color: '#f59e0b',
      tags: ['DeFi', 'Yield', 'Finance'], likes_count: 430, comments_count: 0, reposts_count: 34, bookmarks_count: 150,
      image_url: '', is_repost: false, repost_of: null,
      created_at: new Date(Date.now() - 18000000).toISOString(), updated_at: new Date().toISOString() },
  ]
  tables.posts.push(...posts)
}

seedPosts()

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
      const refRow = refTable.find(r => r[j.refKey] === refValue)
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

function parseJoinSelect(col: string): { field: string; refTable: string; refKey: string } | null {
  const m = col.match(/^(\w+):(\w+(?:\.\w+)?)!(\w+(?:\(\))?)$/)
  if (!m) return null
  return { field: m[1], refTable: m[2].split('.')[0], refKey: m[3].replace('()', '') }
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
          const q = getOrCreateQuery()
          if (cols.includes('*,')) {
            const parts = (cols as string).split(/\*,\s*/)
            q.selectCols = ['*']
            for (let i = 1; i < parts.length; i++) {
              const parsed = parseJoinSelect(parts[i])
              if (parsed) q.joins.push({ field: parsed.field, refTable: parsed.refTable, refKey: parsed.refKey, localKey: `${parsed.field}_id` })
            }
          } else if (cols.includes('!')) {
            const parsed = parseJoinSelect(cols as string)
            if (parsed) {
              if (!q.selectCols.includes('*')) q.selectCols = ['*']
              q.joins.push({ field: parsed.field, refTable: parsed.refTable, refKey: parsed.refKey, localKey: `${parsed.field}_id` })
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
      if (prop === 'or') return () => chainable
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
