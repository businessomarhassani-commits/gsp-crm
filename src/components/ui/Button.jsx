import { motion } from 'framer-motion'

const variants = {
  primary:   'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20',
  secondary: 'dark:bg-white/8 dark:hover:bg-white/12 dark:text-white/90 bg-black/6 hover:bg-black/10 text-slate-700 dark:border-white/10 border border-black/8',
  ghost:     'hover:bg-white/6 text-slate-400 hover:text-white dark:hover:bg-white/8 dark:hover:text-white',
  danger:    'bg-red-600/90 hover:bg-red-500 text-white shadow-lg shadow-red-600/20',
  success:   'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20',
  purple:    'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20',
}

const sizes = {
  xs: 'h-7 px-3 text-xs gap-1.5',
  sm: 'h-8 px-3.5 text-sm gap-2',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-base gap-2.5',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight: IconRight,
  className = '',
  type = 'button',
  ...props
}) {
  const isDisabled = disabled || loading
  return (
    <motion.button
      whileHover={isDisabled ? {} : { scale: 1.01 }}
      whileTap={isDisabled ? {} : { scale: 0.98 }}
      type={type}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center font-medium rounded-xl
        transition-all duration-150 cursor-pointer select-none
        focus-visible:outline-2 focus-visible:outline-blue-500
        disabled:opacity-40 disabled:cursor-not-allowed
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin-smooth w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      ) : Icon ? (
        <Icon size={size === 'xs' ? 12 : size === 'sm' ? 13 : 14} />
      ) : null}
      {children}
      {!loading && IconRight && <IconRight size={14} />}
    </motion.button>
  )
}
