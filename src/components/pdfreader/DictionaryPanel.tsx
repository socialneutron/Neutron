import React, { useState, useEffect, useCallback } from 'react'
import {
  Search, BookOpen, Star, Trash2, ExternalLink, ChevronDown, ChevronRight,
  X, History, Bookmark,
} from 'lucide-react'
import { usePdfReaderStore, type ApiDefinitionResponse } from '../../stores/pdfReaderStore'

const C = {
  bg: '#0f172a',
  card: '#1e293b',
  accent: '#00D2FF',
  border: 'rgba(255,255,255,0.07)',
  text: '#f1f5f9',
  muted: '#6b7280',
  green: '#22c55e',
  yellow: '#fbbf24',
  pink: '#ec4899',
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function DictionaryPanel() {
  const {
    dictionaryWord, setDictionaryWord,
    dictHistory, addDictHistory, removeDictHistory, clearDictHistory,
    savedWords, toggleSavedWord, isWordSaved,
    dictCache, cacheDefinition,
  } = usePdfReaderStore()

  const [searchInput, setSearchInput] = useState('')
  const [definition, setDefinition] = useState<ApiDefinitionResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [etymologyOpen, setEtymologyOpen] = useState(false)
  const [showSaved, setShowSaved] = useState(false)

  const lookupWord = useCallback(async (word: string) => {
    const normalized = word.toLowerCase().trim()
    if (!normalized) return

    const cached = dictCache[normalized]
    if (cached) {
      setDefinition(cached)
      setError(null)
      setLoading(false)
      addDictHistory(normalized)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(normalized)}`)
      if (!res.ok) throw new Error('Word not found')
      const data = await res.json()
      if (data && data.length > 0) {
        const entry: ApiDefinitionResponse = data[0]
        setDefinition(entry)
        cacheDefinition(normalized, entry)
        addDictHistory(normalized)
      } else {
        setDefinition(null)
        setError('No definition found')
      }
    } catch {
      setDefinition(null)
      setError('Failed to fetch definition')
    } finally {
      setLoading(false)
    }
  }, [dictCache, cacheDefinition, addDictHistory])

  useEffect(() => {
    if (dictionaryWord) {
      setSearchInput(dictionaryWord)
      lookupWord(dictionaryWord)
    }
  }, [dictionaryWord])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const word = searchInput.trim()
    if (!word) return
    setDictionaryWord(word)
  }

  const handleSynonymClick = (word: string) => {
    setSearchInput(word)
    setDictionaryWord(word)
  }

  const saved = isWordSaved(definition?.word || '')
  const firstMeaning = definition?.meanings[0]
  const primaryPos = firstMeaning?.partOfSpeech || ''

  return (
    <div style={{ padding: '12px 14px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 6, marginBottom: 12, flexShrink: 0 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={13} color={C.muted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Type a word..."
            style={{
              width: '100%', padding: '8px 28px 8px 30px', borderRadius: 8,
              border: `1px solid ${C.border}`, background: '#0d1220',
              color: '#fff', fontSize: 12, fontFamily: 'inherit', outline: 'none',
            }}
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => { setSearchInput(''); setDefinition(null); setError(null); setDictionaryWord(null) }}
              style={{
                position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                width: 18, height: 18, borderRadius: 4, border: 'none',
                background: 'rgba(255,255,255,0.08)', color: C.muted, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={10} />
            </button>
          )}
        </div>
        <button type="submit" style={{
          padding: '8px 12px', borderRadius: 8, border: 'none',
          background: searchInput.trim() ? 'linear-gradient(135deg, #00D2FF, #7928CA)' : '#374151',
          color: '#fff', fontSize: 12, fontWeight: 700, cursor: searchInput.trim() ? 'pointer' : 'not-allowed',
          opacity: searchInput.trim() ? 1 : 0.5, fontFamily: 'inherit', flexShrink: 0,
        }}>
          Go
        </button>
      </form>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {/* Loading skeleton */}
        {loading && (
          <div style={{ padding: '8px 0' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                height: i === 1 ? 20 : 14, borderRadius: 4,
                background: 'rgba(255,255,255,0.04)',
                marginBottom: 10,
                width: `${80 - i * 15}%`,
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{ textAlign: 'center', padding: '24px 16px', color: C.muted }}>
            <BookOpen size={28} style={{ marginBottom: 10, opacity: 0.2 }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>
              "{searchInput || dictionaryWord}"
            </p>
            <p style={{ fontSize: 12 }}>{error}</p>
          </div>
        )}

        {/* Definition result */}
        {definition && !loading && (
          <div>
            {/* Word header + star */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.accent }}>
                  {definition.word}
                </h3>
                {definition.phonetic && (
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: C.muted }}>
                    {definition.phonetic}
                  </p>
                )}
              </div>
              <button
                onClick={() => toggleSavedWord(definition.word, primaryPos)}
                title={saved ? 'Remove from saved' : 'Save word'}
                style={{
                  width: 28, height: 28, borderRadius: 6, border: 'none',
                  background: saved ? `${C.yellow}20` : 'rgba(255,255,255,0.05)',
                  color: saved ? C.yellow : C.muted,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Star size={14} fill={saved ? C.yellow : 'none'} />
              </button>
            </div>

            {/* Wiktionary link */}
            {definition.sourceUrls?.[0] && (
              <a
                href={definition.sourceUrls[0]}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 11, color: C.accent, textDecoration: 'none', marginBottom: 14,
                  opacity: 0.8,
                }}
              >
                <ExternalLink size={10} /> Wiktionary
              </a>
            )}

            {/* Meanings */}
            {definition.meanings.map((meaning, mIdx) => {
              const meaningSynonyms = meaning.synonyms.filter(s => s)
              const meaningAntonyms = meaning.antonyms.filter(a => a)
              return (
                <div key={mIdx} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: C.accent,
                      background: `${C.accent}15`, padding: '3px 8px', borderRadius: 4,
                    }}>
                      {meaning.partOfSpeech}
                    </span>
                    <span style={{ fontSize: 10, color: C.muted }}>
                      {meaning.definitions.length} {meaning.definitions.length === 1 ? 'sense' : 'senses'}
                    </span>
                  </div>

                  {/* Definitions */}
                  {meaning.definitions.map((def, dIdx) => {
                    const defSynonyms = def.synonyms.filter(s => s)
                    const defAntonyms = def.antonyms.filter(a => a)
                    return (
                      <div key={dIdx} style={{
                        marginBottom: dIdx < meaning.definitions.length - 1 ? 10 : 0,
                        paddingLeft: 12, borderLeft: `2px solid ${C.border}`,
                      }}>
                        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: C.text }}>
                          <span style={{ color: C.muted, fontSize: 10, fontWeight: 700, marginRight: 4 }}>
                            {dIdx + 1}.
                          </span>
                          {def.definition}
                        </p>
                        {def.example && (
                          <p style={{
                            margin: '4px 0 0', fontSize: 11, lineHeight: 1.4,
                            color: C.muted, fontStyle: 'italic',
                          }}>
                            "{def.example}"
                          </p>
                        )}
                        {defSynonyms.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                            {defSynonyms.slice(0, 5).map(s => (
                              <button
                                key={s}
                                onClick={() => handleSynonymClick(s)}
                                style={{
                                  padding: '2px 7px', borderRadius: 4, border: 'none',
                                  background: `${C.green}15`, color: C.green,
                                  fontSize: 10, fontWeight: 600, cursor: 'pointer',
                                  fontFamily: 'inherit',
                                }}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                        {defAntonyms.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                            {defAntonyms.slice(0, 5).map(a => (
                              <button
                                key={a}
                                onClick={() => handleSynonymClick(a)}
                                style={{
                                  padding: '2px 7px', borderRadius: 4, border: 'none',
                                  background: `${C.pink}15`, color: C.pink,
                                  fontSize: 10, fontWeight: 600, cursor: 'pointer',
                                  fontFamily: 'inherit',
                                }}
                              >
                                {a}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Per-POS synonyms/antonyms summary */}
                  {meaningSynonyms.length > 0 && (
                    <div style={{ marginTop: 8, paddingLeft: 12 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: C.muted, marginRight: 4 }}>Synonyms:</span>
                      {meaningSynonyms.slice(0, 8).map(s => (
                        <button
                          key={s}
                          onClick={() => handleSynonymClick(s)}
                          style={{
                            padding: '1px 6px', borderRadius: 3, border: 'none',
                            background: `${C.green}12`, color: C.green,
                            fontSize: 10, cursor: 'pointer', fontFamily: 'inherit', marginRight: 3,
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                  {meaningAntonyms.length > 0 && (
                    <div style={{ marginTop: 4, paddingLeft: 12 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: C.muted, marginRight: 4 }}>Antonyms:</span>
                      {meaningAntonyms.slice(0, 8).map(a => (
                        <button
                          key={a}
                          onClick={() => handleSynonymClick(a)}
                          style={{
                            padding: '1px 6px', borderRadius: 3, border: 'none',
                            background: `${C.pink}12`, color: C.pink,
                            fontSize: 10, cursor: 'pointer', fontFamily: 'inherit', marginRight: 3,
                          }}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Etymology */}
            {definition.origin && (
              <div style={{
                marginTop: 4, marginBottom: 16,
                border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden',
              }}>
                <button
                  onClick={() => setEtymologyOpen(!etymologyOpen)}
                  style={{
                    width: '100%', padding: '8px 12px', border: 'none',
                    background: 'rgba(255,255,255,0.02)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                    color: C.text, fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                  }}
                >
                  {etymologyOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <BookOpen size={12} color={C.muted} />
                  Etymology
                </button>
                {etymologyOpen && (
                  <div style={{ padding: '0 12px 10px', fontSize: 12, lineHeight: 1.6, color: C.muted }}>
                    {definition.origin}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Empty state — show history + saved */}
        {!definition && !loading && !error && (
          <div>
            {/* Lookup history */}
            {dictHistory.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <History size={12} color={C.muted} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Recent
                    </span>
                  </div>
                  <button
                    onClick={clearDictHistory}
                    style={{
                      padding: '2px 6px', borderRadius: 4, border: 'none',
                      background: 'rgba(255,255,255,0.05)', color: C.muted,
                      fontSize: 9, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Clear all
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {dictHistory.slice(0, 10).map(entry => (
                    <div
                      key={entry.word}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '6px 10px', borderRadius: 6,
                        background: 'rgba(255,255,255,0.03)',
                        border: `1px solid ${C.border}`,
                      }}
                    >
                      <button
                        onClick={() => { setSearchInput(entry.word); setDictionaryWord(entry.word) }}
                        style={{
                          flex: 1, textAlign: 'left', border: 'none', background: 'none',
                          color: C.text, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                          fontFamily: 'inherit', padding: 0,
                        }}
                      >
                        {entry.word}
                      </button>
                      <span style={{ fontSize: 9, color: C.muted, marginRight: 6 }}>
                        {timeAgo(entry.timestamp)}
                      </span>
                      <button
                        onClick={() => removeDictHistory(entry.word)}
                        style={{
                          width: 18, height: 18, borderRadius: 4, border: 'none',
                          background: 'rgba(255,255,255,0.05)', color: C.muted,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <X size={9} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Saved words */}
            {savedWords.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Bookmark size={12} color={C.yellow} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Saved ({savedWords.length})
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {savedWords.map(entry => (
                    <div
                      key={entry.word}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '6px 10px', borderRadius: 6,
                        background: 'rgba(255,255,255,0.03)',
                        border: `1px solid ${C.border}`,
                      }}
                    >
                      <button
                        onClick={() => { setSearchInput(entry.word); setDictionaryWord(entry.word) }}
                        style={{
                          flex: 1, textAlign: 'left', border: 'none', background: 'none',
                          color: C.text, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                          fontFamily: 'inherit', padding: 0,
                        }}
                      >
                        {entry.word}
                        <span style={{ fontSize: 9, color: C.muted, marginLeft: 6 }}>
                          {entry.partOfSpeech}
                        </span>
                      </button>
                      <button
                        onClick={() => toggleSavedWord(entry.word, entry.partOfSpeech)}
                        title="Remove from saved"
                        style={{
                          width: 18, height: 18, borderRadius: 4, border: 'none',
                          background: 'rgba(255,255,255,0.05)', color: C.muted,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <X size={9} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completely empty */}
            {dictHistory.length === 0 && savedWords.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: C.muted }}>
                <Search size={28} style={{ marginBottom: 10, opacity: 0.2 }} />
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Dictionary</p>
                <p style={{ fontSize: 11, lineHeight: 1.5 }}>
                  Select a word in the PDF or type above to look up its meaning
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
