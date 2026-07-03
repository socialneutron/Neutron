import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Search, TrendingUp, TrendingDown, ArrowUpDown, Star } from 'lucide-react'

const C = {
  bg: '#05050A', surface: '#090914', card: '#0d0d1a', border: 'rgba(255,255,255,0.06)',
  cyan: '#00D2FF', purple: '#7928CA', green: '#34D399', red: '#ef4444',
  text: '#f1f5f9', muted: '#6b7280',
}

const MOCK_ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿', price: 104320, change24h: 2.34, change7d: 5.12, marketCap: 2048000000000, volume: 42300000000, category: 'Crypto', sparkline: [102, 103, 101, 103.5, 104, 103.2, 104.3] },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ', price: 3892, change24h: 1.87, change7d: 4.21, marketCap: 467000000000, volume: 18200000000, category: 'Crypto', sparkline: [382, 385, 383, 387, 388, 386, 389] },
  { symbol: 'SOL', name: 'Solana', icon: '◎', price: 198, change24h: 4.56, change7d: 12.34, marketCap: 92000000000, volume: 5800000000, category: 'Layer 1', sparkline: [188, 190, 192, 194, 196, 195, 198] },
  { symbol: 'NTRN', name: 'Neutron', icon: '⚛', price: 2.45, change24h: -1.23, change7d: 3.67, marketCap: 890000000, volume: 45000000, category: 'DeFi', sparkline: [2.48, 2.47, 2.44, 2.43, 2.45, 2.44, 2.45] },
  { symbol: 'ADA', name: 'Cardano', icon: '₳', price: 0.82, change24h: 3.21, change7d: -1.45, marketCap: 29000000000, volume: 1200000000, category: 'Layer 1', sparkline: [0.79, 0.80, 0.81, 0.80, 0.81, 0.82, 0.82] },
  { symbol: 'DOT', name: 'Polkadot', icon: '●', price: 9.12, change24h: -0.89, change7d: 2.11, marketCap: 13200000000, volume: 680000000, category: 'Layer 1', sparkline: [9.18, 9.15, 9.10, 9.11, 9.13, 9.12, 9.12] },
  { symbol: 'LINK', name: 'Chainlink', icon: '⬡', price: 18.67, change24h: 5.43, change7d: 8.92, marketCap: 11100000000, volume: 920000000, category: 'DeFi', sparkline: [17.8, 18.0, 18.2, 18.4, 18.5, 18.6, 18.7] },
  { symbol: 'MATIC', name: 'Polygon', icon: '⬟', price: 0.54, change24h: 1.12, change7d: -2.34, marketCap: 5400000000, volume: 310000000, category: 'Layer 2', sparkline: [0.53, 0.54, 0.53, 0.54, 0.55, 0.54, 0.54] },
  { symbol: 'AVAX', name: 'Avalanche', icon: '▲', price: 42.18, change24h: 6.78, change7d: 15.43, marketCap: 16800000000, volume: 1100000000, category: 'Layer 1', sparkline: [39.5, 40.2, 40.8, 41.3, 41.7, 42.0, 42.2] },
  { symbol: 'UNI', name: 'Uniswap', icon: '🦄', price: 12.34, change24h: -2.11, change7d: 1.89, marketCap: 9300000000, volume: 540000000, category: 'DeFi', sparkline: [12.6, 12.5, 12.4, 12.3, 12.35, 12.33, 12.34] },
  { symbol: 'AAVE', name: 'Aave', icon: '👻', price: 142.56, change24h: 3.45, change7d: 9.87, marketCap: 2150000000, volume: 280000000, category: 'DeFi', sparkline: [137, 139, 140, 141, 142, 141.5, 142.5] },
  { symbol: 'MKR', name: 'Maker', icon: '⚗', price: 2845, change24h: -0.56, change7d: 4.32, marketCap: 2580000000, volume: 190000000, category: 'DeFi', sparkline: [2860, 2855, 2850, 2848, 2846, 2844, 2845] },
]

const FILTER_TABS = ['All', 'Crypto', 'DeFi', 'AI Tokens', 'Layer 1', 'Layer 2']
const SORT_OPTIONS = [
  { label: 'Market Cap', key: 'marketCap' },
  { label: 'Price Change', key: 'change24h' },
  { label: 'Volume', key: 'volume' },
  { label: 'Name', key: 'name' },
]

