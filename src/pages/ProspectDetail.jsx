import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft, Phone, Mail, MessageCircle, Briefcase, Globe, MapPin,
  MessageSquare, Edit2, Plus, Trash2, CheckCircle2, Clock, DoorOpen, Calendar
} from 'lucide-react'
import { useProspect, useUpdateProspect } from '../hooks/useProspects'
import { useOutreachLogs, useCreateOutreach, useDeleteOutreach } from '../hooks/useOutreach'
import { useCreateTask } from '../hooks/useTasks'
import { useNiches } from '../hooks/useNiches'
import { useUIStore } from '../store/useUIStore'
import { GlassCard } from '../components/ui/GlassCard'
import { Button } from '../components/ui/Button'
import { Input, Textarea, FormSelect } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { StatusPill } from '../components/ui/StatusPill'
import { NicheBadge } from '../components/ui/Badge'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { PROSPECT_STATUSES, OUTREACH_TYPES, CALL_OUTCOMES, EMAIL_RESPONSES, DM_RESPONSES } from '../lib/constants'
import { format } from 'date-fns'

const OUTREACH_ICONS = { cold_call: Phone, cold_email: Mail, instagram_dm: MessageCircle, linkedin_message: Briefcase, door_to_door: DoorOpen }
const OUTREACH_COLORS = { cold_call: '#10b981', cold_email: '#3b82f6', instagram_dm: '#ec4899', linkedin_message: '#0ea5e9', door_to_door: '#f59e0b' }

function OutreachForm({ type, prospectId, onClose }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: { type, date: format(new Date(), 'yyyy-MM-dd') } })
  const { mutate: create, isPending } = useCreateOutreach()
  const onSubmit = (vals) => { create({ ...vals, prospect_id: prospectId }); onClose() }

  const outcomes = type === 'cold_call' ? CALL_OUTCOMES : type === 'cold_email' ? EMAIL_RESPONSES : DM_RESPONSES

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <input type="hidden" {...register('type')} />
      <Input label="Date" type="date" {...register('date')} />
      {type === 'cold_call' && <Input label="Duration (minutes)" type="number" placeholder="5" {...register('duration_minutes', { valueAsNumber: true })} />}
      {(type === 'cold_email') && <Input label="Subject" placeholder="Email subject..." {...register('subject')} />}
      <FormSelect label="Outcome / Response" {...register('outcome')}>
        <option value="">Select outcome…</option>
        {outcomes.map(o => <option key={o} value={o}>{o}</option>)}
      </FormSelect>
      <Textarea label="Notes" placeholder="What happened?" rows={3} {...register('notes')} />
      <Button type="submit" loading={isPending} className="w-full">Log {type.replace(/_/g, ' ')}</Button>
    </form>
  )
}

function LogEntry({ log, onDelete }) {
  const { theme } = useUIStore()
  const isDark = theme === 'dark'
  const Icon = OUTREACH_ICONS[log.type] || MessageSquare
  const color = OUTREACH_COLORS[log.type] || '#3b82f6'
  const typeLabel = OUTREACH_TYPES.find(t => t.value === log.type)?.label || log.type

  return (
    <div className={`flex gap-3 relative ${isDark ? '' : ''}`}>
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + '20' }}>
          <Icon size={13} style={{ color }} />
        </div>
        <div className={`w-px flex-1 mt-1 ${isDark ? 'bg-white/6' : 'bg-black/6'}`} />
      </div>
      <div className={`flex-1 rounded-xl p-3 mb-3 ${isDark ? 'bg-white/4' : 'bg-black/3'}`}>
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold" style={{ color }}>{typeLabel}</span>
            {log.outcome && <span className={`ml-2 text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>· {log.outcome}</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${isDark ? 'text-white/30' : 'text-slate-400'}`}>{format(new Date(log.date), 'MMM d, yyyy')}</span>
            <button onClick={() => onDelete({ id: log.id, prospect_id: log.prospect_id })}
              className={`p-1 rounded cursor-pointer transition-colors ${isDark ? 'hover:bg-red-500/15 text-white/20 hover:text-red-400' : 'hover:bg-red-50 text-slate-300 hover:text-red-400'}`}>
              <Trash2 size={11} />
            </button>
          </div>
        </div>
        {log.notes && <p className={`text-xs mt-1 ${isDark ? 'text-white/55' : 'text-slate-600'}`}>{log.notes}</p>}
        {log.duration_minutes && <p className={`text-xs mt-0.5 ${isDark ? 'text-white/30' : 'text-slate-400'}`}>{log.duration_minutes} min</p>}
      </div>
    </div>
  )
}

