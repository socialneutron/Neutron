import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Settings, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, PieChart, Activity } from 'lucide-react';

const C = {
  bg: '#05050A', surface: '#090914', card: '#0d0d1a', border: 'rgba(255,255,255,0.06)',
  cyan: '#00D2FF', purple: '#7928CA', green: '#34D399', red: '#ef4444',
  text: '#f1f5f9', muted: '#6b7280',
};

const HOLDINGS = [
  { symbol: 'BTC', name: 'Bitcoin', amount: 0.85, value: 89250, pnl: 15200, pnlPct: 20.5, change24h: 2.4, color: '#F7931A' },
  { symbol: 'ETH', name: 'Ethereum', amount: 12.5, value: 28125, pnl: 5400, pnlPct: 23.8, change24h: 1.8, color: '#627EEA' },
  { symbol: 'SOL', name: 'Solana', amount: 145, value: 15950, pnl: 3800, pnlPct: 31.3, change24h: -1.2, color: '#00FFA3' },
  { symbol: 'NTRN', name: 'Neutron', amount: 5000, value: 4250, pnl: 850, pnlPct: 25.0, change24h: 5.6, color: C.cyan },
  { symbol: 'LINK', name: 'Chainlink', amount: 200, value: 5200, pnl: 1800, pnlPct: 52.9, change24h: -0.7, color: '#2A5ADA' },
  { symbol: 'UNI', name: 'Uniswap', amount: 75, value: 2897.35, pnl: 1290.12, pnlPct: 81.3, change24h: 3.1, color: '#FF007A' },
];

const TRANSACTIONS = [
  { type: 'buy', symbol: 'BTC', amount: 0.15, price: 117500, total: 17625, date: '2026-06-28' },
  { type: 'sell', symbol: 'ETH', amount: 2.5, price: 2450, total: 6125, date: '2026-06-27' },
  { type: 'buy', symbol: 'SOL', amount: 50, price: 105, total: 5250, date: '2026-06-25' },
  { type: 'buy', symbol: 'NTRN', amount: 2000, price: 0.82, total: 1640, date: '2026-06-23' },
  { type: 'sell', symbol: 'LINK', amount: 50, price: 28, total: 1400, date: '2026-06-20' },
];

const TIME_FILTERS = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

const PERFORMANCE_METRICS = [
  { label: 'Best Day', value: '+4.28%', color: C.green },
  { label: 'Worst Day', value: '-3.15%', color: C.red },
  { label: 'Avg Daily Return', value: '+0.78%', color: C.green },
  { label: 'Sharpe Ratio', value: '1.85', color: C.cyan },
];

const ANALYTICS = [
  { label: 'Beta', value: '1.12', desc: 'vs BTC' },
  { label: 'Volatility (30d)', value: '42.3%', desc: 'Annualized' },
  { label: 'Max Drawdown', value: '-18.7%', desc: 'Last 90 days' },
  { label: 'Win Rate', value: '68.4%', desc: 'Trades' },
  { label: 'Sortino Ratio', value: '2.31', desc: 'Risk-adjusted' },
  { label: 'Correlation', value: '0.74', desc: 'vs S&P 500' },
];

function generateCurve(days = 30, seed = 42) {
  let s = seed;
  const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  const pts = [];
  let v = 100000;
  for (let i = 0; i <= days; i++) {
    pts.push(v);
    v += (rand() - 0.45) * 4000;
    if (v < 80000) v = 80000 + rand() * 5000;
  }
  return pts;
}

