import { NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import Logo from './Logo'
import api from '../utils/api'
import {
  LayoutDashboard,
  Users,
  BarChart2,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
} from 'lucide-react'

function AdminNavItem({ to, label, Icon, end, badge, onClose }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClose}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors duration-150 ${
          isActive
            ? 'bg-[#E8A838] text-[#0A0A0A]'
            : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={15} strokeWidth={isActive ? 2.5 : 1.8} />
          <span className="flex-1">{label}</span>
          {badge > 0 && (
            <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [pendingCount, setPendingCount] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    api.get('/api/admin/users/pending-count')
      .then(r => setPendingCount(r.data.count || 0))
      .catch(() => {})
  }, [])

  const handleLogout = () => { logout(); navigate('/login') }
  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="flex min-h-screen bg-[#F0F2F5] dark:bg-[#0A0A0A]">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar — always dark */}
      <aside className={`w-[240px] shrink-0 bg-[#0A0A0A] flex flex-col fixed top-0 left-0 h-full z-40 border-t-2 border-[#E8A838] transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/[0.07]">
          <div className="flex items-center gap-2.5">
            <Logo size={28} />
            <div>
              <p className="font-bold text-[15px] leading-tight">
                <span className="text-white">Archi</span><span className="text-[#E8A838]">CRM</span>
              </p>
              <p className="text-white/35 text-[10px] font-medium tracking-wide uppercase">Admin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <AdminNavItem to="/admin"           label="Dashboard"    Icon={LayoutDashboard} end onClose={closeSidebar} />
          <AdminNavItem to="/admin/users"     label="Utilisateurs" Icon={Users}           badge={pendingCount} onClose={closeSidebar} />
          <AdminNavItem to="/admin/analytics" label="Analytics"    Icon={BarChart2} onClose={closeSidebar} />
          <AdminNavItem to="/admin/settings"  label="Paramètres"   Icon={Settings} onClose={closeSidebar} />
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-white/[0.07] space-y-0.5">
          {/* User */}
          <div className="px-3 py-2.5 rounded-lg bg-white/[0.05] mb-2">
            <p className="text-white text-[13px] font-medium truncate">{user?.name || 'Admin'}</p>
            <p className="text-white/35 text-[11px] truncate">{user?.email}</p>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-[13px] text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-[13px] text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={14} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Mobile top header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-[#0A0A0A] border-b-2 border-[#E8A838] flex items-center px-4 gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <Logo size={24} />
          <div>
            <span className="font-bold text-[14px]">
              <span className="text-white">Archi</span><span className="text-[#E8A838]">CRM</span>
            </span>
            <span className="text-white/35 text-[9px] font-medium tracking-wide uppercase ml-1.5">Admin</span>
          </div>
        </div>
        {pendingCount > 0 && (
          <div className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
            {pendingCount}
          </div>
        )}
      </header>

      {/* Main */}
      <main className="lg:ml-[240px] flex-1 min-h-screen overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pt-[72px] lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  )
}
