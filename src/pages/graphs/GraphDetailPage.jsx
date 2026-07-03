import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Heart, MessageCircle, Share2, Download, Maximize2,
  Send, X, Eye, Clock, ChevronRight, BadgeCheck, ZoomIn, ZoomOut
} from 'lucide-react'

const C = {
  bg: '#05050A', surface: '#090914', card: '#0d0d1a', border: 'rgba(255,255,255,0.06)',
  cyan: '#00D2FF', purple: '#7928CA', green: '#34D399', red: '#ef4444',
  text: '#f1f5f9', muted: '#6b7280',
}

const GRAPHS = {
  g1: {
    id: 'g1', title: 'Solana (SOL) Market Cap & Volume Confluence',
    type: 'line',
    tags: ['Crypto', 'Finance', 'Web3'],
    description: 'A comprehensive view of Solana\'s market capitalization paired with trading volume, showing key confluence zones where price action aligns with on-chain activity. Useful for identifying accumulation phases and distribution patterns.',
    creator: {
      name: 'Devin Vance', handle: '@vance_quant',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      verified: true,
    },
    uploadDate: 'Jun 24, 2026',
    views: 4872, likes: 512, comments: 5,
    change: '+8.7%', positive: true,
  },
  g2: {
    id: 'g2', title: 'Web3 Protocol Gas Index (N-Candle)',
    type: 'bar',
    tags: ['Ethereum', 'Web3', 'EVM'],
    description: 'Normalized gas fee index across major Ethereum DeFi protocols. The N-Candle metric smooths out base fee volatility to reveal true protocol-level demand. Useful for predicting network congestion windows.',
    creator: {
      name: 'Aria Takahashi', handle: '@aria_t',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      verified: true,
    },
    uploadDate: 'Jun 22, 2026',
    views: 9143, likes: 914, comments: 8,
    change: '+12.5%', positive: true,
  },
  g3: {
    id: 'g3', title: 'Deep Genomics Multi-Series RNA Fold Frequency',
    type: 'area',
    tags: ['Biotech', 'Genetics', 'AI'],
    description: 'Multi-series visualization of RNA secondary structure fold frequencies derived from deep learning predictions. Shows convergence patterns across 10k simulated folding trajectories, revealing thermodynamically stable conformations.',
    creator: {
      name: 'Lina Vance', handle: '@lina_data',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
      verified: true,
    },
    uploadDate: 'Jun 20, 2026',
    views: 3189, likes: 318, comments: 3,
    change: '+15.3%', positive: true,
  },
}

