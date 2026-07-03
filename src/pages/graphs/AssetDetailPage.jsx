import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Star, TrendingUp, TrendingDown, Clock, BarChart3, MessageCircle, ExternalLink } from 'lucide-react'

const C = {
  bg: '#05050A', surface: '#090914', card: '#0d0d1a', border: 'rgba(255,255,255,0.06)',
  cyan: '#00D2FF', purple: '#7928CA', green: '#34D399', red: '#ef4444',
  text: '#f1f5f9', muted: '#6b7280',
}

const MOCK = {
  BTC: {
    name: 'Bitcoin', symbol: 'BTC', icon: '₿', price: 66982, change24h: 2.34,
    marketCap: '1.32T', volume24h: '28.4B', supply: '19.7M', ath: '73,750', athDate: 'Mar 2024', atl: '67.81', atlDate: 'Jul 2010',
    description: 'Bitcoin is the first decentralized cryptocurrency, using blockchain technology to enable peer-to-peer transactions without intermediaries. Created in 2009 by Satoshi Nakamoto, it remains the largest cryptocurrency by market capitalization.',
  },
  ETH: {
    name: 'Ethereum', symbol: 'ETH', icon: 'Ξ', price: 3512, change24h: -1.12,
    marketCap: '422B', volume24h: '14.2B', supply: '120.2M', ath: '4,878', athDate: 'Nov 2021', atl: '0.42', atlDate: 'Oct 2015',
    description: 'Ethereum is a decentralized platform for smart contracts and dApps, enabling developers to build and deploy decentralized applications without downtime, fraud, or third-party interference.',
  },
  SOL: {
    name: 'Solana', symbol: 'SOL', icon: '◎', price: 164, change24h: 5.67,
    marketCap: '71.3B', volume24h: '3.1B', supply: '434.5M', ath: '260', athDate: 'Nov 2021', atl: '0.50', atlDate: 'May 2020',
    description: 'Solana is a high-performance blockchain supporting smart contracts and dApps, known for its speed and low transaction costs. It uses Proof of History alongside Proof of Stake.',
  },
  NTRN: {
    name: 'Neutron', symbol: 'NTRN', icon: '⚛', price: 1.29, change24h: 8.42,
    marketCap: '512M', volume24h: '24.5M', supply: '396.9M', ath: '2.15', athDate: 'Dec 2024', atl: '0.35', atlDate: 'Jun 2023',
    description: 'Neutron is a Cosmos blockchain with advanced smart contract capabilities, offering DeFi primitives and cross-chain security through the Interchain ecosystem.',
  },
}

function generatePriceHistory(seed) {
  const points = []
  let price = MOCK[seed].price * 0.92
  for (let i = 0; i < 30; i++) {
    price += (Math.sin(i * 0.5 + seed.charCodeAt(0)) * MOCK[seed].price * 0.012)
    points.push(Math.max(price, MOCK[seed].price * 0.5))
  }
  points[points.length - 1] = MOCK[seed].price
  return points
}

function generateHistoricalData(symbol) {
  const data = []
  const base = MOCK[symbol].price
  for (let i = 0; i < 10; i++) {
    const d = new Date()
    d.setDate(d.getDate() - (9 - i))
    data.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      price: (base + (Math.sin(i) * base * 0.05)).toFixed(2),
      volume: (Math.random() * 2 + 1).toFixed(2) + 'B',
      change: (Math.sin(i) * 4).toFixed(2),
    })
  }
  return data
}

function getRelatedGraphs(symbol) {
  const graphs = [
    { title: 'Price vs Market Cap', type: 'correlation', views: '12.4K' },
    { title: 'Volume Distribution', type: 'distribution', views: '8.2K' },
    { title: 'Network Activity', type: 'network', views: '5.7K' },
  ]
  return graphs
}

function getCommunityPosts(symbol) {
  return [
    { user: 'CryptoAnalyst', avatar: '📈', time: '2h ago', text: `${symbol} looking bullish on the daily. Key resistance at previous high, break could mean new ATH.`, likes: 234, replies: 45 },
    { user: 'DeFiDev', avatar: '⚙', time: '5h ago', text: `Incredible growth in ${symbol} ecosystem this quarter. TVL up 40% week over week.`, likes: 189, replies: 32 },
    { user: 'MacroView', avatar: '🌍', time: '1d ago', text: `Macro conditions aligning for ${symbol} breakout. Watching Fed policy closely.`, likes: 567, replies: 89 },
  ]
}

const tabs = ['Overview', 'Historical Data', 'Related Graphs', 'Community']
const timeFilters = ['1H', '24H', '7D', '30D', 'ALL']

