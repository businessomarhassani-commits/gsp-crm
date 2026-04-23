import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import ImpersonationBanner from './ImpersonationBanner'
import ErrorBoundary from './ErrorBoundary'
import Logo from './Logo'
import { useAuth } from '../context/AuthContext'
import { Menu, LogOut } from 'lucide-react'

// Hard logout — works even if React context is broken
function hardLogout() {
  try {
    localStorage.removeItem('archicrm_token')
    localStorage.removeItem('archicrm_admin_token')
    sessionStorage.removeItem('archicrm_impersonation_token')
  } catch (_) {}
  window.location.href = '/'
}

// Floating emergency logout — shows after 3s if page has no visible content
function EmergencyLogout() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      // Only surface the button if the main content area is essentially empty
      const main = document.querySelector('main')
      const hasContent = main && main.innerText.trim().length > 40
      if (!hasContent) setVisible(true)
    }, 3000)
    return () => clearTimeout(t)
  }, [])

  if (!visible) return null

  return (
    <button
      onClick={hardLogout}
      className="fixed bottom-5 right-5 z-[9999] flex items-center gap-2 bg-[#1a1a1a] border border-white/10 hover:border-red-500/40 hover:bg-red-500/10 text-white/60 hover:text-red-400 text-[12px] font-medium px-4 py-2.5 rounded-xl shadow-2xl transition-all"
      title="Se déconnecter"
    >
      <LogOut size={14} />
      Se déconnecter
    </button>
  )
}

export default function Layout({ children }) {
  const { isImpersonating, user, exitImpersonation, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    window.location.href = '/'
  }

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A]">
        {isImpersonating && (
          <ImpersonationBanner userName={user?.name} onExit={exitImpersonation} />
        )}

        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Mobile top header — shifts down by banner height (48px = top-12) when impersonating */}
        <header className={`lg:hidden fixed left-0 right-0 z-30 h-14 bg-[#0A0A0A] border-b-2 border-[#E8A838] flex items-center px-4 gap-3 transition-[top] duration-150 ${isImpersonating ? 'top-12' : 'top-0'}`}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Logo size={24} />
            <span className="font-bold text-[14px]">
              <span className="text-white">Archi</span><span className="text-[#E8A838]">CRM</span>
            </span>
          </div>
          {/* Mobile header logout — always works */}
          <button
            onClick={handleLogout}
            className="ml-auto w-8 h-8 rounded-full bg-[#E8A838]/20 border border-[#E8A838]/40 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/40 transition-colors"
            title="Se déconnecter"
          >
            <span className="text-[#E8A838] text-xs font-bold">{user?.name?.[0] || '?'}</span>
          </button>
        </header>

        {/*
          Content top-padding matrix:
            mobile  / no banner  : 72px  (56px header + 16px gap)
            mobile  / banner     : 116px (48px banner + 56px header + 12px gap)
            desktop / no banner  : 32px  (lg:p-8 normal)
            desktop / banner     : 76px  (44px banner + 32px normal)
        */}
        <main className="lg:ml-[240px] flex-1 min-h-screen overflow-y-auto">
          <div className={`max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 ${
            isImpersonating
              ? 'pt-[116px] lg:pt-[76px]'
              : 'pt-[72px] lg:pt-8'
          }`}>
            {children}
          </div>
        </main>

        {/* Emergency floating logout — appears after 3s if page has no content */}
        <EmergencyLogout />
      </div>
    </ErrorBoundary>
  )
}