const formatPrice = (p) => p >= 1 ? `$${p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `$${p.toFixed(4)}`
const formatCap = (n) => {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  return `$${n.toLocaleString()}`
}

function Sparkline({ data, color, width = 80, height = 28 }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function MarketsPage({ navigate, user }) {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [sortBy, setSortBy] = useState('marketCap')
  const [sortDir, setSortDir] = useState('desc')
  const [showSort, setShowSort] = useState(false)
  const [visibleCount, setVisibleCount] = useState(8)
  const [favorites, setFavorites] = useState(new Set(['BTC', 'NTRN']))

  const toggleFavorite = (e, symbol) => {
    e.stopPropagation()
    setFavorites((prev) => {
      const next = new Set(prev)
      next.has(symbol) ? next.delete(symbol) : next.add(symbol)
      return next
    })
  }

  const filtered = useMemo(() => {
    let list = MOCK_ASSETS
    if (activeFilter !== 'All') list = list.filter((a) => a.category === activeFilter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((a) => a.name.toLowerCase().includes(q) || a.symbol.toLowerCase().includes(q))
    }
    list = [...list].sort((a, b) => {
      const mul = sortDir === 'desc' ? -1 : 1
      if (sortBy === 'name') return mul * a.name.localeCompare(b.name)
      return mul * ((a[sortBy] || 0) - (b[sortBy] || 0))
    })
    return list
  }, [activeFilter, search, sortBy, sortDir])

  const visible = filtered.slice(0, visibleCount)
  const stats = {
    totalMarketCap: MOCK_ASSETS.reduce((s, a) => s + a.marketCap, 0),
    totalVolume: MOCK_ASSETS.reduce((s, a) => s + a.volume, 0),
    btcDominance: ((MOCK_ASSETS[0].marketCap / MOCK_ASSETS.reduce((s, a) => s + a.marketCap, 0)) * 100).toFixed(1),
    activeMarkets: MOCK_ASSETS.length,
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 20px' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('graphs')}
            style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.text }}
          >
            <ArrowLeft size={18} />
          </motion.button>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Markets</h1>
          <div style={{ flex: 1 }} />
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assets..."
              style={{
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '9px 14px 9px 36px', color: C.text, fontSize: 13, width: 220, outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total Market Cap', value: formatCap(stats.totalMarketCap), color: C.cyan },
            { label: '24h Volume', value: formatCap(stats.totalVolume), color: C.purple },
            { label: 'BTC Dominance', value: `${stats.btcDominance}%`, color: '#F7931A' },
            { label: 'Active Markets', value: stats.activeMarkets, color: C.green },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px' }}
            >
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Filter tabs + sort */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4, flex: 1, flexWrap: 'wrap' }}>
            {FILTER_TABS.map((tab) => (
              <motion.button
                key={tab}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setActiveFilter(tab)}
                style={{
                  background: activeFilter === tab ? C.card : 'transparent',
                  border: `1px solid ${activeFilter === tab ? C.cyan : C.border}`,
                  color: activeFilter === tab ? C.cyan : C.muted,
                  borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  transition: 'all .15s',
                }}
              >
                {tab}
              </motion.button>
            ))}
          </div>
          <div style={{ position: 'relative' }}>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowSort(!showSort)}
              style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 12px', color: C.muted, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <ArrowUpDown size={14} />
              {SORT_OPTIONS.find((o) => o.key === sortBy)?.label}
            </motion.button>
            <AnimatePresence>
              {showSort && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  style={{ position: 'absolute', right: 0, top: '110%', background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 6, zIndex: 30, minWidth: 160 }}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => {
                        if (sortBy === opt.key) setSortDir(sortDir === 'desc' ? 'asc' : 'desc')
                        else { setSortBy(opt.key); setSortDir('desc') }
                        setShowSort(false)
                      }}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: sortBy === opt.key ? C.cyan : C.text, padding: '7px 10px', fontSize: 12, cursor: 'pointer', borderRadius: 6,
                      }}
                    >
                      {opt.label} {sortBy === opt.key ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '40px 36px 1fr 80px 90px 90px 90px', gap: 8, padding: '8px 12px', fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: `1px solid ${C.border}` }}>
          <span>#</span>
          <span />
          <span>Asset</span>
          <span style={{ textAlign: 'right' }}>Price</span>
          <span style={{ textAlign: 'right' }}>24h</span>
          <span style={{ textAlign: 'center' }}>7d</span>
          <span style={{ textAlign: 'right' }}>Mkt Cap</span>
        </div>

        {/* Rows */}
        <AnimatePresence>
          {visible.map((asset, i) => {
            const isUp = asset.change24h >= 0
            return (
              <motion.div
                key={asset.symbol}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                onClick={() => navigate('asset', { symbol: asset.symbol })}
                style={{
                  display: 'grid', gridTemplateColumns: '40px 36px 1fr 80px 90px 90px 90px', gap: 8, padding: '12px', cursor: 'pointer', borderRadius: 8, alignItems: 'center', transition: 'background .15s',
                }}
              >
                <span style={{ fontSize: 13, color: C.muted }}>{i + 1}</span>
                <motion.button
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => toggleFavorite(e, asset.symbol)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                >
                  <Star size={14} fill={favorites.has(asset.symbol) ? '#FBBF24' : 'none'} color={favorites.has(asset.symbol) ? '#FBBF24' : C.muted} />
                </motion.button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20, width: 30, textAlign: 'center' }}>{asset.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{asset.name}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{asset.symbol}</div>
                  </div>
                </div>
                <span style={{ textAlign: 'right', fontSize: 13, fontWeight: 600 }}>{formatPrice(asset.price)}</span>
                <span style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: isUp ? C.green : C.red, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                  {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {isUp ? '+' : ''}{asset.change24h.toFixed(2)}%
                </span>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <Sparkline data={asset.sparkline} color={isUp ? C.green : C.red} />
                </div>
                <span style={{ textAlign: 'right', fontSize: 13, color: C.muted }}>{formatCap(asset.marketCap)}</span>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Load more */}
        {visibleCount < filtered.length && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setVisibleCount((v) => v + 4)}
              style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.cyan, padding: '10px 28px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Load More ({filtered.length - visibleCount} remaining)
            </motion.button>
          </div>
        )}

        {visible.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: C.muted, fontSize: 14 }}>
            No assets found
          </div>
        )}
      </div>
    </div>
  )
}
