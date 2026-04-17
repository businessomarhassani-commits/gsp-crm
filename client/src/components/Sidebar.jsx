import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/',           label: 'Tableau de bord', emoji: '📊' },
  { to: '/leads',      label: 'Leads',           emoji: '🎯' },
  { to: '/clients',    label: 'Clients',          emoji: '👥' },
  { to: '/pipeline',   label: 'Pipeline',         emoji: '📋' },
  { to: '/reminders',  label: 'Rappels',          emoji: '🔔' },
  { to: '/finance',    label: 'Finance',          emoji: '💰' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-[280px] bg-navy flex flex-col z-30">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gold rounded-lg flex items-center justify-center text-navy font-bold text-lg">A</div>
          <div>
            <p className="text-white font-bold text-base leading-tight">ArchiCRM</p>
            <p className="text-white/40 text-xs">Gestion architectes</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, label, emoji }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-gold text-navy font-semibold'
                  : 'text-white/65 hover:text-white hover:bg-white/8'
              }`
            }
          >
            <span className="text-base w-5 text-center">{emoji}</span>
            {label}
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 mt-2 ${
                isActive
                  ? 'bg-purple-500 text-white font-semibold'
                  : 'text-purple-300/80 hover:text-purple-200 hover:bg-purple-500/15'
              }`
            }
          >
            <span className="text-base w-5 text-center">🛡️</span>
            Admin Panel
          </NavLink>
        )}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="px-4 py-3 rounded-xl bg-white/5 mb-2">
          <p className="text-white text-sm font-medium truncate">{user?.name || '—'}</p>
          <p className="text-white/40 text-xs truncate">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
        >
          <span className="text-base w-5 text-center">🚪</span>
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
