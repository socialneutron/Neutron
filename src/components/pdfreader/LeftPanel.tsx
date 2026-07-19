import React, { useState } from 'react'
import { StickyNote, Search, Plus, Edit3, Trash2, FileText, X } from 'lucide-react'
import { usePdfReaderStore } from '../../stores/pdfReaderStore'
import DictionaryPanel from './DictionaryPanel'

const C = {
  bg: '#0f172a',
  card: '#1e293b',
  accent: '#00D2FF',
  border: 'rgba(255,255,255,0.07)',
  text: '#f1f5f9',
  muted: '#6b7280',
  green: '#22c55e',
}

interface LeftPanelProps {
  pdfId: string
  currentPage: number
}

export default function LeftPanel({ pdfId, currentPage }: LeftPanelProps) {
  const {
    leftPanelTab, setLeftPanelTab,
    notes, highlights, addNote, updateNote, removeNote, getNotes, getHighlights, removeHighlight,
  } = usePdfReaderStore()

  const [newNoteText, setNewNoteText] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')

  const pdfNotes = getNotes(pdfId).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  const pdfHighlights = getHighlights(pdfId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const handleAddNote = () => {
    if (!newNoteText.trim()) return
    addNote({
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      pdfId,
      page: currentPage,
      text: newNoteText.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    setNewNoteText('')
  }

  const handleUpdateNote = (noteId: string) => {
    if (!editingText.trim()) return
    updateNote(noteId, editingText.trim())
    setEditingNoteId(null)
    setEditingText('')
  }

  const combinedItems = [
    ...pdfHighlights.map(h => ({ type: 'highlight' as const, id: h.id, page: h.page, text: h.text, color: h.color, createdAt: h.createdAt })),
    ...pdfNotes.map(n => ({ type: 'note' as const, id: n.id, page: n.page, text: n.text, createdAt: n.createdAt })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div style={{
      width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column',
      borderRight: `1px solid ${C.border}`, background: `${C.bg}ee`,
      overflow: 'hidden',
    }}>
      {/* Tab bar */}
      <div style={{
        display: 'flex', borderBottom: `1px solid ${C.border}`,
        flexShrink: 0,
      }}>
        {[
          { id: 'notes' as const, icon: StickyNote, label: 'Notes', count: combinedItems.length },
          { id: 'dict' as const, icon: Search, label: 'Dict', count: null },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setLeftPanelTab(tab.id)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px 8px', border: 'none', cursor: 'pointer',
              background: leftPanelTab === tab.id ? `${C.accent}10` : 'transparent',
              color: leftPanelTab === tab.id ? C.accent : C.muted,
              fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
              borderBottom: leftPanelTab === tab.id ? `2px solid ${C.accent}` : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            <tab.icon size={13} />
            {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 8,
                background: leftPanelTab === tab.id ? `${C.accent}20` : 'rgba(255,255,255,0.06)',
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {leftPanelTab === 'notes' ? (
          <div style={{ padding: '12px 14px' }}>
            {/* Add note */}
            <div style={{ marginBottom: 16 }}>
              <textarea
                placeholder={`Add a note for page ${currentPage + 1}...`}
                value={newNoteText}
                onChange={e => setNewNoteText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddNote() }}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8,
                  border: `1px solid ${C.border}`, background: '#0d1220',
                  color: '#fff', fontSize: 12, fontFamily: 'inherit', outline: 'none',
                  resize: 'none', minHeight: 60, lineHeight: 1.5,
                }}
              />
              <button
                onClick={handleAddNote}
                disabled={!newNoteText.trim()}
                style={{
                  width: '100%', marginTop: 8, padding: '8px 12px', borderRadius: 8, border: 'none',
                  background: newNoteText.trim() ? 'linear-gradient(135deg, #00D2FF, #7928CA)' : '#374151',
                  color: '#fff', fontSize: 12, fontWeight: 700, cursor: newNoteText.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  opacity: newNoteText.trim() ? 1 : 0.5, fontFamily: 'inherit',
                }}
              >
                <Plus size={14} /> Add Note
              </button>
            </div>

            {/* Combined list */}
            {combinedItems.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {combinedItems.map(item => (
                  <div
                    key={item.id}
                    style={{
                      padding: '10px 12px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${C.border}`,
                      borderLeft: item.type === 'highlight' ? `3px solid ${item.color}` : `3px solid ${C.border}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                          background: item.type === 'highlight' ? `${item.color}20` : 'rgba(255,255,255,0.06)',
                          color: item.type === 'highlight' ? item.color : C.muted,
                        }}>
                          {item.type === 'highlight' ? 'Highlight' : 'Note'}
                        </span>
                        <span style={{ fontSize: 10, color: C.muted }}>Pg {item.page + 1}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {item.type === 'note' && (
                          <button
                            onClick={() => { setEditingNoteId(item.id); setEditingText(item.text) }}
                            style={{ width: 20, height: 20, borderRadius: 4, border: 'none', background: 'rgba(255,255,255,0.05)', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Edit3 size={10} />
                          </button>
                        )}
                        <button
                          onClick={() => item.type === 'highlight' ? removeHighlight(pdfId, item.id) : removeNote(pdfId, item.id)}
                          style={{ width: 20, height: 20, borderRadius: 4, border: 'none', background: 'rgba(255,255,255,0.05)', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>

                    {editingNoteId === item.id ? (
                      <div>
                        <textarea
                          value={editingText}
                          onChange={e => setEditingText(e.target.value)}
                          autoFocus
                          style={{
                            width: '100%', padding: '8px', borderRadius: 6,
                            border: `1px solid ${C.accent}`, background: '#0d1220',
                            color: '#fff', fontSize: 12, fontFamily: 'inherit', outline: 'none',
                            resize: 'none', minHeight: 40,
                          }}
                        />
                        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                          <button onClick={() => handleUpdateNote(item.id)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: C.accent, color: '#fff', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
                          <button onClick={() => { setEditingNoteId(null); setEditingText('') }} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: C.text, whiteSpace: 'pre-wrap' }}>
                        {item.text.length > 150 ? item.text.substring(0, 150) + '...' : item.text}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: C.muted }}>
                <FileText size={28} style={{ marginBottom: 8, opacity: 0.3 }} />
                <p style={{ fontSize: 12, lineHeight: 1.5 }}>
                  No notes or highlights yet.<br />Select text in the PDF to highlight it.
                </p>
              </div>
            )}
          </div>
        ) : (
          <DictionaryPanel />
        )}
      </div>
    </div>
  )
}
