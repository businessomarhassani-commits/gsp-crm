import { useState, useEffect } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import { formatDH, formatDate } from '../utils/format'

export default function Admin() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' })

  const load = async () => {
    const [sRes, uRes] = await Promise.all([
      api.get('/api/admin/stats'),
      api.get('/api/admin/users'),
    ])
    setStats(sRes.data)
    setUsers(uRes.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/api/admin/users', form)
      toast.success('Utilisateur créé !')
      setShowCreate(false)
      setForm({ name: '', email: '', password: '', role: 'user' })
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const handleSuspend = async (user) => {
    const action = user.status === 'suspended' ? 'réactiver' : 'suspendre'
    if (!window.confirm(`Voulez-vous ${action} ${user.name} ?`)) return
    try {
      await api.put(`/api/admin/users/${user.id}/suspend`)
      toast.success(`Utilisateur ${user.status === 'suspended' ? 'réactivé' : 'suspendu'}`)
      load()
    } catch {
      toast.error('Erreur')
    }
  }

  const handleDelete = async (user) => {
    if (!window.confirm(`Supprimer définitivement ${user.name} ? Toutes ses données seront perdues.`)) return
    try {
      await api.delete(`/api/admin/users/${user.id}`)
      toast.success('Utilisateur supprimé')
      load()
    } catch {
      toast.error('Erreur')
    }
  }

  const handleRoleChange = async (user, role) => {
    try {
      await api.put(`/api/admin/users/${user.id}`, { role })
      toast.success('Rôle mis à jour')
      load()
    } catch {
      toast.error('Erreur')
    }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  if (loading) return <div className="flex items-center justify-center h-64 text-navy/40 text-sm">Chargement…</div>

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Administration</h1>
          <p className="text-gray-500 text-sm mt-1">Gestion des utilisateurs et statistiques globales</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <span>+</span> Nouvel utilisateur
        </button>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Utilisateurs',   value: stats?.total_users ?? 0 },
          { label: 'Leads total',    value: stats?.total_leads ?? 0 },
          { label: 'Utilisateurs actifs', value: stats?.active_users ?? 0 },
          { label: 'CA global',      value: formatDH(stats?.total_revenue) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-navy rounded-2xl p-5">
            <p className="text-white/50 text-xs uppercase tracking-wider mb-1">{label}</p>
            <p className="text-xl font-bold text-gold">{value}</p>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-navy text-sm uppercase tracking-wider">Utilisateurs ({users.length})</h2>
        </div>
        {users.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-12">Aucun utilisateur</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Nom','Email','Rôle','Leads','CA','Inscrit','Statut','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-navy whitespace-nowrap">{u.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={e => handleRoleChange(u, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-gold/30"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.lead_count ?? 0}</td>
                    <td className="px-4 py-3 font-medium text-green-600">{formatDH(u.ca)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      {u.status === 'suspended' ? (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Suspendu</span>
                      ) : (
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">Actif</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSuspend(u)}
                          className={`text-xs font-medium px-2 py-1 rounded-lg transition-colors ${
                            u.status === 'suspended'
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-yellow-600 hover:bg-yellow-50'
                          }`}
                        >
                          {u.status === 'suspended' ? 'Réactiver' : 'Suspendre'}
                        </button>
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleDelete(u)}
                            className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create user modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nouvel utilisateur">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Nom complet *</label>
            <input required className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Karim Benali" />
          </div>
          <div>
            <label className="label">Email *</label>
            <input required type="email" className="input" value={form.email} onChange={e => set('email', e.target.value)} placeholder="karim@cabinet.ma" />
          </div>
          <div>
            <label className="label">Mot de passe *</label>
            <input required type="password" minLength={6} className="input" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 6 caractères" />
          </div>
          <div>
            <label className="label">Rôle</label>
            <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
              <option value="user">Utilisateur</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full py-2.5">
            {saving ? 'Création…' : 'Créer l\'utilisateur'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
