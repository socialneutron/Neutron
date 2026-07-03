import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Bell, BarChart3, Download, Share2, Repeat2,
  Heart, MessageCircle, ChevronDown, Info, Maximize2, Eye,
  Compass, Zap
} from 'lucide-react'
import ShareModal from '../components/graphs/ShareModal'
import GraphDownloadModal from '../components/graphs/GraphDownloadModal'
import CreatorStudio from '../components/graphs/CreatorStudio'
import { useGraphStore } from '../stores/graphStore'
import { useUserAvatar } from '../stores/userAvatarStore'

const C = {
  bg: '#05050A', surface: '#090914', card: '#0d0d1a', cardHover: '#111127',
  border: 'rgba(255,255,255,0.06)', borderLight: 'rgba(255,255,255,0.1)',
  cyan: '#00D2FF', purple: '#7928CA', green: '#34D399', red: '#ef4444',
  text: '#f1f5f9', muted: '#6b7280', dim: '#374151',
}

const MARKET_DATA = [
  { symbol: 'BTC', name: 'Bitcoin', price: '$66,982.41', change: '+2.35%', positive: true, icon: '₿', color: '#f7931a' },
  { symbol: 'ETH', name: 'Ethereum', price: '$3,512.84', change: '+1.87%', positive: true, icon: 'Ξ', color: '#627eea' },
  { symbol: 'SOL', name: 'Solana', price: '$164.72', change: '+4.25%', positive: true, icon: '◎', color: '#00D2FF' },
  { symbol: 'NTRN', name: 'Neutron', price: '$1.29', change: '+6.14%', positive: true, icon: '⚛', color: '#7928CA' },
]

