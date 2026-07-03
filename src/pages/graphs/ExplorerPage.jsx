import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, TrendingUp, Users, BarChart3, Hash, ArrowLeft, Eye, Heart } from 'lucide-react'

const C = {
  bg: '#05050A', surface: '#090914', card: '#0d0d1a', border: 'rgba(255,255,255,0.06)',
  cyan: '#00D2FF', purple: '#7928CA', green: '#34D399', red: '#ef4444',
  text: '#f1f5f9', muted: '#6b7280',
}

const mockTrending = [
  { id: '1', title: 'AI Model Performance 2025', creator: 'Alice Chen', likes: 1240, tags: ['#AI', '#ML'], chartType: 'line' },
  { id: '2', title: 'Crypto Market Cap Growth', creator: 'Bob Smith', likes: 980, tags: ['#Crypto', '#Finance'], chartType: 'bar' },
  { id: '3', title: 'Web3 User Adoption', creator: 'Carol Dev', likes: 850, tags: ['#Web3', '#DeFi'], chartType: 'area' },
  { id: '4', title: 'Biotech Breakthroughs', creator: 'Dan Kim', likes: 720, tags: ['#Biotech', '#Research'], chartType: 'line' },
  { id: '5', title: 'Global Startup Funding', creator: 'Eve Wang', likes: 650, tags: ['#Finance', '#Startups'], chartType: 'bar' },
  { id: '6', title: 'Carbon Emissions Tracker', creator: 'Frank Lee', likes: 590, tags: ['#Climate', '#Data'], chartType: 'area' },
]

const mockCreators = [
  { name: 'Alice Chen', handle: '@alicechen', avatar: 'AC', followers: 12400, graphs: 48 },
  { name: 'Bob Smith', handle: '@bobsmith', avatar: 'BS', followers: 8900, graphs: 32 },
  { name: 'Carol Dev', handle: '@caroldev', avatar: 'CD', followers: 6700, graphs: 27 },
  { name: 'Dan Kim', handle: '@dankim', avatar: 'DK', followers: 5200, graphs: 19 },
  { name: 'Eve Wang', handle: '@evewang', avatar: 'EW', followers: 4100, graphs: 15 },
  { name: 'Frank Lee', handle: '@franklee', avatar: 'FL', followers: 3300, graphs: 11 },
]

const mockGraphs = [
  ...mockTrending,
  { id: '7', title: 'Social Media Trends Q4', creator: 'Grace Hall', likes: 480, tags: ['#Social', '#Marketing'], chartType: 'bar' },
  { id: '8', title: 'Quantum Computing Advances', creator: 'Henry Zhao', likes: 420, tags: ['#AI', '#Research'], chartType: 'line' },
  { id: '9', title: 'DeFi TVL Growth', creator: 'Iris Park', likes: 370, tags: ['#DeFi', '#Crypto'], chartType: 'area' },
]

const mockTopics = [
  { tag: '#AI', posts: 12400 },
  { tag: '#Crypto', posts: 9800 },
  { tag: '#Web3', posts: 7200 },
  { tag: '#DeFi', posts: 5900 },
  { tag: '#Biotech', posts: 4300 },
  { tag: '#Finance', posts: 3800 },
  { tag: '#Climate', posts: 2100 },
  { tag: '#Startups', posts: 1900 },
  { tag: '#Marketing', posts: 1500 },
  { tag: '#Research', posts: 1200 },
]

const tabs = [
  { key: 'trending', label: 'Trending', icon: TrendingUp },
  { key: 'creators', label: 'Creators', icon: Users },
  { key: 'graphs', label: 'Graphs', icon: BarChart3 },
  { key: 'topics', label: 'Topics', icon: Hash },
]

const sortOptions = ['Most Recent', 'Most Liked', 'Most Viewed']

