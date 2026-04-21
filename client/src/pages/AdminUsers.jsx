import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'
import { formatDH, formatDate } from '../utils/format'
import { Eye, CheckCircle, XCircle } from 'lucide-react'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [tab, setTab] = useState('active') // 'active' | 'pending'
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' })
  const navigate = useNavigate()

  const load = async () => {
    const { data } = await api.get('/api/admin/users')
    setUsers(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const activeUsers  = users.filter(u => u.account_status !== 'pending')
  const pendingUsers = users.filter(u => u.account_status === 'pending')

  const filtered = (tab === 'pending' ? pendingUsers : activeUsers).filter(u => {
    if (!search) return true
    const q = search.toLowerCase()
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  })

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

  const handleApprove = async (user) => {
    try {
      await api.put(`/api/admin/users/${user.id}/approve`)
      toast.success(`${user.name} approuvé`)
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur')
    }
  }

  const handleReject = async (user) => {
    if (!window.confirm(`Rejeter et supprimer le compte de ${user.name} ?`)) return
    try {
      await api.delete(`/api/admin/users/${user.id}/reject`)
      toast.success('Compte rejeté')
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur')
    }
  }

  const handleImpersonate = async (user) => {
    try {
      const { data } = await api.post(`/api/admin/impersonate/${user.id}`)
      // Open CRM app on the app subdomain (or same host in local dev)
      const crmBase = window.location.hostname === 'admin.archicrm.ma' ? 'https://app.archicrm.ma' : ''
      window.open(`${crmBase}/?impersonate=${encodeURIComponent(data.token)}`, '_blank')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur impersonation')
    }
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Utilisateurs</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {activeUsers.length} compte{activeUsers.length !== 1 ? 's' : ''} actif{activeUsers.length !== 1 ? 's' : ''}
            {pendingUsers.length > 0 && (
              <span className="ml-2 text-amber-600 dark:text-amber-400 font-medium">· {pendingUsers.length} en attente</span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-gray-900 dark:bg-white hover:bg-gray-700 dark:hover:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          + Nouveau
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/[0.05] p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab('active')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'active' ? 'bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
        >
          Actifs ({activeUsers.length})
        </button>
        <button
          onClick={() => setTab('pending')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'pending' ? 'bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
        >
          En attente
          {pendingUsers.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {pendingUsers.length}
            </span>
          )}
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
          placeholder="Rechercher…"
          className="w-full max-w-sm pl-10 pr-4 py-2.5 bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#E8A838]/50 transition-colors"
        />
      </div>

      {/* Pending tab */}
      {tab === 'pending' && (
        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-white/[0.06] overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">Aucune demande en attente</div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-white/[0.04]">
              {filtered.map(u => (
                <div key={u.id} className="px-4 sm:px-5 py-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                      <span className="text-amber-600 dark:text-amber-400 text-sm font-bold">{u.name?.[0]?.toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">{u.name}</p>
                      <p className="text-[11px] text-gray-400 truncate">{u.email} · {formatDate(u.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(u)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-[12px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 px-3 py-2 rounded-lg transition-colors"
                    >
                      <CheckCircle size={13} />
                      Approuver
                    </button>
                    <button
                      onClick={() => handleReject(u)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-[12px] font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 px-3 py-2 rounded-lg transition-colors"
                    >
                      <XCircle size={13} />
                      Rejeter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Active tab */}
      {tab === 'active' && (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-white/[0.06] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-transparent">
                    {['Utilisateur','Rôle','Leads','CA','META','Inscription','Statut','Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3.5 text-[11px] font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} className="text-center text-gray-400 text-sm py-12">Aucun utilisateur trouvé</td></tr>
                  ) : filtered.map(u => (
                    <tr
                      key={u.id}
                      className="border-b border-gray-50 dark:border-white/[0.04] last:border-0 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/users/${u.id}`)}
                    >
                      <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#E8A838]/10 border border-[#E8A838]/20 flex items-center justify-center shrink-0">
                            <span className="text-[#E8A838] text-xs font-bold">{u.name?.[0]?.toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-xs hover:text-[#E8A838] cursor-pointer" onClick={() => navigate(`/admin/users/${u.id}`)}>{u.name}</p>
                            <p className="text-gray-400 text-xs">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                        <select value={u.role} onChange={e => handleRoleChange(u, e.target.value)} className="text-xs bg-transparent border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1 text-gray-700 dark:text-gray-300 focus:outline-none">
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400 text-xs">{u.lead_count ?? 0}</td>
                      <td className="px-4 py-3.5 text-emerald-600 dark:text-emerald-400 font-medium text-xs">{formatDH(u.ca)}</td>
                      <td className="px-4 py-3.5">
                        {u.has_meta_connection ? (
                          <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" />Connecté</span>
                        ) : <span className="text-xs text-gray-300 dark:text-gray-600">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-gray-400 text-xs whitespace-nowrap">{formatDate(u.created_at)}</td>
                      <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                        {u.status === 'suspended' ? (
                          <span className="inline-flex items-center gap-1 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded font-medium">Suspendu</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded font-medium"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Actif</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleImpersonate(u)} title="Accéder au CRM" className="p-1.5 text-gray-400 hover:text-[#E8A838] hover:bg-[#E8A838]/10 rounded-lg transition-colors"><Eye size={14} /></button>
                          <button onClick={() => handleSuspend(u)} className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${u.status === 'suspended' ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'}`}>
                            {u.status === 'suspended' ? 'Réactiver' : 'Suspendre'}
                          </button>
                          {u.role !== 'admin' && (
                            <button onClick={() => handleDelete(u)} className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1.5 rounded-lg transition-colors">✕</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {filtered.length === 0 ? (
              <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-white/[0.06] p-8 text-center text-gray-400 text-sm">
                Aucun utilisateur trouvé
              </div>
            ) : filtered.map(u => (
              <div key={u.id} className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-white/[0.06] p-4">
                <div className="flex items-center gap-3 mb-3" onClick={() => navigate(`/admin/users/${u.id}`)}>
                  <div className="w-10 h-10 rounded-full bg-[#E8A838]/10 border border-[#E8A838]/20 flex items-center justify-center shrink-0">
                    <span className="text-[#E8A838] text-sm font-bold">{u.name?.[0]?.toUpperCase()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{u.name}</p>
                    <p className="text-gray-400 text-xs truncate">{u.email}</p>
                  </div>
                  {u.status === 'suspended' ? (
                    <span className="text-xs bg-red-50 dark:bg-red-900/20 text-red-500 px-2 py-0.5 rounded font-medium shrink-0">Suspendu</span>
                  ) : (
                    <span className="text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 px-2 py-0.5 rounded font-medium shrink-0">Actif</span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400 mb-3 flex-wrap">
                  <span>{u.lead_count ?? 0} leads</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">{formatDH(u.ca)}</span>
                  {u.has_meta_connection && <span className="text-blue-500">Meta ✓</span>}
                  <span>{u.role}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleImpersonate(u)} className="flex items-center gap-1.5 text-xs text-[#E8A838] bg-[#E8A838]/10 hover:bg-[#E8A838]/20 font-medium px-3 py-1.5 rounded-lg transition-colors">
                    <Eye size={12} /> Accéder
                  </button>
                  <button onClick={() => handleSuspend(u)} className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${u.status === 'suspended' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-amber-600 bg-amber-50 dark:bg-amber-900/20'}`}>
                    {u.status === 'suspended' ? 'Réactiver' : 'Suspendre'}
                  </button>
                  {u.role !== 'admin' && (
                    <button onClick={() => handleDelete(u)} className="ml-auto text-xs text-red-400 hover:text-red-600 px-2 py-1.5 rounded-lg transition-colors">✕</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

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
          <button type="submit" disabled={saving} className="w-full py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors hover:bg-gray-700 dark:hover:bg-gray-100">
            {saving ? 'Création…' : "Créer l'utilisateur"}
          </button>
        </form>
      </Modal>
    </div>
  )
}
