import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ArrowLeft, X, Plus, UserMinus, TrendingUp } from 'lucide-react';

const C = {
  bg: '#05050A', surface: '#090914', card: '#0d0d1a', border: 'rgba(255,255,255,0.06)',
  cyan: '#00D2FF', purple: '#7928CA', green: '#34D399', red: '#ef4444',
  text: '#f1f5f9', muted: '#6b7280',
};

const mockGraphs = [
  { id: 'g1', title: 'BTC Dominance Cycle', creator: '@cryptoalice', tags: ['BTC', 'Macro'], updated: '2h ago', data: [30, 35, 28, 40, 38, 42, 36] },
  { id: 'g2', title: 'ETH Gas vs Price', creator: '@onchaindev', tags: ['ETH', 'Gas'], updated: '5h ago', data: [20, 25, 22, 30, 28, 35, 32] },
  { id: 'g3', title: 'NTRN Staking APR', creator: '@neutronfan', tags: ['NTRN', 'DeFi'], updated: '1d ago', data: [15, 18, 16, 20, 19, 22, 21] },
  { id: 'g4', title: 'SOL Meme Coin Index', creator: '@solresearch', tags: ['SOL', 'Meme'], updated: '3d ago', data: [40, 38, 45, 42, 50, 48, 55] },
  { id: 'g5', title: 'DeFi TVL Aggregator', creator: '@defiwatch', tags: ['DeFi', 'TVL'], updated: '1w ago', data: [10, 12, 11, 14, 13, 16, 15] },
];

const mockAssets = [
  { symbol: 'BTC', name: 'Bitcoin', price: 67420.32, change: 2.34 },
  { symbol: 'ETH', name: 'Ethereum', price: 3521.18, change: -1.12 },
  { symbol: 'SOL', name: 'Solana', price: 172.45, change: 5.67 },
  { symbol: 'NTRN', name: 'Neutron', price: 2.84, change: -0.45 },
  { symbol: 'ADA', name: 'Cardano', price: 0.62, change: 1.23 },
  { symbol: 'DOT', name: 'Polkadot', price: 8.91, change: -2.10 },
  { symbol: 'LINK', name: 'Chainlink', price: 18.34, change: 3.45 },
  { symbol: 'MATIC', name: 'Polygon', price: 0.89, change: 0.78 },
];

const mockCreators = [
  { author: 'cryptoalice', name: 'Alice Chen', handle: '@cryptoalice', followers: 12400, graphs: 42 },
  { author: 'onchaindev', name: 'Dev Patel', handle: '@onchaindev', followers: 8900, graphs: 28 },
  { author: 'neutronfan', name: 'NTRN Maxi', handle: '@neutronfan', followers: 5600, graphs: 15 },
  { author: 'solresearch', name: 'Sol Research', handle: '@solresearch', followers: 21000, graphs: 67 },
];

function Sparkline({ data, color, width = 80, height = 32 }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MiniChart({ data, color = C.cyan }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 60, h = 24;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const tabs = ['Graphs', 'Assets', 'Creators'];

const listVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVariants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } };

