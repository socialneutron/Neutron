import { Component } from 'react'

const C = {
  card: '#090914',
  border: 'rgba(255,255,255,0.06)',
  text: '#f1f5f9',
  muted: '#6b7280',
  accent: '#00D2FF',
}

export default class ScopedErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: '28px 20px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: '0 0 4px' }}>
            Couldn't load this section
          </p>
          <p style={{ fontSize: 12, color: C.muted, margin: '0 0 14px' }}>
            Something went wrong loading this part of the page.
          </p>
          <button
            onClick={() => {
              if (this.props.onRetry) {
                this.props.onRetry()
                this.setState({ hasError: false })
              } else {
                this.setState({ hasError: false })
              }
            }}
            style={{
              padding: '7px 18px', borderRadius: 8,
              border: `1px solid ${C.accent}`,
              background: 'rgba(0,210,255,0.08)',
              color: C.accent, fontSize: 12, fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
