import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function AdminSettings() {
  const { user, setUser } = useAuth()
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    confirm: '',
  })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleProfile = async (e) => {
    e.preventDefault()
    if (form.password && form.password !== form.confirm) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }
    setSaving(true)
    try {
      const body = { name: form.name, email: form.email }
      if (form.password) body.password = form.password
      const { data } = await api.put('/api/auth/profile', body)
      setUser(data)
      toast.success('Profil mis à jour avec succès')
      setForm(f => ({ ...f, password: '', confirm: '' }))
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  const card = 'bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-white/5 p-6'

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paramètres plateforme</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Profil et informations de la plateforme</p>
      </div>

      {/* Mon Profil */}
      <div className={card}>
        <h2 className="text-gray-900 dark:text-white font-semibold text-sm uppercase tracking-wider mb-5">Mon profil</h2>
        <form onSubmit={handleProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nom complet</label>
              <input
                required
                className="input"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Votre nom"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                required
                type="email"
                className="input"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="votre@email.com"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-white/5 pt-4">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
              Laissez les champs mot de passe vides pour ne pas le modifier.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Nouveau mot de passe</label>
                <input
                  type="password"
                  minLength={6}
                  className="input"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder="Min 6 caractères"
                />
              </div>
              <div>
                <label className="label">Confirmer le mot de passe</label>
                <input
                  type="password"
                  minLength={6}
                  className="input"
                  value={form.confirm}
                  onChange={e => set('confirm', e.target.value)}
                  placeholder="Répéter le mot de passe"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-colors"
            >
              {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>

      {/* Platform info */}
      <div className={card}>
        <h2 className="text-gray-900 dark:text-white font-semibold text-sm uppercase tracking-wider mb-4">Informations plateforme</h2>
        <div className="space-y-0">
          {[
            { label: 'Plateforme',     value: 'ArchiCRM' },
            { label: 'Version',        value: '1.0.0' },
            { label: 'Base de données', value: 'Supabase (PostgreSQL)' },
            { label: 'Hébergement',    value: 'Vercel' },
            { label: 'Région',         value: 'EU West' },
            { label: 'Statut',         value: 'Opérationnel' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-white/5 last:border-0">
              <span className="text-gray-500 dark:text-gray-400 text-sm">{item.label}</span>
              <span className="text-gray-900 dark:text-gray-200 font-medium text-sm">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
