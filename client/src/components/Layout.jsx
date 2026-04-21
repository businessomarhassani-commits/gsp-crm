import { useState } from 'react'
import Sidebar from './Sidebar'
import ImpersonationBanner from './ImpersonationBanner'
import Logo from './Logo'
import { useAuth } from '../context/AuthContext'
import { Menu } from 'lucide-react'

export default function Layout({ children }) {
  const { isImpersonating, user, exitImpersonation } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
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
        <div className="ml-auto w-8 h-8 rounded-full bg-[#E8A838]/20 border border-[#E8A838]/40 flex items-center justify-center">
          <span className="text-[#E8A838] text-xs font-bold">{user?.name?.[0] || '?'}</span>
        </div>
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
    </div>
  )
}
