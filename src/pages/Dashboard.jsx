import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, FunnelChart, Funnel, Cell, LineChart, Line } from 'recharts'
import { TrendingUp, Users, UserCheck, DollarSign, CheckCircle2, Phone, Mail, MessageCircle, Briefcase, DoorOpen, ArrowRight, Star } from 'lucide-react'
import { useAnalytics } from '../hooks/useAnalytics'
import { useTodayTasks } from '../hooks/useTasks'
import { useCompleteTask } from '../hooks/useTasks'
import { useUIStore } from '../store/useUIStore'
import { useCurrencyStore } from '../store/useCurrencyStore'
import { GlassCard } from '../components/ui/GlassCard'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { StatusPill } from '../components/ui/StatusPill'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { OUTREACH_TYPES } from '../lib/constants'
import { formatCurrency } from '../lib/currency'
import { format } from 'date-fns'

const FUNNEL_COLORS = ['#94a3b8','#3b82f6','#8b5cf6','#f59e0b','#10b981','#ef4444','#06b6d4']

const OUTREACH_ICONS = {
  cold_call: Phone,
  cold_email: Mail,
  instagram_dm: MessageCircle,
  linkedin_message: Briefcase,
  door_to_door: DoorOpen,
}

function KpiCard({ label, value, icon: Icon, color, change }) {
  const { theme } = useUIStore()
  const isDark = theme === 'dark'
  return (
    <GlassCard className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-medium uppercase tracking-widest ${isDark ? 'text-white/40' : 'text-slate-400'}`}>{label}</p>
          <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</p>
          {change !== undefined && (
            <p className={`text-xs mt-1.5 ${Number(change) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {Number(change) >= 0 ? '+' : ''}{change}%
            </p>
          )}
        </div>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: color + '18' }}>
          <Icon size={22} style={{ color }} />
        </div>
      </div>
    </GlassCard>
  )
}

