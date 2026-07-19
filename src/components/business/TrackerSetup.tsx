import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2, TrendingUp, DollarSign, ShoppingCart, Users, Target, Zap, BarChart3 } from 'lucide-react'
import type { TrackerMetric } from '../../types/database'

interface TrackerSetupProps {
  trackerName: string
  metrics: TrackerMetric[]
  onSave: (name: string, metrics: TrackerMetric[]) => void
  onClose: () => void
}

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

const PRESET_COLORS = ['#00D2FF', '#7928CA', '#34D399', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#06B6D4']
const PRESET_ICONS = [
  { id: 'TrendingUp', icon: TrendingUp, label: 'Sales' },
  { id: 'DollarSign', icon: DollarSign, label: 'Revenue' },
  { id: 'ShoppingCart', icon: ShoppingCart, label: 'Orders' },
  { id: 'Users', icon: Users, label: 'Customers' },
  { id: 'Target', icon: Target, label: 'Target' },
  { id: 'Zap', icon: Zap, label: 'Energy' },
  { id: 'BarChart3', icon: BarChart3, label: 'Metrics' },
]

export default function TrackerSetup({ trackerName, metrics, onSave, onClose }: TrackerSetupProps) {
  const [name, setName] = useState(trackerName)
  const [localMetrics, setLocalMetrics] = useState<TrackerMetric[]>([...(Array.isArray(metrics) ? metrics : [])])
  const [editingMetric, setEditingMetric] = useState<string | null>(null)

  const addMetric = () => {
    const id = `m${Date.now()}`
    const newMetric: TrackerMetric = {
      id,
      name: 'New Metric',
      color: PRESET_COLORS[localMetrics.length % PRESET_COLORS.length],
      target: 100,
      unit: 'count',
      icon: 'TrendingUp',
    }
    setLocalMetrics(prev => [...prev, newMetric])
    setEditingMetric(id)
  }

  const updateMetric = (id: string, updates: Partial<TrackerMetric>) => {
    setLocalMetrics(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m))
  }

  const removeMetric = (id: string) => {
    setLocalMetrics(prev => prev.filter(m => m.id !== id))
    if (editingMetric === id) setEditingMetric(null)
  }

  const handleSave = () => {
    if (name.trim() && localMetrics.length > 0) {
      onSave(name.trim(), localMetrics)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: C.card, borderRadius: 16,
            border: `1px solid ${C.cardBdr}`,
            width: '90%', maxWidth: 480, maxHeight: '80vh',
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px', borderBottom: `1px solid ${C.cardBdr}`,
          }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>
              Setup Tracker
            </h3>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', color: C.muted, cursor: 'pointer',
            }}>
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
            {/* Tracker name */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 6 }}>
                TRACKER NAME
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="My Business Tracker"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8,
                  border: `1px solid ${C.cardBdr}`, background: 'rgba(255,255,255,0.04)',
                  color: C.text, fontSize: 14, fontWeight: 600, outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Metrics */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 8 }}>
                METRICS ({localMetrics.length})
              </label>

              {localMetrics.map((metric, i) => {
                const isEditing = editingMetric === metric.id
                return (
                  <motion.div
                    key={metric.id}
                    layout
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 10, border: `1px solid ${isEditing ? `${metric.color}40` : C.cardBdr}`,
                      marginBottom: 8, overflow: 'hidden',
                    }}
                  >
                    {/* Metric header */}
                    <div
                      onClick={() => setEditingMetric(isEditing ? null : metric.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', cursor: 'pointer',
                      }}
                    >
                      <div style={{
                        width: 10, height: 10, borderRadius: 3,
                        background: metric.color, flexShrink: 0,
                      }} />
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.text }}>
                        {metric.name}
                      </span>
                      <span style={{ fontSize: 10, color: C.muted }}>
                        {metric.unit === '$' ? `$${metric.target}` : `${metric.target} ${metric.unit}`}
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); removeMetric(metric.id) }}
                        style={{
                          background: 'none', border: 'none', color: '#ef4444',
                          cursor: 'pointer', padding: 2,
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Edit form */}
                    <AnimatePresence>
                      {isEditing && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          style={{ padding: '0 12px 12px', overflow: 'hidden' }}
                        >
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <div>
                              <label style={{ fontSize: 9, color: C.muted, marginBottom: 4, display: 'block' }}>NAME</label>
                              <input
                                value={metric.name}
                                onChange={e => updateMetric(metric.id, { name: e.target.value })}
                                style={{
                                  width: '100%', padding: '6px 8px', borderRadius: 6,
                                  border: `1px solid ${C.cardBdr}`, background: 'rgba(0,0,0,0.3)',
                                  color: C.text, fontSize: 12, outline: 'none', boxSizing: 'border-box',
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: 9, color: C.muted, marginBottom: 4, display: 'block' }}>TARGET</label>
                              <input
                                type="number"
                                value={metric.target}
                                onChange={e => updateMetric(metric.id, { target: Number(e.target.value) })}
                                style={{
                                  width: '100%', padding: '6px 8px', borderRadius: 6,
                                  border: `1px solid ${C.cardBdr}`, background: 'rgba(0,0,0,0.3)',
                                  color: C.text, fontSize: 12, outline: 'none', boxSizing: 'border-box',
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: 9, color: C.muted, marginBottom: 4, display: 'block' }}>UNIT</label>
                              <select
                                value={metric.unit}
                                onChange={e => updateMetric(metric.id, { unit: e.target.value })}
                                style={{
                                  width: '100%', padding: '6px 8px', borderRadius: 6,
                                  border: `1px solid ${C.cardBdr}`, background: 'rgba(0,0,0,0.3)',
                                  color: C.text, fontSize: 12, outline: 'none', boxSizing: 'border-box',
                                }}
                              >
                                <option value="count">Count</option>
                                <option value="$">Dollars ($)</option>
                                <option value="%">Percentage (%)</option>
                                <option value="hrs">Hours</option>
                                <option value="kg">Kilograms</option>
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize: 9, color: C.muted, marginBottom: 4, display: 'block' }}>COLOR</label>
                              <div style={{ display: 'flex', gap: 4 }}>
                                {PRESET_COLORS.map(c => (
                                  <button
                                    key={c}
                                    onClick={() => updateMetric(metric.id, { color: c })}
                                    style={{
                                      width: 20, height: 20, borderRadius: 4,
                                      background: c, border: metric.color === c ? '2px solid white' : '2px solid transparent',
                                      cursor: 'pointer',
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={addMetric}
                style={{
                  width: '100%', padding: '10px', borderRadius: 10,
                  border: `1px dashed ${C.cyan}40`,
                  background: `${C.cyan}08`, color: C.cyan,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <Plus size={14} /> Add Metric
              </motion.button>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '14px 20px', borderTop: `1px solid ${C.cardBdr}`,
            display: 'flex', gap: 8, justifyContent: 'flex-end',
          }}>
            <button onClick={onClose} style={{
              padding: '8px 16px', borderRadius: 8, border: `1px solid ${C.cardBdr}`,
              background: 'transparent', color: C.muted, fontSize: 12, fontWeight: 600,
              cursor: 'pointer',
            }}>
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={!name.trim() || localMetrics.length === 0}
              style={{
                padding: '8px 20px', borderRadius: 8, border: 'none',
                background: !name.trim() || localMetrics.length === 0
                  ? 'rgba(0,210,255,0.3)'
                  : `linear-gradient(135deg, ${C.cyan}, ${C.purple})`,
                color: '#fff', fontSize: 12, fontWeight: 700,
                cursor: !name.trim() || localMetrics.length === 0 ? 'default' : 'pointer',
              }}
            >
              Save Tracker
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
