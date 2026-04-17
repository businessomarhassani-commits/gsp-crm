import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../utils/api'
import { formatDH, formatDate } from '../utils/format'

const MONTH_NAMES = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

function CustomTooltip({ active, payload, label }) {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-sm font-bold text-navy">{formatDH(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

export default function Finance() {
  const [summary, setSummary] = useState(null)
  const [monthly, setMonthly] = useState([])
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/finance/summary'),
      api.get('/api/finance/monthly'),
      api.get('/api/finance/deals'),
    ]).then(([s, m, d]) => {
      setSummary(s.data)
      // Format monthly data for recharts
      const formatted = m.data.map(row => ({
        ...row,
        name: `${MONTH_NAMES[row.month - 1]} ${String(row.year).slice(2)}`,
      }))
      setMonthly(formatted)
      setDeals(d.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-navy/40 text-sm">Chargement…</div>

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy">Finance</h1>
        <p className="text-gray-500 text-sm mt-1">Vue d'ensemble de votre chiffre d'affaires</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-navy rounded-2xl p-6">
          <p className="text-white/50 text-xs uppercase tracking-wider mb-2">CA Total</p>
          <p className="text-2xl font-bold text-gold">{formatDH(summary?.total_revenue)}</p>
          <p className="text-white/40 text-xs mt-1">{summary?.total_clients} client{summary?.total_clients !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-navy rounded-2xl p-6">
          <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Valeur Moyenne</p>
          <p className="text-2xl font-bold text-gold">{formatDH(summary?.average_value)}</p>
          <p className="text-white/40 text-xs mt-1">par projet clôturé</p>
        </div>
        <div className="bg-navy rounded-2xl p-6">
          <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Projet Max</p>
          <p className="text-2xl font-bold text-gold">{formatDH(summary?.max_value)}</p>
          <p className="text-white/40 text-xs mt-1">meilleure affaire</p>
        </div>
      </div>

      {/* Monthly bar chart */}
      <div className="card p-6">
        <h2 className="font-semibold text-navy text-sm uppercase tracking-wider mb-6">CA Mensuel (12 derniers mois)</h2>
        {monthly.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">Aucune donnée mensuelle disponible</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthly} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9f5eb' }} />
              <Bar dataKey="total" fill="#E8A838" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Deals table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-navy text-sm uppercase tracking-wider">Affaires clôturées</h2>
        </div>
        {deals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32">
            <p className="text-gray-400 text-sm">Aucune affaire clôturée pour l'instant</p>
            <p className="text-xs text-gray-300 mt-1">Les leads marqués "Gagné" apparaissent ici</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Client','Type de projet','Valeur','Date clôture'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deals.map(d => (
                <tr key={d.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3 font-medium text-navy">{d.name}</td>
                  <td className="px-5 py-3 text-gray-500">{d.project_type || '—'}</td>
                  <td className="px-5 py-3 font-semibold text-green-600">{formatDH(d.project_value)}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{formatDate(d.closing_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