function MiniChart({ type, color }) {
  const points = useMemo(() => {
    const pts = []
    for (let i = 0; i < 7; i++) {
      pts.push({ x: i * 12, y: 8 + Math.random() * 28 })
    }
    return pts
  }, [])

  if (type === 'bar') {
    return (
      <svg width="84" height="40" style={{ marginTop: 8 }}>
        {points.map((p, i) => (
          <rect key={i} x={p.x} y={40 - p.y} width={8} height={p.y} rx={2} fill={color} opacity={0.7} />
        ))}
      </svg>
    )
  }

  const path = points.reduce((d, p, i) => {
    if (i === 0) return `M${p.x},${p.y}`
    const prev = points[i - 1]
    const cx = (prev.x + p.x) / 2
    return `${d} C${cx},${prev.y} ${cx},${p.y} ${p.x},${p.y}`
  }, '')

  if (type === 'area') {
    const areaPath = `${path} L84,40 L0,40 Z`
    return (
      <svg width="84" height="40" style={{ marginTop: 8 }}>
        <path d={areaPath} fill={color} opacity={0.15} />
        <path d={path} fill="none" stroke={color} strokeWidth={2} />
      </svg>
    )
  }

  return (
    <svg width="84" height="40" style={{ marginTop: 8 }}>
      <path d={path} fill="none" stroke={color} strokeWidth={2} />
    </svg>
  )
}

const cardHover = {
  rest: { scale: 1 },
  hover: { scale: 1.02, y: -2 },
}

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
}

