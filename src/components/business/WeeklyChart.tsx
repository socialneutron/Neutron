import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { TrackerMetric } from '../../types/database'

interface WeeklyChartProps {
  metrics: TrackerMetric[]
  weekEntries: { date: string; values: Record<string, number> }[]
}

const C = {
  card: '#090914',
  cardBdr: 'rgba(255,255,255,0.06)',
  cyan: '#00D2FF',
  text: '#f1f5f9',
  muted: '#6b7280',
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function WeeklyChart({ metrics, weekEntries }: WeeklyChartProps) {
  const chartData = useMemo(() => {
    return DAYS.map((day, i) => {
      const entry = weekEntries[i]
      return {
        day,
        values: entry?.values || {},
        date: entry?.date || '',
      }
    })
  }, [weekEntries])

  const maxVal = useMemo(() => {
    let max = 0
    for (const d of chartData) {
      for (const m of metrics) {
        const v = d.values[m.id] || 0
        if (v > max) max = v
      }
    }
    return max || 1
  }, [chartData, metrics])

  const barHeight = 120
  const barWidth = 28
  const gap = 8

  return (
    <div style={{
      background: `${C.card}cc`, borderRadius: 12,
      border: `1px solid ${C.cardBdr}`, padding: 16,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: C.muted,
        textTransform: 'uppercase', letterSpacing: '0.5px',
        marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6,
      }}>
        📊 Weekly Summary
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        {metrics.map(m => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: C.muted }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: m.color }} />
            {m.name}
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap, height: barHeight + 30, justifyContent: 'center' }}>
        {chartData.map((d, i) => (
          <div key={d.day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: barHeight }}>
              {metrics.map((m, mi) => {
                const val = d.values[m.id] || 0
                const pct = (val / m.target) * 100
                const h = Math.max(2, (val / maxVal) * barHeight)
                const met = val >= m.target
                return (
                  <motion.div
                    key={m.id}
                    initial={{ height: 0 }}
                    animate={{ height: h }}
                    transition={{ delay: i * 0.05 + mi * 0.02, duration: 0.4, ease: 'easeOut' }}
                    title={`${d.day}: ${m.name} = ${val}/${m.target}`}
                    style={{
                      width: barWidth / metrics.length,
                      borderRadius: 3,
                      background: met ? m.color : `${m.color}40`,
                      minHeight: 2,
                      cursor: 'pointer',
                    }}
                  />
                )
              })}
            </div>
            <span style={{
              fontSize: 9, fontWeight: 600,
              color: i === new Date().getDay() ? C.cyan : C.muted,
            }}>
              {d.day}
            </span>
          </div>
        ))}
      </div>

      {/* Target lines info */}
      <div style={{ marginTop: 12, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {metrics.map(m => (
          <div key={m.id} style={{
            fontSize: 9, color: C.muted, display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{ color: m.color, fontWeight: 700 }}>{m.name}</span>
            target: {m.unit === '$' ? `$${m.target.toLocaleString()}` : `${m.target} ${m.unit}`}
          </div>
        ))}
      </div>
    </div>
  )
}
