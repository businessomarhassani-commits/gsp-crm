import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('archicrm_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('archicrm_token')
    if (stored) {
      api.defaults.headers.common['Authorization'] = `Bearer ${stored}`
      // Fetch full user profile (including role) so routing decisions are correct on refresh
      api.get('/api/auth/me')
        .then(res => {
          setUser(res.data)
        })
        .catch(() => {
          // Token invalid or expired — clear it
          localStorage.removeItem('archicrm_token')
          delete api.defaults.headers.common['Authorization']
          setToken(null)
          setUser(null)
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
  }

  const logout = () => {
    localStorage.removeItem('archicrm_token')
    delete api.defaults.headers.common['Authorization']
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
