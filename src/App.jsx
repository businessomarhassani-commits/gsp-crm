import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { queryClient } from './lib/queryClient'
import { supabase } from './lib/supabase'
import { useAuthStore } from './store/useAuthStore'
import { useUIStore } from './store/useUIStore'

import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/layout/ProtectedRoute'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Prospects from './pages/Prospects'
import ProspectDetail from './pages/ProspectDetail'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import Outreach from './pages/Outreach'
import Scraper from './pages/Scraper'
import CopyStudio from './pages/CopyStudio'
import CreativeStudio from './pages/CreativeStudio'
import Tasks from './pages/Tasks'
import Niches from './pages/Niches'
import Team from './pages/Team'
import Settings from './pages/Settings'

function AppInitializer({ children }) {
  const { setSession, setLoading, fetchProfile } = useAuthStore()
  const { theme, setTheme } = useUIStore()

  useEffect(() => {
    // Apply saved theme immediately
    document.documentElement.classList.toggle('dark', theme === 'dark')

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return children
}

export default function App() {
  const { theme } = useUIStore()

  return (
    <QueryClientProvider client={queryClient}>
      <div className={theme === 'dark' ? 'dark' : ''}>
        <BrowserRouter>
          <AppInitializer>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard"        element={<Dashboard />} />
                <Route path="prospects"        element={<Prospects />} />
                <Route path="prospects/:id"    element={<ProspectDetail />} />
                <Route path="clients"          element={<Clients />} />
                <Route path="clients/:id"      element={<ClientDetail />} />
                <Route path="outreach"         element={<Outreach />} />
                <Route path="scraper"          element={<Scraper />} />
                <Route path="copy-studio"      element={<CopyStudio />} />
                <Route path="creative-studio"  element={<CreativeStudio />} />
                <Route path="tasks"            element={<Tasks />} />
                <Route path="niches"           element={<Niches />} />
                <Route path="team"             element={<Team />} />
                <Route path="settings"         element={<Settings />} />
              </Route>
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AppInitializer>
        </BrowserRouter>

        <Toaster
          position="top-right"
          gutter={8}
          toastOptions={{
            duration: 3500,
            style: {
              background: theme === 'dark' ? 'rgba(14,20,32,0.92)' : 'rgba(255,255,255,0.96)',
              color: theme === 'dark' ? '#e2e8f0' : '#0f172a',
              border: theme === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
              backdropFilter: 'blur(16px)',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '500',
              padding: '10px 14px',
              boxShadow: theme === 'dark' ? '0 8px 32px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0,0,0,0.1)',
            },
          }}
        />
      </div>
    </QueryClientProvider>
  )
}
