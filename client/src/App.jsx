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
import AdminLandingEditor from './pages/AdminLandingEditor'
import Integrations from './pages/Integrations'
import UserSettings from './pages/UserSettings'
import Sites from './pages/Sites'
import AgencyAI from './pages/AgencyAI'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import LandingPage from './pages/LandingPage'
import DownloadPage from './pages/DownloadPage'
import DesktopSetup from './pages/DesktopSetup'

// ── Detect which app to render based on hostname ─────────────────────────────
function getAppMode() {
  const h = window.location.hostname
  if (h === 'admin.crm.archi') return 'admin'
  if (h === 'crm.archi' || h === 'www.crm.archi') return 'landing'
  if (h === 'app.crm.archi') return 'crm'
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
// 1. LANDING APP  (crm.archi / www.crm.archi)
// ────────────────────────────────────────────────────────────────────────────
function LandingAppRoutes() {
  return (
    <Routes>
      <Route path="/"        element={<LandingPage />} />
      <Route path="/login"   element={<Login />} />
      <Route path="/signup"  element={<Signup />} />
      <Route path="/privacy"  element={<Privacy />} />
      <Route path="/terms"    element={<Terms />} />
      <Route path="/download" element={<DownloadPage />} />
      {/* Legacy /landing path still works */}
      <Route path="/landing" element={<Navigate to="/" replace />} />
      <Route path="*"        element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// 2. CRM APP  (app.crm.archi / localhost)
// ────────────────────────────────────────────────────────────────────────────

// Protects CRM pages — unauthenticated → back to login (/)
function CRMRoute({ children, adminOnly = false }) {
  const { user, token, loading, authError, isImpersonating } = useAuth()
  if (loading) return <Loader />
  if (authError === 'invalid_admin_token') return <Navigate to="/?session_error=1" replace />
  if (!token) return <Navigate to="/" replace />
  // adminOnly routes: allow if user has admin role OR if an admin is impersonating this account
  if (adminOnly && user?.role !== 'admin' && user?.role !== 'superadmin' && !isImpersonating) {
    return <Navigate to="/dashboard" replace />
  }
  return <Layout>{children}</Layout>
}

function CRMAppRoutes() {
  const { token, loading, authError } = useAuth()

  if (loading) return <Loader />
  // Admin token detected — send to login with error message, no loop
  if (authError === 'invalid_admin_token' && !token) return <Navigate to="/?session_error=1" replace />

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
      <Route path="/sites"       element={<CRMRoute adminOnly><Sites /></CRMRoute>} />
      <Route path="/agency-ai"   element={<CRMRoute adminOnly><AgencyAI /></CRMRoute>} />

      {/* Public pages also available inside CRM subdomain */}
      <Route path="/privacy"  element={<Privacy />} />
      <Route path="/terms"    element={<Terms />} />
      <Route path="/download" element={<DownloadPage />} />

      {/* Catch-all */}
      <Route path="*"
        element={<Navigate to={token ? '/dashboard' : '/'} replace />}
      />
    </Routes>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// 3. ADMIN APP  (admin.crm.archi)
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

  // ── Electron offline-first: show setup wizard on first launch ────────────
  const isDesktop = typeof window !== 'undefined' && !!window.db
  if (isDesktop) {
    const setupDone = localStorage.getItem('archicrm_setup_done')
    const hasToken  = !!localStorage.getItem('archicrm_token')
    if (!setupDone && !hasToken) {
      return <DesktopSetup />
    }
  }

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
