import { NeutronLogo } from '../components/NeutronLogo'
import './WelcomeScreen.css'

export default function WelcomeScreen({ onLogin, onSignup }) {
  return (
    <div className="welcome-screen">
      {/* Background grid */}
      <div className="welcome-grid"/>

      {/* Animated orbs */}
      <div className="orb orb-blue"/>
      <div className="orb orb-purple"/>

      {/* Hero content */}
      <div className="welcome-hero">
        <div className="welcome-logo-wrap" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <NeutronLogo size={50} animated={true} />
          <span className="neutron-brand" style={{ fontSize: '28px' }}>neutron</span>
        </div>

        <div className="hero-badge">
          <span className="badge-dot"/>
          <span>Trusted by 2M+ Minds Worldwide</span>
        </div>

        <h1 className="hero-headline">
          <span className="neon-text" style={{ fontSize: 'clamp(42px, 8vw, 64px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-2px', display: 'block' }}>
            Discuss the
          </span>
          <span style={{ fontSize: 'clamp(42px, 8vw, 64px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-2px', display: 'block', color: '#ffffff' }}>
            Future.
          </span>
        </h1>

        <p className="hero-sub">
          Join the most intelligent conversations on AI, politics, startups, science and the forces shaping tomorrow.
        </p>

        {/* Feature pills */}
        <div className="feature-pills">
          {['Global Politics', 'AI & Tech', 'Startups', 'Finance', 'Science'].map(tag => (
            <span key={tag} className="pill">{tag}</span>
          ))}
        </div>

        {/* Live stats */}
        <div className="stats-row">
          {[
            { value: '2.4M', label: 'Discussions' },
            { value: '180+', label: 'Countries' },
            { value: '99K', label: 'Online Now' },
          ].map(stat => (
            <div key={stat.label} className="stat-item">
              <span className="stat-value neon-text">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="welcome-cta">
        <button className="glow-btn" id="welcome-signup-btn" onClick={onSignup}>
          Create Free Account
        </button>
        <button className="secondary-btn" id="welcome-login-btn" onClick={onLogin}>
          Sign In
        </button>
        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', textAlign: 'center', marginTop: '8px' }}>
          By continuing, you agree to our{' '}
          <span style={{ color: 'var(--accent-blue)', cursor: 'pointer' }}>Terms</span> &amp;{' '}
          <span style={{ color: 'var(--accent-blue)', cursor: 'pointer' }}>Privacy Policy</span>
        </p>
      </div>
    </div>
  )
}
