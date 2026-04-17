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
          <h1 className="text-2xl font-bold text-navy">Clients</h1>
          <p className="text-gray-500 text-sm mt-1">{clients.length} client{clients.length !== 1 ? 's' : ''} · CA total : {formatDH(totalCA)}</p>
        </div>
      </div>

      <input className="input max-w-xs" placeholder="Rechercher un client…" value={search} onChange={e => setSearch(e.target.value)} />

      <div className="card overflow-hidden">
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
    </div>
  )
}
