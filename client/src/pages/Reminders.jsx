import { useState, useEffect } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'
import { formatDateTime, isOverdue } from '../utils/format'

export default function Reminders() {
  const [data, setData] = useState({ pending: [], done: [] })
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('pending')
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', reminder_date: '', client_id: '' })
  const [clients, setClients] = useState([])

  const load = async () => {
    const [remRes, cliRes] = await Promise.all([
      api.get('/api/reminders'),
      api.get('/api/clients')
    ])
    setData(remRes.data)
    setClients(cliRes.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/api/reminders', {
        ...form,
        client_id: form.client_id || null
      })
      toast.success('Rappel créé !')
      setShowCreate(false)
      setForm({ title: '', description: '', reminder_date: '', client_id: '' })
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const markDone = async (id) => {
    try {
      await api.put(`/api/reminders/${id}`, { status: 'done' })
      toast.success('Rappel marqué comme fait !')
      load()
    } catch {
      toast.error('Erreur')
    }
  }

  const deleteReminder = async (id) => {
    if (!window.confirm('Supprimer ce rappel ?')) return
    try {
      await api.delete(`/api/reminders/${id}`)
      toast.success('Rappel supprimé')
      load()
    } catch {
      toast.error('Erreur')
    }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const list = data[tab] || []

  if (loading) return <div className="flex items-center justify-center h-64 text-navy/40 text-sm">Chargement…</div>

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Rappels</h1>
          <p className="text-gray-500 text-sm mt-1">
            {data.pending.length} en attente · {data.done.length} terminé{data.done.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <span>+</span> Nouveau rappel
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { key: 'pending', label: 'À faire', count: data.pending.length },
          { key: 'done',    label: 'Terminés', count: data.done.length },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              tab === t.key ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-navy'
            }`}
          >
            {t.label}
            {t.key === 'pending' && t.count > 0 && (
              <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${
                data.pending.some(r => isOverdue(r.reminder_date)) ? 'bg-red-100 text-red-600' : 'bg-gold/20 text-gold'
              }`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {list.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-gray-400 text-sm">
              {tab === 'pending' ? 'Aucun rappel en attente' : 'Aucun rappel terminé'}
            </p>
            {tab === 'pending' && (
              <button onClick={() => setShowCreate(true)} className="text-gold text-sm mt-2 hover:underline">
                + Créer un rappel
              </button>
            )}
          </div>
        ) : (
          list.map(r => {
            const overdue = tab === 'pending' && isOverdue(r.reminder_date)
            return (
              <div key={r.id} className={`card p-5 flex items-start gap-4 ${overdue ? 'border-l-4 border-red-400' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-navy">{r.title}</p>
                    {overdue && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">En retard</span>
                    )}
                  </div>
                  {r.description && (
                    <p className="text-xs text-gray-400 mt-1">{r.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className={`text-xs font-medium ${overdue ? 'text-red-500' : 'text-gold'}`}>
                      🕐 {formatDateTime(r.reminder_date)}
                    </span>
                    {r.client_name && (
                      <span className="text-xs text-gray-400">👤 {r.client_name}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {tab === 'pending' && (
                    <button
                      onClick={() => markDone(r.id)}
                      className="text-xs bg-green-50 text-green-600 hover:bg-green-100 font-medium px-3 py-1.5 rounded-lg transition-colors"
                    >
                      ✓ Fait
                    </button>
                  )}
                  <button
                    onClick={() => deleteReminder(r.id)}
                    className="text-xs text-gray-300 hover:text-red-400 px-2 py-1.5 rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nouveau rappel">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Titre *</label>
            <input required className="input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Rappeler Mme. Benali…" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none h-20" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Détails optionnels…" />
          </div>
          <div>
            <label className="label">Date et heure *</label>
            <input required type="datetime-local" className="input" value={form.reminder_date} onChange={e => set('reminder_date', e.target.value)} />
          </div>
          <div>
            <label className="label">Client associé (optionnel)</label>
            <select className="input" value={form.client_id} onChange={e => set('client_id', e.target.value)}>
              <option value="">Aucun</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full py-2.5">
            {saving ? 'Création…' : 'Créer le rappel'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
