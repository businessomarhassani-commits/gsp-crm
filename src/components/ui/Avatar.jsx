export function Avatar({ src, name, size = 'md', className = '' }) {
  const sizes = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base', xl: 'w-14 h-14 text-xl' }
  const initials = name ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?'
  const colors = ['bg-blue-500','bg-purple-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-cyan-500']
  const colorIdx = name ? name.charCodeAt(0) % colors.length : 0

  if (src) return <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover ring-2 ring-white/10 ${className}`} />

  return (
    <div className={`${sizes[size]} ${colors[colorIdx]} rounded-full flex items-center justify-center font-semibold text-white shrink-0 ${className}`}>
      {initials}
    </div>
  )
}
