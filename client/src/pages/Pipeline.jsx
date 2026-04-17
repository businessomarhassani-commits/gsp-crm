import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import api from '../utils/api'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'

const COLUMNS = [
  { id: 'Nouveau',      color: 'bg-gray-400',   light: 'bg-gray-50',   border: 'border-gray-200' },
  { id: 'Contacté',     color: 'bg-blue-400',   light: 'bg-blue-50',   border: 'border-blue-200' },
  { id: 'Rendez-vous',  color: 'bg-purple-400', light: 'bg-purple-50', border: 'border-purple-200' },
  { id: 'Proposition',  color: 'bg-yellow-400', light: 'bg-yellow-50', border: 'border-yellow-200' },
  { id: 'Gagné',        color: 'bg-green-400',  light: 'bg-green-50',  border: 'border-green-200' },
  { id: 'Perdu',        color: 'bg-red-400',    light: 'bg-red-50',    border: 'border-red-200' },
]

const PROJECT_TYPES = ['Résidentiel','Commercial','Rénovation','Extension','Design intérieur']
const SOURCES = ['Site web','Instagram','Référence','Appel direct','Salon','LinkedIn','Autre']
const BUDGETS = ['< 50.000 DH','50.000 – 100.000 DH','100.000 – 200.000 DH','200.000 – 500.000 DH','500.000 – 1.000.000 DH','1.000.000 – 2.000.000 DH','2.000.000+ DH']

export default function Pipeline() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', project_type: '', city: '', budget: '', source: '', status: 'Nouveau' })

  const load = async () => {
    const { data } = await api.get('/api/leads')
    setLeads(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const byStatus = (status) => leads.filter(l => l.status === status)

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result
    if (!destination || source.droppableId === destination.droppableId) return

    const newStatus = destination.droppableId
    const leadId = draggableId

    // Optimistic update
    setLeads(prev => prev.map(l => String(l.id) === leadId ? { ...l, status: newStatus } : l))

    try {
      await api.put(`/api/leads/${leadId}`, { status: newStatus })
      if (newStatus === 'Gagné') toast.success('🎉 Lead gagné — client créé !')
      else toast.success('Statut mis à jour')
    } catch {
      toast.error('Erreur lors de la mise à jour')
      load() // revert
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/api/leads', form)
      toast.success('Lead ajouté !')
      setShowCreate(false)
      setForm({ name: '', phone: '', email: '', project_type: '', city: '', budget: '', source: '', status: 'Nouveau' })
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  if (loading) return <div className="flex items-center justify-center h-64 text-navy/40 text-sm">Chargement…</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Pipeline</h1>
          <p className="text-gray-500 text-sm mt-1">{leads.length} lead{leads.length !== 1 ? 's' : ''} au total</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <span>+</span> Nouveau lead
        </button>
      </div>

      {/* Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '70vh' }}>
          {COLUMNS.map(col => {
            const colLeads = byStatus(col.id)
            return (
              <div key={col.id} className="flex-shrink-0 w-64 flex flex-col">
                {/* Column header */}
                <div className={`flex items-center gap-2 mb-3 px-1`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                  <span className="text-sm font-semibold text-navy">{col.id}</span>
                  <span className="ml-auto text-xs font-medium bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">{colLeads.length}</span>
                </div>

                {/* Droppable column */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 rounded-xl p-2 space-y-2 transition-colors ${snapshot.isDraggingOver ? col.light + ' ' + col.border + ' border-2 border-dashed' : 'bg-gray-50/60 border-2 border-transparent'}`}
                      style={{ minHeight: 120 }}
                    >
                      {colLeads.map((lead, index) => (
                        <Draggable key={lead.id} draggableId={String(lead.id)} index={index}>
                          {(prov, snap) => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                              className={`bg-white rounded-lg p-3 shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing transition-shadow ${snap.isDragging ? 'shadow-lg rotate-1' : 'hover:shadow-md'}`}
                            >
                              <p className="text-sm font-semibold text-navy truncate">{lead.name}</p>
                              {lead.project_type && (
                                <p className="text-xs text-gray-400 mt-0.5 truncate">{lead.project_type}</p>
                              )}
                              {lead.budget && (
                                <p className="text-xs text-gold font-medium mt-1 truncate">{lead.budget}</p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                {lead.phone && (
                                  <span className="text-xs text-gray-400 truncate">📞 {lead.phone}</span>
                                )}
                              </div>
                              {lead.city && (
                                <p className="text-xs text-gray-300 mt-1">📍 {lead.city}</p>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {colLeads.length === 0 && !snapshot.isDraggingOver && (
                        <p className="text-center text-xs text-gray-300 py-6">Vide</p>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nouveau lead">
        <form onSubmit={handleCreate} className="space-y-4">
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
              <input type="email" className="input" value={form.email} onChange={e => set('email', e.target.value)} />
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
              <label className="label">Colonne initiale</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                {COLUMNS.map(c => <option key={c.id}>{c.id}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full py-2.5">
            {saving ? 'Enregistrement…' : 'Ajouter'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
