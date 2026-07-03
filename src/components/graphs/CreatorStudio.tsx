import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Rocket, TrendingUp, BarChart3, Activity,
  PieChart, Upload, FileSpreadsheet, Plus, Trash2, Download, Sparkles, Grid
} from 'lucide-react'
import { useGraphStore } from '../../stores/graphStore'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area,
  PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'
import * as XLSX from 'xlsx'

const C = {
  bg: '#05050A', surface: '#090914', card: '#0d0d1a', cardHover: '#111127',
  border: 'rgba(255,255,255,0.06)', borderL: 'rgba(255,255,255,0.1)',
  cyan: '#00D2FF', purple: '#7928CA', green: '#34D399', red: '#ef4444',
  text: '#f1f5f9', muted: '#6b7280', dim: '#374151',
}

const CHART_TYPES = [
  { id: 'line' as const, label: 'Line', icon: TrendingUp },
  { id: 'bar' as const, label: 'Bar', icon: BarChart3 },
  { id: 'area' as const, label: 'Area', icon: Activity },
  { id: 'pie' as const, label: 'Pie', icon: PieChart },
  { id: 'doughnut' as const, label: 'Doughnut', icon: PieChart },
]

const COLOR_PRESETS = [
  { colors: ['#00D2FF', '#a855f7'], label: 'Cyan / Purple', all: ['#00D2FF', '#a855f7', '#34D399', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'] },
  { colors: ['#ef4444', '#22c55e'], label: 'Red / Green', all: ['#ef4444', '#22c55e', '#f59e0b', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#f97316'] },
  { colors: ['#22c55e', '#16a34a'], label: 'Green Mono', all: ['#22c55e', '#16a34a', '#4ade80', '#86efac', '#bbf7d0', '#14532d', '#166534', '#15803d'] },
  { colors: ['#f59e0b', '#f97316'], label: 'Amber', all: ['#f59e0b', '#f97316', '#ef4444', '#22c55e', '#3b82f6', '#a855f7', '#14b8a6', '#ec4899'] },
  { colors: ['#a855f7', '#ec4899'], label: 'Purple / Pink', all: ['#a855f7', '#ec4899', '#6366f1', '#d946ef', '#f43f5e', '#e11d48', '#be123c', '#9d174d'] },
]

const TEMPLATES = [
  { name: 'Revenue vs Expenses', headers: ['month', 'revenue', 'expenses', 'profit'], rows: [
    { month: 'Jan', revenue: 40, expenses: 28, profit: 12 },
    { month: 'Feb', revenue: 52, expenses: 34, profit: 18 },
    { month: 'Mar', revenue: 48, expenses: 30, profit: 18 },
    { month: 'Apr', revenue: 70, expenses: 42, profit: 28 },
    { month: 'May', revenue: 85, expenses: 50, profit: 35 },
    { month: 'Jun', revenue: 92, expenses: 55, profit: 37 },
  ], chartType: 'line' as const, xField: 'month', yField: 'revenue' },
  { name: 'Market Share', headers: ['brand', 'share'], rows: [
    { brand: 'Bitcoin', share: 42 }, { brand: 'Ethereum', share: 28 },
    { brand: 'Solana', share: 15 }, { brand: 'Others', share: 10 },
    { brand: 'Neutron', share: 5 },
  ], chartType: 'pie' as const, xField: 'brand', yField: 'share' },
  { name: 'Monthly Users', headers: ['month', 'active', 'new'], rows: [
    { month: 'Jan', active: 1200, new: 340 }, { month: 'Feb', active: 1850, new: 520 },
    { month: 'Mar', active: 2400, new: 680 }, { month: 'Apr', active: 3100, new: 820 },
    { month: 'May', active: 3800, new: 950 }, { month: 'Jun', active: 4200, new: 1100 },
  ], chartType: 'area' as const, xField: 'month', yField: 'active' },
  { name: 'Token Price', headers: ['day', 'price', 'volume'], rows: [
    { day: 'Mon', price: 12.4, volume: 340 }, { day: 'Tue', price: 13.1, volume: 420 },
    { day: 'Wed', price: 12.8, volume: 380 }, { day: 'Thu', price: 14.2, volume: 510 },
    { day: 'Fri', price: 15.0, volume: 590 }, { day: 'Sat', price: 14.5, volume: 480 },
    { day: 'Sun', price: 15.8, volume: 620 },
  ], chartType: 'bar' as const, xField: 'day', yField: 'price' },
  { name: 'Browser Usage', headers: ['browser', 'share'], rows: [
    { browser: 'Chrome', share: 48 }, { browser: 'Safari', share: 24 },
    { browser: 'Firefox', share: 12 }, { browser: 'Edge', share: 10 },
    { browser: 'Other', share: 6 },
  ], chartType: 'doughnut' as const, xField: 'browser', yField: 'share' },
  { name: 'Q4 Growth', headers: ['metric', 'q1', 'q2', 'q3', 'q4'], rows: [
    { metric: 'Revenue', q1: 80, q2: 95, q3: 110, q4: 145 },
    { metric: 'Costs', q1: 50, q2: 55, q3: 60, q4: 70 },
    { metric: 'Profit', q1: 30, q2: 40, q3: 50, q4: 75 },
    { metric: 'Growth', q1: 15, q2: 22, q3: 28, q4: 40 },
  ], chartType: 'bar' as const, xField: 'metric', yField: 'q1' },
]

function parseCSV(text: string) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0)
  if (!lines.length) return { headers: [] as string[], rows: [] as Record<string, any>[] }
  const delim = text.includes('\t') ? '\t' : text.includes(';') ? ';' : ','
  const headers = lines[0].split(delim).map(h => h.replace(/^["']|["']$/g, '').trim())
  const rows: Record<string, any>[] = []
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(delim).map(v => v.replace(/^["']|["']$/g, '').trim())
    if (vals.length < headers.length) continue
    const row: Record<string, any> = {}
    headers.forEach((h, idx) => {
      const v = vals[idx]
      row[h] = (isNaN(Number(v)) || v === '') ? v : Number(v)
    })
    rows.push(row)
  }
  return { headers, rows }
}

export default function CreatorStudio({ onBack }: { onBack: () => void }) {
  const { addGraph } = useGraphStore()

  // Metadata
  const [title, setTitle] = useState('')
  const [metric, setMetric] = useState('')
  const [tagsInput, setTagsInput] = useState('')

  // Chart config
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area' | 'pie' | 'doughnut'>('line')
  const [colorPreset, setColorPreset] = useState(0)

  // Data
  const [headers, setHeaders] = useState<string[]>(['month', 'revenue', 'expenses'])
  const [rows, setRows] = useState<Record<string, any>[]>([
    { month: 'Jan', revenue: 40, expenses: 28 },
    { month: 'Feb', revenue: 52, expenses: 34 },
    { month: 'Mar', revenue: 48, expenses: 30 },
    { month: 'Apr', revenue: 70, expenses: 42 },
    { month: 'May', revenue: 85, expenses: 50 },
  ])
  const [xField, setXField] = useState('month')
  const [yField, setYField] = useState('revenue')

  // Additional series for line/bar/area
  const additionalSeries = useMemo(() => {
    const numericHeaders = headers.filter(
      h => h !== xField && h !== yField && rows.some(r => typeof r[h] === 'number')
    )
    return numericHeaders
  }, [headers, rows, xField, yField])

  const [enabledSeries, setEnabledSeries] = useState<Record<string, boolean>>({})

  // Auto-enable additional series when headers change
  useEffect(() => {
    setEnabledSeries(prev => {
      const next = { ...prev }
      headers.forEach(h => { if (!(h in next)) next[h] = false })
      return next
    })
  }, [headers])

  // UI state
  const [posted, setPosted] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [fileError, setFileError] = useState('')
  const [pastedText, setPastedText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const colors = COLOR_PRESETS[colorPreset].all

  const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean).map(t => t.startsWith('#') ? t : `#${t}`)
  const isValid = title.trim() && rows.length >= 1 && xField && yField && xField !== yField

  // Chart data
  const chartData = useMemo(() => {
    if (chartType === 'pie' || chartType === 'doughnut') {
      return rows.map((r, i) => ({
        name: String(r[xField] ?? `Item ${i + 1}`),
        value: Number(r[yField] ?? 0),
        fill: colors[i % colors.length],
      }))
    }
    return rows
  }, [rows, xField, yField, chartType, colors])

  const activeSeriesKeys = useMemo(() => {
    if (chartType === 'pie' || chartType === 'doughnut') return []
    const keys = [yField]
    additionalSeries.forEach(h => { if (enabledSeries[h]) keys.push(h) })
    return keys
  }, [yField, additionalSeries, enabledSeries, chartType])

  const handleFileUpload = useCallback((file: File) => {
    setFileError('')
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'csv') {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const parsed = parseCSV(e.target?.result as string)
          if (!parsed.headers.length) throw new Error('No headers found')
          applyParsedData(parsed.headers, parsed.rows)
        } catch (err: any) {
          setFileError(err.message || 'Failed to parse CSV')
        }
      }
      reader.readAsText(file)
    } else if (ext === 'xlsx') {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheet = workbook.Sheets[workbook.SheetNames[0]]
          const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' })
          if (!json.length) throw new Error('Empty sheet')
          const hdrs = Object.keys(json[0])
          applyParsedData(hdrs, json)
        } catch (err: any) {
          setFileError(err.message || 'Failed to parse XLSX')
        }
      }
      reader.readAsArrayBuffer(file)
    } else {
      setFileError('Unsupported format. Use .csv or .xlsx')
    }
  }, [])

  function applyParsedData(hdrs: string[], data: Record<string, any>[]) {
    setHeaders(hdrs)
    setRows(data)
    setXField(hdrs[0] || '')
    setYField(hdrs[1] && hdrs[1] !== hdrs[0] ? hdrs[1] : hdrs[0] || '')
    if (hdrs.length >= 2 && data.some(r => typeof r[hdrs[1]] === 'number')) {
      setChartType('line')
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }, [handleFileUpload])

  const handlePasteProcess = () => {
    if (!pastedText.trim()) return
    try {
      const parsed = parseCSV(pastedText)
      if (!parsed.headers.length) throw new Error('No headers detected')
      applyParsedData(parsed.headers, parsed.rows)
      setPastedText('')
    } catch (err: any) {
      setFileError(err.message || 'Parse error')
    }
  }

  const loadTemplate = (t: typeof TEMPLATES[number]) => {
    setHeaders(t.headers)
    setRows(t.rows as Record<string, any>[])
    setChartType(t.chartType)
    setXField(t.xField)
    setYField(t.yField)
    setTitle(t.name)
  }

  const updateCell = (rowIdx: number, field: string, val: string) => {
    setRows(prev => prev.map((r, i) => {
      if (i !== rowIdx) return r
      const parsed = isNaN(Number(val)) || val === '' ? val : Number(val)
      return { ...r, [field]: parsed }
    }))
  }

  const addRow = () => {
    const row: Record<string, any> = {}
    headers.forEach(h => { row[h] = h === xField ? `Item ${rows.length + 1}` : 0 })
    setRows(prev => [...prev, row])
  }

  const deleteRow = (idx: number) => {
    if (rows.length <= 1) return
    setRows(prev => prev.filter((_, i) => i !== idx))
  }

  const addColumn = () => {
    const name = `series_${headers.length}`
    setHeaders(prev => [...prev, name])
    setRows(prev => prev.map(r => ({ ...r, [name]: 0 })))
  }

  const handleSave = () => {
    if (!isValid) return
    const pts = rows.map(r => Number(r[yField] ?? 0))
    const labels = chartType === 'pie' || chartType === 'doughnut'
      ? rows.map(r => String(r[xField] ?? ''))
      : undefined

    addGraph({
      title: title.trim(),
      change: metric.trim() || '+0%',
      positive: !metric.includes('-'),
      tags: tags.length > 0 ? tags : ['#CUSTOM'],
      type: chartType,
      colors: COLOR_PRESETS[colorPreset].colors,
      dataPoints: pts,
      labels,
      creatorName: 'You',
      creatorAvatar: '',
    })
    setPosted(true)
    setTimeout(() => {
      setPosted(false)
      onBack()
    }, 1200)
  }

  const renderChart = () => {
    if (!rows.length || !xField) {
      return (
        <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px dashed ${C.border}`, borderRadius: 12, color: C.muted, fontSize: 13 }}>
          No data — import a file or pick a template
        </div>
      )
    }

    if (chartType === 'pie' || chartType === 'doughnut') {
      const innerR = chartType === 'doughnut' ? 55 : 0
      return (
        <ResponsiveContainer width="100%" height={320}>
          <RePieChart>
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={innerR} outerRadius={110}
              paddingAngle={3} dataKey="value" isAnimationActive={true}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={colors[i % colors.length]} stroke="rgba(255,255,255,0.05)" />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11, color: C.muted }} />
          </RePieChart>
        </ResponsiveContainer>
      )
    }

    const chartProps = {
      data: chartData,
      margin: { top: 10, right: 18, left: 0, bottom: 10 },
    }

    const axisProps = {
      stroke: C.dim,
      tick: { fill: C.muted, fontSize: 11 },
      axisLine: { stroke: C.border },
      tickLine: { stroke: C.border },
    }

    const chartEl = (() => {
      switch (chartType) {
        case 'bar':
          return (
            <BarChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey={xField} {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: C.muted }} />
              {activeSeriesKeys.map((k, i) => (
                <Bar key={k} dataKey={k} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} isAnimationActive={true} />
              ))}
            </BarChart>
          )
        case 'area':
          return (
            <AreaChart {...chartProps}>
              <defs>
                {activeSeriesKeys.map((k, i) => (
                  <linearGradient key={k} id={`grad_${k}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors[i % colors.length]} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={colors[i % colors.length]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey={xField} {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: C.muted }} />
              {activeSeriesKeys.map((k, i) => (
                <Area key={k} type="monotone" dataKey={k} stroke={colors[i % colors.length]}
                  fill={`url(#grad_${k})`} strokeWidth={2} dot={{ r: 3, fill: colors[i % colors.length] }}
                  isAnimationActive={true} />
              ))}
            </AreaChart>
          )
        default:
          return (
            <LineChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey={xField} {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 12 }}
                formatter={(value: any) => [typeof value === 'number' ? value.toLocaleString() : value]} />
              <Legend wrapperStyle={{ fontSize: 11, color: C.muted }} />
              {activeSeriesKeys.map((k, i) => (
                <Line key={k} type="monotone" dataKey={k} stroke={colors[i % colors.length]}
                  strokeWidth={2} dot={{ r: 3, fill: colors[i % colors.length] }}
                  isAnimationActive={true} />
              ))}
            </LineChart>
          )
      }
    })()

    return <ResponsiveContainer width="100%" height={320}>{chartEl}</ResponsiveContainer>
  }

  const isPieLike = chartType === 'pie' || chartType === 'doughnut'

  return (
    <div style={{ display: 'flex', gap: 20, minHeight: 'calc(100vh - 56px)' }}>
      {/* ── Left Sidebar ── */}
      <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14, padding: '20px 0', overflowY: 'auto', maxHeight: 'calc(100vh - 56px)' }}>
        {/* Back + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 2 }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <span style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Creator Studio</span>
            <span style={{ fontSize: 10, color: C.muted, display: 'block' }}>Build & publish charts</span>
          </div>
        </div>

        {/* Chart Type */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Chart Type</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
            {CHART_TYPES.map(ct => {
              const Icon = ct.icon
              const active = chartType === ct.id
              return (
                <button key={ct.id} onClick={() => setChartType(ct.id)}
                  style={{
                    padding: '7px 4px', borderRadius: 8, cursor: 'pointer',
                    background: active ? `${C.cyan}15` : 'transparent',
                    border: `1px solid ${active ? `${C.cyan}40` : C.border}`,
                    color: active ? C.cyan : C.muted, fontSize: 10, fontWeight: 600,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    transition: 'all 0.15s',
                  }}>
                  <Icon size={15} />
                  {ct.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Axis Mapping */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
            {isPieLike ? 'Name / Value Mapping' : 'Axis Mapping'}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              <span style={{ fontSize: 10, color: C.muted }}>{isPieLike ? 'Name' : 'X-Axis'}</span>
              <select value={xField} onChange={e => setXField(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 11, outline: 'none', marginTop: 3 }}>
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <span style={{ fontSize: 10, color: C.muted }}>{isPieLike ? 'Value' : 'Y-Axis'}</span>
              <select value={yField} onChange={e => setYField(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 11, outline: 'none', marginTop: 3 }}>
                {headers.filter(h => h !== xField).map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            {!isPieLike && additionalSeries.length > 0 && (
              <div>
                <span style={{ fontSize: 10, color: C.muted, display: 'block', marginBottom: 4 }}>Additional Series</span>
                {additionalSeries.map(h => (
                  <label key={h} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.text, cursor: 'pointer', padding: '2px 0' }}>
                    <input type="checkbox" checked={!!enabledSeries[h]}
                      onChange={() => setEnabledSeries(prev => ({ ...prev, [h]: !prev[h] }))}
                      style={{ accentColor: C.cyan }} />
                    {h}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Color Scheme */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Color Scheme</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {COLOR_PRESETS.map((cp, i) => (
              <button key={i} onClick={() => setColorPreset(i)}
                style={{
                  flex: 1, height: 28, borderRadius: 8, cursor: 'pointer', padding: 0,
                  background: `linear-gradient(135deg, ${cp.colors[0]}, ${cp.colors[1]})`,
                  border: colorPreset === i ? `2px solid ${C.cyan}` : `2px solid ${C.border}`,
                  transition: 'border-color 0.15s',
                }} />
            ))}
          </div>
        </div>

        {/* Templates */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
            <Sparkles size={12} style={{ verticalAlign: 'middle', marginRight: 4, color: C.cyan }} />
            Quick Templates
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {TEMPLATES.map((t, i) => (
              <button key={i} onClick={() => loadTemplate(t)}
                style={{
                  padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
                  background: 'transparent', border: `1px solid ${C.border}`,
                  color: C.text, fontSize: 11, fontWeight: 500,
                  textAlign: 'left', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = C.cardHover; e.currentTarget.style.borderColor = `${C.cyan}30` }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = C.border }}>
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Data Import */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
            <Upload size={12} style={{ verticalAlign: 'middle', marginRight: 4, color: C.cyan }} />
            Import Data
          </span>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? C.cyan : C.border}`,
              borderRadius: 10, padding: '16px 12px', textAlign: 'center',
              cursor: 'pointer', transition: 'all 0.15s',
              background: dragOver ? `${C.cyan}08` : 'transparent',
            }}>
            <FileSpreadsheet size={24} color={dragOver ? C.cyan : C.muted} style={{ marginBottom: 4 }} />
            <div style={{ fontSize: 11, color: dragOver ? C.cyan : C.muted, fontWeight: 600 }}>Drop .csv or .xlsx</div>
            <div style={{ fontSize: 9, color: C.dim, marginTop: 2 }}>or click to browse</div>
          </div>
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx" onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} style={{ display: 'none' }} />

          {/* Paste area */}
          <div style={{ marginTop: 8 }}>
            <textarea value={pastedText} onChange={e => setPastedText(e.target.value)}
              placeholder="Or paste CSV data..."
              rows={2}
              style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 10, fontFamily: 'monospace', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
            <button onClick={handlePasteProcess}
              style={{ marginTop: 4, width: '100%', padding: '5px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.cyan, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
              Load Paste
            </button>
          </div>

          {fileError && <div style={{ marginTop: 6, fontSize: 10, color: C.red }}>{fileError}</div>}
        </div>

        {/* Metadata */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Details</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Graph title"
              style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 11, outline: 'none', boxSizing: 'border-box' }} />
            <input value={metric} onChange={e => setMetric(e.target.value)} placeholder="Metric change (e.g. +12.5%)"
              style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 11, outline: 'none', boxSizing: 'border-box' }} />
            <input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="Tags (comma-sep)"
              style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 11, outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* Save */}
        <motion.button
          whileHover={isValid ? { scale: 1.01 } : {}}
          whileTap={isValid ? { scale: 0.98 } : {}}
          onClick={handleSave}
          disabled={!isValid || posted}
          style={{
            padding: '12px 20px', borderRadius: 10, border: 'none', cursor: isValid ? 'pointer' : 'default',
            background: posted ? '#22c55e' : isValid ? `linear-gradient(135deg, ${C.cyan}, ${C.purple})` : `${C.cyan}20`,
            color: isValid ? '#000' : `${C.cyan}60`,
            fontSize: 13, fontWeight: 800, letterSpacing: '0.03em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'background 0.3s',
          }}>
          <Rocket size={16} />
          {posted ? '✓ Published!' : 'Publish Graph'}
        </motion.button>
      </div>

      {/* ── Main Area ── */}
      <div style={{ flex: 1, padding: '20px 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Live Preview */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text }}>
              {title || 'Chart Preview'}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, color: C.muted }}>
                {rows.length} rows &middot; {headers.length} cols &middot; {chartType}
              </span>
            </div>
          </div>
          {renderChart()}
        </div>

        {/* Data Table */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              <Grid size={13} style={{ verticalAlign: 'middle', marginRight: 5, color: C.cyan }} />
              Data Table
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={addRow}
                style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.cyan, fontSize: 10, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Plus size={12} /> Row
              </button>
              <button onClick={addColumn}
                style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.cyan, fontSize: 10, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Plus size={12} /> Col
              </button>
            </div>
          </div>
          <div style={{ overflowX: 'auto', maxHeight: 220, border: `1px solid ${C.border}`, borderRadius: 8 }}>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', minWidth: 400 }}>
              <thead>
                <tr style={{ background: C.surface }}>
                  <th style={{ padding: '6px 8px', color: C.muted, fontWeight: 700, fontSize: 10, textAlign: 'center', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: C.surface, width: 28 }}>#</th>
                  {headers.map(h => (
                    <th key={h} style={{ padding: '6px 8px', color: h === xField ? C.cyan : h === yField ? C.green : C.muted, fontWeight: 700, fontSize: 10, textAlign: 'left', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: C.surface, whiteSpace: 'nowrap' }}>
                      {h}
                      {h === xField && <span style={{ color: C.cyan, fontSize: 8, marginLeft: 3 }}>⬅X</span>}
                      {h === yField && <span style={{ color: C.green, fontSize: 8, marginLeft: 3 }}>⬅Y</span>}
                    </th>
                  ))}
                  <th style={{ padding: '6px 4px', borderBottom: `1px solid ${C.border}`, width: 28 }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '3px 6px', color: C.dim, fontSize: 10, textAlign: 'center' }}>{i + 1}</td>
                    {headers.map(h => (
                      <td key={h} style={{ padding: '2px 4px' }}>
                        <input value={row[h] !== undefined ? String(row[h]) : ''}
                          onChange={e => updateCell(i, h, e.target.value)}
                          style={{ width: '100%', padding: '4px 6px', border: 'none', background: 'transparent', color: C.text, fontSize: 11, outline: 'none', borderRadius: 4 }}
                          onFocus={e => { e.currentTarget.style.background = `${C.cyan}08` }}
                          onBlur={e => { e.currentTarget.style.background = 'transparent' }} />
                      </td>
                    ))}
                    <td style={{ padding: '2px 4px', textAlign: 'center' }}>
                      <button onClick={() => deleteRow(i)} disabled={rows.length <= 1}
                        style={{ background: 'none', border: 'none', color: C.muted, cursor: rows.length > 1 ? 'pointer' : 'default', padding: 2, opacity: rows.length > 1 ? 1 : 0.3 }}>
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info footer */}
        <p style={{ fontSize: 10, color: C.muted, margin: 0, lineHeight: 1.5 }}>
          Changes update the preview in real-time. Import CSV/XLSX or pick a template to get started quickly.
          Use the axis dropdowns to map columns to X/Y. Toggle checkboxes to add more series.
        </p>
      </div>
    </div>
  )
}