export default function ProspectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { theme } = useUIStore()
  const isDark = theme === 'dark'

  const { data: prospect, isLoading } = useProspect(id)
  const { data: logs } = useOutreachLogs(id)
  const { data: niches } = useNiches()
  const { mutate: updateProspect, isPending: updating } = useUpdateProspect()
  const { mutate: deleteLog } = useDeleteOutreach()
  const { mutate: createTask, isPending: creatingTask } = useCreateTask()

  const [editMode, setEditMode] = useState(false)
  const [logModal, setLogModal] = useState(null)
  const [taskModal, setTaskModal] = useState(false)
  const [activeTab, setActiveTab] = useState('timeline')

  const { register, handleSubmit, formState: { errors } } = useForm({
    values: prospect || {},
  })

  if (isLoading) return <PageLoader />
  if (!prospect) return <div className="p-8 text-center text-red-400">Prospect not found.</div>

  const onSave = (vals) => { updateProspect({ id, ...vals }); setEditMode(false) }

  const TABS = [
    { id: 'timeline', label: 'Timeline' },
    { id: 'calls',    label: 'Calls' },
    { id: 'emails',   label: 'Emails' },
    { id: 'instagram',label: 'Instagram' },
    { id: 'linkedin', label: 'LinkedIn' },
    { id: 'visits',   label: 'Door-to-Door' },
  ]

  const typeMap = { calls: 'cold_call', emails: 'cold_email', instagram: 'instagram_dm', linkedin: 'linkedin_message', visits: 'door_to_door' }
  const filteredLogs = activeTab === 'timeline' ? logs : logs?.filter(l => l.type === typeMap[activeTab])

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate('/prospects')} className={`p-2 rounded-xl cursor-pointer transition-colors ${isDark ? 'hover:bg-white/8 text-white/50' : 'hover:bg-black/6 text-slate-400'}`}>
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{prospect.full_name}</h1>
            <StatusPill status={prospect.status} />
            {prospect.niches && <NicheBadge niche={prospect.niches} />}
          </div>
          {prospect.business_name && <p className={`text-sm mt-0.5 ${isDark ? 'text-white/45' : 'text-slate-500'}`}>{prospect.business_name}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={Edit2} onClick={() => setEditMode(!editMode)}>
            {editMode ? 'Cancel' : 'Edit'}
          </Button>
          <Button size="sm" icon={Plus} onClick={() => setLogModal('cold_call')}>Log Outreach</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Contact Info */}
        <div className="space-y-4">
          <GlassCard className="p-4">
            <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-white/35' : 'text-slate-400'}`}>Contact Info</h3>
            {editMode ? (
              <form onSubmit={handleSubmit(onSave)} className="space-y-3">
                <Input label="Phone" {...register('phone')} />
                <Input label="WhatsApp" {...register('whatsapp')} />
                <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
                <Input label="Instagram" {...register('instagram_handle')} />
                <Input label="LinkedIn" {...register('linkedin_url')} />
                <Input label="Website" {...register('website')} />
                <Input label="City" {...register('city')} />
                <Input label="Country" {...register('country')} />
                <FormSelect label="Niche" {...register('niche_id')}>
                  <option value="">No niche</option>
                  {niches?.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </FormSelect>
                <FormSelect label="Status" {...register('status')}>
                  {PROSPECT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </FormSelect>
                <Input label="Follow-up Date" type="date" {...register('follow_up_date')} />
                <Textarea label="Notes" rows={3} {...register('notes')} />
                <Button type="submit" loading={updating} className="w-full" size="sm">Save Changes</Button>
              </form>
            ) : (
              <div className="space-y-2.5">
                {[
                  { icon: Phone,    label: prospect.phone,            href: `tel:${prospect.phone}` },
                  { icon: Phone,    label: prospect.whatsapp && `WA: ${prospect.whatsapp}` },
                  { icon: Mail,     label: prospect.email,            href: `mailto:${prospect.email}` },
                  { icon: MessageCircle,label: prospect.instagram_handle, href: `https://instagram.com/${prospect.instagram_handle?.replace('@','')}` },
                  { icon: Briefcase, label: prospect.linkedin_url,     href: prospect.linkedin_url },
                  { icon: Globe,    label: prospect.website,          href: prospect.website?.startsWith('http') ? prospect.website : `https://${prospect.website}` },
                  { icon: MapPin,   label: [prospect.city, prospect.country].filter(Boolean).join(', ') },
                ].filter(r => r.label).map((row, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <row.icon size={13} className={isDark ? 'text-white/35 shrink-0' : 'text-slate-400 shrink-0'} />
                    {row.href ? (
                      <a href={row.href} target="_blank" rel="noreferrer" className="text-sm text-blue-400 hover:text-blue-300 truncate transition-colors">{row.label}</a>
                    ) : (
                      <span className={`text-sm truncate ${isDark ? 'text-white/65' : 'text-slate-600'}`}>{row.label}</span>
                    )}
                  </div>
                ))}
                {prospect.follow_up_date && (
                  <div className={`mt-3 pt-3 border-t ${isDark ? 'border-white/8' : 'border-black/6'}`}>
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className="text-amber-400" />
                      <span className={`text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>Follow-up: </span>
                      <span className="text-xs font-medium text-amber-400">{format(new Date(prospect.follow_up_date), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                )}
                {prospect.notes && (
                  <div className={`mt-3 pt-3 border-t ${isDark ? 'border-white/8' : 'border-black/6'}`}>
                    <p className={`text-xs ${isDark ? 'text-white/45' : 'text-slate-500'}`}>{prospect.notes}</p>
                  </div>
                )}
              </div>
            )}
          </GlassCard>

          {/* Quick Actions */}
          <GlassCard className="p-4">
            <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-white/35' : 'text-slate-400'}`}>Log Outreach</h3>
            <div className="grid grid-cols-2 gap-2">
              {OUTREACH_TYPES.map(t => (
                <Button key={t.value} variant="secondary" size="sm" onClick={() => setLogModal(t.value)} className="justify-start">
                  {t.label.split(' ')[0]}
                </Button>
              ))}
            </div>
            <div className={`mt-3 pt-3 border-t ${isDark ? 'border-white/8' : 'border-black/6'}`}>
              <Button variant="secondary" size="sm" className="w-full" icon={Clock} onClick={() => setTaskModal(true)}>
                Set Follow-up
              </Button>
            </div>
          </GlassCard>
        </div>

        {/* Right: Timeline */}
        <div className="lg:col-span-2">
          <GlassCard className="p-4">
            {/* Tabs */}
            <div className={`flex gap-1 p-1 rounded-xl mb-4 overflow-x-auto ${isDark ? 'bg-white/5' : 'bg-black/4'}`}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === t.id
                      ? (isDark ? 'bg-white/12 text-white' : 'bg-white text-slate-700 shadow-sm')
                      : (isDark ? 'text-white/40 hover:text-white/70' : 'text-slate-400 hover:text-slate-600')
                  }`}>
                  {t.label}
                  {t.id !== 'timeline' && logs?.filter(l => l.type === typeMap[t.id]).length > 0 &&
                    <span className="ml-1.5 text-xs opacity-60">({logs.filter(l => l.type === typeMap[t.id]).length})</span>
                  }
                </button>
              ))}
            </div>

            {/* Log entries */}
            {!filteredLogs?.length ? (
              <div className="py-10 text-center">
                <MessageSquare size={24} className={`mx-auto mb-2 ${isDark ? 'text-white/20' : 'text-slate-300'}`} />
                <p className={`text-sm ${isDark ? 'text-white/35' : 'text-slate-400'}`}>No {activeTab === 'timeline' ? 'activity' : activeTab} logged yet.</p>
                <button onClick={() => setLogModal(typeMap[activeTab] || 'cold_call')}
                  className="text-xs text-blue-400 mt-2 underline cursor-pointer">Log one now</button>
              </div>
            ) : (
              <div className="space-y-0 max-h-[60vh] overflow-y-auto pr-1">
                {filteredLogs.map(log => (
                  <LogEntry key={log.id} log={log} onDelete={deleteLog} />
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Log Outreach Modal */}
      <Modal open={!!logModal} onClose={() => setLogModal(null)} title={`Log ${logModal?.replace(/_/g, ' ') || ''}`} size="sm">
        {logModal && <OutreachForm type={logModal} prospectId={id} onClose={() => setLogModal(null)} />}
      </Modal>

      {/* Task Modal */}
      <Modal open={taskModal} onClose={() => setTaskModal(false)} title="Set Follow-up Task" size="sm">
        <form className="space-y-3" onSubmit={(e) => {
          e.preventDefault()
          const fd = new FormData(e.target)
          createTask({ prospect_id: id, outreach_type: fd.get('outreach_type'), due_date: fd.get('due_date'), notes: fd.get('notes') })
          setTaskModal(false)
        }}>
          <Input label="Due Date" type="date" name="due_date" defaultValue={format(new Date(), 'yyyy-MM-dd')} />
          <FormSelect label="Outreach Type" name="outreach_type">
            {OUTREACH_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </FormSelect>
          <Textarea label="Notes" name="notes" rows={2} placeholder="What to discuss?" />
          <Button type="submit" loading={creatingTask} className="w-full">Create Task</Button>
        </form>
      </Modal>
    </div>
  )
}
