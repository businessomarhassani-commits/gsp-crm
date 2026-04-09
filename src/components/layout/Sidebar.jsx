import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, UserCheck, Megaphone, Search,
  PenTool, Film, CheckSquare, Tag, UsersRound, Settings,
  ChevronLeft, ChevronRight, Sun, Moon, LogOut, Zap
} from 'lucide-react'
import { useUIStore } from '../../store/useUIStore'
import { useAuthStore } from '../../store/useAuthStore'
import { useTodayTasks } from '../../hooks/useTasks'
import { Avatar } from '../ui/Avatar'

const NAV = [
  { to: '/dashboard',        icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/prospects',        icon: Users,           label: 'Prospects' },
  { to: '/clients',          icon: UserCheck,       label: 'Clients' },
  { to: '/outreach',         icon: Megaphone,       label: 'Outreach' },
  { to: '/scraper',          icon: Search,          label: 'Scraper' },
  { to: '/copy-studio',      icon: PenTool,         label: 'Copy Studio' },
  { to: '/creative-studio',  icon: Film,            label: 'Creative Studio' },
  { to: '/tasks',            icon: CheckSquare,     label: 'Tasks' },
  { to: '/niches',           icon: Tag,             label: 'Niches' },
  { to: '/team',             icon: UsersRound,      label: 'Team' },
  { to: '/settings',         icon: Settings,        label: 'Settings' },
]

export function Sidebar() {
  const { theme, toggleTheme, sidebarCollapsed, toggleSidebar } = useUIStore()
  const { profile, signOut } = useAuthStore()
  const { data: todayTasks } = useTodayTasks()
  const navigate = useNavigate()
  const isDark = theme === 'dark'
  const collapsed = sidebarCollapsed

  const borderColor = isDark ? 'border-white/6' : 'border-black/8'
  const bg = isDark ? 'bg-dark-surface/80 backdrop-blur-xl' : 'bg-white/90 backdrop-blur-xl'
  const textMuted = isDark ? 'text-white/40' : 'text-slate-400'
  const textBase = isDark ? 'text-white/70' : 'text-slate-600'

  const overdueTasks = todayTasks?.length || 0

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed left-0 top-0 h-screen z-40 border-r ${borderColor} ${bg} flex flex-col shrink-0 overflow-hidden`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-5 py-5 border-b ${borderColor}`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
          <Zap size={17} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className={`font-bold text-[15px] tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}
            >
              SuccessPro
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
              transition-all duration-150 relative group cursor-pointer
              ${isActive
                ? (isDark ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600')
                : `${textBase} hover:${isDark ? 'bg-white/6 text-white' : 'bg-black/4 text-slate-900'}`
              }
            `}
          >
            {({ isActive }) => (
              <>
                <Icon size={17} className={`shrink-0 ${isActive ? (isDark ? 'text-blue-400' : 'text-blue-600') : ''}`} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                      className="whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {/* Tasks badge */}
                {to === '/tasks' && overdueTasks > 0 && (
                  <span className={`ml-auto shrink-0 min-w-[20px] h-[20px] rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center ${collapsed ? 'absolute top-1 right-1 min-w-[14px] h-[14px] text-[10px]' : ''}`}>
                    {overdueTasks > 9 ? '9+' : overdueTasks}
                  </span>
                )}
                {/* Tooltip when collapsed */}
                {collapsed && (
                  <span className={`absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 ${isDark ? 'bg-dark-surface border border-white/10 text-white' : 'bg-white border border-black/8 text-slate-700 shadow-md'}`}>
                    {label}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className={`border-t ${borderColor} px-3 py-4 space-y-1.5`}>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-sm font-medium transition-all duration-150 cursor-pointer ${isDark ? `text-white/50 hover:bg-white/6 hover:text-white` : `text-slate-500 hover:bg-black/4 hover:text-slate-800`}`}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                {isDark ? 'Light mode' : 'Dark mode'}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* User profile */}
        <button
          onClick={() => navigate('/settings')}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl w-full transition-all duration-150 cursor-pointer ${isDark ? 'hover:bg-white/6' : 'hover:bg-black/4'}`}
        >
          <Avatar name={profile?.full_name || profile?.email} size="sm" />
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="text-left min-w-0">
                <p className={`text-sm font-medium truncate ${isDark ? 'text-white/80' : 'text-slate-700'}`}>{profile?.full_name || 'Account'}</p>
                <p className={`text-xs truncate ${textMuted}`}>{profile?.role || 'owner'}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Sign out */}
        <button
          onClick={signOut}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-sm transition-all duration-150 cursor-pointer ${isDark ? 'text-white/30 hover:bg-red-500/10 hover:text-red-400' : 'text-slate-400 hover:bg-red-50 hover:text-red-500'}`}
        >
          <LogOut size={15} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>Sign out</motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className={`absolute -right-3 top-24 w-6 h-6 rounded-full border flex items-center justify-center z-50 cursor-pointer transition-colors ${isDark ? 'bg-dark-surface border-white/10 text-white/50 hover:text-white' : 'bg-white border-black/10 text-slate-400 hover:text-slate-700 shadow-sm'}`}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  )
}
