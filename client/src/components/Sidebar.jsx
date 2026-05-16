import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import Logo from './Logo'
import SyncStatus from './SyncStatus'
import {
  LayoutDashboard,
  Target,
  Users,
  GitMerge,
  Bell,
  DollarSign,
  Globe,
  Sparkles,
  Settings,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react'

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout, isImpersonating } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  // Show admin features if user has admin role OR if an admin is currently impersonating this account
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin' || isImpersonating

  const NAV = [
    { to: '/dashboard',  label: 'Tableau de bord', Icon: LayoutDashboard, end: true },
    { to: '/leads',      label: 'Leads',            Icon: Target },
    { to: '/clients',    label: 'Clients',           Icon: Users },
    { to: '/pipeline',   label: 'Pipeline',          Icon: GitMerge },
    { to: '/reminders',  label: 'Rappels',           Icon: Bell },
    { to: '/finance',    label: 'Finance',           Icon: DollarSign },
    ...(isAdmin ? [{ to: '/sites', label: 'Sites Web', Icon: Globe }] : []),
    ...(isAdmin ? [{ to: '/agency-ai', label: 'Agency AI', Icon: Sparkles }] : []),
    { to: '/settings',   label: 'Paramètres',        Icon: Settings },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
    <aside className={`fixed left-0 top-0 h-full w-[240px] bg-[#0A0A0A] flex flex-col z-40 border-t-2 border-[#E8A838] transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.07]">
        <div className="flex items-center gap-2.5">
          <Logo size={28} />
          <span className="font-bold text-[15px] leading-none">
            <span className="text-white">Archi</span><span className="text-[#E8A838]">CRM</span>
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
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
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-white/[0.07] space-y-0.5">
        {/* User pill */}
        <div className="px-3 py-2.5 rounded-lg bg-white/[0.05] mb-2">
          <p className="text-white text-[13px] font-medium truncate">{user?.name || '—'}</p>
          <p className="text-white/35 text-[11px] truncate">{user?.email}</p>
          {isAdmin && (
            <span className="inline-block mt-1 text-[10px] font-semibold text-[#E8A838] bg-[#E8A838]/10 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
              Admin
            </span>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-[13px] text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
        </button>

        {/* Sync status — desktop only */}
        <SyncStatus />

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
    </>
  )
}