export default function WatchlistPage({ navigate, user }) {
  const [activeTab, setActiveTab] = useState('Graphs');
  const [graphs, setGraphs] = useState(mockGraphs);
  const [assets, setAssets] = useState(mockAssets);
  const [creators, setCreators] = useState(mockCreators);
  const [showAdd, setShowAdd] = useState(false);

  const removeGraph = (id) => setGraphs((p) => p.filter((g) => g.id !== id));
  const removeAsset = (sym) => setAssets((p) => p.filter((a) => a.symbol !== sym));
  const unfollowCreator = (author) => setCreators((p) => p.filter((c) => c.author !== author));

  const empty = { Graphs: graphs.length === 0, Assets: assets.length === 0, Creators: creators.length === 0 };

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px 32px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button
            onClick={() => navigate('graphs')}
            style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center' }}
          >
            <ArrowLeft size={20} />
          </button>
          <Star size={22} color={C.cyan} fill={C.cyan} />
          <span style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Watchlist</span>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: C.surface, borderRadius: 12, padding: 4 }}>
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                flex: 1, padding: '10px 0', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'all 0.2s',
                background: activeTab === t ? C.card : 'transparent',
                color: activeTab === t ? C.text : C.muted,
                boxShadow: activeTab === t ? `0 0 12px ${C.cyan}22` : 'none',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            {empty[activeTab] ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', padding: '48px 16px' }}
              >
                <Star size={40} color={C.muted} style={{ marginBottom: 16 }} />
                <p style={{ color: C.muted, fontSize: 15, marginBottom: 20 }}>Your {activeTab.toLowerCase()} watchlist is empty</p>
                <button
                  onClick={() => setShowAdd(true)}
                  style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.purple})`, border: 'none', color: '#fff', padding: '10px 24px', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  <Plus size={16} /> Add to Watchlist
                </button>
              </motion.div>
            ) : (
              <motion.div variants={listVariants} initial="hidden" animate="visible">
                {activeTab === 'Graphs' && graphs.map((g) => (
                  <motion.div
                    key={g.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => navigate('graph-detail', { graphId: g.id })}
                    style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginBottom: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.title}</div>
                      <div style={{ color: C.muted, fontSize: 12, marginBottom: 6 }}>{g.creator} · {g.updated}</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {g.tags.map((tag) => (
                          <span key={tag} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: `${C.cyan}15`, color: C.cyan, fontWeight: 500 }}>{tag}</span>
                        ))}
                      </div>
                    </div>
                    <MiniChart data={g.data} />
                    <button
                      onClick={(e) => { e.stopPropagation(); removeGraph(g.id); }}
                      style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 4, borderRadius: 6 }}
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                ))}

                {activeTab === 'Assets' && assets.map((a) => {
                  const sparkData = Array.from({ length: 20 }, () => Math.random() * 40 + 30);
                  return (
                    <motion.div
                      key={a.symbol}
                      variants={itemVariants}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => navigate('asset', { symbol: a.symbol })}
                      style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginBottom: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${C.cyan}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: C.cyan, flexShrink: 0 }}>{a.symbol}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{a.name}</div>
                        <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>${a.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      </div>
                      <div style={{ textAlign: 'right', marginRight: 8 }}>
                        <div style={{ color: a.change >= 0 ? C.green : C.red, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                          <TrendingUp size={12} style={{ transform: a.change < 0 ? 'rotate(180deg)' : 'none' }} />
                          {a.change >= 0 ? '+' : ''}{a.change}%
                        </div>
                      </div>
                      <Sparkline data={sparkData} color={a.change >= 0 ? C.green : C.red} />
                      <button
                        onClick={(e) => { e.stopPropagation(); removeAsset(a.symbol); }}
                        style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 4, borderRadius: 6 }}
                      >
                        <X size={14} />
                      </button>
                    </motion.div>
                  );
                })}

                {activeTab === 'Creators' && creators.map((c) => (
                  <motion.div
                    key={c.author}
                    variants={itemVariants}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => navigate('profile', { author: c.author })}
                    style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginBottom: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg, ${C.purple}40, ${C.cyan}40)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, color: C.cyan, flexShrink: 0 }}>
                      {c.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                      <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{c.handle}</div>
                      <div style={{ display: 'flex', gap: 12, marginTop: 4, color: C.muted, fontSize: 11 }}>
                        <span>{c.followers.toLocaleString()} followers</span>
                        <span>{c.graphs} graphs</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); unfollowCreator(c.author); }}
                      style={{ background: 'none', border: `1px solid ${C.border}`, color: C.muted, cursor: 'pointer', padding: '8px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500 }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.color = C.red; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
                    >
                      <UserMinus size={14} /> Unfollow
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Add to Watchlist button (shown when list is not empty) */}
        {!empty[activeTab] && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowAdd(true)}
            style={{ marginTop: 12, width: '100%', padding: '12px 0', background: C.surface, border: `1px dashed ${C.border}`, borderRadius: 12, color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <Plus size={16} /> Add to Watchlist
          </motion.button>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAdd(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, width: '100%', maxWidth: 420, maxHeight: '80vh', overflow: 'auto' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <span style={{ fontSize: 18, fontWeight: 700 }}>Add to Watchlist</span>
                <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 4 }}>
                  <X size={20} />
                </button>
              </div>
              <input
                type="text"
                placeholder={`Search ${activeTab.toLowerCase()}...`}
                style={{ width: '100%', padding: '12px 14px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: 'none', marginBottom: 16 }}
                onFocus={(e) => e.target.style.borderColor = `${C.cyan}60`}
                onBlur={(e) => e.target.style.borderColor = C.border}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(activeTab === 'Graphs' ? ['Volume Profile', 'Funding Rate', 'OI Divergence'] : activeTab === 'Assets' ? ['DOGE', 'AVAX', 'APT'] : ['quantcharts', 'blockprobe']).map((item) => (
                  <button
                    key={item}
                    onClick={() => setShowAdd(false)}
                    style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px', color: C.text, fontSize: 14, fontWeight: 500, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, transition: 'border-color 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = `${C.cyan}40`}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}
                  >
                    <Plus size={14} color={C.cyan} /> {item}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
