import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import './OnboardingFlow.css'

const TOPICS = [
  { id: 'politics', label: 'Politics', icon: '🌍', desc: 'Global governance & power' },
  { id: 'ai', label: 'AI', icon: '🤖', desc: 'Machine intelligence & ethics' },
  { id: 'startups', label: 'Startups', icon: '🚀', desc: 'Innovation & founders' },
  { id: 'science', label: 'Science', icon: '🔬', desc: 'Research & discovery' },
  { id: 'finance', label: 'Finance', icon: '📈', desc: 'Markets & investments' },
  { id: 'technology', label: 'Technology', icon: '💻', desc: 'Future of computing' },
  { id: 'space', label: 'Space', icon: '🛸', desc: 'Cosmos & exploration' },
  { id: 'economics', label: 'Economics', icon: '💹', desc: 'Global economy & trade' },
  { id: 'business', label: 'Business', icon: '🏢', desc: 'Enterprise & strategy' },
  { id: 'climate', label: 'Climate', icon: '🌿', desc: 'Environment & future' },
  { id: 'health', label: 'Health', icon: '🧬', desc: 'Medicine & longevity' },
  { id: 'geopolitics', label: 'Geopolitics', icon: '⚡', desc: 'World conflicts & alliances' },
]

export default function OnboardingFlow({ onFinish, navigate }) {
  const [selected, setSelected] = useState([])
  const [done, setDone] = useState(false)

  const toggle = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handleContinue = () => {
    setDone(true)
    setTimeout(() => onFinish(), 1200)
  }

  return (
    <div className="onboarding-page">
      <div className="onb-bg-orb orb-1"/>
      <div className="onb-bg-orb orb-2"/>

      <div className="onb-header">
        {navigate && (
          <button onClick={() => navigate('welcome')} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0, zIndex: 10 }}>
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="onb-logo">
          <span className="neon-text" style={{ fontWeight: 800, fontSize: '22px', letterSpacing: '-0.5px' }}>NEUTRON</span>
        </div>
        <span className="skip-btn" onClick={onFinish}>Skip</span>
      </div>

      <div className="onb-body">
        <div className="onb-title">
          <h1>What moves you?</h1>
          <p>Pick your topics — we'll build your intelligent feed around them</p>
        </div>

        <div className="topics-grid">
          {TOPICS.map(topic => (
            <button
              key={topic.id}
              className={`topic-card ${selected.includes(topic.id) ? 'topic-selected' : ''}`}
              onClick={() => toggle(topic.id)}
              id={`topic-${topic.id}`}
            >
              <span className="topic-icon">{topic.icon}</span>
              <span className="topic-label">{topic.label}</span>
              <span className="topic-desc">{topic.desc}</span>
              {selected.includes(topic.id) && (
                <span className="topic-check">✓</span>
              )}
            </button>
          ))}
        </div>

        <div className="onb-footer">
          <p className="onb-count">
            <span className="neon-text" style={{ fontWeight: 700 }}>{selected.length}</span>
            <span style={{ color: 'var(--text-secondary)' }}> of 12 topics selected</span>
          </p>
          <button
            className={`glow-btn ${done ? 'btn-done' : ''}`}
            id="onboarding-continue-btn"
            onClick={handleContinue}
            disabled={selected.length < 3}
            style={{ opacity: selected.length < 3 ? 0.5 : 1, marginTop: '12px' }}
          >
            {done ? '✓ Setting up your feed...' : `Build My Feed →`}
          </button>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px', textAlign: 'center', marginTop: '8px' }}>
            Select at least 3 topics
          </p>
        </div>
      </div>
    </div>
  )
}