export default function ExplorerPage({ navigate, user }) {
  const [activeTab, setActiveTab] = useState('trending')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('Most Recent')

  const q = search.toLowerCase()

  const filteredTrending = mockTrending.filter(
    (g) =>
      g.title.toLowerCase().includes(q) ||
      g.creator.toLowerCase().includes(q) ||
      g.tags.some((t) => t.toLowerCase().includes(q))
  )

  const filteredCreators = mockCreators.filter(
    (c) => c.name.toLowerCase().includes(q) || c.handle.toLowerCase().includes(q)
  )

  const filteredGraphs = mockGraphs
    .filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.creator.toLowerCase().includes(q) ||
        g.tags.some((t) => t.toLowerCase().includes(q))
    )
    .sort((a, b) => {
      if (sort === 'Most Liked') return b.likes - a.likes
      if (sort === 'Most Viewed') return b.likes * 1.3 - a.likes * 1.3
      return 0
    })

  const filteredTopics = mockTopics.filter((t) => t.tag.toLowerCase().includes(q))

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 20px',
          borderBottom: `1px solid ${C.border}`,
          background: C.surface,
        }}
      >
        <button
          onClick={() => navigate('graphs')}
          style={{
            background: 'none',
            border: 'none',
            color: C.muted,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: 6,
            borderRadius: 8,
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = C.text)}
          onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Explorer</h1>
        <div style={{ flex: 1 }} />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: '7px 14px',
            maxWidth: 320,
            width: '100%',
          }}
        >
          <Search size={16} color={C.muted} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search graphs, creators, topics..."
            style={{
              background: 'none',
              border: 'none',
              outline: 'none',
              color: C.text,
              fontSize: 14,
              width: '100%',
              fontFamily: 'inherit',
            }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 2,
          padding: '12px 20px',
          borderBottom: `1px solid ${C.border}`,
          background: C.surface,
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 16px',
                borderRadius: 8,
                border: 'none',
                background: active ? 'rgba(0,210,255,0.1)' : 'transparent',
                color: active ? C.cyan : C.muted,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Sort bar for Graphs tab */}
      {activeTab === 'graphs' && (
        <div style={{ padding: '10px 20px', borderBottom: `1px solid ${C.border}`, background: C.surface }}>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{
              background: C.card,
              color: C.text,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 13,
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            {sortOptions.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Content */}
      <div style={{ padding: 20 }}>
        <AnimatePresence mode="wait">
          {/* Trending */}
          {activeTab === 'trending' && (
            <motion.div key="trending" {...fadeSlide}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 16,
                }}
              >
                {filteredTrending.map((g) => (
                  <motion.div
                    key={g.id}
                    variants={cardHover}
                    initial="rest"
                    whileHover="hover"
                    onClick={() => navigate('graph-detail', { graphId: g.id })}
                    style={{
                      background: C.card,
                      border: `1px solid ${C.border}`,
                      borderRadius: 14,
                      padding: 18,
                      cursor: 'pointer',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0,210,255,0.25)'
                      e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,210,255,0.08)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = C.border
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{g.title}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>{g.creator}</div>
                    <MiniChart type={g.chartType} color={C.cyan} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {g.tags.map((t) => (
                          <span
                            key={t}
                            style={{
                              fontSize: 11,
                              color: C.cyan,
                              background: 'rgba(0,210,255,0.1)',
                              padding: '2px 8px',
                              borderRadius: 6,
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.muted }}>
                        <Heart size={13} />
                        {g.likes}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              {filteredTrending.length === 0 && <p style={{ color: C.muted, textAlign: 'center', marginTop: 40 }}>No trending graphs found.</p>}
            </motion.div>
          )}

          {/* Creators */}
          {activeTab === 'creators' && (
            <motion.div key="creators" {...fadeSlide}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: 16,
                }}
              >
                {filteredCreators.map((c) => (
                  <motion.div
                    key={c.handle}
                    variants={cardHover}
                    initial="rest"
                    whileHover="hover"
                    onClick={() => navigate('profile', { author: { name: c.name, handle: c.handle, avatar: c.avatar } })}
                    style={{
                      background: C.card,
                      border: `1px solid ${C.border}`,
                      borderRadius: 14,
                      padding: 18,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(121,40,202,0.35)'
                      e.currentTarget.style.boxShadow = '0 4px 24px rgba(121,40,202,0.08)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = C.border
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${C.purple}, ${C.cyan})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {c.avatar}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>{c.handle}</div>
                      <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: 12, color: C.muted }}>
                        <span>{c.followers.toLocaleString()} followers</span>
                        <span>{c.graphs} graphs</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              {filteredCreators.length === 0 && <p style={{ color: C.muted, textAlign: 'center', marginTop: 40 }}>No creators found.</p>}
            </motion.div>
          )}

          {/* Graphs */}
          {activeTab === 'graphs' && (
            <motion.div key="graphs" {...fadeSlide}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 16,
                }}
              >
                {filteredGraphs.map((g) => (
                  <motion.div
                    key={g.id}
                    variants={cardHover}
                    initial="rest"
                    whileHover="hover"
                    onClick={() => navigate('graph-detail', { graphId: g.id })}
                    style={{
                      background: C.card,
                      border: `1px solid ${C.border}`,
                      borderRadius: 14,
                      padding: 18,
                      cursor: 'pointer',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(52,211,153,0.3)'
                      e.currentTarget.style.boxShadow = '0 4px 24px rgba(52,211,153,0.08)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = C.border
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{g.title}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>{g.creator}</div>
                    <MiniChart type={g.chartType} color={C.green} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {g.tags.map((t) => (
                          <span
                            key={t}
                            style={{
                              fontSize: 11,
                              color: C.green,
                              background: 'rgba(52,211,153,0.1)',
                              padding: '2px 8px',
                              borderRadius: 6,
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: C.muted }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Eye size={13} /> {Math.floor(g.likes * 3.2)}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Heart size={13} /> {g.likes}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              {filteredGraphs.length === 0 && <p style={{ color: C.muted, textAlign: 'center', marginTop: 40 }}>No graphs found.</p>}
            </motion.div>
          )}

          {/* Topics */}
          {activeTab === 'topics' && (
            <motion.div key="topics" {...fadeSlide}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 14,
                }}
              >
                {filteredTopics.map((t) => (
                  <motion.div
                    key={t.tag}
                    variants={cardHover}
                    initial="rest"
                    whileHover="hover"
                    onClick={() => navigate('tag', { tag: t.tag })}
                    style={{
                      background: C.card,
                      border: `1px solid ${C.border}`,
                      borderRadius: 14,
                      padding: 20,
                      cursor: 'pointer',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0,210,255,0.25)'
                      e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,210,255,0.08)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = C.border
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{ fontSize: 20, fontWeight: 700, color: C.cyan, marginBottom: 6 }}>{t.tag}</div>
                    <div style={{ fontSize: 13, color: C.muted }}>
                      {t.posts.toLocaleString()} posts
                    </div>
                  </motion.div>
                ))}
              </div>
              {filteredTopics.length === 0 && <p style={{ color: C.muted, textAlign: 'center', marginTop: 40 }}>No topics found.</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
