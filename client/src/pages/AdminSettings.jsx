export default function AdminSettings() {
  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Paramètres plateforme</h1>
        <p className="text-gray-400 text-sm mt-1">Configuration et informations de la plateforme</p>
      </div>

      {/* Platform info */}
      <div className="bg-[#111827] rounded-2xl border border-white/5 p-6 space-y-4">
        <h2 className="text-white font-semibold text-sm uppercase tracking-wider">Informations plateforme</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            { label: 'Plateforme', value: 'ArchiCRM' },
            { label: 'Version', value: '1.0.0' },
            { label: 'Base de données', value: 'Supabase (PostgreSQL)' },
            { label: 'Hébergement', value: 'Vercel' },
            { label: 'Région', value: 'EU West' },
            { label: 'Statut', value: 'Opérationnel' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-gray-500">{item.label}</span>
              <span className="text-gray-300 font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
