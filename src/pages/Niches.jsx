import { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Tag, Edit2, Trash2, Users, UserCheck, TrendingUp } from 'lucide-react'
import { useNiches, useCreateNiche, useUpdateNiche, useDeleteNiche } from '../hooks/useNiches'
import { useUIStore } from '../store/useUIStore'
import { GlassCard } from '../components/ui/GlassCard'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { Input, Textarea, FormSelect } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { EmptyState } from '../components/ui/EmptyState'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { NICHE_COLORS, CURRENCIES } from '../lib/constants'
import { formatCurrency } from '../lib/currency'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  target_country: z.string().optional(),
  target_city: z.string().optional(),
  budget_min: z.coerce.number().min(0).optional(),
  budget_max: z.coerce.number().min(0).optional(),
  budget_currency: z.string().default('MAD'),
  color: z.string().default('#3b82f6'),
})

function NicheForm({ defaultValues, onSubmit, loading }) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues || { color: '#3b82f6', budget_currency: 'MAD' },
  })
  const selectedColor = watch('color')
  const { theme } = useUIStore()
  const isDark = theme === 'dark'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Niche Name *" placeholder="e.g. Restaurants" error={errors.name?.message} {...register('name')} wrapperClass="col-span-2" />
        <Input label="Target Country" placeholder="Morocco" {...register('target_country')} />
        <Input label="Target City" placeholder="Casablanca" {...register('target_city')} />
        <Input label={`Budget Min`} type="number" placeholder="5000" {...register('budget_min')} />
        <Input label={`Budget Max`} type="number" placeholder="20000" {...register('budget_max')} />
      </div>
      <FormSelect label="Budget Currency" {...register('budget_currency')}>
        {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label} – {c.name}</option>)}
      </FormSelect>
      <Textarea label="Description" placeholder="Brief description of this niche..." rows={2} {...register('description')} />

      {/* Color picker */}
      <div>
        <label className={`text-sm font-medium block mb-2 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>Color Label</label>
        <div className="flex gap-2 flex-wrap">
          {NICHE_COLORS.map(c => (
            <button key={c} type="button" onClick={() => setValue('color', c)}
              className={`w-7 h-7 rounded-lg cursor-pointer transition-all ${selectedColor === c ? 'ring-2 ring-offset-2 ring-white/50 scale-110' : 'opacity-60 hover:opacity-100'}`}
              style={{ background: c, ringOffsetColor: 'transparent' }} />
          ))}
        </div>
      </div>

      <Button type="submit" loading={loading} className="w-full">Save Niche</Button>
    </form>
  )
}

export default function Niches() {
  const { data: niches, isLoading } = useNiches()
  const { mutate: createNiche, isPending: creating } = useCreateNiche()
  const { mutate: updateNiche, isPending: updating } = useUpdateNiche()
  const { mutate: deleteNiche, isPending: deleting } = useDeleteNiche()
  const { theme } = useUIStore()
  const isDark = theme === 'dark'

  const [showCreate, setShowCreate] = useState(false)
  const [editNiche, setEditNiche] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-8">
      <PageHeader
        title="Niches"
        subtitle={`${niches?.length || 0} target markets defined`}
        actions={<Button icon={Plus} onClick={() => setShowCreate(true)}>New Niche</Button>}
      />

      {!niches?.length ? (
        <GlassCard>
          <EmptyState
            icon={Tag}
            title="No niches yet"
            message="Create your first niche to start organizing your prospects by target market."
            action={<Button icon={Plus} onClick={() => setShowCreate(true)}>Create First Niche</Button>}
          />
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {niches.map((niche, idx) => (
            <motion.div key={niche.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
              <GlassCard animate={false} className="p-7 glass-hover" hover>
                {/* Color bar */}
                <div className="h-1.5 rounded-full mb-5" style={{ background: niche.color }} />

                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className={`font-semibold text-base ${isDark ? 'text-white' : 'text-slate-800'}`}>{niche.name}</h3>
                    {(niche.target_city || niche.target_country) && (
                      <p className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                        {[niche.target_city, niche.target_country].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => setEditNiche(niche)} className={`p-2 rounded-lg cursor-pointer transition-colors ${isDark ? 'hover:bg-white/8 text-white/40 hover:text-white' : 'hover:bg-black/6 text-slate-400 hover:text-slate-700'}`}>
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => setDeleteId(niche.id)} className={`p-2 rounded-lg cursor-pointer transition-colors ${isDark ? 'hover:bg-red-500/15 text-white/30 hover:text-red-400' : 'hover:bg-red-50 text-slate-300 hover:text-red-400'}`}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {niche.description && (
                  <p className={`text-sm mb-4 line-clamp-2 ${isDark ? 'text-white/45' : 'text-slate-500'}`}>{niche.description}</p>
                )}

                {(niche.budget_min || niche.budget_max) && (
                  <div className={`text-xs px-3 py-2 rounded-lg inline-block ${isDark ? 'bg-white/6' : 'bg-black/5'}`}>
                    <span className={isDark ? 'text-white/50' : 'text-slate-500'}>Budget: </span>
                    <span className={isDark ? 'text-white/80' : 'text-slate-700'}>
                      {formatCurrency(niche.budget_min || 0, niche.budget_currency)} – {formatCurrency(niche.budget_max || 0, niche.budget_currency)}
                    </span>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Niche">
        <NicheForm loading={creating} onSubmit={(vals) => { createNiche(vals); setShowCreate(false) }} />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editNiche} onClose={() => setEditNiche(null)} title="Edit Niche">
        {editNiche && (
          <NicheForm
            defaultValues={editNiche}
            loading={updating}
            onSubmit={(vals) => { updateNiche({ id: editNiche.id, ...vals }); setEditNiche(null) }}
          />
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { deleteNiche(deleteId); setDeleteId(null) }}
        title="Delete Niche"
        message="This niche will be deleted. Prospects linked to it will not be deleted but will lose their niche association."
        loading={deleting}
      />
    </div>
  )
}
