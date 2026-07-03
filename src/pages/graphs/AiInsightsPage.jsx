import React, { useState, useEffect } from 'react';
import { Zap, ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, Shield, Brain, Activity } from 'lucide-react';

const C = {
  bg: '#05050A', surface: '#090914', card: '#0d0d1a', border: 'rgba(255,255,255,0.06)',
  cyan: '#00D2FF', purple: '#7928CA', green: '#34D399', red: '#ef4444',
  text: '#f1f5f9', muted: '#6b7280',
};

const predictions = [
  { symbol: 'BTC', name: 'Bitcoin', price: 108420, predicted: 115000, confidence: 87, direction: 'Bullish', timeframe: '7d', color: '#F7931A' },
  { symbol: 'ETH', name: 'Ethereum', price: 4320, predicted: 4850, confidence: 79, direction: 'Bullish', timeframe: '7d', color: '#627EEA' },
  { symbol: 'SOL', name: 'Solana', price: 215, predicted: 198, confidence: 64, direction: 'Bearish', timeframe: '14d', color: '#9945FF' },
  { symbol: 'NTRN', name: 'Neutron', price: 2.45, predicted: 3.10, confidence: 72, direction: 'Bullish', timeframe: '30d', color: C.cyan },
];

const summaries = [
  {
    title: 'Crypto Market',
    severity: 'neutral',
    summary: 'Bitcoin consolidating near ATH with decreasing volume. Altcoins showing mixed signals. Institutional inflows remain strong with $2.3B weekly ETF accumulation.',
    points: ['BTC dominance at 54.2%', 'Total market cap $3.8T', 'Fear & Greed: 72 (Greed)'],
  },
  {
    title: 'DeFi Sector',
    severity: 'bullish',
    summary: 'DeFi TVL increased 12% this week to $187B. Layer 2 solutions seeing massive growth. Yield farming opportunities expanding with new liquid staking protocols.',
    points: ['L2 TVL up 18%', 'DEX volume $45B/week', 'New ATH for stablecoin supply'],
  },
  {
    title: 'AI Tokens',
    severity: 'warning',
    summary: 'AI token sector showing extreme volatility. Several projects hitting new highs but RSI indicators suggest overbought conditions across the board.',
    points: ['Sector up 34% MTD', 'RSI > 75 on top 5 tokens', 'Whale accumulation detected'],
  },
];

const trends = [
  { title: 'Restaking narrative gaining traction', relevance: 94, icon: '🔄', category: 'DeFi' },
  { title: 'Institutional BTC accumulation accelerates', relevance: 91, icon: '🏦', category: 'Macro' },
  { title: 'AI x Crypto intersection expanding', relevance: 87, icon: '🤖', category: 'AI' },
  { title: 'RWA tokenization TVL surging', relevance: 82, icon: '📄', category: 'RWA' },
  { title: 'Memecoin rotation to utility tokens', relevance: 76, icon: '🔄', category: 'Rotation' },
];

const MiniGauge = ({ confidence, color }) => {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (confidence / 100) * circumference;

  return (
    <svg width="68" height="68" viewBox="0 0 68 68">
      <circle cx="34" cy="34" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
      <circle
        cx="34" cy="34" r={radius} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 34 34)"
        style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
      />
      <text x="34" y="34" textAnchor="middle" dominantBaseline="central" fill={C.text} fontSize="12" fontWeight="700">
        {confidence}%
      </text>
    </svg>
  );
};

const RiskMeter = ({ level }) => {
  const levels = { low: 1, medium: 2, high: 3 };
  const colors = { 1: C.green, 2: '#FBBF24', 3: C.red };
  const labels = { 1: 'Low Risk', 2: 'Medium Risk', 3: 'High Risk' };
  const idx = levels[level] || 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{
            width: 60, height: 18, borderRadius: 9,
            background: i <= idx ? colors[idx] : 'rgba(255,255,255,0.08)',
            opacity: i <= idx ? 1 : 0.4,
            transition: 'all 0.6s ease',
          }} />
        ))}
      </div>
      <span style={{ color: colors[idx], fontSize: 14, fontWeight: 600 }}>{labels[idx]}</span>
    </div>
  );
};

const LoadingScreen = ({ onComplete }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400);
    const timer = setTimeout(() => { clearInterval(interval); onComplete(); }, 2500);
    return () => { clearInterval(interval); clearTimeout(timer); };
  }, [onComplete]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh', gap: 20 }}>
      <Brain size={48} color={C.cyan} style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ color: C.text, fontSize: 18, fontWeight: 600 }}>AI Analyzing Markets{dots}</div>
      <div style={{ color: C.muted, fontSize: 13 }}>Processing 2,847 data points</div>
      <style>{`@keyframes pulse { 0%,100% { opacity:0.4; transform:scale(1) } 50% { opacity:1; transform:scale(1.1) } }`}</style>
    </div>
  );
};

