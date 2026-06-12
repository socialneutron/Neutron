import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Plus, Edit3, Save, Trash2, X, Info,
  Calendar, User, MessageSquare, Heart, Share2, Compass,
  Settings, Cpu, Eye, LayoutGrid, Zap, Activity, TrendingUp,
  BarChart2
} from 'lucide-react'
import './GraphPage.css'

/* ─────────────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────────────── */
const NEON = [
  '#00d2ff', '#ff007f', '#39ff14', '#ff6c00', '#a855f7', '#ffe600'
]

const CHART_TYPES = [
  { key: 'bar',    label: 'Bar',    icon: '▬' },
  { key: 'line',   label: 'Line',   icon: '╱' },
  { key: 'pie',    label: 'Pie',    icon: '◕' },
  { key: 'donut',  label: 'Donut',  icon: '◉' },
  { key: 'radial', label: 'Radial', icon: '◎' },
]

const INTEL_STREAMS = {
  1: [
    { id: 101, author: '@macro_recon', content: 'Gold breakout confirmed above 2,050. Central bank accumulation is at multi-decade highs. Risk-off indices flashing neon.', likes: 184, comments: 29 },
    { id: 102, author: '@cyber_hedge', content: 'As real yields drop, physical bullion becomes structurally attractive. Multi-year cup-and-handle targeting $2,600.', likes: 92, comments: 11 },
    { id: 103, author: '@tokyo_quant', content: 'Currency expansion metrics across 8 majors correlate directly with this gold trajectory. Long exposure recommended.', likes: 53, comments: 4 }
  ],
  2: [
    { id: 201, author: '@satoshi_core', content: 'ETF telemetry registers another record session. $350M net positive inflows. Cold storage drains unsustainable.', likes: 1420, comments: 412 },
    { id: 202, author: '@hash_node_42', content: 'Bitcoin network difficulty at record peak. Post-halving miners expanding with next-gen ASICs. Bull cycle structural.', likes: 890, comments: 167 },
    { id: 203, author: '@on_chain_lens', content: 'Long-term holders not budging. SOPR stable — zero panic or early profit-taking. Realization phase warming up.', likes: 742, comments: 92 }
  ],
  3: [
    { id: 301, author: '@silicon_vector', content: 'AI margins showing structural bifurcation. NVIDIA capturing 85% of value; software wrappers facing price fatigue.', likes: 450, comments: 95 },
    { id: 302, author: '@alpha_decay', content: 'Technically overextended but cash generation keeps multi-caps afloat. Consolidation to 14,800 is overdue.', likes: 284, comments: 34 },
  ],
  4: [
    { id: 401, author: '@crude_sentinel', content: 'Crude tightening in global ports. Mid-East cuts compressing physical spot premiums. Brent targeting $92.', likes: 230, comments: 41 },
    { id: 402, author: '@solar_transition', content: 'Europe drawing reserves fast, but solar infrastructure already offset 12% of baseline grid energy requirements.', likes: 167, comments: 38 }
  ]
}

