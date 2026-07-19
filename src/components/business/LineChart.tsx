import { useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts'
import type { TrackerMetric } from '../../types/database'

interface LineChartProps {
  metrics: TrackerMetric[]
  monthEntries: Record<string, Record<string, number>>
  currentMonth: Date
}

const C = {
  card: '#090914',
  cardBdr: 'rgba(255,255,255,0.06)',
  cyan: '#00D2FF',
  text: '#f1f5f9',
  muted: '#6b7280',
  grid: 'rgba(255,255,255,0.04)',
}

export default function MetricLineChart({ metrics, monthEntries, currentMonth }: LineChartProps) {
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate()

  const chartData = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const entry = monthEntries[dateStr] || {}
      const point: Record<string, any> = { day: String(day) }
      for (const m of metrics) {
        point[m.id] = entry[m.id] !== undefined ? entry[m.id] : null
      }
      return point
    })
  }, [monthEntries, daysInMonth, currentMonth, metrics])

  const maxVal = useMemo(() => {
    let max = 0
    for (const point of chartData) {
      for (const m of metrics) {
        const v = point[m.id]
        if (v !== null && v !== undefined && v > max) max = v
      }
    }
    for (const m of metrics) {
      if (m.target > max) max = m.target
    }
    return max || 100
  }, [chartData, metrics])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{
        background: `${C.card}ee`,
        backdropFilter: 'blur(12px)',
        border: `1px solid ${C.cardBdr}`,
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 12,
      }}>
        <div style={{ fontWeight: 700, color: C.text, marginBottom: 6 }}>
          Day {label}
        </div>
        {payload.map((p: any) => {
          const metric = metrics.find(m => m.id === p.dataKey)
          return (
            <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color }} />
              <span style={{ color: C.muted }}>{metric?.name || p.dataKey}:</span>
              <span style={{ color: C.text, fontWeight: 600 }}>
                {p.value !== null
                  ? (metric?.unit === '$' ? `$${p.value.toLocaleString()}` : p.value)
                  : '—'}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ReLineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
          <XAxis
            dataKey="day"
            stroke={C.muted}
            fontSize={9}
            tickLine={false}
            interval={daysInMonth > 14 ? 4 : 1}
          />
          <YAxis
            stroke={C.muted}
            fontSize={9}
            tickLine={false}
            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="square"
            iconSize={8}
            wrapperStyle={{ fontSize: 10, color: C.muted, paddingTop: 8 }}
          />
          {metrics.map(m => (
            <ReferenceLine
              key={`target-${m.id}`}
              y={m.target}
              stroke={m.color}
              strokeDasharray="6 4"
              strokeOpacity={0.3}
            />
          ))}
          {metrics.map(m => (
            <Line
              key={m.id}
              type="monotone"
              dataKey={m.id}
              name={`${m.name} (${m.unit === '$' ? '$' : ''}${m.target}${m.unit !== '$' ? ' ' + m.unit : ''})`}
              stroke={m.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, fill: C.card }}
              connectNulls
            />
          ))}
        </ReLineChart>
      </ResponsiveContainer>
    </div>
  )
}
