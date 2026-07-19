import React from 'react'
import { motion } from 'framer-motion'
import { X, Minus, Plus } from 'lucide-react'
import { useBookReaderStore, type ReadingMode } from '../../stores/bookReaderStore'

const C = {
  bg: '#0f172a',
  card: '#1e293b',
  accent: '#00D2FF',
  border: 'rgba(255,255,255,0.1)',
  text: '#f1f5f9',
  muted: '#6b7280',
}

interface ReaderSettingsProps {
  onClose: () => void
}

export default function ReaderSettings({ onClose }: ReaderSettingsProps) {
  const {
    fontSize,
    lineHeight,
    fontFamily,
    setFontSize,
    setLineHeight,
    setFontFamily,
  } = useBookReaderStore()

  const handleFontSizeChange = (delta: number) => {
    const newSize = fontSize + delta
    if (newSize >= 12 && newSize <= 24) {
      setFontSize(newSize)
    }
  }

  const handleLineHeightChange = (delta: number) => {
    const newHeight = lineHeight + delta
    if (newHeight >= 1.2 && newHeight <= 2.0) {
      setLineHeight(Math.round(newHeight * 10) / 10)
    }
  }

  const fontFamilyOptions: { id: 'sans' | 'serif' | 'mono'; label: string; style: string }[] = [
    { id: 'sans', label: 'Sans', style: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
    { id: 'serif', label: 'Serif', style: 'Georgia, serif' },
    { id: 'mono', label: 'Mono', style: 'Courier New, monospace' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      style={{
        position: 'absolute', bottom: 70, right: 16,
        zIndex: 100, width: 280,
      }}
    >
      <div style={{
        background: C.bg, border: `1px solid ${C.border}`,
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderBottom: `1px solid ${C.border}`,
        }}>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff' }}>
            Reader Settings
          </h4>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 6,
              border: 'none', background: 'rgba(255,255,255,0.1)',
              color: C.muted, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: '16px' }}>
          {/* Font Size */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Font Size</span>
              <span style={{ fontSize: 12, color: C.accent, fontWeight: 700 }}>{fontSize}px</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => handleFontSizeChange(-2)}
                disabled={fontSize <= 12}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: fontSize <= 12 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)',
                  color: fontSize <= 12 ? 'rgba(255,255,255,0.3)' : C.text,
                  cursor: fontSize <= 12 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Minus size={14} />
              </button>
              <div style={{ flex: 1, height: 4, background: '#1e293b', borderRadius: 2, position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: `${((fontSize - 12) / 12) * 100}%`,
                  top: '50%', transform: 'translate(-50%, -50%)',
                  width: 12, height: 12, borderRadius: '50%',
                  background: C.accent, border: `2px solid ${C.bg}`,
                }} />
              </div>
              <button
                onClick={() => handleFontSizeChange(2)}
                disabled={fontSize >= 24}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: fontSize >= 24 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)',
                  color: fontSize >= 24 ? 'rgba(255,255,255,0.3)' : C.text,
                  cursor: fontSize >= 24 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Line Height */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Line Height</span>
              <span style={{ fontSize: 12, color: C.accent, fontWeight: 700 }}>{lineHeight}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => handleLineHeightChange(-0.1)}
                disabled={lineHeight <= 1.2}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: lineHeight <= 1.2 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)',
                  color: lineHeight <= 1.2 ? 'rgba(255,255,255,0.3)' : C.text,
                  cursor: lineHeight <= 1.2 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Minus size={14} />
              </button>
              <div style={{ flex: 1, height: 4, background: '#1e293b', borderRadius: 2, position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: `${((lineHeight - 1.2) / 0.8) * 100}%`,
                  top: '50%', transform: 'translate(-50%, -50%)',
                  width: 12, height: 12, borderRadius: '50%',
                  background: C.accent, border: `2px solid ${C.bg}`,
                }} />
              </div>
              <button
                onClick={() => handleLineHeightChange(0.1)}
                disabled={lineHeight >= 2.0}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: lineHeight >= 2.0 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)',
                  color: lineHeight >= 2.0 ? 'rgba(255,255,255,0.3)' : C.text,
                  cursor: lineHeight >= 2.0 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Font Family */}
          <div>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.text, display: 'block', marginBottom: 8 }}>
              Font Family
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              {fontFamilyOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => setFontFamily(option.id)}
                  style={{
                    flex: 1, padding: '10px 8px', borderRadius: 8,
                    border: `1px solid ${fontFamily === option.id ? C.accent : C.border}`,
                    background: fontFamily === option.id ? `${C.accent}15` : 'rgba(255,255,255,0.03)',
                    color: fontFamily === option.id ? C.accent : C.muted,
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    textAlign: 'center',
                    fontFamily: option.style,
                    transition: 'all 0.15s',
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}