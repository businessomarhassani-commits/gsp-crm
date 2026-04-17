import { useState, useEffect } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import { formatDH, formatDate } from '../utils/format'

const STATUSES = ['Nouveau','Contacté','Rendez-vous','Proposition','Gagné','Perdu']
const PROJECT_TYPES = ['Résidentiel','Commercial','Rénovation','Extension','Design intérieur']
const SOURCES = ['Site web','Instagram','Référence','Appel direct','Salon','LinkedIn','Autre']
const BUDGETS = ['< 50.000 DH','50.000 – 100.000 DH','100.000 – 200.000 DH','200.000 – 500.000 DH','500.000 – 1.000.000 DH','1.000.000 – 2.000.000 DH','2.000.000+ DH']

function LeadForm({ initial = {}, onSave, loading, niches }) {
  const [form, setForm] = useState({ name:'', phone:'', email:'', project_type:'', city:'', budget:'', status:'Nouveau', source:'', last_contact_date:'', ...initial })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="label">Nom complet *</label>
          <input required className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Mehdi Laaroussi" />
        </div>
        <div>
          <label className="label">Téléphone</label>
          <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+212 6XX XXX XXX" />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" value={form.email} onChange={e => set('email', e.target.value)} placeholder="client@mail.ma" />
        </div>
        <div>
          <label className="label">Type de projet</label>
          <select className="input" value={form.project_type} onChange={e => set('project_type', e.target.value)}>
            <option value="">Sélectionner…</option>
            {PROJECT_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Ville</label>
          <input className="input" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Casablanca" />
        </div>
        <div>
          <label className="label">Budget estimé</label>
          <select className="input" value={form.budget} onChange={e => set('budget', e.target.value)}>
            <option value="">Sélectionner…</option>
            {BUDGETS.map(b => <option key={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Source</label>
          <select className="input" value={form.source} onChange={e => set('source', e.target.value)}>
            <option value="">Sélectionner…</option>
            {SOURCES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Statut</label>
          <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Dernier contact</label>
          <input type="date" className="input" value={form.last_contact_date?.split('T')[0] || ''} onChange={e => set('last_contact_date', e.target.value)} />
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
        {loading ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  )
}

export default function Leads() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const params = {}
    if (search) params.search = search
    if (statusFilter) params.status = statusFilter
    const { data } = await api.get('/api/leads', { params })
    setLeads(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [search, statusFilter])

  const handleCreate = async (form) => {
    setSaving(true)
    try {
      await api.post('/api/leads', form)
      toast.success('Lead ajouté !')
      setShowCreate(false)
      load()
    } catch (err) { toast.error(err.response?.data?.error || 'Erreur') }
    finally { setSaving(false) }
  }

  const handleUpdate = async (form) => {
    setSaving(true)
    try {
      await api.put(`/api/leads/${selected.id}`, form)
      toast.success('Lead mis à jour !')
      setSelected(null)
      load()
    } catch (err) { toast.error(err.response?.data?.error || 'Erreur') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!window.confirm('Supprimer ce lead ?')) return
    try {
      await api.delete(`/api/leads/${selected.id}`)
      toast.success('Lead supprimé')
      setSelected(null)
      load()
    } catch { toast.error('Erreur lors de la suppression') }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Leads</h1>
          <p className="text-gray-500 text-sm mt-1">{leads.length} lead{leads.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <span>+</span> Nouveau lead
        </button>
      </div>

      {/* Search + filter */}
      <div className="flex gap-3">
        <input className="input max-w-xs" placeholder="Rechercher un lead…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input max-w-[180px]" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Tous les statuts</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Chargement…</div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40">
            <p className="text-gray-400 text-sm">Aucun lead trouvé</p>
            <button onClick={() => setShowCreate(true)} className="text-gold text-sm mt-2 hover:underline">+ Ajouter le premier lead</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Nom','Projet','Budget','Ville','Statut','Dernier contact'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map(lead => (
                <tr key={lead.id} onClick={() => setSelected(lead)} className="table-row">
                  <td className="px-4 py-3 font-medium text-navy">{lead.name}</td>
                  <td className="px-4 py-3 text-gray-500">{lead.project_type || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{lead.budget || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{lead.city || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={lead.status} /></td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(lead.last_contact_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nouveau lead">
        <LeadForm onSave={handleCreate} loading={saving} />
      </Modal>

      {/* Slide-over edit panel */}
      {selected && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-semibold text-navy">{selected.name}</h2>
              <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 text-lg">✕</button>
            </div>
            <div className="px-6 py-5">
              {/* Quick info */}
              <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
                {selected.phone && <div><p className="text-xs text-gray-400">Téléphone</p><p className="font-medium text-navy">{selected.phone}</p></div>}
                {selected.email && <div><p className="text-xs text-gray-400">Email</p><p className="font-medium text-navy truncate">{selected.email}</p></div>}
                {selected.source && <div><p className="text-xs text-gray-400">Source</p><p className="font-medium">{selected.source}</p></div>}
                <div><p className="text-xs text-gray-400">Ajouté le</p><p className="font-medium">{formatDate(selected.created_at)}</p></div>
              </div>
              <LeadForm initial={selected} onSave={handleUpdate} loading={saving} />
              <button onClick={handleDelete} className="btn-danger w-full mt-3">Supprimer ce lead</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
