import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { TrackerMetric } from '../../types/database'

interface MonthlyOverviewProps {
  metrics: TrackerMetric[]
  monthEntries: Record<string, Record<string, number>>
  currentMonth: Date
  selectedDay: number | null
  onDayClick: (day: number) => void
}

const C = {
  card: '#090914',
  cardBdr: 'rgba(255,255,255,0.06)',
  cyan: '#00D2FF',
  text: '#f1f5f9',
  muted: '#6b7280',
}

export default function MonthlyOverview({
  metrics,
  monthEntries,
  currentMonth,
  selectedDay,
  onDayClick,
}: MonthlyOverviewProps) {
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate()

  const stats = useMemo(() => {
    const totals: Record<string, { met: number; total: number; sum: number }> = {}
    for (const m of metrics) {
      totals[m.id] = { met: 0, total: 0, sum: 0 }
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const entry = monthEntries[dateStr]
      if (entry) {
        for (const m of metrics) {
          const val = entry[m.id]
          if (val !== undefined) {
            totals[m.id].total++
            totals[m.id].sum += val
            if (val >= m.target) totals[m.id].met++
          }
        }
      }
    }
    return totals
  }, [metrics, monthEntries, daysInMonth, currentMonth])

  const primaryMetric = metrics[0]

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
        📅 Monthly Overview
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(metrics.length, 4)}, 1fr)`, gap: 8, marginBottom: 16 }}>
        {metrics.slice(0, 4).map(m => {
          const s = stats[m.id]
          const avg = s.total > 0 ? Math.round(s.sum / s.total) : 0
          const pct = s.total > 0 ? Math.round((s.met / s.total) * 100) : 0
          return (
            <div key={m.id} style={{
              background: 'rgba(255,255,255,0.03)', borderRadius: 8,
              padding: '10px 8px', border: `1px solid ${C.cardBdr}`,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 9, color: C.muted, marginBottom: 4 }}>{m.name}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: m.color }}>
                {m.unit === '$' ? `$${avg.toLocaleString()}` : avg}
              </div>
              <div style={{ fontSize: 9, color: pct >= 70 ? '#34D399' : '#ef4444', marginTop: 2 }}>
                {pct}% days met
              </div>
            </div>
          )
        })}
      </div>

      {/* Day grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} style={{ fontSize: 9, color: C.muted, textAlign: 'center', padding: 4, fontWeight: 600 }}>
            {d}
          </div>
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const entry = monthEntries[dateStr]
          const isToday = day === new Date().getDate()
          const isSelected = day === selectedDay
          const met = primaryMetric && entry?.[primaryMetric.id] !== undefined
            ? entry[primaryMetric.id] >= primaryMetric.target
            : false
          const hasData = !!entry

          const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()
          const gridCol = ((day + firstDay - 1) % 7) + 1

          return (
            <motion.button
              key={day}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDayClick(day)}
              style={{
                aspectRatio: '1',
                borderRadius: 6,
                border: isSelected ? `2px solid ${C.cyan}` : isToday ? `1px solid ${C.cyan}40` : `1px solid ${C.cardBdr}`,
                background: hasData
                  ? (met ? `${primaryMetric?.color}20` : 'rgba(239,68,68,0.08)')
                  : 'rgba(255,255,255,0.02)',
                color: isToday ? C.cyan : C.muted,
                fontSize: 10, fontWeight: isToday || isSelected ? 700 : 500,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gridColumn: day === 1 ? gridCol : undefined,
              }}
            >
              {day}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
