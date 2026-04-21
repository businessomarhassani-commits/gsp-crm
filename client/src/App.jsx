import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext'
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
import AdminLogin from './pages/AdminLogin'
import AdminTeam from './pages/AdminTeam'
import Integrations from './pages/Integrations'
import UserSettings from './pages/UserSettings'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import LandingPage from './pages/LandingPage'

// ── Detect admin subdomain ───────────────────────────────────────────────────
const isAdminSubdomain = () => {
  const h = window.location.hostname
  return h === 'admin.archicrm.ma' || h.startsWith('admin.')
}

// ── Public-only pages (bypass auth loading entirely) ─────────────────────────
const PUBLIC_PATHS = ['/landing', '/privacy', '/terms']

// ── CRM routes (non-admin users) ─────────────────────────────────────────────
function CRMRoute({ children }) {
  const { user, token, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-400 text-sm">Chargement…</div></div>
  if (!token) return <Navigate to="/landing" replace />
  if (user?.role === 'admin') return <Navigate to="/landing" replace />
  return <Layout>{children}</Layout>
}

// ── Admin panel routes (admin_users) ─────────────────────────────────────────
function AdminRoute({ children, requireSuperAdmin = false, requirePermission = null }) {
  const { admin, token, loading } = useAdminAuth()
  if (loading) return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center"><div className="text-gray-400 text-sm">Chargement…</div></div>
  if (!token) return <Navigate to="/login" replace />
  if (requireSuperAdmin && admin?.role !== 'superadmin') return <Navigate to="/" replace />
  if (requirePermission && admin?.role !== 'superadmin' && !admin?.permissions?.[requirePermission]) {
    return <Navigate to="/" replace />
  }
  return <AdminLayout>{children}</AdminLayout>
}

// ── Admin subdomain app ───────────────────────────────────────────────────────
function AdminAppRoutes() {
  const { admin, token, loading } = useAdminAuth()

  if (loading) return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="text-gray-400 text-sm">Chargement…</div>
    </div>
  )

  return (
    <Routes>
      <Route path="/login"
        element={token ? <Navigate to="/" replace /> : <AdminLogin />}
      />
      <Route path="/"             element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/users"        element={<AdminRoute requirePermission="users"><AdminUsers /></AdminRoute>} />
      <Route path="/users/:id"    element={<AdminRoute requirePermission="users"><AdminUserDetail /></AdminRoute>} />
      <Route path="/analytics"    element={<AdminRoute requirePermission="analytics"><AdminAnalytics /></AdminRoute>} />
      <Route path="/settings"     element={<AdminRoute requirePermission="settings"><AdminSettings /></AdminRoute>} />
      <Route path="/team"         element={<AdminRoute requireSuperAdmin><AdminTeam /></AdminRoute>} />
      <Route path="*"             element={<Navigate to={token ? '/' : '/login'} replace />} />
    </Routes>
  )
}

// ── CRM subdomain app ─────────────────────────────────────────────────────────
function CRMAppRoutes() {
  const { user, token, loading } = useAuth()
  const { pathname } = useLocation()

  if (PUBLIC_PATHS.includes(pathname)) {
    return (
      <Routes>
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms"   element={<Terms />} />
      </Routes>
    )
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1117]">
      <div className="text-gray-400 text-sm">Chargement…</div>
    </div>
  )

  return (
    <Routes>
      <Route path="/login"
        element={token ? <Navigate to={user?.role === 'admin' ? '/landing' : '/'} replace /> : <Login />}
      />
      <Route path="/signup"
        element={token ? <Navigate to={user?.role === 'admin' ? '/landing' : '/'} replace /> : <Signup />}
      />

      <Route path="/"            element={<CRMRoute><Dashboard /></CRMRoute>} />
      <Route path="/leads"       element={<CRMRoute><Leads /></CRMRoute>} />
      <Route path="/clients"     element={<CRMRoute><Clients /></CRMRoute>} />
      <Route path="/clients/:id" element={<CRMRoute><ClientDetail /></CRMRoute>} />
      <Route path="/pipeline"    element={<CRMRoute><Pipeline /></CRMRoute>} />
      <Route path="/reminders"   element={<CRMRoute><Reminders /></CRMRoute>} />
      <Route path="/finance"     element={<CRMRoute><Finance /></CRMRoute>} />
      <Route path="/integrations" element={<CRMRoute><Integrations /></CRMRoute>} />
      <Route path="/settings"    element={<CRMRoute><UserSettings /></CRMRoute>} />

      <Route path="*"
        element={<Navigate to={token ? '/' : '/landing'} replace />}
      />
    </Routes>
  )
}

export default function App() {
  const adminMode = isAdminSubdomain()

  return (
    <ThemeProvider>
      {adminMode ? (
        <AdminAuthProvider>
          <AdminAppRoutes />
        </AdminAuthProvider>
      ) : (
        <AuthProvider>
          <CRMAppRoutes />
        </AuthProvider>
      )}
    </ThemeProvider>
  )
}
