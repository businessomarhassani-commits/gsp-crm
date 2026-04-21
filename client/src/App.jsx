import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Leads from './pages/Leads'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import Pipeline from './pages/Pipeline'
import Reminders from './pages/Reminders'
import Finance from './pages/Finance'
import AdminDashboard from './pages/AdminDashboard'
import AdminUsers from './pages/AdminUsers'
import AdminUserDetail from './pages/AdminUserDetail'
import AdminAnalytics from './pages/AdminAnalytics'
import AdminSettings from './pages/AdminSettings'
import Integrations from './pages/Integrations'
import UserSettings from './pages/UserSettings'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import LandingPage from './pages/LandingPage'

// CRM routes — only for non-admin users
function CRMRoute({ children }) {
  const { user, token, loading } = useAuth()
  if (loading) return <div className="min-h-screen bg-cream dark:bg-[#0f1117] flex items-center justify-center"><div className="text-navy/40 dark:text-gray-500 text-sm">Chargement…</div></div>
  if (!token) return <Navigate to="/login" replace />
  if (user?.role === 'admin') return <Navigate to="/admin" replace />
  return <Layout>{children}</Layout>
}

// Admin routes — only for admin users
function AdminRoute({ children }) {
  const { user, token, loading } = useAuth()
  if (loading) return <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#0f1117] flex items-center justify-center"><div className="text-gray-400 text-sm">Chargement…</div></div>
  if (!token) return <Navigate to="/login" replace />
  if (user?.role !== 'admin') return <Navigate to="/" replace />
  return <AdminLayout>{children}</AdminLayout>
}

function AppRoutes() {
  const { user, token, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen bg-cream dark:bg-[#0f1117] flex items-center justify-center">
      <div className="text-navy/40 dark:text-gray-500 text-sm">Chargement…</div>
    </div>
  )

  return (
    <Routes>
      {/* Public — no auth required */}
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms"   element={<Terms />} />
      <Route path="/login"   element={token ? <Navigate to={user?.role === 'admin' ? '/admin' : '/'} replace /> : <Login />} />
      <Route path="/signup"  element={token ? <Navigate to={user?.role === 'admin' ? '/admin' : '/'} replace /> : <Signup />} />

      {/* CRM — user only */}
      <Route path="/"            element={<CRMRoute><Dashboard /></CRMRoute>} />
      <Route path="/leads"       element={<CRMRoute><Leads /></CRMRoute>} />
      <Route path="/clients"     element={<CRMRoute><Clients /></CRMRoute>} />
      <Route path="/clients/:id" element={<CRMRoute><ClientDetail /></CRMRoute>} />
      <Route path="/pipeline"    element={<CRMRoute><Pipeline /></CRMRoute>} />
      <Route path="/reminders"   element={<CRMRoute><Reminders /></CRMRoute>} />
      <Route path="/finance"       element={<CRMRoute><Finance /></CRMRoute>} />
      <Route path="/integrations" element={<CRMRoute><Integrations /></CRMRoute>} />
      <Route path="/settings"     element={<CRMRoute><UserSettings /></CRMRoute>} />

      {/* Admin panel — admin only */}
      <Route path="/admin"               element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/users"         element={<AdminRoute><AdminUsers /></AdminRoute>} />
      <Route path="/admin/users/:id"     element={<AdminRoute><AdminUserDetail /></AdminRoute>} />
      <Route path="/admin/analytics"     element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
      <Route path="/admin/settings"      element={<AdminRoute><AdminSettings /></AdminRoute>} />

      <Route path="*" element={<Navigate to={token ? (user?.role === 'admin' ? '/admin' : '/') : '/login'} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  )
}
