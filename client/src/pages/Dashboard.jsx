import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import StatusBadge from '../components/StatusBadge'
import { formatDH, formatDateTime, isOverdue } from '../utils/format'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const STATUS_COLORS = {
  'Nouveau':          '#E8A838',
  'Contacté':         '#3b82f6',
  'RDV fixé':         '#8b5cf6',
  'Proposition':      '#f59e0b',
  'Gagné':            '#10b981',
  'Perdu':            '#ef4444',
  'Sans réponse':     '#6b7280',
}

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/[0.06] rounded-xl p-5">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30 mb-2">{label}</p>
      <p className="text-[28px] font-bold text-gray-900 dark:text-white leading-none">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/10 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-gray-700 dark:text-white mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/api/dashboard').then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Chargement…</div>
  )

  const convRate = data?.conversion_rate ?? 0
  const statusData = data?.status_distribution || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[20px] sm:text-[22px] font-bold text-gray-900 dark:text-white">Tableau de bord</h1>
        <p className="text-gray-400 text-sm mt-0.5">Bonjour, {user?.name?.split(' ')[0]}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Chiffre d'affaires"
          value={formatDH(data?.total_revenue)}
        />
        <StatCard
          label="Leads ce mois"
          value={data?.monthly_chart?.[5]?.leads ?? 0}
          sub={`${data?.total_leads ?? 0} total`}
        />
        <StatCard
          label="Taux de conversion"
          value={`${convRate}%`}
          sub={`${data?.won_leads ?? 0} gagnés`}
        />
        <StatCard
          label="Clients gagnés"
          value={data?.closed_clients ?? 0}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Area chart — 60% */}
        <div className="lg:col-span-3 bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/[0.06] rounded-xl p-4 sm:p-5">
          <h2 className="text-[13px] font-semibold text-gray-700 dark:text-white mb-4">Activité des leads</h2>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data?.monthly_chart || []} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E8A838" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#E8A838" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorClients" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="leads"   name="Leads reçus"    stroke="#E8A838" strokeWidth={2} fill="url(#colorLeads)"   dot={false} />
              <Area type="monotone" dataKey="clients" name="Clients gagnés" stroke="#10b981" strokeWidth={2} fill="url(#colorClients)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-[11px] text-gray-400"><span className="w-3 h-0.5 bg-[#E8A838] rounded" />Leads reçus</span>
            <span className="flex items-center gap-1.5 text-[11px] text-gray-400"><span className="w-3 h-0.5 bg-emerald-500 rounded" />Clients gagnés</span>
          </div>
        </div>

        {/* Donut chart — 40% */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/[0.06] rounded-xl p-4 sm:p-5">
          <h2 className="text-[13px] font-semibold text-gray-700 dark:text-white mb-4">Répartition des statuts</h2>
          {statusData.length === 0 ? (
            <div className="flex items-center justify-center h-[180px] text-gray-300 text-sm">Aucune donnée</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  dataKey="count"
                  nameKey="status"
                  paddingAngle={2}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#9ca3af'} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent leads */}
        <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/[0.06] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-white/[0.06]">
            <h2 className="font-semibold text-gray-700 dark:text-white text-[13px]">Derniers leads</h2>
            <button onClick={() => navigate('/leads')} className="text-xs text-[#E8A838] hover:underline">Voir tout →</button>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-white/[0.04]">
            {data?.recent_leads?.length === 0 && (
              <p className="text-center py-8 text-gray-400 text-sm">Aucun lead pour l'instant</p>
            )}
            {data?.recent_leads?.map(lead => (
              <div key={lead.id} onClick={() => navigate('/leads')}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{lead.name}</p>
                    {lead.source === 'Meta Ads' && (
                      <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded">
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/></svg>
                        Meta
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{lead.project_type || '—'} · {lead.city || '—'}</p>
                </div>
                <StatusBadge status={lead.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming reminders */}
        <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/[0.06] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-white/[0.06]">
            <h2 className="font-semibold text-gray-700 dark:text-white text-[13px]">Prochains rappels</h2>
            <button onClick={() => navigate('/reminders')} className="text-xs text-[#E8A838] hover:underline">Voir tout →</button>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-white/[0.04]">
            {data?.upcoming_reminders?.length === 0 && (
              <p className="text-center py-8 text-gray-400 text-sm">Aucun rappel à venir</p>
            )}
            {data?.upcoming_reminders?.map(r => (
              <div key={r.id} className="px-5 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{r.title}</p>
                    {r.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{r.description}</p>}
                  </div>
                  <span className={`text-xs font-medium shrink-0 ${isOverdue(r.reminder_date) ? 'text-red-500' : 'text-[#E8A838]'}`}>
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
