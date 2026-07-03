import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#05050A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#f1f5f9', fontFamily: 'system-ui', padding: 24 }}>
          <div style={{ maxWidth: 440, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Something went wrong</h1>
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, marginBottom: 20 }}>
              The app encountered an unexpected error. Try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
            >
              Refresh Page
            </button>
            <details style={{ marginTop: 20, textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', fontSize: 12, color: '#6b7280' }}>Error details</summary>
              <pre style={{ marginTop: 8, fontSize: 11, color: '#ef4444', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {this.state.error?.message}
              </pre>
            </details>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
