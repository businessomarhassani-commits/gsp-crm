import { useEffect, useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import api from '../utils/api'
import { formatDH } from '../utils/format'
import { useTheme } from '../context/ThemeContext'

const MONTH_NAMES = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

function ChartTooltip({ active, payload, label, isDark }) {
  if (!active || !payload?.length) return null
  return (
    <div className={`${isDark ? 'bg-[#1f2937] border-white/10' : 'bg-white border-gray-200'} border rounded-xl shadow-xl px-4 py-3 space-y-1`}>
      <p className="text-gray-400 text-xs mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-400">{p.name}:</span>
          <span className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold`}>
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
  const { theme } = useTheme()
  const isDark = theme === 'dark'

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
      <div className="text-gray-400 text-sm">Chargement…</div>
    </div>
  )

  const totalRevenue = analytics.monthly.reduce((s, m) => s + m.revenue, 0)
  const totalNewUsers = analytics.monthly.reduce((s, m) => s + m.new_users, 0)
  const peakRevenueMonth = analytics.monthly.reduce((a, b) => b.revenue > a.revenue ? b : a, analytics.monthly[0] || {})
  const peakUsersMonth = analytics.monthly.reduce((a, b) => b.new_users > a.new_users ? b : a, analytics.monthly[0] || {})

  const gridColor = isDark ? 'rgba(255,255,255,0.04)' : '#e5e7eb'
  const tickColor = isDark ? '#6b7280' : '#9ca3af'
  const legendStyle = { fontSize: '12px', color: isDark ? '#9ca3af' : '#6b7280', paddingTop: '16px' }

  const card = 'bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-white/5 p-5'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Tendances plateforme sur les 12 derniers mois</p>
      </div>

      {/* Summary cards — 3 cards (no Taux conversion) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'CA 12 mois',     value: formatDH(totalRevenue), color: 'text-indigo-500 dark:text-indigo-400' },
          { label: 'Nouveaux users', value: totalNewUsers,           color: 'text-emerald-500 dark:text-emerald-400' },
          { label: 'Mois record',    value: peakRevenueMonth.name || '—', color: 'text-violet-500 dark:text-violet-400' },
        ].map(c => (
          <div key={c.label} className={card}>
            <p className="text-gray-400 text-xs uppercase tracking-wider font-medium mb-3">{c.label}</p>
            <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Combined line chart */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-white/5 p-6">
        <h2 className="text-gray-900 dark:text-white font-semibold text-sm mb-1">Revenus & Croissance utilisateurs</h2>
        <p className="text-gray-400 dark:text-gray-500 text-xs mb-6">Évolution mensuelle sur 12 mois</p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={analytics.monthly} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left"  tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<ChartTooltip isDark={isDark} />} />
            <Legend wrapperStyle={legendStyle} />
            <Line yAxisId="left"  type="monotone" dataKey="revenue"   name="Revenus"         stroke="#6366f1" strokeWidth={2} dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="new_users" name="Nouveaux users"  stroke="#10b981" strokeWidth={2} dot={false} strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bar charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-white/5 p-6">
          <h2 className="text-gray-900 dark:text-white font-semibold text-sm mb-1">Revenus par mois</h2>
          <p className="text-gray-400 dark:text-gray-500 text-xs mb-6">
            Pic : {peakRevenueMonth.name} — {formatDH(peakRevenueMonth.revenue || 0)}
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics.monthly} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <Tooltip content={<ChartTooltip isDark={isDark} />} />
              <Bar dataKey="revenue" name="Revenus" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-white/5 p-6">
          <h2 className="text-gray-900 dark:text-white font-semibold text-sm mb-1">Nouveaux utilisateurs</h2>
          <p className="text-gray-400 dark:text-gray-500 text-xs mb-6">
            Pic : {peakUsersMonth.name} — {peakUsersMonth.new_users || 0} inscrits
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics.monthly} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip isDark={isDark} />} />
              <Bar dataKey="new_users" name="Nouveaux users" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
