import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { formatDH, formatDate } from '../utils/format'

const STATUS_COLORS = {
  Nouveau:       'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300',
  Contacté:      'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  'Rendez-vous': 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
  Proposition:   'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
  Gagné:         'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  Perdu:         'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
}

export default function AdminUserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('leads')

  useEffect(() => {
    api.get(`/api/admin/users/${id}/detail`).then(r => {
      setData(r.data)
      setLoading(false)
    }).catch(() => {
      toast.error('Utilisateur introuvable')
      navigate('/users')
    })
  }, [id, navigate])

  const handleSuspend = async () => {
    const action = data.user.status === 'suspended' ? 'réactiver' : 'suspendre'
    if (!window.confirm(`Voulez-vous ${action} ${data.user.name} ?`)) return
    try {
      await api.put(`/api/admin/users/${id}/suspend`)
      const r = await api.get(`/api/admin/users/${id}/detail`)
      setData(r.data)
      toast.success('Statut mis à jour')
    } catch { toast.error('Erreur') }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-400 text-sm">Chargement…</div>
    </div>
  )

  const { user, leads, clients } = data

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back */}
      <button
        onClick={() => navigate('/users')}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Retour aux utilisateurs
      </button>

      {/* User card */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-white/5 p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-600/30 flex items-center justify-center">
              <span className="text-indigo-600 dark:text-indigo-400 text-xl font-bold">{user.name?.[0]?.toUpperCase()}</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
              <p className="text-gray-400 text-sm">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full capitalize">{user.role}</span>
                {user.status === 'suspended' ? (
                  <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700/30 px-2 py-0.5 rounded-full">Suspendu</span>
                ) : (
                  <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/30 px-2 py-0.5 rounded-full">Actif</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleSuspend}
            className={`text-xs font-medium px-4 py-2 rounded-xl transition-colors ${
              user.status === 'suspended'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30'
            }`}
          >
            {user.status === 'suspended' ? 'Réactiver' : 'Suspendre'}
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-white/5">
          {[
            { label: 'Leads',    value: leads.length },
            { label: 'Clients',  value: clients.length },
            { label: 'CA généré', value: formatDH(user.ca) },
            { label: 'Inscrit le', value: formatDate(user.created_at) },
          ].map(item => (
            <div key={item.label}>
              <p className="text-gray-400 text-xs uppercase tracking-wider">{item.label}</p>
              <p className="text-gray-900 dark:text-white font-semibold text-sm mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-[#111827] rounded-xl p-1 w-fit border border-gray-200 dark:border-white/5">
        {[
          { key: 'leads',   label: `Leads (${leads.length})` },
          { key: 'clients', label: `Clients (${clients.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-indigo-600 text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Leads table */}
      {tab === 'leads' && (
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden">
          {leads.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-12">Aucun lead</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-transparent">
                  {['Nom','Statut','Téléphone','Ville','Créé le'].map(h => (
                    <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map(l => (
                  <tr key={l.id} className="border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{l.name}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[l.status] || STATUS_COLORS['Nouveau']}`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{l.phone || '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{l.city || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(l.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Clients table */}
      {tab === 'clients' && (
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden">
          {clients.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-12">Aucun client</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-transparent">
                  {['Client','Type de projet','Valeur','Date clôture'].map(h => (
                    <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c.id} className="border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{c.name}</td>
                    <td className="px-4 py-3 text-gray-400">{c.project_type || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">{formatDH(c.project_value)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(c.closing_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
