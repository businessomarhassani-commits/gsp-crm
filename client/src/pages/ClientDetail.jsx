import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { formatDH, formatDate, formatDateTime } from '../utils/format'

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [editValue, setEditValue] = useState(false)
  const [projectValue, setProjectValue] = useState('')

  const load = () => {
    api.get(`/api/clients/${id}`).then(r => {
      setClient(r.data)
      setNotes(r.data.notes || '')
      setProjectValue(r.data.project_value || '')
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const saveNotes = async () => {
    setSavingNotes(true)
    await api.put(`/api/clients/${id}`, { notes })
    toast.success('Notes sauvegardées !')
    setSavingNotes(false)
  }

  const saveValue = async () => {
    await api.put(`/api/clients/${id}`, { project_value: Number(projectValue) })
    toast.success('Valeur mise à jour !')
    setEditValue(false)
    load()
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-navy/40 text-sm">Chargement…</div>
  if (!client) return <div className="text-center text-gray-400 py-20">Client introuvable</div>

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back */}
      <button onClick={() => navigate('/clients')} className="text-sm text-gold hover:underline flex items-center gap-1">← Retour aux clients</button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">{client.name}</h1>
          <p className="text-gray-500 text-sm mt-1">{client.project_type} · {client.city}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">✓ Client</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info card */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-navy text-sm uppercase tracking-wider">Informations</h2>
          {[
            { label: 'Téléphone', value: client.phone },
            { label: 'Email', value: client.email },
            { label: 'Ville', value: client.city },
            { label: 'Type de projet', value: client.project_type },
            { label: 'Date clôture', value: formatDate(client.closing_date) },
            { label: 'Client depuis', value: formatDate(client.created_at) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-sm font-medium text-navy mt-0.5">{value || '—'}</p>
            </div>
          ))}
          {/* Project value editable */}
          <div>
            <p className="text-xs text-gray-400 mb-1">Valeur du projet</p>
            {editValue ? (
              <div className="flex gap-2">
                <input type="number" className="input flex-1" value={projectValue} onChange={e => setProjectValue(e.target.value)} />
                <button onClick={saveValue} className="btn-primary px-3 text-xs">✓</button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-base font-bold text-green-600">{formatDH(client.project_value)}</p>
                <button onClick={() => setEditValue(true)} className="text-xs text-gold hover:underline">Modifier</button>
              </div>
            )}
          </div>
        </div>

        {/* Notes + history */}
        <div className="lg:col-span-2 space-y-5">
          {/* Notes */}
          <div className="card p-5">
            <h2 className="font-semibold text-navy text-sm uppercase tracking-wider mb-3">Notes</h2>
            <textarea className="input resize-none h-28" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes sur ce client…" />
            <button onClick={saveNotes} disabled={savingNotes} className="btn-primary mt-2 text-xs px-4">
              {savingNotes ? 'Sauvegarde…' : 'Sauvegarder'}
            </button>
          </div>

          {/* Reminders */}
          {client.reminders?.length > 0 && (
            <div className="card p-5">
              <h2 className="font-semibold text-navy text-sm uppercase tracking-wider mb-3">Rappels liés</h2>
              <div className="space-y-2">
                {client.reminders.map(r => (
                  <div key={r.id} className="flex items-start justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-navy">{r.title}</p>
                      {r.description && <p className="text-xs text-gray-400 mt-0.5">{r.description}</p>}
                    </div>
                    <span className="text-xs text-gold shrink-0">{formatDateTime(r.reminder_date)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History */}
          <div className="card p-5">
            <h2 className="font-semibold text-navy text-sm uppercase tracking-wider mb-3">Historique</h2>
            {client.history?.length === 0 ? (
              <p className="text-gray-400 text-sm">Aucune activité enregistrée</p>
            ) : (
              <div className="space-y-3">
                {client.history?.map(h => (
                  <div key={h.id} className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-gold mt-2 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-navy">{h.action}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{h.description}</p>
                      <p className="text-xs text-gray-300 mt-0.5">{formatDateTime(h.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
