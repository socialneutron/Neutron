import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2 } from 'lucide-react'

const TALENT_CATEGORIES = [
  'Content Creator', 'Designer', 'Developer', 'Writer', 'Photographer',
  'Videographer', 'Marketer', 'Consultant', 'Musician', 'Artist',
]

const SKILL_SUGGESTIONS = [
  'React', 'Node.js', 'Python', 'TypeScript', 'Figma', 'Photoshop',
  'Video Editing', 'Copywriting', 'SEO', 'Social Media',
  'UI/UX Design', '3D Modeling', 'Animation', 'Data Analysis',
]

interface RegisterTalentModalProps {
  onClose: () => void
  onSubmit: (talent: any) => void
}

export default function RegisterTalentModal({ onClose, onSubmit }: RegisterTalentModalProps) {
  const [form, setForm] = useState({
    title: '', bio: '', category: 'Content Creator',
    rate: '', skills: [] as string[], portfolioUrl: '', availability: 'available',
  })
  const [skillInput, setSkillInput] = useState('')

  const addSkill = (skill: string) => {
    if (skill.trim() && !form.skills.includes(skill.trim()) && form.skills.length < 8) {
      setForm(f => ({ ...f, skills: [...f.skills, skill.trim()] }))
      setSkillInput('')
    }
  }

  const removeSkill = (skill: string) => {
    setForm(f => ({ ...f, skills: f.skills.filter(s => s !== skill) }))
  }

  const handleSubmit = () => {
    if (!form.title.trim()) return
    onSubmit(form)
    onClose()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.07)', background: '#0d1220',
    color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none',
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: '#111827', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 18, width: '100%', maxWidth: 500,
            maxHeight: '90vh', overflow: 'auto',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '20px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#fff' }}>Register as Talent</h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280' }}>Let companies find and hire you</p>
            </div>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 8, border: 'none',
              background: 'rgba(255,255,255,0.05)', color: '#6b7280', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <X size={16} />
            </button>
          </div>

          {/* Form */}
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Professional Title */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 6 }}>Professional Title *</label>
              <input placeholder="e.g. Senior UI/UX Designer" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} />
            </div>

            {/* Bio */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 6 }}>Bio</label>
              <textarea
                placeholder="Tell companies about your experience and what you offer..."
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
              />
            </div>

            {/* Category */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 6 }}>Category *</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {TALENT_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setForm(f => ({ ...f, category: cat }))}
                    style={{
                      padding: '7px 14px', borderRadius: 8, border: 'none',
                      background: form.category === cat ? 'rgba(124,58,237,0.2)' : '#0d1220',
                      color: form.category === cat ? '#7c3aed' : '#9ca3af',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Rate */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 6 }}>Hourly Rate ($)</label>
              <input placeholder="e.g. 75" value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value }))} style={inputStyle} />
            </div>

            {/* Skills */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 6 }}>
                Skills ({form.skills.length}/8)
              </label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {form.skills.map(skill => (
                  <span key={skill} style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                    background: 'rgba(124,58,237,0.15)', color: '#7c3aed',
                  }}>
                    {skill}
                    <button onClick={() => removeSkill(skill)} style={{
                      border: 'none', background: 'transparent', color: '#7c3aed', cursor: 'pointer', padding: 0,
                    }}>
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
              {form.skills.length < 8 && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    placeholder="Add a skill..."
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput) } }}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button onClick={() => addSkill(skillInput)} style={{
                    padding: '10px 12px', borderRadius: 10, border: 'none',
                    background: '#0d1220', color: '#9ca3af', cursor: 'pointer',
                  }}>
                    <Plus size={14} />
                  </button>
                </div>
              )}
              {/* Suggestions */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                {SKILL_SUGGESTIONS.filter(s => !form.skills.includes(s)).slice(0, 6).map(skill => (
                  <button
                    key={skill}
                    onClick={() => addSkill(skill)}
                    style={{
                      padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                      border: '1px solid rgba(255,255,255,0.07)', background: 'transparent',
                      color: '#6b7280', cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    + {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Portfolio URL */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 6 }}>Portfolio URL</label>
              <input placeholder="https://your-portfolio.com" value={form.portfolioUrl} onChange={e => setForm(f => ({ ...f, portfolioUrl: e.target.value }))} style={inputStyle} />
            </div>

            {/* Availability */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 6 }}>Availability</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['available', 'busy', 'unavailable'].map(status => (
                  <button
                    key={status}
                    onClick={() => setForm(f => ({ ...f, availability: status }))}
                    style={{
                      padding: '7px 14px', borderRadius: 8, border: 'none',
                      background: form.availability === status ? 'rgba(34,197,94,0.2)' : '#0d1220',
                      color: form.availability === status ? '#22c55e' : '#9ca3af',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                      transition: 'all 0.15s',
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '16px 24px 20px', display: 'flex', gap: 12, justifyContent: 'flex-end',
            borderTop: '1px solid rgba(255,255,255,0.05)',
          }}>
            <button onClick={onClose} style={{
              padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)',
              background: 'transparent', color: '#9ca3af', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              Cancel
            </button>
            <button onClick={handleSubmit} style={{
              padding: '10px 24px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
              color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>
              Register as Talent
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
