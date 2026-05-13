import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

// Decode JWT payload without a library
function decodeJwt(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

// Wipe every auth key from storage
function clearAllAuth() {
  localStorage.removeItem('archicrm_token')
  localStorage.removeItem('archicrm_admin_token')
  sessionStorage.removeItem('archicrm_impersonation_token')
  delete api.defaults.headers.common['Authorization']
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isImpersonating, setIsImpersonating] = useState(false)
  const [authError, setAuthError] = useState(null)   // 'invalid_admin_token' | null

  useEffect(() => {
    // Check for impersonation token from URL (?impersonate=TOKEN), sessionStorage, or regular localStorage
    const urlParams = new URLSearchParams(window.location.search)
    const urlImpToken = urlParams.get('impersonate')
    if (urlImpToken) {
      sessionStorage.setItem('archicrm_impersonation_token', urlImpToken)
      // Clean the URL so token doesn't persist in address bar / history
      window.history.replaceState({}, '', window.location.pathname)
    }

    const impToken = sessionStorage.getItem('archicrm_impersonation_token')
    const regularToken = localStorage.getItem('archicrm_token')
    const stored = impToken || regularToken

    if (stored) {
      // ── Guard: reject admin tokens on the user CRM ────────────────────────
      const decoded = decodeJwt(stored)
      if (decoded?.adminUserId || decoded?.role === 'superadmin') {
        clearAllAuth()
        setAuthError('invalid_admin_token')
        setLoading(false)
        return
      }

      api.defaults.headers.common['Authorization'] = `Bearer ${stored}`
      api.get('/api/auth/me')
        .then(res => {
          const userData = res.data
          // Double-check: server should never return an admin user here
          if (userData?.role === 'superadmin') {
            clearAllAuth()
            setAuthError('invalid_admin_token')
            return
          }
          setUser(userData)
          setToken(stored)
          setIsImpersonating(!!impToken)
        })
        .catch(() => {
          // Token invalid or expired — clear everything
          clearAllAuth()
          setToken(null)
          setUser(null)
          setIsImpersonating(false)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = (newToken, userData) => {
    localStorage.setItem('archicrm_token', newToken)
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
    setToken(newToken)
    setUser(userData)
    setIsImpersonating(false)
  }

  const logout = () => {
    clearAllAuth()
    setToken(null)
    setUser(null)
    setIsImpersonating(false)
    setAuthError(null)
  }

  const exitImpersonation = () => {
    sessionStorage.removeItem('archicrm_impersonation_token')
    setIsImpersonating(false)
    setToken(null)
    setUser(null)
    // Close this tab (it was opened via window.open from the admin panel)
    window.close()
    // Fallback if window.close() doesn't work — go to admin subdomain
    const adminBase = window.location.hostname === 'app.crm.archi'
      ? 'https://admin.crm.archi'
      : window.location.hostname === 'app.archicrm.ma'
      ? 'https://admin.archicrm.ma'
      : ''
    setTimeout(() => { window.location.href = `${adminBase}/users` }, 200)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, token, login, logout, loading, isImpersonating, exitImpersonation, authError }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