export default function AssetDetailPage({ symbol = 'BTC', navigate, user }) {
  const [activeTab, setActiveTab] = useState('Overview')
  const [activeTime, setActiveTime] = useState('30D')
  const [watchlist, setWatchlist] = useState(false)

  const asset = MOCK[symbol] || MOCK.BTC
  const priceHistory = useMemo(() => generatePriceHistory(symbol), [symbol])
  const historicalData = useMemo(() => generateHistoricalData(symbol), [symbol])
  const relatedGraphs = getRelatedGraphs(symbol)
  const communityPosts = getCommunityPosts(symbol)

  const minPrice = Math.min(...priceHistory)
  const maxPrice = Math.max(...priceHistory)
  const range = maxPrice - minPrice || 1

  const svgPoints = priceHistory.map((p, i) => {
    const x = (i / (priceHistory.length - 1)) * 480
    const y = 160 - ((p - minPrice) / range) * 140
    return `${x},${y}`
  }).join(' ')

  const pathD = priceHistory.map((p, i) => {
    const x = (i / (priceHistory.length - 1)) * 480
    const y = 160 - ((p - minPrice) / range) * 140
    return `${i === 0 ? 'M' : 'L'}${x},${y}`
  }).join(' ')

  const areaD = pathD + ` L480,160 L0,160 Z`

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px' }}>
        <motion.button
          onClick={() => navigate('graphs')}
          style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', fontSize: 14 }}
          whileHover={{ color: C.text }}
        >
          <ArrowLeft size={18} /> Back to Graphs
        </motion.button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 16, flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <motion.div
              style={{ width: 56, height: 56, borderRadius: 16, background: C.card, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}
              whileHover={{ scale: 1.05, borderColor: C.cyan }}
              transition={{ duration: 0.2 }}
            >
              {asset.icon}
            </motion.div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>{asset.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span style={{ color: C.muted, fontSize: 14 }}>{asset.symbol}</span>
                <span style={{ padding: '2px 8px', borderRadius: 6, background: C.surface, fontSize: 12, color: C.muted, border: `1px solid ${C.border}` }}>#{Object.keys(MOCK).indexOf(symbol) + 1}</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <motion.div
              style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={asset.price}
            >
              ${asset.price.toLocaleString()}
            </motion.div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 4 }}>
              {asset.change24h >= 0 ? <TrendingUp size={16} color={C.green} /> : <TrendingDown size={16} color={C.red} />}
              <span style={{ color: asset.change24h >= 0 ? C.green : C.red, fontSize: 16, fontWeight: 600 }}>
                {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
              </span>
              <span style={{ color: C.muted, fontSize: 14 }}>24h</span>
            </div>
          </div>
        </div>

        <motion.div
          style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginTop: 24 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {timeFilters.map(tf => (
                <motion.button
                  key={tf}
                  onClick={() => setActiveTime(tf)}
                  style={{
                    padding: '6px 14px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: activeTime === tf ? C.cyan + '18' : 'transparent',
                    color: activeTime === tf ? C.cyan : C.muted,
                  }}
                  whileHover={{ background: activeTime === tf ? C.cyan + '25' : C.card }}
                >
                  {tf}
                </motion.button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.muted, fontSize: 12 }}>
              <Clock size={14} /> Updated live
            </div>
          </div>

          <svg viewBox="0 0 480 180" style={{ width: '100%', height: 200 }}>
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={asset.change24h >= 0 ? C.cyan : C.red} stopOpacity="0.3" />
                <stop offset="100%" stopColor={asset.change24h >= 0 ? C.cyan : C.red} stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 40, 80, 120, 160].map(y => (
              <line key={y} x1="0" y1={y} x2="480" y2={y} stroke={C.border} strokeWidth="0.5" />
            ))}
            <motion.path
              d={areaD}
              fill="url(#chartGrad)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            />
            <motion.path
              d={pathD}
              fill="none"
              stroke={asset.change24h >= 0 ? C.cyan : C.red}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
          </svg>
        </motion.div>

        <motion.div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 20 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {[
            { label: 'Market Cap', value: '$' + asset.marketCap },
            { label: '24h Volume', value: '$' + asset.volume24h },
            { label: 'Circulating Supply', value: asset.supply },
            { label: 'All-Time High', value: '$' + asset.ath, sub: asset.athDate },
            { label: 'All-Time Low', value: '$' + asset.atl, sub: asset.atlDate },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}
              whileHover={{ borderColor: C.cyan + '40', y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <div style={{ color: C.muted, fontSize: 12, marginBottom: 6 }}>{stat.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{stat.value}</div>
              {stat.sub && <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{stat.sub}</div>}
            </motion.div>
          ))}
        </motion.div>

        <div style={{ display: 'flex', gap: 4, marginTop: 28, borderBottom: `1px solid ${C.border}`, paddingBottom: 0 }}>
          {tabs.map(tab => (
            <motion.button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 18px', background: 'none', border: 'none', borderBottom: `2px solid ${activeTab === tab ? C.cyan : 'transparent'}`,
                color: activeTab === tab ? C.text : C.muted, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
              whileHover={{ color: C.text }}
            >
              {tab === 'Overview' && <BarChart3 size={15} />}
              {tab === 'Historical Data' && <Clock size={15} />}
              {tab === 'Related Graphs' && <TrendingUp size={15} />}
              {tab === 'Community' && <MessageCircle size={15} />}
              {tab}
            </motion.button>
          ))}
        </div>

        <div style={{ marginTop: 24 }}>
          <AnimatePresence mode="wait">
            {activeTab === 'Overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}
              >
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>About {asset.name}</h3>
                  <p style={{ color: C.muted, lineHeight: 1.7, fontSize: 14 }}>{asset.description}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: C.card, borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
                    <div style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>Price Change (7D)</div>
                    <div style={{ color: C.green, fontSize: 18, fontWeight: 700 }}>+{(Math.random() * 15).toFixed(1)}%</div>
                  </div>
                  <div style={{ background: C.card, borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
                    <div style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>7D High / Low</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>${(asset.price * 1.08).toFixed(0)} / ${(asset.price * 0.92).toFixed(0)}</div>
                  </div>
                  <div style={{ background: C.card, borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
                    <div style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>Active Addresses</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{(Math.random() * 900 + 100).toFixed(0)}K</div>
                  </div>
                  <div style={{ background: C.card, borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
                    <div style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>Transaction Count (24H)</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{(Math.random() * 500 + 50).toFixed(0)}K</div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'Historical Data' && (
              <motion.div
                key="historical"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 0.8fr', padding: '12px 18px', borderBottom: `1px solid ${C.border}`, color: C.muted, fontSize: 12, fontWeight: 600 }}>
                    <span>Date</span><span>Price</span><span>Volume</span><span>Change</span>
                  </div>
                  {historicalData.map((row, i) => (
                    <motion.div
                      key={i}
                      style={{
                        display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 0.8fr', padding: '10px 18px',
                        borderBottom: i < historicalData.length - 1 ? `1px solid ${C.border}` : 'none',
                        fontSize: 13, alignItems: 'center',
                      }}
                      whileHover={{ background: C.card }}
                    >
                      <span>{row.date}</span>
                      <span style={{ fontWeight: 600 }}>${row.price}</span>
                      <span style={{ color: C.muted }}>${row.volume}</span>
                      <span style={{ color: parseFloat(row.change) >= 0 ? C.green : C.red, fontWeight: 600 }}>
                        {parseFloat(row.change) >= 0 ? '+' : ''}{row.change}%
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'Related Graphs' && (
              <motion.div
                key="related"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}
              >
                {relatedGraphs.map((graph, i) => (
                  <motion.div
                    key={i}
                    style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, cursor: 'pointer' }}
                    whileHover={{ borderColor: C.cyan + '50', y: -3, boxShadow: `0 8px 24px ${C.cyan}10` }}
                    transition={{ duration: 0.2 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div style={{ padding: '4px 10px', borderRadius: 6, background: C.purple + '18', color: C.purple, fontSize: 11, fontWeight: 600 }}>
                        {graph.type}
                      </div>
                      <ExternalLink size={14} color={C.muted} />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{graph.title}</div>
                    <div style={{ color: C.muted, fontSize: 12 }}>{graph.views} views</div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {activeTab === 'Community' && (
              <motion.div
                key="community"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
              >
                {communityPosts.map((post, i) => (
                  <motion.div
                    key={i}
                    style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}
                    whileHover={{ borderColor: C.cyan + '30' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                        {post.avatar}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{post.user}</div>
                        <div style={{ color: C.muted, fontSize: 11 }}>{post.time}</div>
                      </div>
                    </div>
                    <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, margin: 0 }}>{post.text}</p>
                    <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                      <span style={{ color: C.muted, fontSize: 12, cursor: 'pointer' }}>♥ {post.likes}</span>
                      <span style={{ color: C.muted, fontSize: 12, cursor: 'pointer' }}>💬 {post.replies}</span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div
          style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.button
            onClick={() => setWatchlist(!watchlist)}
            style={{
              padding: '12px 28px', borderRadius: 12, border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              background: watchlist ? C.green + '20' : C.card,
              color: watchlist ? C.green : C.muted,
              border: `1px solid ${watchlist ? C.green + '50' : C.border}`,
              display: 'flex', alignItems: 'center', gap: 8,
            }}
            whileHover={{ scale: 1.03, borderColor: watchlist ? C.green : C.cyan + '50' }}
            whileTap={{ scale: 0.97 }}
          >
            <Star size={16} fill={watchlist ? C.green : 'none'} color={watchlist ? C.green : C.muted} />
            {watchlist ? 'On Watchlist' : 'Add to Watchlist'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}