export default function AiInsightsPage({ navigate, user }) {
  const [loading, setLoading] = useState(true);
  const [riskLevel] = useState('medium');

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: '0 16px 100px', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0', position: 'sticky', top: 0, background: C.bg, zIndex: 10 }}>
        <button onClick={() => navigate('graphs')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
          <ArrowLeft size={20} color={C.muted} />
        </button>
        <Zap size={22} color={C.cyan} />
        <span style={{ color: C.text, fontSize: 20, fontWeight: 700 }}>AI Insights</span>
        <span style={{
          background: `linear-gradient(135deg, ${C.purple}, ${C.cyan})`, color: '#fff',
          fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 10, letterSpacing: 0.5,
        }}>BETA</span>
      </div>

      {loading ? (
        <LoadingScreen onComplete={() => setLoading(false)} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* Section 1: Market Predictions */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Brain size={16} color={C.purple} />
              <span style={{ color: C.text, fontSize: 16, fontWeight: 700 }}>Market Predictions</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {predictions.map((p, i) => (
                <button
                  key={p.symbol}
                  onClick={() => navigate('asset', { symbol: p.symbol })}
                  style={{
                    background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16,
                    cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10,
                    transition: 'transform 0.15s, border-color 0.15s', opacity: 0, animation: `fadeUp 0.4s ${i * 0.1}s forwards`,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = p.color + '44'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>{p.symbol}</div>
                      <div style={{ color: C.muted, fontSize: 11 }}>${p.price.toLocaleString()}</div>
                    </div>
                    <MiniGauge confidence={p.confidence} color={p.direction === 'Bullish' ? C.green : C.red} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {p.direction === 'Bullish' ? <TrendingUp size={13} color={C.green} /> : <TrendingDown size={13} color={C.red} />}
                    <span style={{ color: p.direction === 'Bullish' ? C.green : C.red, fontSize: 12, fontWeight: 600 }}>{p.direction}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>${p.predicted.toLocaleString()}</span>
                    <span style={{ color: C.muted, fontSize: 11 }}>{p.timeframe}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Section 2: Market Summaries */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Activity size={16} color={C.cyan} />
              <span style={{ color: C.text, fontSize: 16, fontWeight: 700 }}>Market Summaries</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {summaries.map((s, i) => {
                const sevColors = { bullish: C.green, neutral: C.muted, warning: '#FBBF24' };
                return (
                  <div key={s.title} style={{
                    background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16,
                    opacity: 0, animation: `fadeUp 0.4s ${0.4 + i * 0.1}s forwards`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>{s.title}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 8,
                        background: sevColors[s.severity] + '20', color: sevColors[s.severity], textTransform: 'capitalize',
                      }}>{s.severity}</span>
                    </div>
                    <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.5, margin: '0 0 10px' }}>{s.summary}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {s.points.map(p => (
                        <span key={p} style={{
                          background: 'rgba(255,255,255,0.04)', color: C.text, fontSize: 11, padding: '3px 8px',
                          borderRadius: 6, border: `1px solid ${C.border}`,
                        }}>{p}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 3: Trending Insights */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <TrendingUp size={16} color={C.green} />
              <span style={{ color: C.text, fontSize: 16, fontWeight: 700 }}>Trending Insights</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {trends.map((t, i) => (
                <div key={t.title} style={{
                  background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  opacity: 0, animation: `fadeUp 0.4s ${0.7 + i * 0.08}s forwards`,
                }}>
                  <span style={{ fontSize: 20 }}>{t.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{t.title}</div>
                    <div style={{ color: C.muted, fontSize: 11 }}>{t.category}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{
                      width: 48, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${t.relevance}%`, height: '100%', borderRadius: 3,
                        background: `linear-gradient(90deg, ${C.cyan}, ${C.purple})`,
                      }} />
                    </div>
                    <span style={{ color: C.cyan, fontSize: 11, fontWeight: 600 }}>{t.relevance}%</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4: Risk Analysis */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Shield size={16} color={C.green} />
              <span style={{ color: C.text, fontSize: 16, fontWeight: 700 }}>Risk Analysis</span>
            </div>
            <div style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20,
              opacity: 0, animation: 'fadeUp 0.4s 1.1s forwards',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>Portfolio Risk Assessment</div>
                  <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>Based on volatility & correlation</div>
                </div>
                <AlertTriangle size={18} color="#FBBF24" />
              </div>
              <RiskMeter level={riskLevel} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 18 }}>
                {[
                  { label: 'Volatility', value: '42%', color: '#FBBF24' },
                  { label: 'Sharpe Ratio', value: '1.8', color: C.green },
                  { label: 'Max Drawdown', value: '-12%', color: C.red },
                ].map(m => (
                  <div key={m.label} style={{ textAlign: 'center' }}>
                    <div style={{ color: m.color, fontSize: 16, fontWeight: 700 }}>{m.value}</div>
                    <div style={{ color: C.muted, fontSize: 11 }}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Disclaimer */}
          <div style={{ textAlign: 'center', padding: '16px 0', borderTop: `1px solid ${C.border}` }}>
            <p style={{ color: C.muted, fontSize: 11, lineHeight: 1.5 }}>
              AI predictions are experimental. Not financial advice. Always DYOR.
            </p>
          </div>
        </div>
      )}

      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  );
}
