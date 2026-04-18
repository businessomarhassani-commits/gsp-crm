import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isImpersonating, setIsImpersonating] = useState(false)

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
      api.defaults.headers.common['Authorization'] = `Bearer ${stored}`
      api.get('/api/auth/me')
        .then(res => {
          setUser(res.data)
          setToken(stored)
          setIsImpersonating(!!impToken)
        })
        .catch(() => {
          // Token invalid or expired — clear everything
          localStorage.removeItem('archicrm_token')
          sessionStorage.removeItem('archicrm_impersonation_token')
          delete api.defaults.headers.common['Authorization']
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
    localStorage.removeItem('archicrm_token')
    sessionStorage.removeItem('archicrm_impersonation_token')
    delete api.defaults.headers.common['Authorization']
    setToken(null)
    setUser(null)
    setIsImpersonating(false)
  }

  const exitImpersonation = () => {
    sessionStorage.removeItem('archicrm_impersonation_token')
    setIsImpersonating(false)
    setToken(null)
    setUser(null)
    // Close this tab if opened as impersonation; otherwise navigate admin
    window.close()
    // Fallback if window.close() doesn't work (same tab)
    setTimeout(() => { window.location.href = '/admin/users' }, 200)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, token, login, logout, loading, isImpersonating, exitImpersonation }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
