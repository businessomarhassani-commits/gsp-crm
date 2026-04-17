import { useEffect, useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import api from '../utils/api'
import { formatDH } from '../utils/format'

const MONTH_NAMES = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1f2937] border border-white/10 rounded-xl shadow-xl px-4 py-3 space-y-1">
      <p className="text-gray-400 text-xs mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-400">{p.name}:</span>
          <span className="text-white font-semibold">
            {p.name === 'Revenus' ? formatDH(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/admin/analytics').then(r => {
      const monthly = (r.data.monthly || []).map(row => ({
        ...row,
        name: `${MONTH_NAMES[row.month - 1]} ${String(row.year).slice(2)}`
      }))
      setAnalytics({ ...r.data, monthly })
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-500 text-sm">Chargement…</div>
    </div>
  )

  const totalRevenue = analytics.monthly.reduce((s, m) => s + m.revenue, 0)
  const totalNewUsers = analytics.monthly.reduce((s, m) => s + m.new_users, 0)
  const peakRevenueMonth = analytics.monthly.reduce((a, b) => b.revenue > a.revenue ? b : a, analytics.monthly[0] || {})
  const peakUsersMonth = analytics.monthly.reduce((a, b) => b.new_users > a.new_users ? b : a, analytics.monthly[0] || {})

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-gray-400 text-sm mt-1">Tendances plateforme sur les 12 derniers mois</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'CA 12 mois', value: formatDH(totalRevenue), color: 'text-indigo-400' },
          { label: 'Nouveaux users', value: totalNewUsers, color: 'text-emerald-400' },
          { label: 'Taux conversion', value: `${analytics.conversion_rate}%`, color: 'text-amber-400' },
          { label: 'Mois record', value: peakRevenueMonth.name || '—', color: 'text-violet-400' },
        ].map(c => (
          <div key={c.label} className="bg-[#111827] rounded-2xl border border-white/5 p-5">
            <p className="text-gray-500 text-xs uppercase tracking-wider font-medium mb-3">{c.label}</p>
            <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Combined line chart */}
      <div className="bg-[#111827] rounded-2xl border border-white/5 p-6">
        <h2 className="text-white font-semibold text-sm mb-1">Revenus & Croissance utilisateurs</h2>
        <p className="text-gray-500 text-xs mb-6">Évolution mensuelle sur 12 mois</p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={analytics.monthly} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<DarkTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', color: '#9ca3af', paddingTop: '16px' }} />
            <Line yAxisId="left" type="monotone" dataKey="revenue" name="Revenus" stroke="#6366f1" strokeWidth={2} dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="new_users" name="Nouveaux users" stroke="#10b981" strokeWidth={2} dot={false} strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bar charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111827] rounded-2xl border border-white/5 p-6">
          <h2 className="text-white font-semibold text-sm mb-1">Revenus par mois</h2>
          <p className="text-gray-500 text-xs mb-6">Pic : {peakRevenueMonth.name} — {formatDH(peakRevenueMonth.revenue || 0)}</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics.monthly} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <Tooltip content={<DarkTooltip />} />
              <Bar dataKey="revenue" name="Revenus" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#111827] rounded-2xl border border-white/5 p-6">
          <h2 className="text-white font-semibold text-sm mb-1">Nouveaux utilisateurs</h2>
          <p className="text-gray-500 text-xs mb-6">Pic : {peakUsersMonth.name} — {peakUsersMonth.new_users || 0} inscrits</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics.monthly} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<DarkTooltip />} />
              <Bar dataKey="new_users" name="Nouveaux users" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Conversion funnel */}
      <div className="bg-[#111827] rounded-2xl border border-white/5 p-6">
        <h2 className="text-white font-semibold text-sm mb-4">Entonnoir de conversion</h2>
        <div className="flex items-end gap-4 h-24">
          {[
            { label: 'Total leads', value: analytics.total_leads, pct: 100, color: 'bg-indigo-600' },
            { label: 'Leads gagnés', value: analytics.won_leads, pct: analytics.total_leads > 0 ? (analytics.won_leads / analytics.total_leads) * 100 : 0, color: 'bg-emerald-500' },
          ].map(item => (
            <div key={item.label} className="flex-1 flex flex-col items-center gap-2">
              <p className="text-white font-bold text-lg">{item.value}</p>
              <div className="w-full rounded-t-lg" style={{ height: `${Math.max(item.pct * 0.8, 4)}px`, background: item.color === 'bg-indigo-600' ? '#6366f1' : '#10b981' }} />
              <p className="text-gray-500 text-xs text-center">{item.label}</p>
              <p className="text-gray-400 text-xs font-semibold">{Math.round(item.pct)}%</p>
            </div>
          ))}
          <div className="flex-1 flex flex-col items-center gap-2">
            <p className="text-amber-400 font-bold text-lg">{analytics.conversion_rate}%</p>
            <div className="w-full rounded-t-lg bg-amber-500" style={{ height: `${Math.max(analytics.conversion_rate * 0.8, 4)}px` }} />
            <p className="text-gray-500 text-xs text-center">Taux de conversion</p>
            <p className="text-gray-400 text-xs font-semibold">global</p>
          </div>
        </div>
      </div>
    </div>
  )
}