const CREATORS = [
  { name: 'Aria Takahashi', handle: '@aria_t', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', verified: true },
  { name: 'Devin Vance', handle: '@vance_quant', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', verified: true },
  { name: 'Lina Vance', handle: '@lina_data', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80', verified: true },
]

const INSIGHTS = [
  { creator: CREATORS[0], title: 'Web3 Gas Fees Are Stabilizing — What\'s Next?', time: '9m ago', miniType: 'bar' },
  { creator: CREATORS[1], title: 'Solana On-Chain Metrics Show Strong Holder Confluence', time: '21m ago', miniType: 'line' },
  { creator: CREATORS[2], title: 'RNA Folding Models Unlocking New Genomic Frontiers', time: '35m ago', miniType: 'area' },
]

const SIDEBAR_NAV = [
  { id: 'explorer', label: 'Explorer', icon: Compass },
  { id: 'graphs', label: 'Graphs', icon: BarChart3, active: true },
  { id: 'ai', label: 'AI Insights', icon: Zap, badge: 'BETA' },
]

function MiniChart({ type, colors, height = 40 }) {
  const w = 120
  if (type === 'bar') {
    const bars = [0.4, 0.7, 0.3, 0.9, 0.5, 0.8, 0.6, 0.4, 0.7, 0.3, 0.85, 0.55]
    return (
      <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`}>
        {bars.map((h, i) => (
          <rect key={i} x={i * 10} y={height - h * height} width={7} height={h * height} rx={2} fill={i % 2 === 0 ? colors[0] : colors[1]} opacity={0.9} />
        ))}
      </svg>
    )
  }
  if (type === 'line') {
    return (
      <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`}>
        <polyline points="0,30 15,25 30,28 45,15 60,18 75,10 90,12 105,8 120,5" fill="none" stroke={colors[0]} strokeWidth="2" strokeLinecap="round" />
        <polyline points="0,30 15,25 30,28 45,15 60,18 75,10 90,12 105,8 120,5" fill="none" stroke={colors[1]} strokeWidth="2" strokeLinecap="round" strokeDasharray="4,4" opacity={0.5} transform="translate(0,5)" />
      </svg>
    )
  }
  if (type === 'pie' || type === 'doughnut') {
    const r = height / 2 - 4
    const cx = w / 2, cy = height / 2
    const segments = [
      { start: 0, end: 0.35, fill: colors[0] },
      { start: 0.35, end: 0.55, fill: colors[1] },
      { start: 0.55, end: 0.70, fill: '#34D399' },
      { start: 0.70, end: 0.85, fill: '#f59e0b' },
      { start: 0.85, end: 1, fill: '#6366f1' },
    ]
    const innerR = type === 'doughnut' ? r * 0.45 : 0
    const arcs = segments.map((s, i) => {
      const a1 = s.start * 2 * Math.PI - Math.PI / 2
      const a2 = s.end * 2 * Math.PI - Math.PI / 2
      const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1)
      const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2)
      const large = s.end - s.start > 0.5 ? 1 : 0
      let d = `M${cx + innerR * Math.cos(a1)},${cy + innerR * Math.sin(a1)} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} L${cx + innerR * Math.cos(a2)},${cy + innerR * Math.sin(a2)}`
      if (innerR > 0) d += ` A${innerR},${innerR} 0 ${large},0 ${cx + innerR * Math.cos(a1)},${cy + innerR * Math.sin(a1)}`
      else d += ' Z'
      return <path key={i} d={d} fill={s.fill} />
    })
    if (innerR > 0) {
      arcs.push(<circle key="hole" cx={cx} cy={cy} r={innerR} fill="#0d0d1a" />)
    }
    return (
      <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`}>
        {arcs}
      </svg>
    )
  }
  return (
    <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`}>
      <defs>
        <linearGradient id={`ag${colors[0]}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors[0]} stopOpacity={0.4} />
          <stop offset="100%" stopColor={colors[0]} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`M0,${height} L0,30 Q15,10 30,20 T60,15 T90,8 T120,5 L120,${height} Z`} fill={`url(#ag${colors[0]})`} />
      <polyline points="0,30 15,18 30,20 45,12 60,15 75,10 90,8 105,6 120,5" fill="none" stroke={colors[0]} strokeWidth="2" />
    </svg>
  )
}

function ChartCard({ card, navigate, onShare, onDownload }) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(card.likes)

  return (
    <motion.div whileHover={{ y: -2, borderColor: 'rgba(0,210,255,0.2)' }}
      onClick={() => navigate('graph-detail', { graphId: card.id })}
      style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', gap: 14, transition: 'border-color 0.2s', cursor: 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1.4, flex: 1, paddingRight: 8 }}>{card.title}</h3>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.green, background: `${C.green}15`, padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>▲ {card.change}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
        <MiniChart type={card.type} colors={card.colors} height={80} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {card.tags.map(t => (
          <span key={t} onClick={(e) => { e.stopPropagation(); navigate('tag', { tag: t.replace('#', '') }) }}
            style={{ fontSize: 10, fontWeight: 600, color: C.cyan, opacity: 0.7, background: `${C.cyan}10`, padding: '3px 8px', borderRadius: 4, cursor: 'pointer' }}>{t}</span>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); setLiked(!liked); setLikeCount(c => liked ? c - 1 : c + 1) }}
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: liked ? '#f87171' : C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
          <Heart size={14} fill={liked ? 'currentColor' : 'none'} /> {likeCount}
        </motion.button>
        <span onClick={(e) => { e.stopPropagation(); navigate('home', { assetData: { title: card.title, category: card.tags?.[0]?.replace('#','') || 'Graphs', price: card.change, image: null, seller: 'Graph Creator', sellerAvatar: null, graphId: card.id, graphTags: card.tags } }) }}
          style={{ display: 'flex', alignItems: 'center', gap: 5, color: C.muted, fontSize: 12, cursor: 'pointer' }}><MessageCircle size={14} /> {card.comments}</span>
        <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); navigate('home', { repostData: { title: card.title, category: card.tags?.[0]?.replace('#','') || 'Graphs', graphId: card.id } }) }}
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
          <Repeat2 size={14} />
        </motion.button>
        <div style={{ flex: 1 }} />
        <button onClick={(e) => { e.stopPropagation(); onShare?.() }}
          style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 0 }}><Share2 size={14} /></button>
        <button onClick={(e) => { e.stopPropagation(); onDownload?.() }}
          style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 0 }}><Download size={14} /></button>
        <button onClick={(e) => { e.stopPropagation(); navigate('graph-detail', { graphId: card.id }) }}
          style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 0 }}><Maximize2 size={14} /></button>
      </div>
    </motion.div>
  )
}

