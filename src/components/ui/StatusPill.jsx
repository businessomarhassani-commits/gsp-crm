import { PROSPECT_STATUSES } from '../../lib/constants'

export function StatusPill({ status, size = 'sm' }) {
  const s = PROSPECT_STATUSES.find((x) => x.value === status) || PROSPECT_STATUSES[0]
  const sizeClass = size === 'xs' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1'
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClass}`}
      style={{ color: s.color, backgroundColor: s.bg }}
    >
      {s.label}
    </span>
  )
}
