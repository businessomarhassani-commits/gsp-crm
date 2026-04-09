import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserCheck, Plus, ChevronRight, Trash2 } from 'lucide-react'
import { useClients, useDeleteClient } from '../hooks/useClients'
import { useUIStore } from '../store/useUIStore'
import { useCurrencyStore } from '../store/useCurrencyStore'
import { GlassCard } from '../components/ui/GlassCard'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { NicheBadge } from '../components/ui/Badge'
import { PageLoader, SkeletonRow } from '../components/ui/LoadingSpinner'
import { PAYMENT_STATUSES } from '../lib/constants'
import { format } from 'date-fns'

export default function Clients() {
  const navigate = useNavigate()
  const { theme } = useUIStore()
  const isDark = theme === 'dark'
  const { formatAmount } = useCurrencyStore()

  const { data: clients, isLoading } = useClients()
  const { mutate: deleteClient, isPending: deleting } = useDeleteClient()
  const [deleteId, setDeleteId] = useState(null)

  const totalMRR = clients?.reduce((a, c) => a + Number(c.monthly_fee || 0), 0) || 0

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-8">
      <PageHeader
        title="Clients"
        subtitle={`${clients?.length || 0} active clients · MRR: ${formatAmount(totalMRR)}`}
        actions={<Button variant="secondary" size="sm" onClick={() => navigate('/prospects')}>Convert Prospect</Button>}
      />

      <GlassCard className="overflow-hidden">
        {!clients?.length ? (
          <EmptyState
            icon={UserCheck}
            title="No clients yet"
            message="Convert a prospect to client status to see them here."
            action={<Button onClick={() => navigate('/prospects')}>Go to Prospects</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isDark ? 'border-white/6' : 'border-black/6'}`}>
                  {['Client','Service','Monthly Fee','Contract','Started','Status',''].map(h => (
                    <th key={h} className={`text-xs font-medium text-left px-5 py-4 ${isDark ? 'text-white/35' : 'text-slate-400'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map(c => {
                  const prospect = c.prospects
                  const contractEnd = c.contract_start && c.contract_months
                    ? new Date(new Date(c.contract_start).setMonth(new Date(c.contract_start).getMonth() + c.contract_months))
                    : null
                  const isActive = !contractEnd || contractEnd > new Date()
                  return (
                    <tr key={c.id} className={`border-b table-row-hover cursor-pointer ${isDark ? 'border-white/4' : 'border-black/4'}`}
                      onClick={() => navigate(`/clients/${c.id}`)}>
                      <td className="px-5 py-4">
                        <p className={`font-medium ${isDark ? 'text-white/90' : 'text-slate-800'}`}>{prospect?.full_name}</p>
                        {prospect?.business_name && <p className={`text-xs ${isDark ? 'text-white/40' : 'text-slate-400'}`}>{prospect.business_name}</p>}
                      </td>
                      <td className={`px-5 py-4 ${isDark ? 'text-white/55' : 'text-slate-500'}`}>{c.service_type || '—'}</td>
                      <td className="px-5 py-4">
                        <span className={`font-semibold ${isDark ? 'text-white/85' : 'text-slate-800'}`}>{formatAmount(c.monthly_fee, c.fee_currency)}</span>
                        <span className={`text-xs ml-1 ${isDark ? 'text-white/35' : 'text-slate-400'}`}>/mo</span>
                      </td>
                      <td className={`px-5 py-4 ${isDark ? 'text-white/55' : 'text-slate-500'}`}>{c.contract_months || '—'} mo</td>
                      <td className={`px-5 py-4 ${isDark ? 'text-white/55' : 'text-slate-500'}`}>
                        {c.contract_start ? format(new Date(c.contract_start), 'MMM d, yyyy') : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isActive ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-400 bg-slate-400/10'}`}>
                          {isActive ? 'Active' : 'Ended'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 justify-end" onClick={e => e.stopPropagation()}>
                          <button onClick={() => navigate(`/clients/${c.id}`)}
                            className={`p-1.5 rounded-lg cursor-pointer ${isDark ? 'hover:bg-white/8 text-white/30' : 'hover:bg-black/6 text-slate-300'}`}>
                            <ChevronRight size={14} />
                          </button>
                          <button onClick={() => setDeleteId(c.id)}
                            className={`p-1.5 rounded-lg cursor-pointer ${isDark ? 'hover:bg-red-500/15 text-white/20 hover:text-red-400' : 'hover:bg-red-50 text-slate-300 hover:text-red-400'}`}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { deleteClient(deleteId); setDeleteId(null) }}
        title="Remove Client"
        message="This will remove the client record and all payment history. The prospect record will be kept."
        loading={deleting}
      />
    </div>
  )
}
