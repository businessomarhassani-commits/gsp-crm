import { useUIStore } from '../../store/useUIStore'
import { motion } from 'framer-motion'

export function GlassCard({ children, className = '', hover = false, animate = true, onClick, ...props }) {
  const { theme } = useUIStore()
  const isDark = theme === 'dark'

  const base = isDark ? 'glass' : 'glass-light'
  const hoverCls = hover ? 'glass-hover cursor-pointer' : ''

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className={`rounded-2xl ${base} ${hoverCls} ${className}`}
        onClick={onClick}
        {...props}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div className={`rounded-2xl ${base} ${hoverCls} ${className}`} onClick={onClick} {...props}>
      {children}
    </div>
  )
}
