import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, Settings, BarChart3,
  TrendingUp, DollarSign, ShoppingCart, Users,
  Target, Zap, Edit3, Save, Download, X,
  FileText, Image, Table,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import html2canvas from 'html2canvas'
import { supabase } from '../../lib/supabase'
import type { BusinessTracker, BusinessEntry, TrackerMetric } from '../../types/database'
import MetricLineChart from './LineChart'
import WeeklyChart from './WeeklyChart'
import MonthlyOverview from './MonthlyOverview'
import TrackerSetup from './TrackerSetup'

const C = {
  bg: '#05050A',
  card: '#090914',
  cardBdr: 'rgba(255,255,255,0.06)',
  cyan: '#00D2FF',
  purple: '#7928CA',
  green: '#34D399',
  text: '#f1f5f9',
  muted: '#6b7280',
}

const ICON_MAP: Record<string, any> = {
  TrendingUp, DollarSign, ShoppingCart, Users, Target, Zap, BarChart3,
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
}

function getDaysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function getWeekStart(d: Date): Date {
  const r = new Date(d)
  r.setDate(r.getDate() - r.getDay())
  return r
}

export default function BusinessTrackerView() {
  const [tracker, setTracker] = useState<BusinessTracker | null>(null)
  const [entries, setEntries] = useState<BusinessEntry[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showSetup, setShowSetup] = useState(false)
  const [showDataOverlay, setShowDataOverlay] = useState(false)
  const [notesValue, setNotesValue] = useState('')
  const [notesTimeout, setNotesTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [inputModal, setInputModal] = useState<{ day: number; metricId: string } | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [showExportModal, setShowExportModal] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)

  const today = new Date()
  const daysInMonth = getDaysInMonth(selectedDate)
  const selectedDateStr = toDateStr(selectedDate)
  const safeEntries: BusinessEntry[] = Array.isArray(entries) ? entries.filter(e => e && typeof e === 'object' && e.date) : []
  const findEntry = (dateStr: string) => safeEntries.find(e => e.date === dateStr)

  // Load tracker + entries
  const loadData = useCallback(async () => {
    const { data: trackerData } = await supabase
      .from('business_trackers')
      .select('*')
      .limit(1)

    if (trackerData && trackerData.length > 0) {
      setTracker(trackerData[0])

      const { data: entryData } = await supabase
        .from('business_entries')
        .select('*')
        .eq('tracker_id', trackerData[0].id)

      if (entryData) {
        const safeEntryData = Array.isArray(entryData) ? entryData : []
        setEntries(safeEntryData)
        const todayEntry = safeEntryData.find(e => e && typeof e === 'object' && e.date === toDateStr(today))
        if (todayEntry) setNotesValue(todayEntry.notes || '')
      }
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Current day's entry
  const currentEntry = useMemo(() => {
    return findEntry(selectedDateStr)
  }, [safeEntries, selectedDateStr])

  const currentValues = currentEntry?.values || {}

  // Week entries for weekly chart
  const weekEntries = useMemo(() => {
    const weekStart = getWeekStart(selectedDate)
    const safeEntries = Array.isArray(entries) ? entries : []
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      const dateStr = toDateStr(d)
      const entry = safeEntries.find(e => e && typeof e === 'object' && e.date === dateStr)
      return { date: dateStr, values: (entry?.values && typeof entry.values === 'object') ? entry.values : {} }
    })
  }, [entries, selectedDate])

  // Month entries map
  const monthEntriesMap = useMemo(() => {
    const map: Record<string, Record<string, number>> = {}
    const safeEntries = Array.isArray(entries) ? entries : []
    for (const e of safeEntries) {
      if (e && typeof e === 'object' && e.date && e.values && typeof e.values === 'object') {
        if (e.date.startsWith(selectedDateStr.slice(0, 7))) {
          map[e.date] = e.values
        }
      }
    }
    return map
  }, [entries, selectedDateStr])

  // Navigate days
  const prevDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() - 1)
    setSelectedDate(d)
    const entry = findEntry(toDateStr(d))
    setNotesValue(entry?.notes || '')
  }

  const nextDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + 1)
    setSelectedDate(d)
    const entry = findEntry(toDateStr(d))
    setNotesValue(entry?.notes || '')
  }

  const goToToday = () => {
    setSelectedDate(new Date())
    const todayEntry = findEntry(toDateStr(today))
    setNotesValue(todayEntry?.notes || '')
  }

  // Save metric value
  const handleMetricClick = (metricId: string) => {
    const entry = findEntry(selectedDateStr)
    const currentVal = entry?.values?.[metricId] || 0
    setInputModal({ day: selectedDate.getDate(), metricId })
    setInputValue(String(currentVal))
  }

  const saveCellValue = async () => {
    if (!inputModal || !tracker) return
    const val = Number(inputValue) || 0
    const existing = findEntry(selectedDateStr)

    const newValues = { ...(existing?.values || {}), [inputModal.metricId]: val }

    if (existing) {
      await supabase.from('business_entries').update({ values: newValues }).eq('id', existing.id)
      setEntries(prev => (Array.isArray(prev) ? prev : []).map(e => e.id === existing.id ? { ...e, values: newValues } : e))
    } else {
      const { data } = await supabase.from('business_entries').insert({
        tracker_id: tracker.id,
        user_id: 'user-1',
        date: selectedDateStr,
        values: newValues,
        notes: '',
      })
      if (data) setEntries(prev => [...(Array.isArray(prev) ? prev : []), ...(Array.isArray(data) ? data : [data]) as BusinessEntry[]])
    }
    setInputModal(null)
  }

  // Save notes
  const saveNotes = useCallback(async (notes: string) => {
    if (!tracker) return
    const existing = findEntry(selectedDateStr)
    if (existing) {
      await supabase.from('business_entries').update({ notes }).eq('id', existing.id)
      setEntries(prev => (Array.isArray(prev) ? prev : []).map(e => e.id === existing.id ? { ...e, notes } : e))
    } else {
      const { data } = await supabase.from('business_entries').insert({
        tracker_id: tracker.id,
        user_id: 'user-1',
        date: selectedDateStr,
        values: {},
        notes,
      })
      if (data) setEntries(prev => [...(Array.isArray(prev) ? prev : []), ...(Array.isArray(data) ? data : [data]) as BusinessEntry[]])
    }
  }, [tracker, entries, selectedDateStr])

  const handleNotesChange = (val: string) => {
    setNotesValue(val)
    if (notesTimeout) clearTimeout(notesTimeout)
    const t = setTimeout(() => saveNotes(val), 500)
    setNotesTimeout(t)
  }

  // Save tracker setup
  const handleSetupSave = async (name: string, metrics: TrackerMetric[]) => {
    if (tracker) {
      await supabase.from('business_trackers').update({ name, metrics }).eq('id', tracker.id)
      setTracker(prev => prev ? { ...prev, name, metrics } : prev)
    } else {
      const { data } = await supabase.from('business_trackers').insert({
        user_id: 'user-1',
        name,
        metrics,
      })
      if (data) setTracker(data as BusinessTracker)
    }
    setShowSetup(false)
  }

  // Export as Excel (.xlsx)
  const exportExcel = () => {
    if (!tracker || entries.length === 0) return
    const headers = ['Date', ...tracker.metrics.map(m => m.name), 'Notes']
    const rows = entries
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(e => [
        e.date,
        ...tracker.metrics.map(m => e.values[m.id] ?? ''),
        e.notes || '',
      ])
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Tracker Data')
    XLSX.writeFile(wb, `tracker-export-${toDateStr(today)}.xlsx`)
    setShowExportModal(false)
  }

  // Export as Notepad (.txt)
  const exportTXT = () => {
    if (!tracker || entries.length === 0) return
    const divider = '='.repeat(80)
    const lines: string[] = [
      divider,
      `  ${tracker.name || 'Business Tracker'}`,
      `  Exported on ${formatDate(today)}`,
      divider,
      '',
    ]
    const sorted = entries.sort((a, b) => a.date.localeCompare(b.date))
    for (const e of sorted) {
      lines.push(`Date: ${e.date}`)
      for (const m of tracker.metrics) {
        const val = e.values[m.id]
        const display = val !== undefined
          ? (m.unit === '$' ? `$${val.toLocaleString()}` : `${val} ${m.unit}`)
          : '—'
        const target = m.unit === '$' ? `$${m.target.toLocaleString()}` : `${m.target} ${m.unit}`
        const pct = val !== undefined ? Math.round((val / m.target) * 100) : 0
        const status = val !== undefined ? (val >= m.target ? '✓ MET' : `✗ ${pct}%`) : '—'
        lines.push(`  ${m.name}: ${display}  (Target: ${target})  [${status}]`)
      }
      if (e.notes) lines.push(`  Notes: ${e.notes}`)
      lines.push('')
    }
    lines.push(divider)
    const blob = new Blob([lines.join('\r\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tracker-export-${toDateStr(today)}.txt`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportModal(false)
  }

  // Export chart as image (.png)
  const exportImage = async () => {
    if (!chartRef.current) return
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#05050A',
        scale: 2,
      })
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `tracker-chart-${toDateStr(today)}.png`
          a.click()
          URL.revokeObjectURL(url)
        }
      }, 'image/png')
    } catch (err) {
      console.error('Failed to export image:', err)
    }
    setShowExportModal(false)
  }

  const metrics = Array.isArray(tracker?.metrics) ? tracker.metrics : []
  const trackerName = tracker?.name || 'Business Tracker'

  if (!tracker) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16,
        padding: 40,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: `${C.cyan}10`, border: `1px solid ${C.cyan}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <BarChart3 size={28} color={C.cyan} />
        </div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text }}>
          No Tracker Found
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: C.muted, textAlign: 'center', maxWidth: 300 }}>
          Create your first business tracker to start monitoring your daily metrics and targets.
        </p>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowSetup(true)}
          style={{
            padding: '10px 24px', borderRadius: 10, border: 'none',
            background: `linear-gradient(135deg, ${C.cyan}, ${C.purple})`,
            color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Create Tracker
        </motion.button>
        {showSetup && (
          <TrackerSetup
            trackerName="My Business Tracker"
            metrics={[
              { id: 'm1', name: 'Sales', color: '#00D2FF', target: 50, unit: 'items', icon: 'TrendingUp' },
              { id: 'm2', name: 'Revenue', color: '#7928CA', target: 5000, unit: '$', icon: 'DollarSign' },
              { id: 'm3', name: 'Orders', color: '#34D399', target: 30, unit: 'count', icon: 'ShoppingCart' },
              { id: 'm4', name: 'Customers', color: '#F59E0B', target: 100, unit: 'count', icon: 'Users' },
            ]}
            onSave={handleSetupSave}
            onClose={() => setShowSetup(false)}
          />
        )}
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 16px', flexShrink: 0,
        borderBottom: `1px solid ${C.cardBdr}`,
        background: `${C.bg}ee`, backdropFilter: 'blur(12px)',
        zIndex: 10, flexWrap: 'wrap',
      }}>
        <BarChart3 size={16} color={C.cyan} />
        <h1 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text, flex: '0 0 auto' }}>
          {trackerName}
        </h1>

        <div style={{ flex: 1 }} />

        {/* Date nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={prevDay} style={{
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardBdr}`,
            borderRadius: 6, width: 28, height: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: C.muted,
          }}>
            <ChevronLeft size={14} />
          </motion.button>

          <button onClick={goToToday} style={{
            background: selectedDateStr === toDateStr(today) ? `${C.cyan}15` : 'rgba(255,255,255,0.04)',
            border: `1px solid ${selectedDateStr === toDateStr(today) ? `${C.cyan}40` : C.cardBdr}`,
            borderRadius: 6, padding: '4px 10px',
            color: selectedDateStr === toDateStr(today) ? C.cyan : C.muted,
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}>
            {formatDate(selectedDate)}
          </button>

          <motion.button whileTap={{ scale: 0.9 }} onClick={nextDay} style={{
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardBdr}`,
            borderRadius: 6, width: 28, height: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: C.muted,
          }}>
            <ChevronRight size={14} />
          </motion.button>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 4 }}>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowDataOverlay(true)} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '5px 10px', borderRadius: 6, border: `1px solid ${C.cardBdr}`,
            background: 'rgba(255,255,255,0.04)', color: C.muted,
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}>
            <BarChart3 size={12} /> Data
          </motion.button>

          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowExportModal(true)} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '5px 10px', borderRadius: 6, border: `1px solid ${C.cardBdr}`,
            background: 'rgba(255,255,255,0.04)', color: C.muted,
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}>
            <Download size={12} /> Export
          </motion.button>

          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowSetup(true)} style={{
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardBdr}`,
            borderRadius: 6, width: 28, height: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: C.muted,
          }}>
            <Settings size={13} />
          </motion.button>
        </div>
      </div>

      {/* Content — simplified main view */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Metric cards with inline inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(metrics.length, 4)}, 1fr)`, gap: 8 }}>
          {metrics.map(m => {
            const val = currentValues[m.id]
            const met = val !== undefined && val >= m.target
            return (
              <motion.div
                key={m.id}
                whileHover={{ scale: 1.02 }}
                style={{
                  background: `${C.card}cc`, borderRadius: 12,
                  border: `1px solid ${C.cardBdr}`, padding: 14,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 9, color: C.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {m.name}
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: m.color, lineHeight: 1 }}>
                  {val !== undefined ? (m.unit === '$' ? `$${val.toLocaleString()}` : val) : '—'}
                </div>
                <div style={{ fontSize: 9, color: C.muted, marginTop: 4 }}>
                  Target: {m.unit === '$' ? `$${m.target.toLocaleString()}` : `${m.target} ${m.unit}`}
                </div>
                {val !== undefined && (
                  <div style={{
                    marginTop: 8, height: 4, borderRadius: 2,
                    background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', borderRadius: 2,
                      width: `${Math.min(100, (val / m.target) * 100)}%`,
                      background: met ? m.color : '#ef4444',
                      transition: 'width 0.3s',
                    }} />
                  </div>
                )}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleMetricClick(m.id)}
                  style={{
                    marginTop: 10, width: '100%', padding: '6px 0', borderRadius: 6,
                    border: `1px solid ${C.cardBdr}`, background: 'rgba(255,255,255,0.03)',
                    color: C.text, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  {val !== undefined ? `Edit` : `Set ${m.name}`}
                </motion.button>
              </motion.div>
            )
          })}
        </div>

        {/* Notes */}
        <div style={{
          background: `${C.card}cc`, borderRadius: 12,
          border: `1px solid ${C.cardBdr}`, padding: 16,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: C.muted,
            textTransform: 'uppercase', letterSpacing: '0.5px',
            marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Edit3 size={11} /> Daily Notes
          </div>
          <textarea
            value={notesValue}
            onChange={e => handleNotesChange(e.target.value)}
            placeholder="Write your notes for today..."
            rows={4}
            style={{
              width: '100%', padding: 10, borderRadius: 8,
              border: `1px solid ${C.cardBdr}`, background: 'rgba(255,255,255,0.03)',
              color: C.text, fontSize: 12, outline: 'none',
              resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5,
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Input Modal */}
      {inputModal && tracker && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setInputModal(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: C.card, borderRadius: 12,
              border: `1px solid ${C.cardBdr}`,
              padding: 20, width: 280,
            }}
          >
            {(() => {
              const metric = metrics.find(m => m.id === inputModal.metricId)
              if (!metric) return null
              return (
                <>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>
                    {formatDate(selectedDate)} — {metric.name}
                  </div>
                  <div style={{ fontSize: 9, color: C.muted, marginBottom: 12 }}>
                    Target: {metric.unit === '$' ? `$${metric.target.toLocaleString()}` : `${metric.target} ${metric.unit}`}
                  </div>
                  <input
                    autoFocus
                    type="number"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveCellValue() }}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 8,
                      border: `1px solid ${metric.color}40`, background: 'rgba(255,255,255,0.04)',
                      color: C.text, fontSize: 18, fontWeight: 700, outline: 'none',
                      boxSizing: 'border-box', textAlign: 'center',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button onClick={() => setInputModal(null)} style={{
                      flex: 1, padding: '8px', borderRadius: 8,
                      border: `1px solid ${C.cardBdr}`, background: 'transparent',
                      color: C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}>
                      Cancel
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={saveCellValue}
                      style={{
                        flex: 1, padding: '8px', borderRadius: 8, border: 'none',
                        background: `linear-gradient(135deg, ${metric.color}, ${C.purple})`,
                        color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                      }}
                    >
                      <Save size={12} /> Save
                    </motion.button>
                  </div>
                </>
              )
            })()}
          </motion.div>
        </motion.div>
      )}

      {/* Setup Modal */}
      {showSetup && (
        <TrackerSetup
          trackerName={trackerName}
          metrics={metrics}
          onSave={handleSetupSave}
          onClose={() => setShowSetup(false)}
        />
      )}

      {/* Data Overlay */}
      <AnimatePresence>
        {showDataOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 900,
              background: `${C.bg}f8`, backdropFilter: 'blur(8px)',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Overlay header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px', borderBottom: `1px solid ${C.cardBdr}`,
              background: `${C.bg}ee`, flexShrink: 0,
            }}>
              <BarChart3 size={16} color={C.cyan} />
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text, flex: 1 }}>
                Data Overview
              </h2>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setShowDataOverlay(false)} style={{
                background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.cardBdr}`,
                borderRadius: 8, width: 32, height: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: C.muted,
              }}>
                <X size={16} />
              </motion.button>
            </div>

            {/* Overlay content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Line Chart */}
              <div ref={chartRef} style={{
                background: `${C.card}cc`, borderRadius: 12,
                border: `1px solid ${C.cardBdr}`, padding: 20,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>
                  Metric Trends
                </div>
                <MetricLineChart
                  metrics={metrics}
                  monthEntries={monthEntriesMap}
                  currentMonth={selectedDate}
                />
              </div>

              {/* Weekly Chart */}
              <WeeklyChart metrics={metrics} weekEntries={weekEntries} />

              {/* Monthly Overview */}
              <MonthlyOverview
                metrics={metrics}
                monthEntries={monthEntriesMap}
                currentMonth={selectedDate}
                selectedDay={selectedDate.getDate()}
                onDayClick={(day) => {
                  const d = new Date(selectedDate)
                  d.setDate(day)
                  setSelectedDate(d)
                  const entry = findEntry(toDateStr(d))
                  setNotesValue(entry?.notes || '')
                  setShowDataOverlay(false)
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowExportModal(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)', zIndex: 1000,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: C.card, borderRadius: 14,
                border: `1px solid ${C.cardBdr}`,
                padding: 24, width: 300,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 6 }}>
                Export Data
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 18 }}>
                Choose an export format:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={exportExcel}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 16px', borderRadius: 10,
                    border: `1px solid ${C.cardBdr}`,
                    background: 'rgba(52,211,153,0.08)',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <Table size={18} color="#34D399" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Excel Spreadsheet</div>
                    <div style={{ fontSize: 10, color: C.muted }}>.xlsx file with formatted data</div>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={exportTXT}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 16px', borderRadius: 10,
                    border: `1px solid ${C.cardBdr}`,
                    background: 'rgba(0,210,255,0.08)',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <FileText size={18} color={C.cyan} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Notepad File</div>
                    <div style={{ fontSize: 10, color: C.muted }}>.txt plain text table</div>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={exportImage}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 16px', borderRadius: 10,
                    border: `1px solid ${C.cardBdr}`,
                    background: 'rgba(121,40,202,0.08)',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <Image size={18} color="#7928CA" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Chart Image</div>
                    <div style={{ fontSize: 10, color: C.muted }}>.png screenshot of the graph</div>
                  </div>
                </motion.button>
              </div>

              <button onClick={() => setShowExportModal(false)} style={{
                width: '100%', marginTop: 14, padding: '8px 0', borderRadius: 8,
                border: `1px solid ${C.cardBdr}`, background: 'transparent',
                color: C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
