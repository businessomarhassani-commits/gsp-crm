import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Users, ChevronRight, Trash2, Filter, X } from 'lucide-react'
import { useProspects, useCreateProspect, useDeleteProspect } from '../hooks/useProspects'
import { useNiches } from '../hooks/useNiches'
import { useUIStore } from '../store/useUIStore'
import { GlassCard } from '../components/ui/GlassCard'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { Input, FormSelect, Textarea } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { StatusPill } from '../components/ui/StatusPill'
import { NicheBadge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { SearchInput } from '../components/ui/SearchInput'
import { PageLoader, SkeletonRow } from '../components/ui/LoadingSpinner'
import { PROSPECT_STATUSES, PROSPECT_SOURCES } from '../lib/constants'
import { format } from 'date-fns'

const schema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  business_name: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  instagram_handle: z.string().optional(),
  linkedin_url: z.string().optional(),
  website: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional().default('Morocco'),
  niche_id: z.string().optional(),
  source: z.string().optional(),
  status: z.string().default('new'),
  notes: z.string().optional(),
})

function ProspectForm({ niches, defaultValues, onSubmit, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues || { country: 'Morocco', status: 'new' },
  })
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Full Name *" placeholder="Ahmed Benali" error={errors.full_name?.message} {...register('full_name')} wrapperClass="col-span-2 sm:col-span-1" />
        <Input label="Business Name" placeholder="Café Atlas" {...register('business_name')} wrapperClass="col-span-2 sm:col-span-1" />
        <Input label="Phone" placeholder="+212 6XX XXXXXX" {...register('phone')} />
        <Input label="WhatsApp" placeholder="+212 6XX XXXXXX" {...register('whatsapp')} />
        <Input label="Email" type="email" placeholder="ahmed@example.com" error={errors.email?.message} {...register('email')} />
        <Input label="Instagram" placeholder="@handle" {...register('instagram_handle')} />
        <Input label="LinkedIn URL" placeholder="linkedin.com/in/..." {...register('linkedin_url')} />
        <Input label="Website" placeholder="example.com" {...register('website')} />
        <Input label="City" placeholder="Casablanca" {...register('city')} />
        <Input label="Country" placeholder="Morocco" {...register('country')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormSelect label="Niche" {...register('niche_id')}>
          <option value="">No niche</option>
          {niches?.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
        </FormSelect>
        <FormSelect label="Source" {...register('source')}>
          <option value="">Unknown</option>
          {PROSPECT_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
        </FormSelect>
        <FormSelect label="Status" {...register('status')}>
          {PROSPECT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </FormSelect>
      </div>
      <Textarea label="Notes" placeholder="Any notes about this prospect..." rows={3} {...register('notes')} />
      <Button type="submit" loading={loading} className="w-full">Add Prospect</Button>
    </form>
  )
}

export default function Prospects() {
  const navigate = useNavigate()
  const { theme } = useUIStore()
  const isDark = theme === 'dark'

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [nicheFilter, setNicheFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [showFilters, setShowFilters] = useState(false)

  const { data: prospects, isLoading } = useProspects({ search, status: statusFilter || undefined, niche_id: nicheFilter || undefined })
  const { data: niches } = useNiches()
  const { mutate: createProspect, isPending: creating } = useCreateProspect()
  const { mutate: deleteProspect, isPending: deleting } = useDeleteProspect()

  const hasFilters = statusFilter || nicheFilter || search

  return (
    <div className="space-y-8">
      <PageHeader
        title="Prospects"
        subtitle={`${prospects?.length || 0} prospects in your pipeline`}
        actions={<Button icon={Plus} onClick={() => setShowCreate(true)}>Add Prospect</Button>}
      />

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name…" className="flex-1 min-w-48" />
        <Button variant="secondary" size="md" icon={Filter} onClick={() => setShowFilters(!showFilters)}>
          Filters {hasFilters ? `(${[statusFilter, nicheFilter, search].filter(Boolean).length})` : ''}
        </Button>
        {hasFilters && <Button variant="ghost" size="md" icon={X} onClick={() => { setSearch(''); setStatusFilter(''); setNicheFilter('') }}>Clear</Button>}
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3">
          <FormSelect value={statusFilter} onChange={e => setStatusFilter(e.target.value)} wrapperClass="flex-1 min-w-40">
            <option value="">All Statuses</option>
            {PROSPECT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </FormSelect>
          <FormSelect value={nicheFilter} onChange={e => setNicheFilter(e.target.value)} wrapperClass="flex-1 min-w-40">
            <option value="">All Niches</option>
            {niches?.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
          </FormSelect>
        </div>
      )}

      {/* Table */}
      <GlassCard className="overflow-hidden">
        {isLoading ? (
          <table className="w-full"><tbody>{Array(5).fill(0).map((_, i) => <SkeletonRow key={i} cols={6} />)}</tbody></table>
        ) : !prospects?.length ? (
          <EmptyState
            icon={Users}
            title="No prospects found"
            message={hasFilters ? "Try adjusting your filters." : "Add your first prospect to start building your pipeline."}
            action={!hasFilters && <Button icon={Plus} onClick={() => setShowCreate(true)}>Add First Prospect</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isDark ? 'border-white/6' : 'border-black/6'}`}>
                  {['Name & Business','Status','Niche','City','Source','Follow-up',''].map(h => (
                    <th key={h} className={`text-xs font-medium text-left px-5 py-4 ${isDark ? 'text-white/35' : 'text-slate-400'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {prospects.map((p) => (
                  <tr key={p.id} className={`border-b table-row-hover cursor-pointer ${isDark ? 'border-white/4' : 'border-black/4'}`}
                    onClick={() => navigate(`/prospects/${p.id}`)}>
                    <td className="px-5 py-4">
                      <p className={`font-medium ${isDark ? 'text-white/90' : 'text-slate-800'}`}>{p.full_name}</p>
                      {p.business_name && <p className={`text-xs ${isDark ? 'text-white/40' : 'text-slate-400'}`}>{p.business_name}</p>}
                    </td>
                    <td className="px-5 py-4"><StatusPill status={p.status} /></td>
                    <td className="px-5 py-4">{p.niches && <NicheBadge niche={p.niches} />}</td>
                    <td className={`px-5 py-4 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>{p.city || '—'}</td>
                    <td className={`px-5 py-4 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>{p.source || '—'}</td>
                    <td className="px-5 py-4">
                      {p.follow_up_date && (
                        <span className={`text-xs ${new Date(p.follow_up_date) < new Date() ? 'text-red-400' : (isDark ? 'text-white/50' : 'text-slate-500')}`}>
                          {format(new Date(p.follow_up_date), 'MMM d')}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 justify-end" onClick={e => e.stopPropagation()}>
                        <button onClick={() => navigate(`/prospects/${p.id}`)}
                          className={`p-1.5 rounded-lg cursor-pointer transition-colors ${isDark ? 'hover:bg-white/8 text-white/30 hover:text-white' : 'hover:bg-black/6 text-slate-300 hover:text-slate-600'}`}>
                          <ChevronRight size={14} />
                        </button>
                        <button onClick={() => setDeleteId(p.id)}
                          className={`p-1.5 rounded-lg cursor-pointer transition-colors ${isDark ? 'hover:bg-red-500/15 text-white/20 hover:text-red-400' : 'hover:bg-red-50 text-slate-300 hover:text-red-400'}`}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Prospect" size="lg">
        <ProspectForm niches={niches} loading={creating} onSubmit={(vals) => { createProspect(vals); setShowCreate(false) }} />
      </Modal>

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { deleteProspect(deleteId); setDeleteId(null) }}
        title="Delete Prospect"
        message="This prospect and all their outreach history will be permanently deleted."
        loading={deleting}
      />
    </div>
  )
}
