export default function AdminSettings() {
  const plans = [
    {
      key: 'free',
      name: 'Free',
      price: '0 DH',
      features: ['Jusqu\'à 50 leads', '1 utilisateur', 'Pipeline de base', 'Support email'],
      color: 'border-gray-600/30 bg-gray-900/30',
      badge: 'bg-gray-700/50 text-gray-300',
    },
    {
      key: 'basic',
      name: 'Basic',
      price: '299 DH / mois',
      features: ['Leads illimités', '3 utilisateurs', 'Pipeline avancé', 'Rappels & finance', 'Support prioritaire'],
      color: 'border-blue-600/30 bg-blue-900/10',
      badge: 'bg-blue-900/40 text-blue-300',
      popular: true,
    },
    {
      key: 'pro',
      name: 'Pro',
      price: '699 DH / mois',
      features: ['Tout Basic +', 'Utilisateurs illimités', 'API externe', 'Analytics avancées', 'Support dédié', 'Export CSV'],
      color: 'border-violet-600/30 bg-violet-900/10',
      badge: 'bg-violet-900/40 text-violet-300',
    },
  ]

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Paramètres plateforme</h1>
        <p className="text-gray-400 text-sm mt-1">Configuration et plans d'abonnement</p>
      </div>

      {/* Plans */}
      <div>
        <h2 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Plans disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map(plan => (
            <div key={plan.key} className={`rounded-2xl border p-6 relative ${plan.color}`}>
              {plan.popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs bg-blue-600 text-white px-3 py-0.5 rounded-full font-semibold whitespace-nowrap">
                  Populaire
                </span>
              )}
              <div className="flex items-start justify-between mb-4">
                <span className={`text-xs font-semibold border px-2.5 py-1 rounded-full ${plan.badge}`}>{plan.name}</span>
              </div>
              <p className="text-white font-bold text-xl mb-1">{plan.price}</p>
              <ul className="space-y-2 mt-4">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-400">
                    <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-gray-600 text-xs mt-3">* Gestion des plans — fonctionnalité de paiement à intégrer (Stripe / CMI)</p>
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
