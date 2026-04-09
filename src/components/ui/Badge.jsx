export function Badge({ children, color = '#3b82f6', className = '', size = 'sm' }) {
  const bg = color + '20'
  const sizeClass = size === 'xs' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClass} ${className}`}
      style={{ color, backgroundColor: bg }}
    >
      {children}
    </span>
  )
}

export function NicheBadge({ niche, size = 'sm' }) {
  if (!niche) return null
  return <Badge color={niche.color || '#3b82f6'} size={size}>{niche.name}</Badge>
}