function LineChart({ data, width = 600, height = 200 }) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pad = { t: 10, b: 30, l: 0, r: 0 };
  const cw = width - pad.l - pad.r;
  const ch = height - pad.t - pad.b;
  const step = cw / (data.length - 1);
  const pts = data.map((v, i) => {
    const x = pad.l + i * step;
    const y = pad.t + ch - ((v - min) / (max - min || 1)) * ch;
    return `${x},${y}`;
  });
  const gradId = 'pg';
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.cyan} stopOpacity="0.3" />
          <stop offset="100%" stopColor={C.cyan} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M${pts.join(' L')} L${pad.l + cw},${height} L${pad.l},${height} Z`} fill={`url(#${gradId})`} />
      <polyline points={pts.join(' ')} fill="none" stroke={C.cyan} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DonutChart({ holdings, size = 180 }) {
  const total = holdings.reduce((s, h) => s + h.value, 0);
  const r = size / 2 - 12;
  const ir = r * 0.62;
  let cum = 0;
  const segs = holdings.map((h) => {
    const pct = h.value / total;
    const start = cum;
    cum += pct;
    return { ...h, pct, start };
  });
  const cx = size / 2;
  const cy = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segs.map((s, i) => {
        const a1 = s.start * 2 * Math.PI - Math.PI / 2;
        const a2 = (s.start + s.pct) * 2 * Math.PI - Math.PI / 2;
        const large = s.pct > 0.5 ? 1 : 0;
        const x1 = cx + r * Math.cos(a1);
        const y1 = cy + r * Math.sin(a1);
        const x2 = cx + r * Math.cos(a2);
        const y2 = cy + r * Math.sin(a2);
        const ix1 = cx + ir * Math.cos(a2);
        const iy1 = cy + ir * Math.sin(a2);
        const ix2 = cx + ir * Math.cos(a1);
        const iy2 = cy + ir * Math.sin(a1);
        return (
          <path key={i} d={`M${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} L${ix1},${iy1} A${ir},${ir} 0 ${large} 0 ${ix2},${iy2} Z`} fill={s.color} opacity="0.85" />
        );
      })}
      <text x={cx} y={cy - 8} textAnchor="middle" fill={C.text} fontSize="18" fontWeight="700">$145.7K</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill={C.muted} fontSize="11">Total Value</text>
    </svg>
  );
}

