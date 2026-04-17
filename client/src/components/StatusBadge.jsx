const STATUS_STYLES = {
  'Nouveau':       'bg-blue-100 text-blue-700',
  'Contacté':      'bg-amber-100 text-amber-700',
  'Rendez-vous':   'bg-purple-100 text-purple-700',
  'Proposition':   'bg-orange-100 text-orange-700',
  'Gagné':         'bg-green-100 text-green-700',
  'Perdu':         'bg-red-100 text-red-700',
  'active':        'bg-green-100 text-green-700',
  'suspended':     'bg-red-100 text-red-700',
  'admin':         'bg-purple-100 text-purple-700',
  'user':          'bg-gray-100 text-gray-600',
  'pending':       'bg-amber-100 text-amber-700',
  'done':          'bg-green-100 text-green-700',
}

const STATUS_LABELS = {
  'active': 'Actif',
  'suspended': 'Suspendu',
  'pending': 'En attente',
  'done': 'Terminé',
  'admin': 'Admin',
  'user': 'Utilisateur',
}

export default function StatusBadge({ status, className = '' }) {
  const style = STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'
  const label = STATUS_LABELS[status] || status
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style} ${className}`}>
      {label}
    </span>
  )
}
