import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { formatDH, formatDate } from '../utils/format'

const PLAN_STYLES = {
  free: 'bg-gray-700/50 text-gray-300 border-gray-600/40',
  basic: 'bg-blue-900/40 text-blue-300 border-blue-700/40',
  pro: 'bg-violet-900/40 text-violet-300 border-violet-700/40',
}

const STATUS_COLORS = {
  Nouveau: 'bg-gray-700/50 text-gray-300',
  Contacté: 'bg-blue-900/40 text-blue-300',
  'Rendez-vous': 'bg-purple-900/40 text-purple-300',
  Proposition: 'bg-yellow-900/40 text-yellow-300',
  Gagné: 'bg-emerald-900/40 text-emerald-300',
  Perdu: 'bg-red-900/40 text-red-300',
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
      navigate('/admin/users')
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

  const handlePlanChange = async (plan) => {
    try {
      await api.put(`/api/admin/users/${id}`, { plan })
      const r = await api.get(`/api/admin/users/${id}/detail`)
      setData(r.data)
      toast.success('Plan mis à jour')
    } catch { toast.error('Erreur') }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-500 text-sm">Chargement…</div>
    </div>
  )

  const { user, leads, clients } = data

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back */}
      <button
        onClick={() => navigate('/admin/users')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Retour aux utilisateurs
      </button>

      {/* User card */}
      <div className="bg-[#111827] rounded-2xl border border-white/5 p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-600/30 flex items-center justify-center">
              <span className="text-indigo-400 text-xl font-bold">{user.name?.[0]?.toUpperCase()}</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{user.name}</h1>
              <p className="text-gray-400 text-sm">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full capitalize">{user.role}</span>
                <span className={`text-xs border px-2 py-0.5 rounded-full capitalize ${PLAN_STYLES[user.plan || 'free']}`}>{user.plan || 'free'}</span>
                {user.status === 'suspended' ? (
                  <span className="text-xs bg-red-900/30 text-red-400 border border-red-700/30 px-2 py-0.5 rounded-full">Suspendu</span>
                ) : (
                  <span className="text-xs bg-emerald-900/30 text-emerald-400 border border-emerald-700/30 px-2 py-0.5 rounded-full">Actif</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={user.plan || 'free'}
              onChange={e => handlePlanChange(e.target.value)}
              className="text-xs bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-gray-300 focus:outline-none focus:border-indigo-500/50"
            >
              <option value="free">Plan: Free</option>
              <option value="basic">Plan: Basic</option>
              <option value="pro">Plan: Pro</option>
            </select>
            <button
              onClick={handleSuspend}
              className={`text-xs font-medium px-4 py-2 rounded-xl transition-colors ${
                user.status === 'suspended'
                  ? 'bg-emerald-900/20 text-emerald-400 hover:bg-emerald-900/30'
                  : 'bg-amber-900/20 text-amber-400 hover:bg-amber-900/30'
              }`}
            >
              {user.status === 'suspended' ? 'Réactiver' : 'Suspendre'}
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/5">
          {[
            { label: 'Leads', value: leads.length },
            { label: 'Clients', value: clients.length },
            { label: 'CA généré', value: formatDH(user.ca) },
            { label: 'Inscrit le', value: formatDate(user.created_at) },
          ].map(item => (
            <div key={item.label}>
              <p className="text-gray-500 text-xs uppercase tracking-wider">{item.label}</p>
              <p className="text-white font-semibold text-sm mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#111827] rounded-xl p-1 w-fit border border-white/5">
        {[
          { key: 'leads', label: `Leads (${leads.length})` },
          { key: 'clients', label: `Clients (${clients.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Leads table */}
      {tab === 'leads' && (
        <div className="bg-[#111827] rounded-2xl border border-white/5 overflow-hidden">
          {leads.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-12">Aucun lead</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Nom','Statut','Téléphone','Ville','Créé le'].map(h => (
                    <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map(l => (
                  <tr key={l.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{l.name}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[l.status] || 'bg-gray-700/50 text-gray-300'}`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{l.phone || '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{l.city || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(l.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Clients table */}
      {tab === 'clients' && (
        <div className="bg-[#111827] rounded-2xl border border-white/5 overflow-hidden">
          {clients.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-12">Aucun client</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Client','Type de projet','Valeur','Date clôture'].map(h => (
                    <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                    <td className="px-4 py-3 text-gray-400">{c.project_type || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-400">{formatDH(c.project_value)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(c.closing_date)}</td>
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
