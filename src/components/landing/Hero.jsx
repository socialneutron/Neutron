import { motion } from 'framer-motion'
import { Zap, Globe, MessageCircle, Shield, ArrowRight, TrendingUp, Cpu } from 'lucide-react'

const METRICS = [
  { value: '2.4M+', label: 'Discussions' },
  { value: '180+', label: 'Countries' },
  { value: '99K', label: 'Online Now' },
  { value: '4.9★', label: 'Avg Rating' },
]

const TRENDING_FEEDS = [
  { tag: '#AGI2025', posts: '14.2K', color: '#00d2ff' },
  { tag: '#USElection', posts: '8.7K', color: '#a855f7' },
  { tag: '#MarsBase', posts: '5.1K', color: '#22c55e' },
  { tag: '#QuantumAI', posts: '3.4K', color: '#f59e0b' },
]

const FEATURES = [
  { icon: MessageCircle, label: 'Real-time Discourse', desc: 'Join live discussions on the topics that matter most.' },
  { icon: TrendingUp, label: 'Trending Intelligence', desc: 'AI-curated feeds showing what\'s breaking globally.' },
  { icon: Shield, label: 'End-to-End Encrypted', desc: 'Your conversations are private and secure by design.' },
  { icon: Cpu, label: 'AI-Powered Insights', desc: 'Smart summaries, fact-checks, and signal detection.' },
]

const TRUST_BADGES = ['SOC 2', 'GDPR', 'ISO 27001', 'CCPA']

function MetricCounter({ value, label, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
      style={{ textAlign: 'center' }}
    >
      <div style={{ fontSize: '28px', fontWeight: 800, background: 'linear-gradient(135deg, #00D2FF, #7928CA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        {value}
      </div>
      <div style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{label}</div>
    </motion.div>
  )
}

export default function Hero({ onNavigate }) {
  return (
    <div style={{ minHeight: '100vh', background: '#05050A', overflow: 'hidden', position: 'relative' }}>
      {/* Ambient glow orbs */}
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '600px', height: '600px', borderRadius: '50%', background: 'rgba(0,210,255,0.08)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(121,40,202,0.08)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      {/* Top Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 40px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          position: 'relative', zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #00D2FF, #7928CA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 900, color: '#fff' }}>N</div>
          <span style={{ fontWeight: 800, fontSize: '18px', color: '#fff', letterSpacing: '0.08em', fontFamily: 'Michroma, sans-serif' }}>NEUTRON</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => onNavigate('login')}
            style={{ padding: '8px 20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#e5e7eb', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            aria-label="Log in to your account"
          >
            Log in
          </button>
          <button
            onClick={() => onNavigate('signup')}
            style={{ padding: '8px 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #00D2FF, #7928CA)', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
            aria-label="Create a free account"
          >
            Get Started
          </button>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '60px 40px 40px', position: 'relative', zIndex: 5 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '99px', background: 'rgba(0,210,255,0.1)', border: '1px solid rgba(0,210,255,0.2)', fontSize: '12px', color: '#00D2FF', fontWeight: 600, marginBottom: '24px' }}>
              <Zap size={14} /> The Future of Intelligence
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            style={{ fontSize: 'clamp(36px, 7vw, 64px)', fontWeight: 900, color: '#fff', lineHeight: 1.1, margin: '0 0 16px', letterSpacing: '-0.02em' }}
          >
            Discuss.<span style={{ background: 'linear-gradient(135deg, #00D2FF, #7928CA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}> Debate.</span> Shape the Future.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            style={{ fontSize: '16px', color: '#94a3b8', maxWidth: '560px', lineHeight: 1.7, margin: '0 0 32px' }}
          >
            The premier platform for global intelligence, AI, politics, startups, science, and the ideas defining tomorrow.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}
          >
            <button
              onClick={() => onNavigate('signup')}
              style={{ padding: '14px 32px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #00D2FF, #7928CA)', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              aria-label="Create your free account"
            >
              Create Free Account <ArrowRight size={18} />
            </button>
            <button
              onClick={() => onNavigate('login')}
              style={{ padding: '14px 32px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.04)', color: '#e5e7eb', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}
              aria-label="Sign in to your account"
            >
              Sign In
            </button>
          </motion.div>
        </div>

        {/* Metrics row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '60px', padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {METRICS.map((m, i) => <MetricCounter key={m.label} {...m} index={i} />)}
        </motion.div>

        {/* Trending feeds row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.5 }}
          style={{ marginTop: '24px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <TrendingUp size={14} color="#00D2FF" />
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Trending Discussions</span>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {TRENDING_FEEDS.map(t => (
              <span key={t.tag} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '99px', background: t.color + '12', border: '1px solid ' + t.color + '30', fontSize: '13px', color: t.color, fontWeight: 600, cursor: 'pointer' }}>
                {t.tag}
                <span style={{ fontSize: '11px', opacity: 0.7 }}>{t.posts}</span>
              </span>
            ))}
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          style={{ marginTop: '40px' }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
            {FEATURES.map(f => (
              <div key={f.label} style={{ padding: '18px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <f.icon size={18} color="#00D2FF" style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{f.label}</div>
                <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.5 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '36px', padding: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span style={{ fontSize: '11px', color: '#4b5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Trusted Infrastructure</span>
          {TRUST_BADGES.map(b => (
            <span key={b} style={{ padding: '3px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '10px', color: '#6b7280', fontWeight: 700, fontFamily: 'monospace' }}>
              {b}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
