import { useEffect, useState } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../utils/api'
import { formatDH } from '../utils/format'
import { useTheme } from '../context/ThemeContext'

const MONTH_NAMES = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

function StatCard({ label, value, sub, color = 'indigo' }) {
  const colors = {
    indigo: 'from-indigo-500/10 to-indigo-600/5 border-indigo-500/20 text-indigo-500 dark:text-indigo-400',
    amber:  'from-amber-500/10 to-amber-600/5  border-amber-500/20  text-amber-500  dark:text-amber-400',
  }
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-6`}>
      <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-medium mb-3">{label}</p>
      <p className={`text-2xl font-bold ${colors[color].split(' ').slice(-2).join(' ')}`}>{value}</p>
      {sub && <p className="text-gray-400 dark:text-gray-500 text-xs mt-1.5">{sub}</p>}
    </div>
  )
}

function RevenueTooltip({ active, payload, label, isDark }) {
  if (active && payload?.length) {
    return (
      <div className={`${isDark ? 'bg-[#1f2937] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'} border rounded-xl shadow-xl px-4 py-3`}>
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        <p className="text-sm font-bold">{formatDH(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

function UsersTooltip({ active, payload, label, isDark }) {
  if (active && payload?.length) {
    return (
      <div className={`${isDark ? 'bg-[#1f2937] border-white/10' : 'bg-white border-gray-200'} border rounded-xl shadow-xl px-4 py-3`}>
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        <p className="text-indigo-500 dark:text-indigo-400 text-sm font-bold">{payload[0].value} nouveaux</p>
      </div>
    )
  }
  return null
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  useEffect(() => {
    Promise.all([
      api.get('/api/admin/stats'),
      api.get('/api/admin/analytics'),
    ]).then(([s, a]) => {
      setStats(s.data)
      const monthly = (a.data.monthly || []).map(row => ({
        ...row,
        name: `${MONTH_NAMES[row.month - 1]} ${String(row.year).slice(2)}`
      }))
      setAnalytics({ ...a.data, monthly })
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-400 text-sm">Chargement…</div>
    </div>
  )

  const totalMonthlyRevenue = analytics?.monthly?.reduce((s, m) => s + m.revenue, 0) || 0
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : '#e5e7eb'
  const tickColor = isDark ? '#6b7280' : '#9ca3af'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Tableau de bord</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Vue d'ensemble de la plateforme ArchiCRM</p>
      </div>

      {/* KPI grid — 2 cards */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label="Utilisateurs"
          value={stats?.total_users ?? 0}
          sub={`${stats?.active_users ?? 0} actifs`}
          color="indigo"
        />
        <StatCard
          label="CA plateforme"
          value={formatDH(stats?.total_revenue)}
          sub="toutes périodes"
          color="amber"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue chart */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-white/5">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-gray-900 dark:text-white font-semibold text-sm">Revenus mensuels</h2>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">12 derniers mois</p>
            </div>
            <span className="text-indigo-500 dark:text-indigo-400 font-bold text-sm">{formatDH(totalMonthlyRevenue)}</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={analytics?.monthly || []} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <Tooltip content={<RevenueTooltip isDark={isDark} />} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revenueGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* New users chart */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-white/5">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-gray-900 dark:text-white font-semibold text-sm">Nouveaux utilisateurs</h2>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">12 derniers mois</p>
            </div>
            <span className="text-emerald-500 dark:text-emerald-400 font-bold text-sm">{stats?.total_users ?? 0} au total</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={analytics?.monthly || []} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<UsersTooltip isDark={isDark} />} />
              <Bar dataKey="new_users" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {[
          { label: 'Gérer les utilisateurs', sub: `${stats?.total_users ?? 0} comptes`, href: '/admin/users' },
          { label: 'Analytics détaillées',   sub: 'Tendances & revenus',                href: '/admin/analytics' },
          { label: 'Paramètres plateforme',  sub: 'Profil & configuration',             href: '/admin/settings' },
        ].map(item => (
          <a
            key={item.href}
            href={item.href}
            className="bg-white dark:bg-[#111827] hover:bg-gray-50 dark:hover:bg-[#1a2234] border border-gray-200 dark:border-white/5 rounded-2xl p-5 flex items-center justify-between group transition-colors"
          >
            <div>
              <p className="text-gray-900 dark:text-white text-sm font-medium">{item.label}</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">{item.sub}</p>
            </div>
            <svg className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        ))}
      </div>
    </div>
  )
}
