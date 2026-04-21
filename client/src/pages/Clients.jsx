import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { formatDH, formatDate } from '../utils/format'

export default function Clients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/api/clients', { params: search ? { search } : {} })
      .then(r => setClients(r.data))
      .finally(() => setLoading(false))
  }, [search])

  const totalCA = clients.reduce((sum, c) => sum + (Number(c.project_value) || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-navy">Clients</h1>
          <p className="text-gray-500 text-sm mt-1">{clients.length} client{clients.length !== 1 ? 's' : ''} · CA : {formatDH(totalCA)}</p>
        </div>
      </div>

      <input className="input w-full sm:max-w-xs" placeholder="Rechercher un client…" value={search} onChange={e => setSearch(e.target.value)} />

      {/* Desktop Table */}
      <div className="card overflow-hidden hidden sm:block">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Chargement…</div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40">
            <p className="text-gray-400 text-sm">Aucun client pour l'instant</p>
            <p className="text-xs text-gray-300 mt-1">Les leads marqués "Gagné" apparaissent ici automatiquement</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Client','Téléphone','Type de projet','Ville','Valeur projet','Date clôture'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id} onClick={() => navigate(`/clients/${c.id}`)} className="table-row">
                  <td className="px-4 py-3 font-medium text-navy">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.project_type || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.city || '—'}</td>
                  <td className="px-4 py-3 font-semibold text-green-600">{formatDH(c.project_value)}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(c.closing_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile Card List */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Chargement…</div>
        ) : clients.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-12 text-center">
            <p className="text-gray-400 text-sm">Aucun client pour l'instant</p>
            <p className="text-xs text-gray-300 mt-1">Les leads marqués "Gagné" apparaissent ici</p>
          </div>
        ) : clients.map(c => (
          <div key={c.id} onClick={() => navigate(`/clients/${c.id}`)} className="card p-4 cursor-pointer active:opacity-80 transition-opacity">
            <div className="flex items-start justify-between gap-3 mb-2">
              <p className="font-semibold text-navy text-sm">{c.name}</p>
              <span className="text-green-600 font-bold text-sm shrink-0">{formatDH(c.project_value)}</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
              {c.project_type && <span>{c.project_type}</span>}
              {c.city && <span>📍 {c.city}</span>}
              {c.phone && <span>📞 {c.phone}</span>}
              {c.closing_date && <span>{formatDate(c.closing_date)}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
