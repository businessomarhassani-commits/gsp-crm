import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { useUIStore } from '../../store/useUIStore'

export function SearchInput({ value, onChange, placeholder = 'Search…', className = '' }) {
  const [local, setLocal] = useState(value || '')
  const { theme } = useUIStore()
  const isDark = theme === 'dark'

  useEffect(() => {
    const t = setTimeout(() => onChange(local), 300)
    return () => clearTimeout(t)
  }, [local, onChange])

  useEffect(() => { setLocal(value || '') }, [value])

  const base = isDark
    ? 'bg-white/5 border-white/10 text-white placeholder:text-white/30'
    : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'

  return (
    <div className={`relative ${className}`}>
      <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-white/30' : 'text-slate-400'}`} />
      <input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className={`w-full h-9 rounded-xl border text-sm outline-none transition-all px-3 pl-9 pr-8 ${base}`}
      />
      {local && (
        <button onClick={() => { setLocal(''); onChange('') }} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 cursor-pointer">
          <X size={13} className={isDark ? 'text-white/30 hover:text-white/60' : 'text-slate-400 hover:text-slate-600'} />
        </button>
      )}
    </div>
  )
}