/* ─────────────────────────────────────────────────────────────────────
   SVG CHART ENGINE
───────────────────────────────────────────────────────────────────── */
function NeonChart({ dataPoints = [], chartType = 'bar', size = 'normal', animKey = 0, animEnabled = true }) {
  const [hovered, setHovered] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(false)
    const t = setTimeout(() => setReady(true), 60)
    return () => clearTimeout(t)
  }, [animKey, chartType])

  const W = 480
  const H = size === 'large' ? 340 : 260
  const PAD = { top: 20, right: 30, bottom: 40, left: 44 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const data = useMemo(() =>
    dataPoints.map(p => ({
      x: String(p.x),
      y: Math.max(0, parseFloat(p.y) || 0)
    }))
  , [dataPoints])

  const maxY = useMemo(() => Math.max(...data.map(d => d.y), 1), [data])
  const totalY = useMemo(() => data.reduce((s, d) => s + d.y, 0), [data])
  const cx = W / 2, cy = H / 2

  if (!data.length) {
    return (
      <div className="nc-empty">
        <Cpu size={32} color="#00d2ff" opacity={0.3} />
        <p>NO DATA LOADED</p>
      </div>
    )
  }

  /* ── BAR CHART ── */
  if (chartType === 'bar') {
    const slotW = innerW / data.length
    const barW  = Math.max(10, slotW * 0.55)
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
      val: Math.round(maxY * f),
      y: PAD.top + innerH - f * innerH
    }))

    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="nc-svg">
        <defs>
          {data.map((d, i) => (
            <linearGradient key={i} id={`bar-grad-${animKey}-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={NEON[i % NEON.length]} stopOpacity="0.9" />
              <stop offset="100%" stopColor={NEON[i % NEON.length]} stopOpacity="0.15" />
            </linearGradient>
          ))}
        </defs>

        {/* Grid lines */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={t.y} x2={PAD.left + innerW} y2={t.y}
              stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4" />
            <text x={PAD.left - 6} y={t.y + 4} textAnchor="end"
              fill="rgba(255,255,255,0.35)" fontSize="9px" fontFamily="monospace">{t.val}</text>
          </g>
        ))}

        {/* Axes */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + innerH}
          stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        <line x1={PAD.left} y1={PAD.top + innerH} x2={PAD.left + innerW} y2={PAD.top + innerH}
          stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

        {/* Bars */}
        {data.map((d, i) => {
          const barH    = (d.y / maxY) * innerH
          const bx      = PAD.left + i * slotW + (slotW - barW) / 2
          const by      = PAD.top + innerH - barH
          const color   = NEON[i % NEON.length]
          const isH     = hovered === i

          return (
            <g key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Bar shadow */}
              {isH && <rect x={bx - 2} y={by - 2} width={barW + 4} height={barH + 4}
                rx="4" fill={color} opacity="0.1" />}

              {/* Bar body */}
              {animEnabled ? (
                <motion.rect
                  x={bx} y={ready ? by : PAD.top + innerH}
                  width={barW} height={ready ? barH : 0}
                  rx="4"
                  fill={`url(#bar-grad-${animKey}-${i})`}
                  stroke={color}
                  strokeWidth={isH ? 1.5 : 0.8}
                  style={{ filter: isH ? `drop-shadow(0 0 8px ${color})` : 'none' }}
                  initial={{ height: 0, y: PAD.top + innerH }}
                  animate={{ height: barH, y: by }}
                  transition={{ duration: 0.7, delay: i * 0.08, ease: 'easeOut' }}
                />
              ) : (
                <rect
                  x={bx} y={by}
                  width={barW} height={barH}
                  rx="4"
                  fill={`url(#bar-grad-${animKey}-${i})`}
                  stroke={color}
                  strokeWidth={isH ? 1.5 : 0.8}
                  style={{ filter: isH ? `drop-shadow(0 0 8px ${color})` : 'none' }}
                />
              )}

              {/* Value label on hover */}
              {isH && (
                <text x={bx + barW / 2} y={by - 6} textAnchor="middle"
                  fill={color} fontSize="10px" fontWeight="700" fontFamily="monospace"
                  style={{ filter: `drop-shadow(0 0 4px ${color})` }}
                >{d.y}</text>
              )}

              {/* X axis label */}
              <text x={bx + barW / 2} y={PAD.top + innerH + 14} textAnchor="middle"
                fill={isH ? color : 'rgba(255,255,255,0.45)'} fontSize="9px" fontFamily="monospace"
              >{d.x}</text>
            </g>
          )
        })}
      </svg>
    )
  }

  /* ── LINE CHART ── */
  if (chartType === 'line') {
    const slotW = innerW / (data.length - 1 || 1)
    const pts   = data.map((d, i) => ({
      x: PAD.left + i * slotW,
      y: PAD.top + innerH - (d.y / maxY) * innerH,
      ...d
    }))

    const pathD = `M ${pts.map(p => `${p.x} ${p.y}`).join(' L ')}`
    const fillPath = `M${pts[0].x},${PAD.top + innerH} ` +
      pts.map(p => `L${p.x},${p.y}`).join(' ') +
      ` L${pts[pts.length - 1].x},${PAD.top + innerH} Z`

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
      val: Math.round(maxY * f),
      y: PAD.top + innerH - f * innerH
    }))

    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="nc-svg">
        <defs>
          <linearGradient id={`line-fill-${animKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00d2ff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#00d2ff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={t.y} x2={PAD.left + innerW} y2={t.y}
              stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4" />
            <text x={PAD.left - 6} y={t.y + 4} textAnchor="end"
              fill="rgba(255,255,255,0.35)" fontSize="9px" fontFamily="monospace">{t.val}</text>
          </g>
        ))}

        {/* Axes */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + innerH}
          stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        <line x1={PAD.left} y1={PAD.top + innerH} x2={PAD.left + innerW} y2={PAD.top + innerH}
          stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

        {/* Area fill */}
        {animEnabled ? (
          <motion.path
            d={fillPath} fill={`url(#line-fill-${animKey})`}
            initial={{ opacity: 0 }} animate={{ opacity: ready ? 1 : 0 }}
            transition={{ duration: 1.2 }}
          />
        ) : (
          <path d={fillPath} fill={`url(#line-fill-${animKey})`} />
        )}

        {/* Line */}
        {animEnabled ? (
          <motion.path
            d={pathD} fill="none"
            stroke="#00d2ff" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 0 6px #00d2ff)' }}
            initial={{ pathLength: 0 }} animate={{ pathLength: ready ? 1 : 0 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          />
        ) : (
          <path
            d={pathD} fill="none"
            stroke="#00d2ff" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 0 6px #00d2ff)' }}
          />
        )}

        {/* Dots */}
        {pts.map((p, i) => {
          const isH = hovered === i
          return (
            <g key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle cx={p.x} cy={p.y} r={isH ? 7 : 4}
                fill={isH ? '#00d2ff' : '#050510'} stroke="#00d2ff" strokeWidth="2"
                style={{ filter: isH ? 'drop-shadow(0 0 8px #00d2ff)' : 'none', transition: 'all 0.2s' }}
              />
              {isH && (
                <text x={p.x} y={p.y - 12} textAnchor="middle"
                  fill="#00d2ff" fontSize="10px" fontWeight="700" fontFamily="monospace"
                  style={{ filter: 'drop-shadow(0 0 4px #00d2ff)' }}
                >{p.y}</text>
              )}
              <text x={p.x} y={PAD.top + innerH + 14} textAnchor="middle"
                fill={isH ? '#00d2ff' : 'rgba(255,255,255,0.45)'} fontSize="9px" fontFamily="monospace"
              >{p.x}</text>
            </g>
          )
        })}
      </svg>
    )
  }

  /* ── PIE / DONUT ── */
  if (chartType === 'pie' || chartType === 'donut') {
    const R   = size === 'large' ? 120 : 90
    const Ri  = chartType === 'donut' ? (size === 'large' ? 76 : 56) : 0

    let angle = -Math.PI / 2
    const slices = totalY === 0 ? [] : data.map((d, i) => {
      const pct   = d.y / totalY
      const sweep = pct * 2 * Math.PI
      const s     = angle
      const e     = angle + sweep
      angle       = e

      const large = pct > 0.5 ? 1 : 0
      const c1    = Math.cos(s), s1 = Math.sin(s)
      const c2    = Math.cos(e), s2 = Math.sin(e)
      const mid   = s + sweep / 2
      const cm    = Math.cos(mid), sm = Math.sin(mid)

      const path = Ri > 0
        ? `M${cx+R*c1} ${cy+R*s1} A${R} ${R} 0 ${large} 1 ${cx+R*c2} ${cy+R*s2} L${cx+Ri*c2} ${cy+Ri*s2} A${Ri} ${Ri} 0 ${large} 0 ${cx+Ri*c1} ${cy+Ri*s1} Z`
        : `M${cx} ${cy} L${cx+R*c1} ${cy+R*s1} A${R} ${R} 0 ${large} 1 ${cx+R*c2} ${cy+R*s2} Z`

      const leR  = R + (size === 'large' ? 32 : 24)
      const lex  = cx + leR * cm
      const ley  = cy + leR * sm
      const eb   = lex + (cm >= 0 ? (size === 'large' ? 30 : 22) : -(size === 'large' ? 30 : 22))
      const lx   = eb + (cm >= 0 ? 4 : -4)

      return {
        i, path,
        color: NEON[i % NEON.length],
        hover: { tx: cm * 8, ty: sm * 8 },
        leader: { sx: cx + (R + 5) * cm, sy: cy + (R + 5) * sm, ex: lex, ey: ley, ebx: eb, eby: ley },
        label: { x: lx, y: ley, anchor: cm >= 0 ? 'start' : 'end' },
        text: `${d.x}: ${d.y} (${Math.round(pct * 100)}%)`,
        pct: Math.round(pct * 100)
      }
    })

    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="nc-svg">
        <defs>
          <filter id={`glow-${animKey}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Reticle rings */}
        <g opacity="0.12">
          <circle cx={cx} cy={cy} r={R + 30} fill="none" stroke="#00d2ff" strokeWidth="0.5" strokeDasharray="3 7" />
          <circle cx={cx} cy={cy} r={R} fill="none" stroke="#ffffff" strokeWidth="0.4" />
          {Ri > 0 && <circle cx={cx} cy={cy} r={Ri} fill="none" stroke="#ffffff" strokeWidth="0.4" />}
          <line x1={cx - R - 40} y1={cy} x2={cx + R + 40} y2={cy} stroke="#00d2ff" strokeWidth="0.4" />
          <line x1={cx} y1={cy - R - 40} x2={cx} y2={cy + R + 40} stroke="#00d2ff" strokeWidth="0.4" />
        </g>

        {/* Slices */}
        {slices.map(sl => {
          const isH = hovered === sl.i
          const anyH = hovered !== null
          const op = anyH ? (isH ? 1 : 0.2) : 0.85

          return (
            <g key={sl.i}
              onMouseEnter={() => setHovered(sl.i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Leader line */}
              {animEnabled ? (
                <motion.path
                  d={`M${sl.leader.sx} ${sl.leader.sy} L${sl.leader.ex} ${sl.leader.ey} L${sl.leader.ebx} ${sl.leader.eby}`}
                  fill="none" stroke={sl.color} strokeWidth="1"
                  strokeDasharray={isH ? 'none' : '2 3'}
                  animate={{ opacity: ready ? op : 0 }}
                  filter={`url(#glow-${animKey})`}
                />
              ) : (
                <path
                  d={`M${sl.leader.sx} ${sl.leader.sy} L${sl.leader.ex} ${sl.leader.ey} L${sl.leader.ebx} ${sl.leader.eby}`}
                  fill="none" stroke={sl.color} strokeWidth="1"
                  strokeDasharray={isH ? 'none' : '2 3'}
                  opacity={op}
                  filter={`url(#glow-${animKey})`}
                />
              )}
              {/* Label */}
              {animEnabled ? (
                <motion.text
                  x={sl.label.x} y={sl.label.y}
                  textAnchor={sl.label.anchor} dominantBaseline="middle"
                  fill={sl.color} fontSize={size === 'large' ? '10px' : '8.5px'}
                  fontFamily="monospace" fontWeight="700"
                  animate={{ opacity: ready ? op : 0 }}
                  filter={`url(#glow-${animKey})`}
                >{sl.text}</motion.text>
              ) : (
                <text
                  x={sl.label.x} y={sl.label.y}
                  textAnchor={sl.label.anchor} dominantBaseline="middle"
                  fill={sl.color} fontSize={size === 'large' ? '10px' : '8.5px'}
                  fontFamily="monospace" fontWeight="700"
                  opacity={op}
                  filter={`url(#glow-${animKey})`}
                >{sl.text}</text>
              )}
              {/* Slice */}
              {animEnabled ? (
                <motion.path
                  d={sl.path}
                  fill={sl.color}
                  fillOpacity={isH ? 0.4 : 0.18}
                  stroke={sl.color}
                  strokeWidth={isH ? 2.5 : 1.2}
                  filter={`url(#glow-${animKey})`}
                  animate={{
                    x: isH ? sl.hover.tx : 0,
                    y: isH ? sl.hover.ty : 0,
                    opacity: ready ? op : 0
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                />
              ) : (
                <path
                  d={sl.path}
                  fill={sl.color}
                  fillOpacity={isH ? 0.4 : 0.18}
                  stroke={sl.color}
                  strokeWidth={isH ? 2.5 : 1.2}
                  filter={`url(#glow-${animKey})`}
                  style={{
                    transform: isH ? `translate(${sl.hover.tx}px, ${sl.hover.ty}px)` : 'none',
                    transition: 'transform 0.2s',
                    opacity: op
                  }}
                />
              )}
            </g>
          )
        })}

        {/* Donut centre */}
        {chartType === 'donut' && (
          <g pointerEvents="none">
            <circle cx={cx} cy={cy} r={Ri - 1} fill="#06061a" />
            <text x={cx} y={cy - 8} textAnchor="middle" fill="#4a4a6a" fontSize="9px" fontFamily="monospace">TOTAL</text>
            <text x={cx} y={cy + 10} textAnchor="middle" fill="#00d2ff" fontSize={size === 'large' ? '20px' : '15px'}
              fontWeight="800" fontFamily="monospace" filter={`url(#glow-${animKey})`}>{totalY}</text>
          </g>
        )}
      </svg>
    )
  }

  /* ── RADIAL BARS ── */
  if (chartType === 'radial') {
    const maxV   = Math.max(...data.map(d => d.y), 1)
    const baseR  = size === 'large' ? 52 : 38
    const step   = size === 'large' ? 20 : 16

    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="nc-svg">
        <defs>
          <filter id={`rglow-${animKey}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {data.map((d, i) => {
          const r     = baseR + i * step
          const circ  = 2 * Math.PI * r
          const pct   = d.y / maxV
          const color = NEON[i % NEON.length]
          const isH   = hovered === i
          const anyH  = hovered !== null
          const op    = anyH ? (isH ? 1 : 0.25) : 0.85

          const endAngle  = -Math.PI / 2 + pct * 2 * Math.PI
          const dotX      = cx + r * Math.cos(endAngle)
          const dotY      = cy + r * Math.sin(endAngle)

          return (
            <g key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Track */}
              <circle cx={cx} cy={cy} r={r} fill="none"
                stroke="rgba(255,255,255,0.04)" strokeWidth="9" />
              {/* Arc */}
              {animEnabled ? (
                <motion.circle
                  cx={cx} cy={cy} r={r}
                  fill="none" stroke={color}
                  strokeWidth={isH ? 11 : 8}
                  strokeLinecap="round"
                  filter={`url(#rglow-${animKey})`}
                  transform={`rotate(-90 ${cx} ${cy})`}
                  style={{ strokeDasharray: circ }}
                  initial={{ strokeDashoffset: circ }}
                  animate={{ strokeDashoffset: ready ? circ * (1 - pct) : circ, opacity: op }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: i * 0.1 }}
                />
              ) : (
                <circle
                  cx={cx} cy={cy} r={r}
                  fill="none" stroke={color}
                  strokeWidth={isH ? 11 : 8}
                  strokeLinecap="round"
                  filter={`url(#rglow-${animKey})`}
                  transform={`rotate(-90 ${cx} ${cy})`}
                  style={{ strokeDasharray: circ, strokeDashoffset: circ * (1 - pct) }}
                  opacity={op}
                />
              )}
              {/* Endpoint dot */}
              {animEnabled ? (
                <motion.circle cx={dotX} cy={dotY} r={isH ? 5 : 3}
                  fill={color} filter={`url(#rglow-${animKey})`}
                  animate={{ opacity: ready ? op : 0 }}
                  transition={{ duration: 0.4, delay: 1 }}
                />
              ) : (
                <circle cx={dotX} cy={dotY} r={isH ? 5 : 3}
                  fill={color} filter={`url(#rglow-${animKey})`}
                  opacity={op}
                />
              )}
              {/* Hover tooltip */}
              {isH && (
                <g pointerEvents="none">
                  <rect x={cx - 70} y={cy - 22} width="140" height="44" rx="8"
                    fill="#08081e" stroke={color} strokeWidth="1" opacity="0.97" />
                  <text x={cx} y={cy - 4} textAnchor="middle"
                    fill="#6a6a8a" fontSize="9px" fontFamily="monospace">{d.x}</text>
                  <text x={cx} y={cy + 13} textAnchor="middle"
                    fill={color} fontSize="14px" fontWeight="800" fontFamily="monospace"
                    filter={`url(#rglow-${animKey})`}>{d.y}</text>
                </g>
              )}
            </g>
          )
        })}

        {/* Legend */}
        {data.map((d, i) => {
          const anyH = hovered !== null
          const op   = anyH ? (hovered === i ? 1 : 0.3) : 0.9
          return (
            <g key={`leg-${i}`} opacity={op}>
              <rect x={W - 125} y={16 + i * 22} width="10" height="10" rx="2"
                fill={NEON[i % NEON.length]} />
              <text x={W - 109} y={24 + i * 22} fill="#b0b0c8"
                fontSize="9px" fontFamily="monospace" dominantBaseline="middle">{d.x}</text>
            </g>
          )
        })}
      </svg>
    )
  }

  return null
}

