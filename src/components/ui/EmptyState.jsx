import { useUIStore } from '../../store/useUIStore'

export function EmptyState({ icon: Icon, title, message, action }) {
  const { theme } = useUIStore()
  const isDark = theme === 'dark'
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${isDark ? 'bg-white/6' : 'bg-black/5'}`}>
          <Icon size={24} className={isDark ? 'text-white/30' : 'text-slate-400'} />
        </div>
      )}
      <h3 className={`text-base font-semibold mb-1.5 ${isDark ? 'text-white/80' : 'text-slate-700'}`}>{title}</h3>
      {message && <p className={`text-sm max-w-xs ${isDark ? 'text-white/40' : 'text-slate-400'}`}>{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
