import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Volume2, BookOpen } from 'lucide-react'

const C = {
  bg: '#0f172a',
  card: '#1e293b',
  accent: '#00D2FF',
  border: 'rgba(255,255,255,0.1)',
  text: '#f1f5f9',
  muted: '#6b7280',
}

interface DictionaryPopupProps {
  word: string
  position: { x: number; y: number }
  onClose: () => void
}

interface Definition {
  word: string
  phonetic: string
  meanings: {
    partOfSpeech: string
    definitions: {
      definition: string
      example?: string
    }[]
    synonyms?: string[]
  }[]
}

export default function DictionaryPopup({ word, position, onClose }: DictionaryPopupProps) {
  const [definition, setDefinition] = useState<Definition | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDefinition = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
        if (!response.ok) {
          throw new Error('Word not found')
        }
        const data = await response.json()
        if (data && data.length > 0) {
          setDefinition(data[0])
        } else {
          setError('No definition found')
        }
      } catch (err) {
        setError('Failed to fetch definition')
      } finally {
        setLoading(false)
      }
    }

    if (word) {
      fetchDefinition()
    }
  }, [word])

  // Adjust position to stay within viewport
  const adjustedPosition = {
    x: Math.min(Math.max(position.x, 150), window.innerWidth - 150),
    y: Math.min(position.y, window.innerHeight - 250),
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      style={{
        position: 'fixed',
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        transform: 'translate(-50%, 8px)',
        zIndex: 3000,
        width: 280,
      }}
    >
      <div style={{
        background: C.bg, border: `1px solid ${C.border}`,
        borderRadius: 12, overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', borderBottom: `1px solid ${C.border}`,
          background: `${C.accent}10`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={14} color={C.accent} />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>
              {word}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 22, height: 22, borderRadius: 4,
              border: 'none', background: 'rgba(255,255,255,0.1)',
              color: C.muted, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={12} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '12px 14px', maxHeight: 200, overflow: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                border: `2px solid ${C.border}`,
                borderTopColor: C.accent,
                animation: 'spin 1s linear infinite',
                margin: '0 auto',
              }} />
              <p style={{ margin: '8px 0 0', fontSize: 11, color: C.muted }}>
                Looking up "{word}"...
              </p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <p style={{ margin: 0, fontSize: 12, color: C.muted }}>{error}</p>
            </div>
          ) : definition ? (
            <div>
              {/* Phonetic */}
              {definition.phonetic && (
                <p style={{ margin: '0 0 8px', fontSize: 12, color: C.muted, fontStyle: 'italic' }}>
                  {definition.phonetic}
                </p>
              )}

              {/* Meanings */}
              {definition.meanings.slice(0, 2).map((meaning, idx) => (
                <div key={idx} style={{ marginBottom: idx < definition.meanings.length - 1 ? 10 : 0 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: C.accent,
                    background: `${C.accent}15`, padding: '2px 6px', borderRadius: 4,
                  }}>
                    {meaning.partOfSpeech}
                  </span>
                  <p style={{
                    margin: '6px 0 0', fontSize: 12, lineHeight: 1.5, color: C.text,
                  }}>
                    {meaning.definitions[0]?.definition}
                  </p>
                  {meaning.definitions[0]?.example && (
                    <p style={{
                      margin: '4px 0 0', fontSize: 11, lineHeight: 1.4,
                      color: C.muted, fontStyle: 'italic',
                      borderLeft: `2px solid ${C.border}`,
                      paddingLeft: 8,
                    }}>
                      "{meaning.definitions[0].example}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Arrow */}
      <div style={{
        width: 0, height: 0,
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderBottom: `6px solid ${C.bg}`,
        margin: '-1px auto 0',
        transform: 'translateY(-100%)',
      }} />
    </motion.div>
  )
}