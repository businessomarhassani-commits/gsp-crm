import { useUIStore } from '../../store/useUIStore'

export function PageHeader({ title, subtitle, actions, className = '' }) {
  const { theme } = useUIStore()
  const isDark = theme === 'dark'
  return (
    <div className={`flex items-start justify-between gap-4 mb-6 ${className}`}>
      <div>
        <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h1>
        {subtitle && <p className={`text-sm mt-1 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
