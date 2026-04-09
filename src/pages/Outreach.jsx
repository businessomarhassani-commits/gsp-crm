import { useState } from 'react'
import { Megaphone, Phone, Mail, MessageCircle, Briefcase, DoorOpen } from 'lucide-react'
import { useAllOutreach } from '../hooks/useOutreach'
import { useUIStore } from '../store/useUIStore'
import { GlassCard } from '../components/ui/GlassCard'
import { PageHeader } from '../components/ui/PageHeader'
import { FormSelect, Input } from '../components/ui/Input'
import { EmptyState } from '../components/ui/EmptyState'
import { PageLoader, SkeletonRow } from '../components/ui/LoadingSpinner'
import { OUTREACH_TYPES } from '../lib/constants'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

const ICONS = { cold_call: Phone, cold_email: Mail, instagram_dm: MessageCircle, linkedin_message: Briefcase, door_to_door: DoorOpen }
const COLORS = { cold_call: '#10b981', cold_email: '#3b82f6', instagram_dm: '#ec4899', linkedin_message: '#0ea5e9', door_to_door: '#f59e0b' }

export default function Outreach() {
  const { theme } = useUIStore()
  const isDark = theme === 'dark'
  const [typeFilter, setTypeFilter] = useState('')
  const [period, setPeriod] = useState('all')

  const today = format(new Date(), 'yyyy-MM-dd')
  const weekStart = format(startOfWeek(new Date()), 'yyyy-MM-dd')
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')

  const filters = {
    type: typeFilter || undefined,
    from: period === 'week' ? weekStart : period === 'month' ? monthStart : undefined,
    to: period !== 'all' ? today : undefined,
  }

  const { data: logs, isLoading } = useAllOutreach(filters)

  const stats = OUTREACH_TYPES.map(t => ({
    ...t,
    count: logs?.filter(l => l.type === t.value).length || 0
  }))

  return (
    <div className="space-y-5">
      <PageHeader title="Outreach" subtitle={`${logs?.length || 0} total interactions logged`} />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {stats.map(s => {
          const Icon = ICONS[s.value] || Megaphone
          const color = COLORS[s.value] || '#3b82f6'
          return (
            <GlassCard key={s.value} className="p-4 text-center">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: color + '20' }}>
                <Icon size={16} style={{ color }} />
              </div>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{s.count}</p>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>{s.label.split(' ')[0]}</p>
            </GlassCard>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <FormSelect value={typeFilter} onChange={e => setTypeFilter(e.target.value)} wrapperClass="flex-1 min-w-36">
          <option value="">All Types</option>
          {OUTREACH_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </FormSelect>
        <div className={`flex items-center rounded-xl p-1 gap-0.5 ${isDark ? 'bg-white/6' : 'bg-black/5'}`}>
          {[['all','All'],['week','This Week'],['month','This Month']].map(([v, l]) => (
            <button key={v} onClick={() => setPeriod(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${period === v ? (isDark ? 'bg-white/12 text-white' : 'bg-white text-slate-700 shadow-sm') : (isDark ? 'text-white/40' : 'text-slate-400')}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Log Table */}
      <GlassCard className="overflow-hidden">
        {isLoading ? (
          <table className="w-full"><tbody>{Array(5).fill(0).map((_, i) => <SkeletonRow key={i} cols={5} />)}</tbody></table>
        ) : !logs?.length ? (
          <EmptyState icon={Megaphone} title="No outreach logged" message="Log your first call, email, or DM from a prospect's profile." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isDark ? 'border-white/6' : 'border-black/6'}`}>
                  {['Prospect','Type','Date','Outcome','Notes','By'].map(h => (
                    <th key={h} className={`text-xs font-medium text-left px-4 py-3 ${isDark ? 'text-white/35' : 'text-slate-400'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(l => {
                  const Icon = ICONS[l.type] || Megaphone
                  const color = COLORS[l.type] || '#3b82f6'
                  return (
                    <tr key={l.id} className={`border-b table-row-hover ${isDark ? 'border-white/4' : 'border-black/4'}`}>
                      <td className="px-4 py-3">
                        <p className={`font-medium ${isDark ? 'text-white/85' : 'text-slate-700'}`}>{l.prospects?.full_name || '—'}</p>
                        {l.prospects?.business_name && <p className={`text-xs ${isDark ? 'text-white/35' : 'text-slate-400'}`}>{l.prospects.business_name}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Icon size={13} style={{ color }} />
                          <span className="text-xs font-medium" style={{ color }}>{OUTREACH_TYPES.find(t => t.value === l.type)?.label}</span>
                        </div>
                      </td>
                      <td className={`px-4 py-3 text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>{format(new Date(l.date), 'MMM d, yyyy')}</td>
                      <td className={`px-4 py-3 text-xs ${isDark ? 'text-white/55' : 'text-slate-600'}`}>{l.outcome || '—'}</td>
                      <td className={`px-4 py-3 text-xs max-w-[200px] truncate ${isDark ? 'text-white/45' : 'text-slate-500'}`}>{l.notes || '—'}</td>
                      <td className={`px-4 py-3 text-xs ${isDark ? 'text-white/35' : 'text-slate-400'}`}>{l.profiles?.full_name || 'You'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