export default function GraphPage({ navigate, user, fxEnabled, setFxEnabled }) {
  const [viewMode, setViewMode] = useState('dashboard')
  const [category, setCategory] = useState('All Categories')
  const [showCatDrop, setShowCatDrop] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [shareData, setShareData] = useState({})
  const [showDownload, setShowDownload] = useState(false)
  const [downloadData, setDownloadData] = useState({})
  const { graphs } = useGraphStore()
  const { avatar: globalAvatar, displayName: globalDisplayName } = useUserAvatar()

  const displayName = globalDisplayName || user?.username || 'Epic Legend'
  const handle = user?.handle || '@epic.legend'
  const avatar = globalAvatar || user?.avatar || ''

  const filteredGraphs = category === 'All Categories'
    ? graphs
    : graphs.filter(g => g.tags.some(t => t.toLowerCase().includes(category.toLowerCase())))

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ background: `${C.surface}ee`, backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}`, padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => navigate('home')} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 4 }}>
            <ArrowLeft size={20} />
          </button>
          <span style={{ fontSize: 16, fontWeight: 800, color: C.text }}>neutron<span style={{ color: C.cyan }}>.graphs</span></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <button onClick={() => setViewMode('dashboard')}
            style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 700, letterSpacing: '0.5px', cursor: 'pointer', padding: '4px 0', color: viewMode === 'dashboard' ? C.cyan : C.muted, borderBottom: viewMode === 'dashboard' ? `2px solid ${C.cyan}` : '2px solid transparent', transition: 'all 0.2s' }}>
            GLOBAL FEED
          </button>
          <button onClick={() => setViewMode('creator')}
            style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 700, letterSpacing: '0.5px', cursor: 'pointer', padding: '4px 0', color: viewMode === 'creator' ? C.cyan : C.muted, borderBottom: viewMode === 'creator' ? `2px solid ${C.cyan}` : '2px solid transparent', transition: 'all 0.2s' }}>
            CREATOR STUDIO
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.muted }}>
            FX:
            <div onClick={() => setFxEnabled && setFxEnabled(!fxEnabled)}
              style={{ width: 32, height: 18, borderRadius: 9, background: fxEnabled ? C.cyan : C.dim, position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: fxEnabled ? 16 : 2, transition: 'left 0.2s' }} />
            </div>
          </div>
          <button onClick={() => navigate('notifications')}
            style={{ position: 'relative', background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 4 }}>
            <Bell size={18} />
            <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: '50%', background: C.red }} />
          </button>
          <div onClick={() => navigate('profile')} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: avatar ? `url(${avatar}) center/cover` : `linear-gradient(135deg, ${C.cyan}, ${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>
              {!avatar && displayName[0]?.toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{displayName}</span>
              <span style={{ fontSize: 10, color: C.cyan }}>{handle}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, maxWidth: 1400, width: '100%', margin: '0 auto' }}>
        {/* Sidebar */}
        <aside style={{ width: 220, flexShrink: 0, padding: '20px 16px', borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 4 }} className="graph-sidebar">
          {SIDEBAR_NAV.map(item => {
            const Icon = item.icon
            const navMap = { explorer: 'explorer', graphs: 'graphs', ai: 'ai-insights' }
            return (
              <button key={item.id} onClick={() => navigate(navMap[item.id] || 'graphs')}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, width: '100%', textAlign: 'left', transition: 'all 0.15s',
                  background: item.active ? `${C.cyan}12` : 'transparent', color: item.active ? C.cyan : C.muted }}>
                <Icon size={18} /> {item.label}
                {item.badge && <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: '#22c55e', background: '#22c55e18', padding: '2px 6px', borderRadius: 4 }}>{item.badge}</span>}
              </button>
            )
          })}
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, padding: '20px 24px', minWidth: 0 }}>
          <AnimatePresence mode="wait">
            {viewMode === 'creator' ? (
              <motion.div key="creator" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <CreatorStudio onBack={() => setViewMode('dashboard')} />
              </motion.div>
            ) : (
              <motion.div key="dashboard" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div>
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>Market Graphs</h1>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>Visualize real-time market trends and on-chain insights.</p>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => setShowCatDrop(!showCatDrop)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      {category} <ChevronDown size={14} />
                    </button>
                    {showCatDrop && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                        style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 4, zIndex: 50, minWidth: 160 }}>
                        {['All Categories', 'Crypto', 'Finance', 'Biotech', 'Web3', 'AI'].map(c => (
                          <button key={c} onClick={() => { setCategory(c); setShowCatDrop(false) }}
                            style={{ display: 'block', width: '100%', padding: '8px 12px', background: category === c ? `${C.cyan}15` : 'transparent', border: 'none', borderRadius: 6, color: category === c ? C.cyan : C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}>
                            {c}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Chart cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 32 }}>
                  {filteredGraphs.map(card => <ChartCard key={card.id} card={card} navigate={navigate} onShare={() => { setShareData({ graphId: card.id, graphTitle: card.title }); setShowShare(true) }} onDownload={() => { setDownloadData(card); setShowDownload(true) }} />)}
                </div>

                {/* Top Insights */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Zap size={16} color={C.cyan} />
                      <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>Top Insights</h2>
                    </div>
                    <button onClick={() => navigate('ai-insights')}
                      style={{ background: 'none', border: 'none', color: C.cyan, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      View all insights <ChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {INSIGHTS.map((ins, i) => (
                      <motion.div key={i} whileHover={{ background: C.cardHover }}
                        onClick={() => navigate('profile', { author: { name: ins.creator.name, handle: ins.creator.handle, avatar: ins.creator.avatar, verified: ins.creator.verified } })}
                        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 10, cursor: 'pointer', transition: 'background 0.15s' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `url(${ins.creator.avatar}) center/cover`, flexShrink: 0 }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: C.text, whiteSpace: 'nowrap' }}>{ins.creator.name}</span>
                          {ins.creator.verified && <span style={{ width: 14, height: 14, borderRadius: '50%', background: C.cyan, color: '#fff', fontSize: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>✓</span>}
                        </div>
                        <span style={{ fontSize: 13, color: C.text, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ins.title}</span>
                        <div style={{ flexShrink: 0, opacity: 0.7 }}><MiniChart type={ins.miniType} colors={[C.cyan, C.purple]} height={24} /></div>
                        <span style={{ fontSize: 11, color: C.muted, flexShrink: 0, whiteSpace: 'nowrap' }}>{ins.time}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Right sidebar — Market Overview */}
        {viewMode === 'dashboard' && (
          <aside style={{ width: 260, flexShrink: 0, padding: '20px 16px', borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 20 }} className="graph-sidebar-right">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text }}>Market Overview</h3>
                <Info size={14} color={C.muted} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {MARKET_DATA.map(m => (
                  <div key={m.symbol} onClick={() => navigate('asset', { symbol: m.symbol })}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '4px 0' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${m.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: m.color, flexShrink: 0 }}>{m.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text }}>{m.name} ({m.symbol})</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text }}>{m.price}</p>
                      <p style={{ margin: 0, fontSize: 11, color: C.green, fontWeight: 600 }}>{m.change}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('markets')}
                style={{ marginTop: 14, width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                View all markets <ChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} />
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* Modals */}
      <ShareModal isOpen={showShare} onClose={() => setShowShare(false)} graphId={shareData.graphId} graphTitle={shareData.graphTitle} navigate={navigate} />
      <GraphDownloadModal isOpen={showDownload} onClose={() => setShowDownload(false)} graph={downloadData} />

      <style>{`
        @media (max-width: 1024px) {
          .graph-sidebar, .graph-sidebar-right { display: none !important; }
        }
      `}</style>
    </div>
  )
}