function TaskItem({ task, onComplete }) {
  const { theme } = useUIStore()
  const isDark = theme === 'dark'
  const isOverdue = task.due_date < format(new Date(), 'yyyy-MM-dd')
  const Icon = OUTREACH_ICONS[task.outreach_type] || CheckCircle2
  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl transition-colors ${isDark ? 'hover:bg-white/4' : 'hover:bg-black/3'}`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isOverdue ? 'bg-red-500/15' : 'bg-blue-500/15'}`}>
        <Icon size={15} className={isOverdue ? 'text-red-400' : 'text-blue-400'} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isDark ? 'text-white/85' : 'text-slate-700'}`}>
          {task.prospects?.full_name || 'Unknown'}
        </p>
        <p className={`text-xs truncate ${isDark ? 'text-white/35' : 'text-slate-400'}`}>
          {task.prospects?.business_name} · {isOverdue ? <span className="text-red-400">Overdue</span> : 'Today'}
        </p>
      </div>
      <button
        onClick={() => onComplete(task.id)}
        className={`shrink-0 w-6 h-6 rounded-lg border flex items-center justify-center cursor-pointer transition-colors ${isDark ? 'border-white/15 hover:bg-green-500/20 hover:border-green-500/40' : 'border-black/10 hover:bg-green-50 hover:border-green-300'}`}
      >
        <CheckCircle2 size={12} className={isDark ? 'text-white/25' : 'text-slate-300'} />
      </button>
    </div>
  )
}

export default function Dashboard() {
  const { data: analytics, isLoading } = useAnalytics()
  const { data: todayTasks } = useTodayTasks()
  const { mutate: completeTask } = useCompleteTask()
  const { theme } = useUIStore()
  const { activeCurrency, rates } = useCurrencyStore()
  const navigate = useNavigate()
  const isDark = theme === 'dark'

  if (isLoading) return <PageLoader />

  const totalMRR = formatCurrency(analytics?.totalMRR || 0, 'MAD')
  const bestNiche = analytics?.nicheStats?.sort((a, b) => (b.clients || 0) - (a.clients || 0))[0]

  const outreachData = analytics?.outreachByType?.map(o => ({
    name: OUTREACH_TYPES.find(t => t.value === o.type)?.label?.split(' ')[0] || o.type,
    count: o.count,
  })) || []

  const funnelData = analytics?.funnel?.filter(f => f.count > 0).map((f, i) => ({
    name: f.status.replace(/_/g, ' '),
    value: f.count,
    fill: FUNNEL_COLORS[i % FUNNEL_COLORS.length],
  })) || []

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        subtitle={`${format(new Date(), 'EEEE, MMMM d yyyy')}`}
        actions={<Button variant="secondary" size="sm" onClick={() => navigate('/prospects')}>View Prospects</Button>}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard label="Total MRR" value={totalMRR} icon={DollarSign} color="#10b981" />
        <KpiCard label="Active Clients" value={analytics?.totalClients || 0} icon={UserCheck} color="#3b82f6" />
        <KpiCard label="Total Prospects" value={analytics?.totalProspects || 0} icon={Users} color="#8b5cf6" />
        <KpiCard label="Conversion Rate" value={`${analytics?.conversionRate || 0}%`} icon={TrendingUp} color="#f59e0b" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Outreach Chart */}
        <GlassCard className="col-span-1 lg:col-span-2 p-7">
          <h3 className={`text-base font-semibold mb-5 ${isDark ? 'text-white/80' : 'text-slate-700'}`}>Weekly Outreach Activity</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analytics?.weeks || []} barSize={24}>
              <XAxis dataKey="label" tick={{ fill: isDark ? 'rgba(255,255,255,0.3)' : '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: isDark ? 'rgba(255,255,255,0.3)' : '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: isDark ? 'rgba(14,20,32,0.9)' : '#fff', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0', borderRadius: 10, fontSize: 12 }}
                cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Today's Tasks */}
        <GlassCard className="p-7">
          <div className="flex items-center justify-between mb-5">
            <h3 className={`text-base font-semibold ${isDark ? 'text-white/80' : 'text-slate-700'}`}>Today's Follow-ups</h3>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
              {todayTasks?.length || 0}
            </span>
          </div>
          {todayTasks?.length === 0 ? (
            <div className="flex flex-col items-center py-8">
              <CheckCircle2 size={32} className="text-emerald-400 mb-3" />
              <p className={`text-sm ${isDark ? 'text-white/40' : 'text-slate-400'}`}>All clear for today!</p>
            </div>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {todayTasks?.slice(0, 6).map(t => (
                <TaskItem key={t.id} task={t} onComplete={completeTask} />
              ))}
            </div>
          )}
          <Button variant="ghost" size="sm" className="w-full mt-4 justify-center" onClick={() => navigate('/tasks')}>
            View all tasks <ArrowRight size={13} />
          </Button>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Outreach by type */}
        <GlassCard className="p-7">
          <h3 className={`text-base font-semibold mb-5 ${isDark ? 'text-white/80' : 'text-slate-700'}`}>Outreach Breakdown</h3>
          <div className="space-y-4">
            {outreachData.map((o, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className={`text-xs w-16 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>{o.name}</span>
                <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/6' : 'bg-black/6'}`}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (o.count / Math.max(...outreachData.map(x => x.count), 1)) * 100)}%` }}
                    transition={{ duration: 0.6, delay: i * 0.08 }}
                    className="h-full rounded-full bg-blue-500"
                  />
                </div>
                <span className={`text-xs font-semibold w-6 text-right ${isDark ? 'text-white/60' : 'text-slate-600'}`}>{o.count}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Per-niche stats */}
        <GlassCard className="col-span-1 lg:col-span-2 p-7">
          <div className="flex items-center justify-between mb-5">
            <h3 className={`text-base font-semibold ${isDark ? 'text-white/80' : 'text-slate-700'}`}>Performance by Niche</h3>
            <Button variant="ghost" size="xs" onClick={() => navigate('/niches')}>View all</Button>
          </div>
          {analytics?.nicheStats?.length === 0 ? (
            <p className={`text-sm text-center py-8 ${isDark ? 'text-white/30' : 'text-slate-400'}`}>No niche data yet. <button onClick={() => navigate('/niches')} className="text-blue-400 underline cursor-pointer">Create niches</button></p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    {['Niche','Prospects','Clients','Rate','MRR'].map(h => (
                      <th key={h} className={`text-xs font-medium text-left pb-3 pr-4 ${isDark ? 'text-white/35' : 'text-slate-400'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {analytics?.nicheStats?.map((n, i) => (
                    <tr key={i} className="table-row-hover">
                      <td className="pr-4 py-3">
                        <div className="flex items-center gap-2">
                          {bestNiche?.name === n.name && <Star size={11} className="text-amber-400 shrink-0" />}
                          <span className="font-medium" style={{ color: n.color }}>{n.name}</span>
                        </div>
                      </td>
                      <td className={`pr-4 py-3 ${isDark ? 'text-white/60' : 'text-slate-600'}`}>{n.prospects}</td>
                      <td className={`pr-4 py-3 ${isDark ? 'text-white/60' : 'text-slate-600'}`}>{n.clients || 0}</td>
                      <td className="pr-4 py-3">
                        <span className="text-xs font-medium text-emerald-400">
                          {n.prospects > 0 ? ((n.clients / n.prospects) * 100).toFixed(0) : 0}%
                        </span>
                      </td>
                      <td className={`py-3 ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                        {formatCurrency(n.mrr || 0, 'MAD')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Conversion Funnel */}
      <GlassCard className="p-7">
        <h3 className={`text-base font-semibold mb-5 ${isDark ? 'text-white/80' : 'text-slate-700'}`}>Pipeline Funnel</h3>
        <div className="flex items-end gap-4 overflow-x-auto pb-2">
          {analytics?.funnel?.map((f, i) => {
            const max = Math.max(...(analytics.funnel.map(x => x.count)), 1)
            const pct = Math.max(16, (f.count / max) * 120)
            return (
              <div key={f.status} className="flex flex-col items-center gap-2.5 flex-1 min-w-[70px]">
                <span className={`text-sm font-bold ${isDark ? 'text-white/80' : 'text-slate-700'}`}>{f.count}</span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${pct}px` }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="w-full rounded-t-lg"
                  style={{ background: FUNNEL_COLORS[i % FUNNEL_COLORS.length] + '80', minHeight: 16 }}
                />
                <span className={`text-xs text-center ${isDark ? 'text-white/40' : 'text-slate-500'}`} style={{ fontSize: 11 }}>
                  {f.status.replace(/_/g, ' ')}
                </span>
              </div>
            )
          })}
        </div>
      </GlassCard>
    </div>
  )
}
