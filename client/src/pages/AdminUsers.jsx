import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'
import { formatDH, formatDate } from '../utils/format'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' })
  const navigate = useNavigate()

  const load = async () => {
    const { data } = await api.get('/api/admin/users')
    setUsers(data)
    setFiltered(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(q ? users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) : users)
  }, [search, users])

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
      toast.success(`Compte ${user.status === 'suspended' ? 'réactivé' : 'suspendu'}`)
      load()
    } catch { toast.error('Erreur') }
  }

  const handleDelete = async (user) => {
    if (!window.confirm(`Supprimer définitivement ${user.name} ? Toutes ses données seront perdues.`)) return
    try {
      await api.delete(`/api/admin/users/${user.id}`)
      toast.success('Utilisateur supprimé')
      load()
    } catch { toast.error('Erreur') }
  }

  const handleRoleChange = async (user, role) => {
    try {
      await api.put(`/api/admin/users/${user.id}`, { role })
      toast.success('Rôle mis à jour')
      load()
    } catch { toast.error('Erreur') }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-400 text-sm">Chargement…</div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Utilisateurs</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {users.length} compte{users.length !== 1 ? 's' : ''} enregistré{users.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <span className="text-lg leading-none">+</span> Nouveau
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un utilisateur…"
          className="w-full max-w-sm pl-10 pr-4 py-2.5 bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500/50 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-transparent">
                {['Utilisateur','Rôle','Leads','CA','Inscription','Statut','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 text-sm py-12">Aucun utilisateur trouvé</td>
                </tr>
              ) : filtered.map(u => (
                <tr
                  key={u.id}
                  className="border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                  onClick={() => navigate(`/admin/users/${u.id}`)}
                >
                  {/* Utilisateur */}
                  <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-600/30 flex items-center justify-center shrink-0">
                        <span className="text-indigo-600 dark:text-indigo-400 text-xs font-bold">{u.name?.[0]?.toUpperCase()}</span>
                      </div>
                      <div>
                        <p
                          className="font-medium text-gray-900 dark:text-white text-xs hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                          onClick={() => navigate(`/admin/users/${u.id}`)}
                        >
                          {u.name}
                        </p>
                        <p className="text-gray-400 text-xs">{u.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Rôle */}
                  <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                    <select
                      value={u.role}
                      onChange={e => handleRoleChange(u, e.target.value)}
                      className="text-xs bg-transparent border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-indigo-500/50"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>

                  {/* Leads */}
                  <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400">{u.lead_count ?? 0}</td>

                  {/* CA */}
                  <td className="px-4 py-3.5 text-emerald-600 dark:text-emerald-400 font-medium">{formatDH(u.ca)}</td>

                  {/* Inscription */}
                  <td className="px-4 py-3.5 text-gray-400 text-xs whitespace-nowrap">{formatDate(u.created_at)}</td>

                  {/* Statut */}
                  <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                    {u.status === 'suspended' ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700/30 px-2 py-0.5 rounded-full font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400" />
                        Suspendu
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/30 px-2 py-0.5 rounded-full font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                        Actif
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSuspend(u)}
                        className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                          u.status === 'suspended'
                            ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                            : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                        }`}
                      >
                        {u.status === 'suspended' ? 'Réactiver' : 'Suspendre'}
                      </button>
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleDelete(u)}
                          className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1.5 rounded-lg transition-colors"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create modal */}
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
          <button type="submit" disabled={saving} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
            {saving ? 'Création…' : "Créer l'utilisateur"}
          </button>
        </form>
      </Modal>
    </div>
  )
}
