import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Leads from './pages/Leads'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import Pipeline from './pages/Pipeline'
import Reminders from './pages/Reminders'
import Finance from './pages/Finance'
import Admin from './pages/Admin'

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, token, loading } = useAuth()
  if (loading) return <div className="min-h-screen bg-cream flex items-center justify-center"><div className="text-navy/40 text-sm">Chargement…</div></div>
  if (!token) return <Navigate to="/login" replace />
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/" replace />
  return <Layout>{children}</Layout>
}

function AppRoutes() {
  const { token } = useAuth()
  return (
    <Routes>
      <Route path="/login"  element={token ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/signup" element={token ? <Navigate to="/" replace /> : <Signup />} />
      <Route path="/"           element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/leads"      element={<ProtectedRoute><Leads /></ProtectedRoute>} />
      <Route path="/clients"    element={<ProtectedRoute><Clients /></ProtectedRoute>} />
      <Route path="/clients/:id" element={<ProtectedRoute><ClientDetail /></ProtectedRoute>} />
      <Route path="/pipeline"   element={<ProtectedRoute><Pipeline /></ProtectedRoute>} />
      <Route path="/reminders"  element={<ProtectedRoute><Reminders /></ProtectedRoute>} />
      <Route path="/finance"    element={<ProtectedRoute><Finance /></ProtectedRoute>} />
      <Route path="/admin"      element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
