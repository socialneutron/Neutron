import { useState, useEffect } from 'react'
import './SplashScreen.css'

const NeutronLogo = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="40" r="38" stroke="url(#grad)" strokeWidth="2" opacity="0.3"/>
    <circle cx="40" cy="40" r="28" stroke="url(#grad)" strokeWidth="1.5" opacity="0.5"/>
    <circle cx="40" cy="40" r="10" fill="url(#grad)"/>
    <ellipse cx="40" cy="40" rx="38" ry="14" stroke="url(#grad)" strokeWidth="1.5" opacity="0.7"/>
    <ellipse cx="40" cy="40" rx="38" ry="14" stroke="url(#grad)" strokeWidth="1.5" opacity="0.7" transform="rotate(60 40 40)"/>
    <ellipse cx="40" cy="40" rx="38" ry="14" stroke="url(#grad)" strokeWidth="1.5" opacity="0.7" transform="rotate(120 40 40)"/>
    <defs>
      <linearGradient id="grad" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop stopColor="#00d2ff"/>
        <stop offset="1" stopColor="#8a2be2"/>
      </linearGradient>
    </defs>
  </svg>
)

export default function SplashScreen({ onFinish }) {
  const [phase, setPhase] = useState('logo') // logo -> text -> fade
  const [particles, setParticles] = useState([])

  useEffect(() => {
    // Generate particles
    const pts = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2,
      opacity: Math.random() * 0.6 + 0.2,
    }))
    setParticles(pts)

    const t1 = setTimeout(() => setPhase('text'), 800)
    const t2 = setTimeout(() => setPhase('fade'), 2500)
    const t3 = setTimeout(() => onFinish(), 3200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <div className={`splash-screen ${phase === 'fade' ? 'splash-fade' : ''}`}>
      {/* Particles */}
      {particles.map(p => (
        <div key={p.id} className="particle" style={{
          left: `${p.x}%`,
          top: `${p.y}%`,
          width: `${p.size}px`,
          height: `${p.size}px`,
          opacity: p.opacity,
          animationDuration: `${p.duration}s`,
          animationDelay: `${p.delay}s`,
        }}/>
      ))}

      {/* Glow rings */}
      <div className="glow-ring ring-1"/>
      <div className="glow-ring ring-2"/>
      <div className="glow-ring ring-3"/>

      <div className={`splash-content ${phase !== 'logo' ? 'content-visible' : ''}`}>
        <div className="logo-wrapper">
          <div className="logo-glow"/>
          <NeutronLogo />
        </div>
        <div className={`splash-title ${phase === 'text' || phase === 'fade' ? 'title-visible' : ''}`}>
          <span className="neutron-brand">
            neutron
          </span>
          <p className="splash-subtitle">
            Discuss the Future
          </p>
        </div>
        <div className={`loading-bar ${phase === 'text' || phase === 'fade' ? 'bar-visible' : ''}`}>
          <div className="loading-fill"/>
        </div>
      </div>
    </div>
  )
}
