import { useState, useRef } from 'react'
import { NeutronLogo } from '../components/NeutronLogo'
import {
  Globe, Cpu, Rocket, DollarSign, FlaskConical, Menu, X,
  ChevronDown, Sparkles, Shield, Briefcase, Check
} from 'lucide-react'
import './WelcomeScreen.css'

const CATEGORIES = [
  { label: 'Global Politics', icon: Globe },
  { label: 'AI & Tech', icon: Cpu },
  { label: 'Startups', icon: Rocket },
  { label: 'Finance', icon: DollarSign },
  { label: 'Science', icon: FlaskConical },
]

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Deep Discussions',
    text: 'Engage in highly curated, long-form intellectual threads covering advanced engineering, macroeconomic shifts, and cutting-edge science.',
  },
  {
    icon: Shield,
    title: 'Verified Insights',
    text: 'Profiles mapped to real-world credentials. Toggle between Public, Private, or Company settings to secure your professional footprint.',
  },
  {
    icon: Briefcase,
    title: 'B2B & Creator Synergy',
    text: 'Seamlessly pivot from reading tech insights to hiring specialized professionals or tracking bulk material supplier catalogs in our integrated marketplace rows.',
  },
]

const PRICING_TIERS = [
  {
    name: 'Standard',
    price: 'Free',
    period: '',
    desc: 'For curious minds and casual contributors.',
    features: ['Unlimited reading', 'Public profile', '5 posts per month', 'Basic analytics', 'Community access'],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$9',
    period: '/month',
    desc: 'For creators and professionals who want more reach.',
    features: ['Unlimited posts', 'Private or Public profile', 'Advanced analytics', 'Priority support', 'Custom profile URL', 'Creator monetization tools'],
    cta: 'Start Pro Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$49',
    period: '/month',
    desc: 'For companies, teams, and B2B operations.',
    features: ['Everything in Pro', 'Company profile & catalog', 'Team management', 'API access', 'Dedicated account manager', 'Custom integrations', 'Escrow & supplier tools'],
    cta: 'Contact Sales',
    highlighted: false,
  },
]

export default function WelcomeScreen({ onLogin, onSignup, onExplore }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [pricingOpen, setPricingOpen] = useState(false)
  const featuresRef = useRef(null)

  const scrollToFeatures = (e) => {
    e.preventDefault()
    setMobileMenuOpen(false)
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="welcome-screen">
      <div className="welcome-grid" />
      <div className="orb orb-blue" />
      <div className="orb orb-purple" />

      {/* ── NAV BAR ── */}
      <nav className="welcome-nav">
        <div className="welcome-nav-inner">
          <div className="welcome-nav-brand">
            <NeutronLogo size={28} animated />
            <span className="neutron-brand" style={{ fontSize: '18px' }}>neutron</span>
          </div>

          <div className={`welcome-nav-links ${mobileMenuOpen ? 'open' : ''}`}>
            <button
              className="nav-link-item"
              onClick={() => { setMobileMenuOpen(false); onExplore?.() }}
            >
              Explore
            </button>

            <div className="nav-dropdown-wrapper">
              <button
                className="nav-link-item nav-dropdown-trigger"
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                onBlur={() => setTimeout(() => setCategoriesOpen(false), 150)}
              >
                Categories
                <ChevronDown size={14} style={{ marginLeft: 4, opacity: 0.6, transition: 'transform 0.2s', transform: categoriesOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
              </button>
              {categoriesOpen && (
                <div className="nav-dropdown">
                  {CATEGORIES.map(({ label, icon: Icon }) => (
                    <button
                      key={label}
                      className="nav-dropdown-item"
                      onClick={() => { setCategoriesOpen(false); setMobileMenuOpen(false); onExplore?.() }}
                    >
                      <Icon size={15} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <a href="#features" className="nav-link-item" onClick={scrollToFeatures}>About</a>
            <button className="nav-link-item" onClick={() => { setPricingOpen(true); setMobileMenuOpen(false) }}>Pricing</button>
            <button className="nav-link-item nav-login-btn" onClick={onLogin}>Log in</button>
            <button className="nav-get-started" onClick={onSignup}>Get Started</button>
          </div>

          <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div className="welcome-hero">
        <div className="hero-badge">
          <span className="badge-dot" />
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

        {/* Category pills with icons */}
        <div className="feature-pills">
          {CATEGORIES.map(({ label, icon: Icon }) => (
            <span key={label} className="pill">
              <Icon size={14} style={{ marginRight: 5, opacity: 0.7 }} />
              {label}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="stats-row">
          {[
            { value: '2.4M+', label: 'DISCUSSIONS' },
            { value: '180+', label: 'COUNTRIES' },
            { value: '99K+', label: 'ONLINE NOW' },
          ].map(stat => (
            <div key={stat.label} className="stat-item">
              <span className="stat-value neon-text">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
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

      {/* ── FEATURES GRID ── */}
      <div className="features-section" ref={featuresRef} id="features">
        <div className="features-header">
          <span className="features-label">Why Neutron</span>
          <h2 className="features-title">Built for thinkers who shape what's next</h2>
        </div>
        <div className="features-grid">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="feature-card">
              <div className="feature-icon">
                <Icon size={22} />
              </div>
              <h3 className="feature-title">{title}</h3>
              <p className="feature-text">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="welcome-footer">
        <div className="welcome-footer-inner">
          <div className="welcome-footer-brand">
            <NeutronLogo size={20} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#E5E5E5' }}>neutron</span>
          </div>
          <div className="welcome-footer-links">
            <a href="#features" onClick={scrollToFeatures}>About</a>
            <a href="#features" onClick={scrollToFeatures}>Features</a>
            <button onClick={() => setPricingOpen(true)}>Pricing</button>
            <a href="#features" onClick={scrollToFeatures}>Privacy</a>
            <a href="#features" onClick={scrollToFeatures}>Terms</a>
          </div>
          <p className="welcome-footer-copy">&copy; 2026 Neutron. All rights reserved.</p>
        </div>
      </footer>

      {/* ── PRICING MODAL ── */}
      {pricingOpen && (
        <div className="pricing-overlay" onClick={() => setPricingOpen(false)}>
          <div className="pricing-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pricing-modal-header">
              <h2 className="pricing-modal-title">Choose Your Plan</h2>
              <p className="pricing-modal-sub">Start free, upgrade when you're ready.</p>
              <button className="pricing-close" onClick={() => setPricingOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="pricing-grid">
              {PRICING_TIERS.map((tier) => (
                <div key={tier.name} className={`pricing-card ${tier.highlighted ? 'pricing-card--highlighted' : ''}`}>
                  {tier.highlighted && <div className="pricing-badge">Most Popular</div>}
                  <h3 className="pricing-name">{tier.name}</h3>
                  <div className="pricing-price">
                    <span className="pricing-amount">{tier.price}</span>
                    {tier.period && <span className="pricing-period">{tier.period}</span>}
                  </div>
                  <p className="pricing-desc">{tier.desc}</p>
                  <ul className="pricing-features">
                    {tier.features.map((f) => (
                      <li key={f}>
                        <Check size={14} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`pricing-cta ${tier.highlighted ? 'pricing-cta--primary' : 'pricing-cta--secondary'}`}
                    onClick={() => { setPricingOpen(false); onSignup?.() }}
                  >
                    {tier.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
