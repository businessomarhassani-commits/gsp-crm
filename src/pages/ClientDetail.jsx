import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft, DollarSign, Calendar, Edit2, Plus, CheckCircle, Clock, XCircle } from 'lucide-react'
import { useClient, useUpdateClient } from '../hooks/useClients'
import { usePayments, useCreatePayment, useUpdatePayment, useDeletePayment } from '../hooks/usePayments'
import { useUIStore } from '../store/useUIStore'
import { useCurrencyStore } from '../store/useCurrencyStore'
import { GlassCard } from '../components/ui/GlassCard'
import { Button } from '../components/ui/Button'
import { Input, FormSelect } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { CURRENCIES, MONTHS, PAYMENT_STATUSES } from '../lib/constants'
import { formatCurrency } from '../lib/currency'
import { format } from 'date-fns'

const STATUS_ICONS = { paid: CheckCircle, pending: Clock, overdue: XCircle }
const STATUS_COLORS = { paid: 'text-emerald-400', pending: 'text-amber-400', overdue: 'text-red-400' }

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { theme } = useUIStore()
  const isDark = theme === 'dark'
  const { formatAmount } = useCurrencyStore()

  const { data: client, isLoading } = useClient(id)
  const { data: payments } = usePayments(id)
  const { mutate: updateClient, isPending: updating } = useUpdateClient()
  const { mutate: createPayment, isPending: creatingPay } = useCreatePayment()
  const { mutate: updatePayment } = useUpdatePayment()
  const { mutate: deletePayment } = useDeletePayment()

  const [editMode, setEditMode] = useState(false)
  const [payModal, setPayModal] = useState(false)
  const [deletePayId, setDeletePayId] = useState(null)

  const { register, handleSubmit } = useForm({ values: client || {} })

  if (isLoading) return <PageLoader />
  if (!client) return <div className="p-8 text-center text-red-400">Client not found.</div>

  const prospect = client.prospects
  const totalPaid = payments?.filter(p => p.status === 'paid').reduce((a, p) => a + Number(p.amount), 0) || 0

  // Build payment calendar (months in contract)
  const startDate = client.contract_start ? new Date(client.contract_start) : new Date()
  const months = []
  for (let m = 0; m < (client.contract_months || 12); m++) {
    const d = new Date(startDate)
    d.setMonth(d.getMonth() + m)
    months.push({ month: d.getMonth() + 1, year: d.getFullYear(), label: `${MONTHS[d.getMonth()].slice(0,3)} ${d.getFullYear()}` })
  }

  const getPayment = (month, year) => payments?.find(p => p.month === month && p.year === year)

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/clients')} className={`p-2 rounded-xl cursor-pointer ${isDark ? 'hover:bg-white/8 text-white/50' : 'hover:bg-black/6 text-slate-400'}`}>
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{prospect?.full_name}</h1>
          <p className={`text-sm ${isDark ? 'text-white/40' : 'text-slate-500'}`}>{prospect?.business_name || 'Client'}</p>
        </div>
        <Button variant="secondary" size="sm" icon={Edit2} onClick={() => setEditMode(!editMode)}>
          {editMode ? 'Cancel' : 'Edit'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contract Info */}
        <GlassCard className="p-6">
          <h3 className={`text-xs font-semibold uppercase tracking-wider mb-5 ${isDark ? 'text-white/35' : 'text-slate-400'}`}>Contract</h3>

          {editMode ? (
            <form onSubmit={handleSubmit(vals => { updateClient({ id, ...vals }); setEditMode(false) })} className="space-y-3">
              <Input label="Monthly Fee" type="number" {...register('monthly_fee')} />
              <FormSelect label="Currency" {...register('fee_currency')}>
                {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </FormSelect>
              <Input label="Service Type" placeholder="Social Media, Ads, SEO..." {...register('service_type')} />
              <Input label="Contract Start" type="date" {...register('contract_start')} />
              <Input label="Contract Months" type="number" {...register('contract_months')} />
              <Button type="submit" loading={updating} size="sm" className="w-full">Save</Button>
            </form>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Monthly Fee', value: formatAmount(client.monthly_fee, client.fee_currency) },
                { label: 'Service', value: client.service_type || '—' },
                { label: 'Contract Start', value: client.contract_start ? format(new Date(client.contract_start), 'MMM d, yyyy') : '—' },
                { label: 'Duration', value: `${client.contract_months || '—'} months` },
                { label: 'Total Collected', value: formatCurrency(totalPaid, client.fee_currency) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className={`text-xs ${isDark ? 'text-white/35' : 'text-slate-400'}`}>{label}</p>
                  <p className={`text-sm font-semibold mt-0.5 ${isDark ? 'text-white/85' : 'text-slate-800'}`}>{value}</p>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Payment Calendar */}
        <div className="lg:col-span-2">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-white/35' : 'text-slate-400'}`}>Payment History</h3>
              <Button size="xs" icon={Plus} onClick={() => setPayModal(true)}>Add Payment</Button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {months.map(({ month, year, label }) => {
                const pay = getPayment(month, year)
                const status = pay?.status || (new Date(year, month - 1) < new Date() ? 'overdue' : 'pending')
                const Icon = STATUS_ICONS[status] || Clock
                const colorClass = STATUS_COLORS[status] || 'text-slate-400'
                return (
                  <div key={`${year}-${month}`}
                    className={`relative p-2 rounded-xl text-center transition-colors cursor-pointer ${isDark ? 'bg-white/4 hover:bg-white/7' : 'bg-black/3 hover:bg-black/6'}`}
                    onClick={() => pay && setDeletePayId(pay.id)}>
                    <Icon size={14} className={`mx-auto mb-1 ${colorClass}`} />
                    <p className={`text-xs font-medium ${colorClass}`}>{label}</p>
                    {pay?.amount && <p className={`text-xs mt-0.5 ${isDark ? 'text-white/30' : 'text-slate-400'}`}>{formatCurrency(pay.amount, pay.currency)}</p>}
                  </div>
                )
              })}
            </div>

            <div className={`mt-3 pt-3 border-t ${isDark ? 'border-white/6' : 'border-black/6'} flex gap-4 flex-wrap`}>
              {[['paid','Paid'],['pending','Pending'],['overdue','Overdue']].map(([s,l]) => (
                <div key={s} className="flex items-center gap-1.5">
                  {(() => { const Icon = STATUS_ICONS[s]; return <Icon size={12} className={STATUS_COLORS[s]} /> })()}
                  <span className={`text-xs ${isDark ? 'text-white/40' : 'text-slate-400'}`}>{l}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Add Payment Modal */}
      <Modal open={payModal} onClose={() => setPayModal(false)} title="Record Payment" size="sm">
        <form className="space-y-3" onSubmit={e => {
          e.preventDefault()
          const fd = new FormData(e.target)
          createPayment({
            client_id: id,
            amount: Number(fd.get('amount')),
            currency: fd.get('currency'),
            month: Number(fd.get('month')),
            year: Number(fd.get('year')),
            status: fd.get('status'),
            paid_at: fd.get('status') === 'paid' ? new Date().toISOString() : null,
            notes: fd.get('notes'),
          })
          setPayModal(false)
        }}>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Amount" type="number" name="amount" defaultValue={client.monthly_fee} />
            <FormSelect label="Currency" name="currency" defaultValue={client.fee_currency}>
              {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </FormSelect>
            <FormSelect label="Month" name="month" defaultValue={new Date().getMonth() + 1}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </FormSelect>
            <Input label="Year" type="number" name="year" defaultValue={new Date().getFullYear()} />
          </div>
          <FormSelect label="Status" name="status" defaultValue="paid">
            {PAYMENT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </FormSelect>
          <Input label="Notes" name="notes" placeholder="Optional note..." />
          <Button type="submit" loading={creatingPay} className="w-full">Save Payment</Button>
        </form>
      </Modal>

      <ConfirmModal
        open={!!deletePayId}
        onClose={() => setDeletePayId(null)}
        onConfirm={() => { deletePayment({ id: deletePayId, client_id: id }); setDeletePayId(null) }}
        title="Delete Payment Record"
        message="Remove this payment record from history?"
      />
    </div>
  )
}
