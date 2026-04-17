import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import { formatDH, formatDateTime, isOverdue } from '../utils/format'

export default function Dashboard() {
  const { user, setUser } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/api/dashboard').then(r => {
      setData(r.data)
      // sync user info if needed
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-navy/40 text-sm">Chargement…</div>

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy">Tableau de bord</h1>
        <p className="text-gray-500 text-sm mt-1">Bonjour, {user?.name?.split(' ')[0]} 👋</p>
      </div>

      {/* Stats bar */}
      <div className="bg-navy rounded-2xl p-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Chiffre d'affaires" value={formatDH(data?.total_revenue)} />
        <StatCard label="Clients gagnés"     value={data?.closed_clients ?? 0} />
        <StatCard label="Valeur moyenne"     value={formatDH(data?.average_deal_value)} />
        <StatCard label="Taux de conversion" value={`${data?.conversion_rate ?? 0}%`} />
      </div>

      {/* Two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent leads */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-navy text-sm">Derniers leads</h2>
            <button onClick={() => navigate('/leads')} className="text-xs text-gold hover:underline">Voir tout →</button>
          </div>
          <div className="divide-y divide-gray-50">
            {data?.recent_leads?.length === 0 && (
              <p className="text-center py-8 text-gray-400 text-sm">Aucun lead pour l'instant</p>
            )}
            {data?.recent_leads?.map(lead => (
              <div key={lead.id} onClick={() => navigate('/leads')}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors">
                <div>
                  <p className="text-sm font-medium text-navy">{lead.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{lead.project_type || '—'} · {lead.city || '—'}</p>
                </div>
                <StatusBadge status={lead.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming reminders */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-navy text-sm">Prochains rappels</h2>
            <button onClick={() => navigate('/reminders')} className="text-xs text-gold hover:underline">Voir tout →</button>
          </div>
          <div className="divide-y divide-gray-50">
            {data?.upcoming_reminders?.length === 0 && (
              <p className="text-center py-8 text-gray-400 text-sm">Aucun rappel à venir</p>
            )}
            {data?.upcoming_reminders?.map(r => (
              <div key={r.id} className="px-5 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy truncate">{r.title}</p>
                    {r.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{r.description}</p>}
                  </div>
                  <span className={`text-xs font-medium shrink-0 ${isOverdue(r.reminder_date) ? 'text-red-500' : 'text-gold'}`}>
                    {formatDateTime(r.reminder_date)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
