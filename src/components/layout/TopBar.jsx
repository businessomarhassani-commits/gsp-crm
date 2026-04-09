import { useLocation } from 'react-router-dom'
import { useUIStore } from '../../store/useUIStore'
import { useCurrencyStore } from '../../store/useCurrencyStore'
import { useAuthStore } from '../../store/useAuthStore'
import { Avatar } from '../ui/Avatar'

const PAGE_TITLES = {
  '/dashboard':       { title: 'Dashboard',        subtitle: 'Your business at a glance' },
  '/prospects':       { title: 'Prospects',         subtitle: 'Manage your lead pipeline' },
  '/clients':         { title: 'Clients',           subtitle: 'Active client management' },
  '/outreach':        { title: 'Outreach',          subtitle: 'All outreach activity logs' },
  '/scraper':         { title: 'Data Scraper',      subtitle: 'Find and import new prospects' },
  '/copy-studio':     { title: 'Copy Studio',       subtitle: 'AI-powered sales copy generation' },
  '/creative-studio': { title: 'Creative Studio',   subtitle: 'Video ad scripts and creatives' },
  '/tasks':           { title: 'Tasks',             subtitle: 'Daily follow-ups and reminders' },
  '/niches':          { title: 'Niches',            subtitle: 'Manage your target markets' },
  '/team':            { title: 'Team',              subtitle: 'Manage access and permissions' },
  '/settings':        { title: 'Settings',          subtitle: 'App preferences and configuration' },
}

export function TopBar() {
  const { theme } = useUIStore()
  const { activeCurrency, setActiveCurrency } = useCurrencyStore()
  const { profile } = useAuthStore()
  const location = useLocation()
  const isDark = theme === 'dark'

  const basePath = '/' + location.pathname.split('/')[1]
  const meta = PAGE_TITLES[basePath] || { title: 'SuccessPro', subtitle: '' }

  const borderColor = isDark ? 'border-white/6' : 'border-black/8'
  const bg = isDark ? 'bg-dark-bg/80 backdrop-blur-xl' : 'bg-light-bg/90 backdrop-blur-xl'

  return (
    <header className={`h-14 border-b ${borderColor} ${bg} flex items-center justify-between px-5 sticky top-0 z-30`}>
      <div>
        <h2 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>{meta.title}</h2>
        {meta.subtitle && <p className={`text-xs ${isDark ? 'text-white/35' : 'text-slate-400'} hidden sm:block`}>{meta.subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Currency toggle */}
        <div className={`flex items-center gap-0.5 rounded-lg p-0.5 ${isDark ? 'bg-white/6' : 'bg-black/5'}`}>
          {['MAD', 'USD', 'EUR'].map((c) => (
            <button
              key={c}
              onClick={() => setActiveCurrency(c)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                activeCurrency === c
                  ? (isDark ? 'bg-white/15 text-white' : 'bg-white text-slate-800 shadow-sm')
                  : (isDark ? 'text-white/40 hover:text-white/70' : 'text-slate-400 hover:text-slate-600')
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Avatar */}
        <Avatar name={profile?.full_name || profile?.email} src={profile?.avatar_url} size="sm" />
      </div>
    </header>
  )
}