const MOCK_COMMENTS = {
  g1: [
    { id: 1, author: 'Marcus Wei', handle: '@marcus_wei', text: 'The volume confluence at the $148 support level is textbook. Accumulation zone confirmed by on-chain whale wallets moving SOL off exchanges.', time: '2h ago', likes: 24, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80' },
    { id: 2, author: 'Elena Park', handle: '@elena_p', text: 'Great overlay of the MVRV ratio on the lower timeframe. The divergence at week 14 was a clear signal.', time: '1d ago', likes: 11, avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80' },
    { id: 3, author: 'Jin Nakamura', handle: '@jin_defi', text: 'Could you add a funding rate overlay? Would love to see how perpetual CEX flow correlates with this pattern.', time: '3d ago', likes: 8, avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=150&q=80' },
  ],
  g2: [
    { id: 1, author: 'Riya Sharma', handle: '@riya_chain', text: 'The N-Candle smoothing really clarifies the signal. The spike at epoch 192 was Uniswap v4 launch congestion — you can see it pull away from the baseline.', time: '5h ago', likes: 31, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
    { id: 2, author: 'Tom Aldric', handle: '@tom_gas', text: 'I\'ve been tracking L2 gas costs as well. Would be amazing to stack this against Arbitrum and Base fee data in a dual-axis view.', time: '12h ago', likes: 18, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80' },
    { id: 3, author: 'Sophia Lin', handle: '@sophia_web3', text: 'This is exactly what protocol treasury managers need. The historical overlay for Q1 and Q2 is spot on for budgeting gas costs.', time: '2d ago', likes: 14, avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80' },
  ],
  g3: [
    { id: 1, author: 'Dr. Arjun Mehta', handle: '@arjun_rna', text: 'The fold convergence at trajectory 8k is remarkable — it mirrors the thermodynamic stability predictions from NMR data. Validating nicely.', time: '1d ago', likes: 42, avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=150&q=80' },
    { id: 2, author: 'Yuki Tanaka', handle: '@yuki_genomics', text: 'Would love to see this extended to non-coding RNA regions. The secondary structure in UTRs is still largely unexplored at this resolution.', time: '3d ago', likes: 19, avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=150&q=80' },
    { id: 3, author: 'Alex Chen', handle: '@alex_ml', text: 'What\'s the inference cost per fold trajectory? Wondering if this approach scales to full transcriptome analysis.', time: '4d ago', likes: 7, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80' },
  ],
}

const RELATED_GRAPHS = {
  g1: [
    { id: 'g2', title: 'Web3 Protocol Gas Index (N-Candle)', type: 'bar', tags: ['Ethereum', 'Web3', 'EVM'], change: '+12.5%', positive: true, creator: 'Aria Takahashi' },
    { id: 'g3', title: 'Deep Genomics Multi-Series RNA Fold Frequency', type: 'area', tags: ['Biotech', 'Genetics', 'AI'], change: '+15.3%', positive: true, creator: 'Lina Vance' },
    { id: 'g1b', title: 'BTC Dominance vs. ETH/SOL Ratio', type: 'line', tags: ['Crypto', 'Macro', 'Trading'], change: '-2.1%', positive: false, creator: 'Devin Vance' },
  ],
  g2: [
    { id: 'g1', title: 'Solana (SOL) Market Cap & Volume Confluence', type: 'line', tags: ['Crypto', 'Finance', 'Web3'], change: '+8.7%', positive: true, creator: 'Devin Vance' },
    { id: 'g3', title: 'Deep Genomics Multi-Series RNA Fold Frequency', type: 'area', tags: ['Biotech', 'Genetics', 'AI'], change: '+15.3%', positive: true, creator: 'Lina Vance' },
    { id: 'g2b', title: 'Layer-2 Throughput Benchmarking', type: 'bar', tags: ['Ethereum', 'L2', 'Performance'], change: '+31.2%', positive: true, creator: 'Aria Takahashi' },
  ],
  g3: [
    { id: 'g1', title: 'Solana (SOL) Market Cap & Volume Confluence', type: 'line', tags: ['Crypto', 'Finance', 'Web3'], change: '+8.7%', positive: true, creator: 'Devin Vance' },
    { id: 'g2', title: 'Web3 Protocol Gas Index (N-Candle)', type: 'bar', tags: ['Ethereum', 'Web3', 'EVM'], change: '+12.5%', positive: true, creator: 'Aria Takahashi' },
    { id: 'g3b', title: 'Protein Folding Confidence Distribution', type: 'area', tags: ['Biotech', 'AI', 'Structural Biology'], change: '+6.8%', positive: true, creator: 'Lina Vance' },
  ],
}

function generateLineData() {
  const pts = []
  let y = 50 + Math.random() * 20
  for (let i = 0; i < 24; i++) {
    y += (Math.random() - 0.45) * 8
    y = Math.max(10, Math.min(90, y))
    pts.push({ x: (i / 23) * 900, y: 200 - (y / 100) * 160 })
  }
  return pts
}

function generateBarData() {
  const vals = []
  for (let i = 0; i < 16; i++) {
    vals.push(20 + Math.random() * 70)
  }
  return vals
}

function generateAreaData() {
  const pts = []
  let y = 60 + Math.random() * 10
  for (let i = 0; i < 24; i++) {
    y += (Math.random() - 0.48) * 5
    y = Math.max(15, Math.min(85, y))
    pts.push({ x: (i / 23) * 900, y: 200 - (y / 100) * 160 })
  }
  return pts
}

function LineChart({ scale }) {
  const pts = generateLineData()
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  return (
    <svg width="100%" height="200" viewBox="0 0 900 220" style={{ transform: `scale(${scale})`, transformOrigin: 'center', transition: 'transform 0.3s ease' }}>
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.cyan} stopOpacity={0.3} />
          <stop offset="100%" stopColor={C.cyan} stopOpacity={0} />
        </linearGradient>
      </defs>
      {[0, 40, 80, 120, 160, 200].map(y => (
        <line key={y} x1={0} y1={y} x2={900} y2={y} stroke={C.border} strokeWidth={1} />
      ))}
      <path d={`${path} L900,200 L0,200 Z`} fill="url(#lineGrad)" />
      <path d={path} fill="none" stroke={C.cyan} strokeWidth={2.5} strokeLinecap="round" />
      {pts.filter((_, i) => i % 4 === 0).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3.5} fill={C.bg} stroke={C.cyan} strokeWidth={2} />
      ))}
    </svg>
  )
}

function BarChart({ scale }) {
  const vals = generateBarData()
  const barW = 900 / vals.length * 0.65
  const gap = (900 / vals.length) * 0.35
  return (
    <svg width="100%" height="200" viewBox="0 0 900 220" style={{ transform: `scale(${scale})`, transformOrigin: 'center', transition: 'transform 0.3s ease' }}>
      <defs>
        <linearGradient id="barGrad1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.red} />
          <stop offset="100%" stopColor={C.red} stopOpacity={0.5} />
        </linearGradient>
        <linearGradient id="barGrad2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.green} />
          <stop offset="100%" stopColor={C.green} stopOpacity={0.5} />
        </linearGradient>
      </defs>
      {[0, 50, 100, 150, 200].map(y => (
        <line key={y} x1={0} y1={y} x2={900} y2={y} stroke={C.border} strokeWidth={1} />
      ))}
      {vals.map((v, i) => {
        const h = (v / 100) * 180
        const x = i * (barW + gap) + gap / 2
        return (
          <rect key={i} x={x} y={200 - h} width={barW} height={h} rx={3}
            fill={i % 2 === 0 ? 'url(#barGrad1)' : 'url(#barGrad2)'} opacity={0.85} />
        )
      })}
    </svg>
  )
}

function AreaChart({ scale }) {
  const pts = generateAreaData()
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  return (
    <svg width="100%" height="200" viewBox="0 0 900 220" style={{ transform: `scale(${scale})`, transformOrigin: 'center', transition: 'transform 0.3s ease' }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.green} stopOpacity={0.5} />
          <stop offset="100%" stopColor={C.green} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      {[0, 40, 80, 120, 160, 200].map(y => (
        <line key={y} x1={0} y1={y} x2={900} y2={y} stroke={C.border} strokeWidth={1} />
      ))}
      <path d={`${path} L900,200 L0,200 Z`} fill="url(#areaGrad)" />
      <path d={path} fill="none" stroke={C.green} strokeWidth={2} strokeLinecap="round" />
    </svg>
  )
}

function SkeletonLoader() {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 56, background: C.surface, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.card }} />
        <div style={{ width: 120, height: 16, borderRadius: 6, background: C.card }} />
      </div>
      <div style={{ flex: 1, padding: '24px 20px', maxWidth: 800, margin: '0 auto', width: '100%' }}>
        <div style={{ width: '70%', height: 28, borderRadius: 8, background: C.card, marginBottom: 12 }} />
        <div style={{ width: '40%', height: 14, borderRadius: 6, background: C.card, marginBottom: 20 }} />
        <div style={{ width: '100%', height: 240, borderRadius: 12, background: C.card, marginBottom: 20 }} />
        <div style={{ width: '100%', height: 14, borderRadius: 6, background: C.card, marginBottom: 8 }} />
        <div style={{ width: '90%', height: 14, borderRadius: 6, background: C.card, marginBottom: 8 }} />
        <div style={{ width: '60%', height: 14, borderRadius: 6, background: C.card }} />
      </div>
    </div>
  )
}

function FullscreenOverlay({ graph, onClose }) {
  const [scale, setScale] = useState(1)
  const ChartComp = graph.type === 'bar' ? BarChart : graph.type === 'area' ? AreaChart : LineChart
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }}
        onClick={e => e.stopPropagation()}
        style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, width: '100%', maxWidth: 1100, position: 'relative' }}>
        <button onClick={onClose}
          style={{ position: 'absolute', top: 12, right: 12, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={18} />
        </button>
        <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 800, color: C.text }}>{graph.title}</h2>
        <div style={{ overflow: 'hidden', display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
          <ChartComp scale={scale} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))}
            style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ZoomOut size={16} />
          </button>
          <button onClick={() => setScale(s => Math.min(2, s + 0.2))}
            style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ZoomIn size={16} />
          </button>
          <span style={{ fontSize: 12, color: C.muted, alignSelf: 'center', marginLeft: 8 }}>{Math.round(scale * 100)}%</span>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function GraphDetailPage({ graphId, navigate, user }) {
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [following, setFollowing] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [fullscreen, setFullscreen] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState([])
  const [replyTo, setReplyTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [commentLikes, setCommentLikes] = useState({})

  const graph = GRAPHS[graphId] || GRAPHS.g1
  const resolvedId = GRAPHS[graphId] ? graphId : 'g1'
  const relatedGraphs = RELATED_GRAPHS[resolvedId] || RELATED_GRAPHS.g1

  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => {
      setLikeCount(graph.likes)
      setComments(MOCK_COMMENTS[resolvedId] || MOCK_COMMENTS.g1)
      setLoading(false)
    }, 800)
    return () => clearTimeout(t)
  }, [graphId, resolvedId])

  const handleLike = () => {
    setLiked(!liked)
    setLikeCount(c => liked ? c - 1 : c + 1)
  }

  const handleAddComment = () => {
    if (!commentText.trim()) return
    const newComment = {
      id: Date.now(),
      author: user?.username || 'You',
      handle: user?.handle || '@you',
      text: commentText.trim(),
      time: 'Just now',
      likes: 0,
      avatar: user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    }
    setComments(prev => [...prev, newComment])
    setCommentText('')
  }

  const handleReply = (commentId) => {
    if (!replyText.trim()) return
    const reply = {
      id: Date.now(),
      author: user?.username || 'You',
      handle: user?.handle || '@you',
      text: `@${comments.find(c => c.id === commentId)?.handle?.slice(1) || 'user'} ${replyText.trim()}`,
      time: 'Just now',
      likes: 0,
      avatar: user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    }
    setComments(prev => [...prev.slice(0, prev.findIndex(c => c.id === commentId) + 1), reply, ...prev.slice(prev.findIndex(c => c.id === commentId) + 1)])
    setReplyText('')
    setReplyTo(null)
  }

  const toggleCommentLike = (commentId) => {
    setCommentLikes(prev => ({
      ...prev,
      [commentId]: !prev[commentId],
    }))
  }

  const handleZoom = (dir) => {
    setZoom(z => dir === 'in' ? Math.min(2, z + 0.2) : Math.max(0.4, z - 0.2))
  }

  if (loading) return <SkeletonLoader />

  const ChartComp = graph.type === 'bar' ? BarChart : graph.type === 'area' ? AreaChart : LineChart

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        background: `${C.surface}ee`, backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${C.border}`, padding: '0 20px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('graphs')}
            style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={20} />
          </motion.button>
          <span style={{ fontSize: 15, fontWeight: 800, color: C.text }}>
            neutron<span style={{ color: C.cyan }}>.graphs</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('share', { graphId: resolvedId })}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <Share2 size={14} /> Share
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('download', { graphId: resolvedId })}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <Download size={14} /> Download
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setFullscreen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: `1px solid ${C.cyan}30`, background: `${C.cyan}10`, color: C.cyan, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <Maximize2 size={14} /> Expand
          </motion.button>
        </div>
      </header>

      {/* Main content */}
      <main style={{ flex: 1, maxWidth: 840, width: '100%', margin: '0 auto', padding: '28px 24px' }}>
        {/* Title & meta */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: C.text, lineHeight: 1.3 }}>{graph.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: graph.positive ? C.green : C.red, background: `${graph.positive ? C.green : C.red}12`, padding: '3px 10px', borderRadius: 6 }}>
              ▲ {graph.change}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: C.muted, fontSize: 12 }}>
              <Eye size={14} /> {graph.views.toLocaleString()} views
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: C.muted, fontSize: 12 }}>
              <Clock size={14} /> {graph.uploadDate}
            </div>
          </div>
        </motion.div>

        {/* Creator */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20, padding: '14px 16px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: `url(${graph.creator.avatar}) center/cover`, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{graph.creator.name}</span>
              {graph.creator.verified && (
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: C.cyan, color: '#fff', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                  <BadgeCheck size={12} />
                </span>
              )}
            </div>
            <span style={{ fontSize: 12, color: C.muted }}>{graph.creator.handle}</span>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setFollowing(!following)}
            style={{
              padding: '7px 16px', borderRadius: 8, border: following ? 'none' : `1px solid ${C.cyan}`,
              background: following ? C.cyan : 'transparent',
              color: following ? '#000' : C.cyan,
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.2s',
            }}>
            {following ? '✓ Following' : '+ Follow'}
          </motion.button>
        </motion.div>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
          {graph.tags.map(t => (
            <span key={t} style={{ fontSize: 11, fontWeight: 700, color: C.cyan, background: `${C.cyan}10`, padding: '4px 10px', borderRadius: 6 }}>
              {t}
            </span>
          ))}
        </div>

        {/* Chart */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ marginTop: 24, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Chart</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleZoom('in')}
                style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ZoomIn size={14} />
              </motion.button>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleZoom('out')}
                style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ZoomOut size={14} />
              </motion.button>
              <span style={{ fontSize: 11, color: C.muted, alignSelf: 'center', marginLeft: 4 }}>{Math.round(zoom * 100)}%</span>
            </div>
          </div>
          <div style={{ overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
            <ChartComp scale={zoom} />
          </div>
        </motion.div>

        {/* Description */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ marginTop: 24 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: C.text }}>About this graph</h2>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: '#9ca3af' }}>{graph.description}</p>
        </motion.div>

        {/* Stats bar */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleLike}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: liked ? '#f87171' : C.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
            <Heart size={16} fill={liked ? 'currentColor' : 'none'} /> {likeCount}
          </motion.button>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.muted, fontSize: 13, fontWeight: 600 }}>
            <MessageCircle size={16} /> {comments.length}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.muted, fontSize: 13, fontWeight: 600 }}>
            <Eye size={16} /> {graph.views.toLocaleString()}
          </span>
        </motion.div>

        {/* Comments */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ marginTop: 24 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: C.text }}>Comments</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {comments.map((c) => (
              <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: `url(${c.avatar}) center/cover`, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{c.author}</span>
                      <span style={{ fontSize: 11, color: C.muted }}>{c.handle}</span>
                      <span style={{ fontSize: 11, color: C.muted }}>· {c.time}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: '#d1d5db' }}>{c.text}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6 }}>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => toggleCommentLike(c.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: commentLikes[c.id] ? '#f87171' : C.muted, fontSize: 11, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                        <Heart size={12} fill={commentLikes[c.id] ? 'currentColor' : 'none'} /> {c.likes + (commentLikes[c.id] ? 1 : 0)}
                      </motion.button>
                      <button onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
                        style={{ background: 'none', border: 'none', color: C.muted, fontSize: 11, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
                {/* Reply input */}
                <AnimatePresence>
                  {replyTo === c.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      style={{ marginLeft: 44, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input value={replyText} onChange={e => setReplyText(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleReply(c.id)}
                          placeholder={`Reply to ${c.handle}...`}
                          style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', color: C.text, fontSize: 12, outline: 'none' }} />
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleReply(c.id)}
                          style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: C.cyan, color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Send size={14} />
                        </motion.button>
                        <button onClick={() => { setReplyTo(null); setReplyText('') }}
                          style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 4 }}>
                          <X size={14} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Add comment input */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20, alignItems: 'center', padding: '12px 16px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${C.cyan}, ${C.purple})`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>
              {(user?.username || 'Y')[0]?.toUpperCase()}
            </div>
            <input
              value={commentText} onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
              placeholder="Write a comment..."
              style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', color: C.text, fontSize: 13, outline: 'none' }}
            />
            <motion.button whileTap={{ scale: 0.9 }} onClick={handleAddComment}
              disabled={!commentText.trim()}
              style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: commentText.trim() ? `linear-gradient(135deg, #2563eb, #7c3aed)` : C.card, color: '#fff', cursor: commentText.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: commentText.trim() ? 1 : 0.4 }}>
              <Send size={14} />
            </motion.button>
          </div>
        </motion.div>

        {/* Related graphs */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          style={{ marginTop: 40, borderTop: `1px solid ${C.border}`, paddingTop: 28 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: C.text }}>Related Graphs</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
            {relatedGraphs.map(r => (
              <motion.div key={r.id} whileHover={{ y: -3, borderColor: `${C.cyan}30` }}
                onClick={() => navigate('graphDetail', { graphId: r.id })}
                style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, cursor: 'pointer', transition: 'border-color 0.2s' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1.4 }}>{r.title}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                  {r.tags.map(t => (
                    <span key={t} style={{ fontSize: 9, fontWeight: 700, color: C.cyan, background: `${C.cyan}10`, padding: '2px 6px', borderRadius: 4 }}>{t}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: C.muted }}>{r.creator}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: r.positive ? C.green : C.red }}>{r.change}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Fullscreen overlay */}
      <AnimatePresence>
        {fullscreen && <FullscreenOverlay graph={graph} onClose={() => setFullscreen(false)} />}
      </AnimatePresence>
    </div>
  )
}
