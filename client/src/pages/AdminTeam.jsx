import { useEffect, useState } from 'react'
import { Users2, Plus, Pencil, Trash2, PowerOff, Power, ShieldCheck, Shield } from 'lucide-react'
import { useAdminAuth } from '../context/AdminAuthContext'
import Modal from '../components/Modal'
import api from '../utils/api'
import toast from 'react-hot-toast'

const PERM_LABELS = { users: 'Utilisateurs', analytics: 'Analytics', settings: 'Paramètres' }

function PermBadge({ label, active }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
      active
        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
        : 'bg-gray-100 dark:bg-white/5 text-gray-400'
    }`}>
      {label}
    </span>
  )
}

const EMPTY_FORM = { name: '', email: '', password: '', permissions: { users: false, analytics: false, settings: false } }

export default function AdminTeam() {
  const { admin } = useAdminAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null) // member being edited, or null for new
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const { data } = await api.get('/api/admin/team')
      setMembers(data)
    } catch { toast.error('Erreur chargement') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  const openEdit = (member) => {
    setEditing(member)
    setForm({
      name: member.name,
      email: member.email,
      password: '',
      permissions: { ...member.permissions },
    })
    setShowModal(true)
  }

  const closeModal = () => { setShowModal(false); setEditing(null); setForm(EMPTY_FORM) }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body = { name: form.name, email: form.email, permissions: form.permissions }
      if (form.password) body.password = form.password
      if (editing) {
        await api.put(`/api/admin/team/${editing.id}`, body)
        toast.success('Membre mis à jour')
      } else {
        if (!form.password) { toast.error('Mot de passe requis'); setSaving(false); return }
        body.password = form.password
        await api.post('/api/admin/team', body)
        toast.success('Membre ajouté')
      }
      closeModal()
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (member) => {
    const action = member.is_active ? 'désactiver' : 'réactiver'
    if (!window.confirm(`Voulez-vous ${action} ${member.name} ?`)) return
    try {
      await api.put(`/api/admin/team/${member.id}`, { is_active: !member.is_active })
      toast.success(`Compte ${member.is_active ? 'désactivé' : 'réactivé'}`)
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur')
    }
  }

  const handleDelete = async (member) => {
    if (!window.confirm(`Supprimer définitivement ${member.name} ?`)) return
    try {
      await api.delete(`/api/admin/team/${member.id}`)
      toast.success('Membre supprimé')
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur')
    }
  }

  const togglePerm = (key) => {
    setForm(f => ({ ...f, permissions: { ...f.permissions, [key]: !f.permissions[key] } }))
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-400 text-sm">Chargement…</div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users2 size={22} className="text-[#E8A838]" />
            Mon Équipe
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">Gérez les accès de votre équipe d'administration</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#E8A838] hover:bg-[#d4962e] active:scale-95 text-[#0A0A0A] font-semibold text-sm px-4 py-2.5 rounded-xl transition-all"
        >
          <Plus size={15} />
          Ajouter un membre
        </button>
      </div>

      {/* Members list */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden">
        {members.length === 0 ? (
          <div className="py-16 text-center">
            <Users2 size={32} className="mx-auto text-gray-300 dark:text-white/10 mb-3" />
            <p className="text-gray-400 text-sm">Aucun membre dans l'équipe</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden sm:table w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-transparent">
                  {['Membre', 'Permissions', 'Statut', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id} className="border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#E8A838]/15 border border-[#E8A838]/30 flex items-center justify-center shrink-0">
                          <span className="text-[#E8A838] font-bold text-sm">{m.name[0]?.toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                            {m.name}
                            {m.id === admin?.id && (
                              <span className="text-[10px] font-bold text-white bg-[#E8A838] px-1.5 py-0.5 rounded-full">Vous</span>
                            )}
                            {m.role === 'superadmin' && (
                              <ShieldCheck size={13} className="text-[#E8A838]" />
                            )}
                          </p>
                          <p className="text-gray-400 text-xs">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {m.role === 'superadmin' ? (
                        <span className="text-xs font-semibold text-[#E8A838] flex items-center gap-1">
                          <ShieldCheck size={12} /> Toutes les permissions
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(PERM_LABELS).map(([key, label]) => (
                            <PermBadge key={key} label={label} active={m.permissions?.[key]} />
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        m.is_active
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                          : 'bg-gray-100 dark:bg-white/5 text-gray-500'
                      }`}>
                        {m.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {m.role !== 'superadmin' && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(m)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                            title="Modifier"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleActive(m)}
                            className={`p-1.5 rounded-lg transition-colors ${m.is_active
                              ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                              : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                            }`}
                            title={m.is_active ? 'Désactiver' : 'Réactiver'}
                          >
                            {m.is_active ? <PowerOff size={14} /> : <Power size={14} />}
                          </button>
                          {m.id !== admin?.id && (
                            <button
                              onClick={() => handleDelete(m)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-gray-100 dark:divide-white/5">
              {members.map(m => (
                <div key={m.id} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#E8A838]/15 border border-[#E8A838]/30 flex items-center justify-center shrink-0">
                        <span className="text-[#E8A838] font-bold text-sm">{m.name[0]?.toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate flex items-center gap-1">
                          {m.name}
                          {m.role === 'superadmin' && <ShieldCheck size={12} className="text-[#E8A838] shrink-0" />}
                        </p>
                        <p className="text-gray-400 text-xs truncate">{m.email}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      m.is_active
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        : 'bg-gray-100 dark:bg-white/5 text-gray-500'
                    }`}>
                      {m.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {m.role === 'superadmin' ? (
                      <span className="text-[10px] font-semibold text-[#E8A838]">Toutes les permissions</span>
                    ) : (
                      Object.entries(PERM_LABELS).map(([key, label]) => (
                        <PermBadge key={key} label={label} active={m.permissions?.[key]} />
                      ))
                    )}
                  </div>
                  {m.role !== 'superadmin' && (
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => openEdit(m)} className="flex-1 text-xs font-medium border border-gray-200 dark:border-white/10 rounded-lg py-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        Modifier
                      </button>
                      <button onClick={() => handleToggleActive(m)} className={`flex-1 text-xs font-medium border rounded-lg py-1.5 transition-colors ${m.is_active
                        ? 'border-amber-200 dark:border-amber-800/30 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/10'
                        : 'border-emerald-200 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10'
                      }`}>
                        {m.is_active ? 'Désactiver' : 'Réactiver'}
                      </button>
                      {m.id !== admin?.id && (
                        <button onClick={() => handleDelete(m)} className="text-xs font-medium border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 rounded-lg px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                          Suppr.
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={showModal}
        onClose={closeModal}
        title={editing ? 'Modifier le membre' : 'Ajouter un membre'}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nom complet</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Omar Hassani"
                className="w-full border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-white/[0.03] text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#E8A838]/30 focus:border-[#E8A838]/60"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="membre@crm.archi"
                className="w-full border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-white/[0.03] text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#E8A838]/30 focus:border-[#E8A838]/60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Mot de passe {editing && <span className="text-gray-400">(laisser vide pour ne pas changer)</span>}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder={editing ? '••••••••' : 'Mot de passe'}
              required={!editing}
              className="w-full border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-white/[0.03] text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#E8A838]/30 focus:border-[#E8A838]/60"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Permissions</label>
            <div className="space-y-2">
              {Object.entries(PERM_LABELS).map(([key, label]) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={form.permissions[key] || false}
                    onChange={() => togglePerm(key)}
                    className="w-4 h-4 rounded accent-[#E8A838]"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#E8A838] hover:bg-[#d4962e] text-[#0A0A0A] font-bold text-sm rounded-xl py-2.5 transition-colors disabled:opacity-60"
            >
              {saving ? 'Enregistrement…' : (editing ? 'Mettre à jour' : 'Ajouter')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
