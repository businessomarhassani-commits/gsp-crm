import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('archicrm_admin_token')
    if (stored) {
      api.defaults.headers.common['Authorization'] = `Bearer ${stored}`
      api.get('/api/admin/me')
        .then(res => {
          setAdmin(res.data)
          setToken(stored)
        })
        .catch(() => {
          localStorage.removeItem('archicrm_admin_token')
          delete api.defaults.headers.common['Authorization']
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = (newToken, adminData) => {
    localStorage.setItem('archicrm_admin_token', newToken)
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
    setToken(newToken)
    setAdmin(adminData)
  }

  const logout = () => {
    localStorage.removeItem('archicrm_admin_token')
    delete api.defaults.headers.common['Authorization']
    setToken(null)
    setAdmin(null)
  }

  return (
    <AdminAuthContext.Provider value={{ admin, setAdmin, token, login, logout, loading }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export const useAdminAuth = () => useContext(AdminAuthContext)