export default function PortfolioPage({ navigate, user }) {
  const [timeFilter, setTimeFilter] = useState('1M');
  const [tab, setTab] = useState('holdings');
  const curve = generateCurve();
  const totalValue = 145672.35;
  const totalPnl = 28340.12;
  const totalPnlPct = 24.1;
  const todayChange = 1245.80;
  const todayChangePct = 0.86;
  const totalAlloc = HOLDINGS.reduce((s, h) => s + h.value, 0);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'Inter', -apple-system, sans-serif", paddingBottom: 40 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 0' }}>
        <button onClick={() => navigate('graphs')} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 8, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={22} />
        </button>
        <span style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Portfolio</span>
        <button style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 8, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Settings size={20} />
        </button>
      </motion.div>

      <div style={{ padding: '0 20px', maxWidth: 480, margin: '0 auto' }}>
        {/* Summary Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} style={{ background: C.card, borderRadius: 20, padding: '28px 24px', marginTop: 20, border: `1px solid ${C.border}` }}>
          <div style={{ color: C.muted, fontSize: 13, marginBottom: 6 }}>Total Balance</div>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1, color: C.text }}>${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.green, fontSize: 15, fontWeight: 600 }}>
              <ArrowUpRight size={16} />+${totalPnl.toLocaleString()} ({totalPnlPct}%)
            </span>
            <span style={{ fontSize: 13, color: C.muted }}>all time</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            {todayChange >= 0 ? <TrendingUp size={14} color={C.green} /> : <TrendingDown size={14} color={C.red} />}
            <span style={{ fontSize: 13, color: todayChange >= 0 ? C.green : C.red, fontWeight: 500 }}>
              Today: {todayChange >= 0 ? '+' : ''}${todayChange.toLocaleString()} ({todayChangePct}%)
            </span>
          </div>
        </motion.div>

        {/* Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} style={{ background: C.card, borderRadius: 20, padding: '20px 12px 8px', marginTop: 12, border: `1px solid ${C.border}` }}>
          <div style={{ overflow: 'hidden', borderRadius: 12 }}>
            <LineChart data={curve} width={440} height={180} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14 }}>
            {TIME_FILTERS.map((f) => (
              <button key={f} onClick={() => setTimeFilter(f)} style={{
                background: timeFilter === f ? C.cyan + '18' : 'transparent',
                color: timeFilter === f ? C.cyan : C.muted,
                border: timeFilter === f ? `1px solid ${C.cyan}40` : '1px solid transparent',
                borderRadius: 10, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
              }}>{f}</button>
            ))}
          </div>
        </motion.div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginTop: 16, background: C.surface, borderRadius: 14, padding: 4 }}>
          {[{ key: 'holdings', label: 'Holdings' }, { key: 'transactions', label: 'Transactions' }, { key: 'analytics', label: 'Analytics' }].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, background: tab === t.key ? C.card : 'transparent', color: tab === t.key ? C.text : C.muted,
              border: 'none', borderRadius: 10, padding: '10px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
            }}>{t.label}</button>
          ))}
        </div>

        {/* Holdings Tab */}
        {tab === 'holdings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            {/* Allocation Donut */}
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.15 }} style={{ background: C.card, borderRadius: 20, padding: '24px', marginTop: 12, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 20 }}>
              <DonutChart holdings={HOLDINGS} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12 }}>Allocation</div>
                {HOLDINGS.slice(0, 4).map((h) => (
                  <div key={h.symbol} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: h.color }} />
                    <span style={{ fontSize: 12, color: C.muted, flex: 1 }}>{h.symbol}</span>
                    <span style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{((h.value / totalAlloc) * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Holdings List */}
            <div style={{ marginTop: 12 }}>
              {HOLDINGS.map((h, i) => (
                <motion.div key={h.symbol} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: i * 0.06 }}
                  onClick={() => navigate('asset', { symbol: h.symbol })}
                  style={{ background: C.card, borderRadius: 16, padding: '16px 18px', marginBottom: 8, border: `1px solid ${C.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: h.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: h.color }}>
                    {h.symbol.slice(0, 2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{h.symbol}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{h.amount} {h.symbol}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>${h.value.toLocaleString()}</div>
                    <div style={{ fontSize: 12, color: h.change24h >= 0 ? C.green : C.red, fontWeight: 500 }}>
                      {h.change24h >= 0 ? '+' : ''}{h.change24h}%
                    </div>
                  </div>
                  <div style={{ width: 52, textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: C.muted }}>P&L</div>
                    <div style={{ fontSize: 13, color: h.pnl >= 0 ? C.green : C.red, fontWeight: 600 }}>
                      {h.pnl >= 0 ? '+' : ''}${h.pnl.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ color: C.muted, fontSize: 12 }}>{((h.value / totalAlloc) * 100).toFixed(1)}%</div>
                </motion.div>
              ))}
            </div>

            {/* Performance Metrics */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }} style={{ background: C.card, borderRadius: 20, padding: '20px', marginTop: 12, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={16} color={C.cyan} /> Performance Metrics
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {PERFORMANCE_METRICS.map((m) => (
                  <div key={m.label} style={{ background: C.surface, borderRadius: 14, padding: '14px 16px', border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Transactions Tab */}
        {tab === 'transactions' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} style={{ marginTop: 12 }}>
            {TRANSACTIONS.map((tx, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: i * 0.07 }}
                style={{ background: C.card, borderRadius: 16, padding: '16px 18px', marginBottom: 8, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: tx.type === 'buy' ? C.green + '18' : C.red + '18'
                }}>
                  {tx.type === 'buy' ? <ArrowUpRight size={18} color={C.green} /> : <ArrowDownRight size={18} color={C.red} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text, textTransform: 'capitalize' }}>
                    {tx.type} {tx.symbol}
                  </div>
                  <div style={{ fontSize: 12, color: C.muted }}>{tx.amount} {tx.symbol} @ ${tx.price.toLocaleString()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>${tx.total.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{tx.date}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Analytics Tab */}
        {tab === 'analytics' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} style={{ marginTop: 12 }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.1 }} style={{ background: C.card, borderRadius: 20, padding: '24px', border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <PieChart size={16} color={C.purple} /> Risk Metrics
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {ANALYTICS.map((a) => (
                  <div key={a.label} style={{ background: C.surface, borderRadius: 14, padding: '14px 16px', border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>{a.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{a.value}</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{a.desc}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Risk Assessment */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} style={{ background: C.card, borderRadius: 20, padding: '20px', marginTop: 12, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 14 }}>Risk Assessment</div>
              {[
                { label: 'Portfolio Risk', value: 'Moderate-High', pct: 72, color: '#F59E0B' },
                { label: 'Diversification', value: 'Good', pct: 78, color: C.green },
                { label: 'Liquidity Score', value: 'High', pct: 91, color: C.cyan },
              ].map((r) => (
                <div key={r.label} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: C.muted }}>{r.label}</span>
                    <span style={{ fontSize: 12, color: r.color, fontWeight: 600 }}>{r.value}</span>
                  </div>
                  <div style={{ height: 6, background: C.surface, borderRadius: 3, overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${r.pct}%` }} transition={{ duration: 1, delay: 0.4 }} style={{ height: '100%', background: r.color, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
