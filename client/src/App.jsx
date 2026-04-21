import { Routes, Route, Navigate } from 'react-router-dom'
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

// ── Detect which app to render based on hostname ─────────────────────────────
function getAppMode() {
  const h = window.location.hostname
  if (h === 'admin.archicrm.ma' || h.startsWith('admin.')) return 'admin'
  if (h === 'archicrm.ma' || h === 'www.archicrm.ma') return 'landing'
  if (h === 'app.archicrm.ma') return 'crm'
  // localhost / dev — default to CRM so developers can work on it
  return 'crm'
}

// ── Loading screen ───────────────────────────────────────────────────────────
function Loader({ dark = false }) {
  return (
    <div className={`min-h-screen flex items-center justify-center ${dark ? 'bg-[#0A0A0A]' : 'bg-gray-50 dark:bg-[#0f1117]'}`}>
      <div className="text-gray-400 text-sm">Chargement…</div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// 1. LANDING APP  (archicrm.ma / www.archicrm.ma)
// ────────────────────────────────────────────────────────────────────────────
function LandingAppRoutes() {
  return (
    <Routes>
      <Route path="/"        element={<LandingPage />} />
      <Route path="/login"   element={<Login />} />
      <Route path="/signup"  element={<Signup />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms"   element={<Terms />} />
      {/* Legacy /landing path still works */}
      <Route path="/landing" element={<Navigate to="/" replace />} />
      <Route path="*"        element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// 2. CRM APP  (app.archicrm.ma / localhost)
// ────────────────────────────────────────────────────────────────────────────

// Protects CRM pages — unauthenticated → back to login (/)
function CRMRoute({ children }) {
  const { user, token, loading } = useAuth()
  if (loading) return <Loader />
  if (!token) return <Navigate to="/" replace />
  if (user?.role === 'admin') return <Navigate to="/" replace />
  return <Layout>{children}</Layout>
}

function CRMAppRoutes() {
  const { token, loading } = useAuth()

  if (loading) return <Loader />

  return (
    <Routes>
      {/* Root = login when unauth, dashboard when auth */}
      <Route path="/"
        element={token ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      {/* /login alias so Sidebar logout link keeps working */}
      <Route path="/login"
        element={token ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route path="/signup"
        element={token ? <Navigate to="/dashboard" replace /> : <Signup />}
      />

      {/* Protected CRM pages */}
      <Route path="/dashboard"   element={<CRMRoute><Dashboard /></CRMRoute>} />
      <Route path="/leads"       element={<CRMRoute><Leads /></CRMRoute>} />
      <Route path="/clients"     element={<CRMRoute><Clients /></CRMRoute>} />
      <Route path="/clients/:id" element={<CRMRoute><ClientDetail /></CRMRoute>} />
      <Route path="/pipeline"    element={<CRMRoute><Pipeline /></CRMRoute>} />
      <Route path="/reminders"   element={<CRMRoute><Reminders /></CRMRoute>} />
      <Route path="/finance"     element={<CRMRoute><Finance /></CRMRoute>} />
      <Route path="/integrations" element={<CRMRoute><Integrations /></CRMRoute>} />
      <Route path="/settings"    element={<CRMRoute><UserSettings /></CRMRoute>} />

      {/* Public pages also available inside CRM subdomain */}
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms"   element={<Terms />} />

      {/* Catch-all */}
      <Route path="*"
        element={<Navigate to={token ? '/dashboard' : '/'} replace />}
      />
    </Routes>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// 3. ADMIN APP  (admin.archicrm.ma)
// ────────────────────────────────────────────────────────────────────────────
function AdminRoute({ children, requireSuperAdmin = false, requirePermission = null }) {
  const { admin, token, loading } = useAdminAuth()
  if (loading) return <Loader dark />
  if (!token) return <Navigate to="/login" replace />
  if (requireSuperAdmin && admin?.role !== 'superadmin') return <Navigate to="/" replace />
  if (requirePermission && admin?.role !== 'superadmin' && !admin?.permissions?.[requirePermission]) {
    return <Navigate to="/" replace />
  }
  return <AdminLayout>{children}</AdminLayout>
}

function AdminAppRoutes() {
  const { token, loading } = useAdminAuth()
  if (loading) return <Loader dark />

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

// ────────────────────────────────────────────────────────────────────────────
// ROOT
// ────────────────────────────────────────────────────────────────────────────
export default function App() {
  const mode = getAppMode()

  return (
    <ThemeProvider>
      {mode === 'admin' ? (
        <AdminAuthProvider>
          <AdminAppRoutes />
        </AdminAuthProvider>
      ) : mode === 'landing' ? (
        <LandingAppRoutes />
      ) : (
        <AuthProvider>
          <CRMAppRoutes />
        </AuthProvider>
      )}
    </ThemeProvider>
  )
}
