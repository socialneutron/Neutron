import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { SupabaseAuthProvider } from './context/SupabaseAuthContext'
import ErrorBoundary from './components/ErrorBoundary'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <SupabaseAuthProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </SupabaseAuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
