import { forwardRef } from 'react'
import { useUIStore } from '../../store/useUIStore'

export const Input = forwardRef(function Input(
  { label, error, icon: Icon, iconRight: IconRight, hint, className = '', wrapperClass = '', type = 'text', ...props },
  ref
) {
  const { theme } = useUIStore()
  const isDark = theme === 'dark'

  const base = isDark
    ? 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-500/60 focus:bg-white/8'
    : 'bg-black/4 border-black/10 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white'

  return (
    <div className={`flex flex-col gap-1.5 ${wrapperClass}`}>
      {label && (
        <label className={`text-sm font-medium ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon size={15} />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={`
            w-full h-9 rounded-xl border text-sm outline-none
            transition-all duration-150 px-3
            ${Icon ? 'pl-9' : ''}
            ${IconRight ? 'pr-9' : ''}
            ${base}
            ${error ? (isDark ? 'border-red-500/60' : 'border-red-400') : ''}
            ${className}
          `}
          {...props}
        />
        {IconRight && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            <IconRight size={15} />
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className={`text-xs ${isDark ? 'text-white/40' : 'text-slate-400'}`}>{hint}</p>}
    </div>
  )
})

export const Textarea = forwardRef(function Textarea(
  { label, error, hint, rows = 4, className = '', wrapperClass = '', ...props },
  ref
) {
  const { theme } = useUIStore()
  const isDark = theme === 'dark'
  const base = isDark
    ? 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-500/60'
    : 'bg-black/4 border-black/10 text-slate-900 placeholder:text-slate-400 focus:border-blue-500'
  return (
    <div className={`flex flex-col gap-1.5 ${wrapperClass}`}>
      {label && <label className={`text-sm font-medium ${isDark ? 'text-white/70' : 'text-slate-600'}`}>{label}</label>}
      <textarea
        ref={ref}
        rows={rows}
        className={`w-full rounded-xl border text-sm outline-none transition-all duration-150 px-3 py-2.5 resize-none ${base} ${error ? 'border-red-500/60' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className={`text-xs ${isDark ? 'text-white/40' : 'text-slate-400'}`}>{hint}</p>}
    </div>
  )
})

export const FormSelect = forwardRef(function FormSelect(
  { label, error, hint, children, className = '', wrapperClass = '', ...props },
  ref
) {
  const { theme } = useUIStore()
  const isDark = theme === 'dark'
  const base = isDark
    ? 'bg-white/5 border-white/10 text-white focus:border-blue-500/60'
    : 'bg-black/4 border-black/10 text-slate-900 focus:border-blue-500 bg-white'
  return (
    <div className={`flex flex-col gap-1.5 ${wrapperClass}`}>
      {label && <label className={`text-sm font-medium ${isDark ? 'text-white/70' : 'text-slate-600'}`}>{label}</label>}
      <select
        ref={ref}
        className={`w-full h-9 rounded-xl border text-sm outline-none transition-all duration-150 px-3 cursor-pointer ${base} ${error ? 'border-red-500/60' : ''} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className={`text-xs ${isDark ? 'text-white/40' : 'text-slate-400'}`}>{hint}</p>}
    </div>
  )
})