export default function GraphPage({ navigate }) {
  const [activeTab, setActiveTab] = useState('my-workspace')
  const [animKey,   setAnimKey]   = useState(0)

  const [animEnabled, setAnimEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('gp-animations');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const toggleAnim = () => {
    setAnimEnabled(prev => {
      const next = !prev;
      try {
        localStorage.setItem('gp-animations', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }

  // Conditionally disable Framer Motion animations globally for the page elements
  const tabAnimProps = animEnabled ? {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -14 },
    transition: { duration: 0.3 }
  } : {}

  const cardAnimProps = animEnabled ? {
    layout: true,
    initial: { opacity: 0, scale: 0.97 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.25 }
  } : {}

  const panelAnimProps = animEnabled ? {
    initial: { opacity: 0, height: 0 },
    animate: { opacity: 1, height: 'auto' },
    exit: { opacity: 0, height: 0 },
    transition: { duration: 0.28 }
  } : {}

  const modalBgAnimProps = animEnabled ? {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.22 }
  } : {}

  const modalAnimProps = animEnabled ? {
    initial: { scale: 0.9, y: 30, opacity: 0 },
    animate: { scale: 1, y: 0, opacity: 1 },
    exit: { scale: 0.9, y: 30, opacity: 0 },
    transition: { type: 'spring', damping: 26, stiffness: 280 }
  } : {}

  const [myGraphs, setMyGraphs] = useState([
    {
      id: 'g1', title: 'Q2 Performance Tracker', chartType: 'bar',
      data: [{ x: 'Apr', y: 45 }, { x: 'May', y: 80 }, { x: 'Jun', y: 150 }, { x: 'Jul', y: 110 }]
    },
    {
      id: 'g2', title: 'Ad Campaign Outcomes', chartType: 'radial',
      data: [{ x: 'Search', y: 320 }, { x: 'Social', y: 580 }, { x: 'Email', y: 190 }]
    }
  ])

  const publicGraphs = [
    {
      id: 1, title: '🥇 Gold Reserves Distribution', trend: '+4.2%', isPositive: true,
      chartType: 'pie', author: '@macro_insights', date: '2026-06-02',
      notes: 'Strategic bullion reserves distribution across global major economies. Sovereign accumulation reflects massive hedge positioning against fiat currency debasement cycles.',
      data: [{ x: 'Fed Reserve', y: 8130 }, { x: 'Bundesbank', y: 3350 }, { x: "B. d'Italia", y: 2450 }, { x: 'Banque FR', y: 2430 }]
    },
    {
      id: 2, title: '₿ Bitcoin Exchange Outflows', trend: '+12.5%', isPositive: true,
      chartType: 'donut', author: '@glassnode', date: '2026-06-03',
      notes: 'Liquidity pools tracking across primary institutional exchanges. Rapid depletion signals severe supply shock threat over standard spot trading pairs.',
      data: [{ x: 'Binance', y: 320 }, { x: 'Coinbase', y: 210 }, { x: 'Kraken', y: 95 }, { x: 'Bitfinex', y: 140 }]
    },
    {
      id: 3, title: '📈 Tech Sector Growth', trend: '-2.1%', isPositive: false,
      chartType: 'line', author: '@alpha_trader', date: '2026-06-04',
      notes: 'Relative allocations of index capital values inside AI and computing segments. Highlights high exposure risk concentrations in mega-cap nodes.',
      data: [{ x: 'Q1 23', y: 12 }, { x: 'Q2 23', y: 19 }, { x: 'Q3 23', y: 17 }, { x: 'Q4 23', y: 28 }, { x: 'Q1 24', y: 35 }]
    },
    {
      id: 4, title: '🛢️ Crude Oil Reserves', trend: '+1.8%', isPositive: true,
      chartType: 'bar', author: '@energy_spy', date: '2026-06-01',
      notes: 'Crude storage capacities utilized relative to global supply targets. High import margins support structural reliance on reserve buffers.',
      data: [{ x: 'Americas', y: 410 }, { x: 'EU', y: 180 }, { x: 'Asia-Pac', y: 320 }, { x: 'Mid-East', y: 550 }]
    }
  ]

  /* ── Edit state ── */
  const [editingId, setEditingId] = useState(null)
  const [editForm,  setEditForm]  = useState(null)
  const [modal,     setModal]     = useState(null)

  const startEdit   = (g) => { setEditingId(g.id); setEditForm({ ...g, data: g.data.map(d => ({ ...d })) }) }
  const editMeta    = (f, v) => setEditForm(p => ({ ...p, [f]: v }))
  const editPoint   = (i, f, v) => {
    const d = [...editForm.data]
    d[i] = { ...d[i], [f]: f === 'y' ? (isNaN(parseFloat(v)) ? 0 : parseFloat(v)) : v }
    setEditForm(p => ({ ...p, data: d }))
  }
  const removePoint = (i) => setEditForm(p => ({ ...p, data: p.data.filter((_, j) => j !== i) }))
  const addPoint    = (x, y) => { if (!x.trim()) return; setEditForm(p => ({ ...p, data: [...p.data, { x, y: parseFloat(y) || 0 }] })) }
  const saveEdit    = () => { setMyGraphs(p => p.map(g => g.id === editForm.id ? editForm : g)); setEditingId(null); setEditForm(null); setAnimKey(k => k + 1) }
  const cancelEdit  = () => { setEditingId(null); setEditForm(null) }
  const deleteGraph = (id) => {
    if (window.confirm('Delete this graph?')) {
      setMyGraphs(p => p.filter(g => g.id !== id))
      if (editingId === id) cancelEdit()
    }
  }
  const createGraph = () => {
    const g = { id: `g-${Date.now()}`, title: 'New Graph', chartType: 'bar', data: [{ x: 'A', y: 50 }, { x: 'B', y: 80 }] }
    setMyGraphs(p => [g, ...p])
    startEdit(g)
  }
  const openModal   = (g) => { setModal(g); setAnimKey(k => k + 1) }

  return (
    <div className="gp-root">
      {/* BG layers */}
      <div className="gp-grid-bg" />
      <div className="gp-orb gp-orb-a" />
      <div className="gp-orb gp-orb-b" />

      <div className="gp-container">

        {/* HEADER */}
        <header className="gp-header">
          <div className="gp-header-left">
            <button className="gp-back-btn" onClick={() => navigate('home')}>
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="gp-status-pill">
                <span className="gp-pulse-dot" />
                LIVE · TELEMETRY v2
              </div>
              <h1 className="gp-page-title">GRAPH INTELLIGENCE</h1>
            </div>
          </div>

          <button
            className={`gp-anim-toggle ${animEnabled ? 'on' : ''}`}
            onClick={toggleAnim}
            title="Toggle chart animations"
          >
            <span className="gp-toggle-dot" />
            {animEnabled ? 'Animations ON' : 'Animations OFF'}
          </button>

          <div className="gp-tabs">
            {[
              { key: 'my-workspace', icon: <Settings size={13} />, label: 'My Workspace' },
              { key: 'public-feed',  icon: <Compass size={13} />,  label: 'Global Feed'  }
            ].map(t => (
              <button
                key={t.key}
                className={`gp-tab ${activeTab === t.key ? 'active' : ''}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </header>

        {/* ════ MY WORKSPACE ════ */}
        <AnimatePresence mode="wait">
        {activeTab === 'my-workspace' && (
          <motion.div key="ws" {...tabAnimProps}>
            <div className="gp-bar">
              <div>
                <h3 className="gp-bar-title">My Data Graphs</h3>
                <p className="gp-bar-sub">Build and edit your personal charts — bar, line, pie and more.</p>
              </div>
              <button className="gp-create-btn" onClick={createGraph}>
                <Plus size={14} /> New Graph
              </button>
            </div>

            <div className="gp-ws-grid">
              {myGraphs.map(graph => {
                const isE   = editingId === graph.id
                const active = isE ? editForm : graph

                return (
                  <motion.div key={graph.id} className={`gp-ws-card ${isE ? 'editing' : ''}`} {...cardAnimProps}>
                    <div className="gp-card-shine" />

                    {/* Card top bar */}
                    <div className="gp-card-top">
                      {isE ? (
                        <input className="gp-rename-input" value={active.title}
                          onChange={e => editMeta('title', e.target.value)} placeholder="Graph title..." />
                      ) : (
                        <div className="gp-card-name-row">
                          <BarChart2 size={13} color="#00d2ff" />
                          <span className="gp-card-name">{active.title}</span>
                        </div>
                      )}

                      <div className="gp-card-btns">
                        {!isE ? (
                          <>
                            <button className="gp-cbtn edit" onClick={() => startEdit(graph)}>
                              <Edit3 size={11} /> Edit
                            </button>
                            <button className="gp-cbtn del" onClick={() => deleteGraph(graph.id)}>
                              <Trash2 size={11} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button className="gp-cbtn save" onClick={saveEdit}>
                              <Save size={11} /> Save
                            </button>
                            <button className="gp-cbtn cancel" onClick={cancelEdit}>Cancel</button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Edit panel */}
                    <AnimatePresence>
                    {isE && (
                      <motion.div className="gp-edit-panel" {...panelAnimProps}>
                        {/* Chart type pills */}
                        <div className="gp-ep-row">
                          <label className="gp-ep-label">Chart Type</label>
                          <div className="gp-type-pills">
                            {CHART_TYPES.map(ct => (
                              <button key={ct.key}
                                className={`gp-type-pill ${active.chartType === ct.key ? 'active' : ''}`}
                                onClick={() => editMeta('chartType', ct.key)}
                              >
                                <span>{ct.icon}</span> {ct.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Data rows */}
                        <div className="gp-ep-row">
                          <label className="gp-ep-label">Data Points ({active.data.length})</label>
                          <div className="gp-data-list">
                            {active.data.map((pt, i) => (
                              <div key={i} className="gp-data-row">
                                <input className="gp-dp-input lbl" value={pt.x} placeholder="Label"
                                  onChange={e => editPoint(i, 'x', e.target.value)} />
                                <input className="gp-dp-input val" type="number" value={pt.y} placeholder="Value"
                                  onChange={e => editPoint(i, 'y', e.target.value)} />
                                <button className="gp-dp-del" onClick={() => removePoint(i)}><X size={11} /></button>
                              </div>
                            ))}
                            <PointAdder onAdd={addPoint} />
                          </div>
                        </div>
                      </motion.div>
                    )}
                    </AnimatePresence>

                    {/* Chart */}
                    <div className="gp-card-chart">
                      <NeonChart
                        dataPoints={active.data}
                        chartType={active.chartType}
                        animKey={isE ? 999 : animKey}
                        animEnabled={animEnabled}
                      />
                    </div>
                  </motion.div>
                )
              })}

              {myGraphs.length === 0 && (
                <div className="gp-empty-state">
                  <BarChart2 size={40} opacity={0.15} color="#00d2ff" />
                  <p>No graphs yet. Click "New Graph" to get started.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ════ PUBLIC FEED ════ */}
        {activeTab === 'public-feed' && (
          <motion.div key="feed" {...tabAnimProps}>
            <div className="gp-bar">
              <div>
                <h3 className="gp-bar-title">Global Intel Feed</h3>
                <p className="gp-bar-sub">Click any card to inspect detailed data and community discussions.</p>
              </div>
              <div className="gp-live-chip">
                <Activity size={11} /> LIVE
              </div>
            </div>

            <div className="gp-pub-grid">
              {publicGraphs.map((g, idx) => {
                const pubCardAnimProps = animEnabled ? {
                  whileHover: { y: -4, scale: 1.01 },
                  whileTap: { scale: 0.98 },
                  initial: { opacity: 0, y: 18 },
                  animate: { opacity: 1, y: 0 },
                  transition: { duration: 0.35, delay: idx * 0.07 }
                } : {}

                return (
                  <motion.div key={g.id} className="gp-pub-card" onClick={() => openModal(g)} {...pubCardAnimProps}>
                    <div className="gp-pub-shine" />

                    {/* Hover overlay */}
                    <div className="gp-pub-hover-layer">
                      <Eye size={20} />
                      <span>INSPECT NODE</span>
                    </div>

                    {/* Card header */}
                    <div className="gp-pub-top">
                      <div>
                        <h4 className="gp-pub-title">{g.title}</h4>
                        <span className="gp-pub-author">by {g.author} · {g.date}</span>
                      </div>
                      <span className={`gp-trend ${g.isPositive ? 'pos' : 'neg'}`}>
                        <TrendingUp size={10} /> {g.trend}
                      </span>
                    </div>

                    {/* Chart preview */}
                    <div className="gp-pub-chart">
                      <NeonChart dataPoints={g.data} chartType={g.chartType} animKey={0} animEnabled={animEnabled} />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {/* ════ MODAL ════ */}
      <AnimatePresence>
      {modal && (
        <motion.div className="gp-modal-bg" {...modalBgAnimProps} onClick={() => setModal(null)}>
          <motion.div className="gp-modal" {...modalAnimProps} onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div className="gp-modal-head">
              <div>
                <h3 className="gp-modal-title">{modal.title}</h3>
                <div className="gp-modal-chips">
                  <span className="gp-chip"><User size={10} /> {modal.author}</span>
                  <span className="gp-chip"><Calendar size={10} /> {modal.date}</span>
                  <span className="gp-chip cyan"><Zap size={10} /> VERIFIED</span>
                  <span className={`gp-chip ${modal.isPositive ? 'green' : 'red'}`}>{modal.trend}</span>
                </div>
              </div>
              <button className="gp-modal-x" onClick={() => setModal(null)}><X size={17} /></button>
            </div>

            {/* Modal body */}
            <div className="gp-modal-body">

              {/* Left side */}
              <div className="gp-modal-left">
                <div className="gp-modal-chart-box">
                  <NeonChart dataPoints={modal.data} chartType={modal.chartType} size="large" animKey={animKey} animEnabled={animEnabled} />
                </div>

                <div className="gp-modal-info">
                  <div className="gp-info-head"><Info size={12} color="#00d2ff" /> Research Notes</div>
                  <p className="gp-info-text">{modal.notes}</p>

                  <div className="gp-info-head" style={{ marginTop: 14 }}>
                    <LayoutGrid size={12} color="#00d2ff" /> Metrics Breakdown
                  </div>
                  <div className="gp-table-wrap">
                    <table className="gp-table">
                      <thead><tr><th>Label</th><th>Value</th><th>Share</th></tr></thead>
                      <tbody>
                        {modal.data.map((d, i) => {
                          const tot   = modal.data.reduce((s, x) => s + (parseFloat(x.y) || 0), 0)
                          const share = tot > 0 ? Math.round((d.y / tot) * 100) : 0
                          const col   = NEON[i % NEON.length]
                          return (
                            <tr key={i}>
                              <td>
                                <span className="gp-tdot" style={{ background: col, boxShadow: `0 0 6px ${col}` }} />
                                {d.x}
                              </td>
                              <td style={{ color: col, fontWeight: 700 }}>{d.y}</td>
                              <td>
                                <div className="gp-share-row">
                                  <div className="gp-share-bar" style={{ width: `${share}%`, background: col, boxShadow: `0 0 6px ${col}` }} />
                                  <span>{share}%</span>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right side: Intel stream */}
              <div className="gp-modal-right">
                <div className="gp-stream-head">
                  <MessageSquare size={13} color="#a855f7" /> Related Intel Stream
                </div>
                <div className="gp-stream-list">
                  {(INTEL_STREAMS[modal.id] || []).map(post => (
                    <div key={post.id} className="gp-post">
                      <div className="gp-post-meta">
                        <span className="gp-post-who">{post.author}</span>
                        <span className="gp-post-live">● LIVE</span>
                      </div>
                      <p className="gp-post-body">{post.content}</p>
                      <div className="gp-post-acts">
                        <button className="gp-pact heart"><Heart size={11} /> {post.likes}</button>
                        <button className="gp-pact msg"><MessageSquare size={11} /> {post.comments}</button>
                        <button className="gp-pact share"><Share2 size={11} /></button>
                      </div>
                    </div>
                  ))}
                  {!(INTEL_STREAMS[modal.id] || []).length && (
                    <div className="gp-stream-empty">
                      <MessageSquare size={22} opacity={0.2} />
                      <p>No discussions yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  )
}

/* ── Helper: Add point row ── */
function PointAdder({ onAdd }) {
  const [x, setX] = useState('')
  const [y, setY] = useState('')
  const go = () => { if (!x.trim()) return; onAdd(x, y); setX(''); setY('') }
  return (
    <div className="gp-data-row add-row">
      <input className="gp-dp-input lbl" placeholder="New label..." value={x}
        onChange={e => setX(e.target.value)} onKeyDown={e => e.key === 'Enter' && go()} />
      <input className="gp-dp-input val" type="number" placeholder="Value" value={y}
        onChange={e => setY(e.target.value)} onKeyDown={e => e.key === 'Enter' && go()} />
      <button className="gp-dp-add" onClick={go} disabled={!x.trim()} type="button"><Plus size={12} /></button>
    </div>
  )
}

