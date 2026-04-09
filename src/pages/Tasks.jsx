import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckSquare, Plus, CheckCircle2, Phone, Mail, MessageCircle, Briefcase, DoorOpen, Clock, Trash2 } from 'lucide-react'
import { useTasks, useCreateTask, useCompleteTask, useDeleteTask } from '../hooks/useTasks'
import { useProspects } from '../hooks/useProspects'
import { useUIStore } from '../store/useUIStore'
import { GlassCard } from '../components/ui/GlassCard'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { Input, FormSelect, Textarea } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { EmptyState } from '../components/ui/EmptyState'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { OUTREACH_TYPES } from '../lib/constants'
import { format, addDays, isToday, isBefore, parseISO } from 'date-fns'

const ICONS = { cold_call: Phone, cold_email: Mail, instagram_dm: MessageCircle, linkedin_message: Briefcase, door_to_door: DoorOpen }

function TaskRow({ task, onComplete, onDelete, navigate }) {
  const { theme } = useUIStore()
  const isDark = theme === 'dark'
  const due = parseISO(task.due_date)
  const overdue = isBefore(due, new Date()) && !isToday(due)
  const today = isToday(due)
  const Icon = ICONS[task.outreach_type] || Clock
  const typeColor = overdue ? '#ef4444' : today ? '#f59e0b' : '#3b82f6'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${isDark ? 'hover:bg-white/4' : 'hover:bg-black/3'}`}
    >
      <button
        onClick={() => onComplete(task.id)}
        className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center shrink-0 cursor-pointer transition-all hover:scale-110 ${
          isDark ? 'border-white/15 hover:border-green-500/60 hover:bg-green-500/15' : 'border-black/12 hover:border-green-400 hover:bg-green-50'
        }`}
      >
        <CheckCircle2 size={15} className={isDark ? 'text-white/20' : 'text-slate-300'} />
      </button>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => task.prospect_id && navigate(`/prospects/${task.prospect_id}`)}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-medium ${isDark ? 'text-white/85' : 'text-slate-700'}`}>
            {task.prospects?.full_name || 'Manual Task'}
          </span>
          {task.prospects?.business_name && (
            <span className={`text-xs ${isDark ? 'text-white/35' : 'text-slate-400'}`}>· {task.prospects.business_name}</span>
          )}
        </div>
        {task.notes && <p className={`text-xs mt-0.5 truncate ${isDark ? 'text-white/35' : 'text-slate-400'}`}>{task.notes}</p>}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <Icon size={12} style={{ color: typeColor }} />
          <span className="text-xs font-medium" style={{ color: typeColor }}>
            {overdue ? `Overdue · ${format(due, 'MMM d')}` : today ? 'Today' : format(due, 'MMM d')}
          </span>
        </div>
        <button onClick={() => onDelete(task.id)} className={`p-1 rounded cursor-pointer transition-colors ${isDark ? 'hover:bg-red-500/15 text-white/15 hover:text-red-400' : 'hover:bg-red-50 text-slate-200 hover:text-red-400'}`}>
          <Trash2 size={11} />
        </button>
      </div>
    </motion.div>
  )
}

export default function Tasks() {
  const navigate = useNavigate()
  const { theme } = useUIStore()
  const isDark = theme === 'dark'

  const today = format(new Date(), 'yyyy-MM-dd')
  const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd')

  const { data: pendingTasks, isLoading } = useTasks({ completed: false })
  const { data: completedTasks } = useTasks({ completed: true })
  const { data: prospects } = useProspects()
  const { mutate: createTask, isPending: creating } = useCreateTask()
  const { mutate: completeTask } = useCompleteTask()
  const { mutate: deleteTask } = useDeleteTask()

  const [showCreate, setShowCreate] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [showCompleted, setShowCompleted] = useState(false)

  const overdue = pendingTasks?.filter(t => t.due_date < today) || []
  const todayTasks = pendingTasks?.filter(t => t.due_date === today) || []
  const upcoming = pendingTasks?.filter(t => t.due_date > today && t.due_date <= nextWeek) || []
  const later = pendingTasks?.filter(t => t.due_date > nextWeek) || []

  if (isLoading) return <PageLoader />

  const Section = ({ title, tasks, badge, badgeColor = 'blue' }) => {
    if (!tasks.length) return null
    const colors = { red: 'text-red-400 bg-red-400/10', amber: 'text-amber-400 bg-amber-400/10', blue: 'text-blue-400 bg-blue-400/10', slate: 'text-slate-400 bg-slate-400/10' }
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className={`text-base font-semibold ${isDark ? 'text-white/70' : 'text-slate-600'}`}>{title}</h3>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${colors[badgeColor]}`}>{tasks.length}</span>
        </div>
        <GlassCard className="p-2">
          {tasks.map(t => (
            <TaskRow key={t.id} task={t} onComplete={completeTask} onDelete={(id) => setDeleteId(id)} navigate={navigate} />
          ))}
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tasks"
        subtitle={`${pendingTasks?.length || 0} pending · ${overdue.length} overdue`}
        actions={<Button icon={Plus} onClick={() => setShowCreate(true)}>New Task</Button>}
      />

      {!pendingTasks?.length ? (
        <GlassCard>
          <EmptyState
            icon={CheckSquare}
            title="All caught up!"
            message="No pending tasks. Add a follow-up from a prospect profile or create a manual task."
            action={<Button icon={Plus} onClick={() => setShowCreate(true)}>Create Task</Button>}
          />
        </GlassCard>
      ) : (
        <div className="space-y-8">
          <Section title="Overdue" tasks={overdue} badgeColor="red" />
          <Section title="Today" tasks={todayTasks} badgeColor="amber" />
          <Section title="Next 7 Days" tasks={upcoming} badgeColor="blue" />
          <Section title="Later" tasks={later} badgeColor="slate" />
        </div>
      )}

      {/* Completed section */}
      {completedTasks?.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className={`text-sm font-medium cursor-pointer ${isDark ? 'text-white/35 hover:text-white/60' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {showCompleted ? '▾' : '▸'} Completed ({completedTasks.length})
          </button>
          {showCompleted && (
            <GlassCard className="mt-2 p-2 opacity-60">
              {completedTasks.slice(0, 20).map(t => (
                <div key={t.id} className={`flex items-center gap-3 p-2.5 rounded-xl`}>
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  <span className={`text-sm line-through ${isDark ? 'text-white/40' : 'text-slate-400'}`}>{t.prospects?.full_name || 'Task'}</span>
                  <span className={`text-xs ml-auto ${isDark ? 'text-white/25' : 'text-slate-300'}`}>{format(new Date(t.due_date), 'MMM d')}</span>
                </div>
              ))}
            </GlassCard>
          )}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Task" size="sm">
        <form className="space-y-3" onSubmit={e => {
          e.preventDefault()
          const fd = new FormData(e.target)
          createTask({
            prospect_id: fd.get('prospect_id') || null,
            outreach_type: fd.get('outreach_type'),
            due_date: fd.get('due_date'),
            notes: fd.get('notes'),
          })
          setShowCreate(false)
        }}>
          <FormSelect label="Prospect (optional)" name="prospect_id">
            <option value="">Manual task (no prospect)</option>
            {prospects?.map(p => <option key={p.id} value={p.id}>{p.full_name} {p.business_name ? `— ${p.business_name}` : ''}</option>)}
          </FormSelect>
          <FormSelect label="Outreach Type" name="outreach_type">
            {OUTREACH_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </FormSelect>
          <Input label="Due Date *" type="date" name="due_date" defaultValue={today} required />
          <Textarea label="Notes" name="notes" rows={2} placeholder="What needs to be done?" />
          <Button type="submit" loading={creating} className="w-full">Create Task</Button>
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { deleteTask(deleteId); setDeleteId(null) }}
        title="Delete Task"
        message="Remove this task from your list?"
      />
    </div>
  )
}
