import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { User, Lock, Plug, Palette, Sun, Moon, RefreshCw, ShieldCheck } from 'lucide-react'

function MetaIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  )
}

function PageSelectorModal({ pages, onSelect, onClose }) {
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleConfirm = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await api.post('/api/meta/select-page', { page_id: selected })
      toast.success('Page connectée avec succès !')
      onSelect()
    } catch {
      toast.error('Erreur lors de la sélection de la page')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-white/10 w-full max-w-md shadow-2xl">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06]">
          <h3 className="font-semibold text-gray-900 dark:text-white text-[15px]">Choisir une page Facebook</h3>
          <p className="text-gray-400 text-xs mt-1">Sélectionnez la page liée à vos formulaires Meta Ads</p>
        </div>
        <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
          {pages.map(page => (
            <label key={page.id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-all ${selected === page.id ? 'border-[#E8A838] bg-[#E8A838]/5' : 'border-gray-100 dark:border-white/[0.06] hover:border-gray-200 dark:hover:border-white/10'}`}>
              <input type="radio" name="page" value={page.id} checked={selected === page.id} onChange={() => setSelected(page.id)} className="accent-[#E8A838]" />
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                <MetaIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{page.name}</p>
                <p className="text-xs text-gray-400">ID: {page.id}</p>
              </div>
            </label>
          ))}
        </div>
        <div className="px-5 py-4 border-t border-gray-100 dark:border-white/[0.06] flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Annuler</button>
          <button disabled={!selected || saving} onClick={handleConfirm} className="flex-1 py-2 bg-[#E8A838] hover:bg-[#d4952a] disabled:opacity-50 text-[#0A0A0A] text-sm font-semibold rounded-lg transition-colors">
            {saving ? 'Connexion…' : 'Connecter'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SectionCard({ icon: Icon, title, badge, children }) {
  return (
    <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/[0.06] rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-50 dark:border-white/[0.04]">
        <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/[0.06] flex items-center justify-center">
          <Icon size={15} className="text-gray-500 dark:text-white/40" />
        </div>
        <h2 className="font-semibold text-gray-900 dark:text-white text-[14px] flex-1">{title}</h2>
        {badge}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

export default function UserSettings() {
  const { user, setUser, isImpersonating } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [searchParams, setSearchParams] = useSearchParams()

  // Profile form
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' })
  const [savingProfile, setSavingProfile] = useState(false)

  // Password form — two modes: regular (needs current) vs impersonation (admin sets directly)
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm: '' })
  const [savingPwd, setSavingPwd] = useState(false)

  // Meta integration
  const [connection, setConnection] = useState(null)
  const [metaLoading, setMetaLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [resubscribing, setResubscribing] = useState(false)
  const [pendingPages, setPendingPages] = useState(null)

  // Handle OAuth callback — this page is loaded inside the popup window after Meta redirects
  useEffect(() => {
    const metaParam = searchParams.get('meta')
    if (!metaParam) return
    setSearchParams({}, { replace: true })
    if (window.opener) {
      const typeMap = { success: 'META_OAUTH_SUCCESS', select: 'META_OAUTH_SELECT', error: 'META_OAUTH_ERROR', no_pages: 'META_OAUTH_NO_PAGES' }
      window.opener.postMessage({ type: typeMap[metaParam] || 'META_OAUTH_ERROR' }, '*')
      window.close()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadConnection = useCallback(async () => {
    try {
      const { data } = await api.get('/api/meta/connection')
      setConnection(data)
      if (data && !data.is_active && data.pending_pages) {
        const { data: pages } = await api.get('/api/meta/pending-pages')
        setPendingPages(pages)
      } else {
        setPendingPages(null)
      }
    } catch {
      setConnection(null)
    } finally {
      setMetaLoading(false)
    }
  }, [])

  useEffect(() => { loadConnection() }, [loadConnection])

  // Listen for postMessage from OAuth popup
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === 'META_OAUTH_SUCCESS') { setConnecting(false); loadConnection(); toast.success('Compte Meta connecté !') }
      else if (e.data?.type === 'META_OAUTH_SELECT') { setConnecting(false); loadConnection() }
      else if (e.data?.type === 'META_OAUTH_ERROR') { setConnecting(false); toast.error('Échec connexion Meta') }
      else if (e.data?.type === 'META_OAUTH_NO_PAGES') { setConnecting(false); toast.error('Aucune page Facebook trouvée') }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [loadConnection])

  // ── Profile save (works in both normal and impersonation mode) ──────────────
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const { data } = await api.put('/api/auth/profile', { name: profile.name, email: profile.email })
      setUser(data)
      toast.success('Profil mis à jour')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur')
    } finally {
      setSavingProfile(false)
    }
  }

  // ── Password save — uses different endpoint for admin impersonation ──────────
  const handleSavePassword = async (e) => {
    e.preventDefault()
    if (passwords.new_password !== passwords.confirm) { toast.error('Les mots de passe ne correspondent pas'); return }
    if (passwords.new_password.length < 8) { toast.error('Minimum 8 caractères'); return }
    setSavingPwd(true)
    try {
      if (isImpersonating) {
        // Admin path — no current password required
        await api.put('/api/auth/force-password', { new_password: passwords.new_password })
      } else {
        // Regular user path — must verify current password
        await api.put('/api/auth/password', { current_password: passwords.current_password, new_password: passwords.new_password })
      }
      toast.success('Mot de passe modifié avec succès')
      setPasswords({ current_password: '', new_password: '', confirm: '' })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur')
    } finally {
      setSavingPwd(false)
    }
  }

  // ── Meta OAuth connect ───────────────────────────────────────────────────────
  const handleConnect = async () => {
    try {
      setConnecting(true)
      const { data } = await api.get('/api/meta/auth-url')
      const popup = window.open(data.url, 'meta_oauth', 'width=600,height=700,scrollbars=yes,resizable=yes')
      const timer = setInterval(() => { if (popup?.closed) { clearInterval(timer); setConnecting(false); loadConnection() } }, 1000)
    } catch {
      setConnecting(false)
      toast.error('Impossible de générer le lien Meta')
    }
  }

  const handleResubscribe = async () => {
    setResubscribing(true)
    try {
      await api.post('/api/meta/subscribe-page')
      toast.success('Webhook leadgen réactivé !')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur')
    } finally {
      setResubscribing(false)
    }
  }

  const handleDisconnect = async () => {
    if (!window.confirm('Déconnecter Meta Ads ? Les leads existants seront conservés.')) return
    setDisconnecting(true)
    try {
      await api.delete('/api/meta/connection')
      setConnection(null)
      toast.success('Compte Meta déconnecté')
    } catch {
      toast.error('Erreur lors de la déconnexion')
    } finally {
      setDisconnecting(false)
    }
  }

  const isConnected = connection?.is_active && connection?.page_id
  const hasPending = connection && !connection.is_active && pendingPages?.length > 0

  const inputClass = "w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#E8A838]/30 focus:border-[#E8A838]/60 bg-white dark:bg-[#1a1a1a] dark:text-white transition"
  const labelClass = "block text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/30 mb-1.5"
  const saveBtn = "px-5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[13px] font-semibold rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-[22px] font-bold text-gray-900 dark:text-white">Paramètres</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          {isImpersonating ? `Gestion du compte de ${user?.name}` : 'Gérez votre compte et vos préférences'}
        </p>
      </div>

      {/* ── Section 1: Profile ──────────────────────────────────────────────── */}
      <SectionCard icon={User} title="Mon profil">
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-[#E8A838]/15 border-2 border-[#E8A838]/30 flex items-center justify-center">
              <span className="text-[#E8A838] text-xl font-bold">{user?.name?.[0]?.toUpperCase() || '?'}</span>
            </div>
            <div>
              <p className="text-[14px] font-semibold text-gray-900 dark:text-white">{user?.name}</p>
              <p className="text-[12px] text-gray-400">{user?.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nom complet</label>
              <input className={inputClass} value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="Votre nom" />
            </div>
            <div>
              <label className={labelClass}>Adresse email</label>
              <input type="email" className={inputClass} value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} placeholder="vous@cabinet.ma" />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={savingProfile} className={saveBtn}>
              {savingProfile ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </SectionCard>

      {/* ── Section 2: Security ─────────────────────────────────────────────── */}
      <SectionCard
        icon={Lock}
        title="Sécurité"
        badge={isImpersonating && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[#E8A838]/10 text-[#E8A838] px-2 py-0.5 rounded">
            <ShieldCheck size={10} /> Mode admin
          </span>
        )}
      >
        <form onSubmit={handleSavePassword} className="space-y-4">
          {/* Admin impersonation: no current password needed */}
          {!isImpersonating && (
            <div>
              <label className={labelClass}>Mot de passe actuel</label>
              <input
                type="password"
                required
                className={inputClass}
                value={passwords.current_password}
                onChange={e => setPasswords(p => ({ ...p, current_password: e.target.value }))}
                placeholder="••••••••"
              />
            </div>
          )}
          {isImpersonating && (
            <p className="text-[12px] text-[#E8A838]/80 bg-[#E8A838]/5 border border-[#E8A838]/20 rounded-lg px-3 py-2">
              En tant qu'administrateur, vous pouvez définir un nouveau mot de passe sans connaître l'ancien.
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nouveau mot de passe</label>
              <input
                type="password"
                required
                minLength={8}
                className={inputClass}
                value={passwords.new_password}
                onChange={e => setPasswords(p => ({ ...p, new_password: e.target.value }))}
                placeholder="Min 8 caractères"
              />
            </div>
            <div>
              <label className={labelClass}>Confirmer</label>
              <input
                type="password"
                required
                className={inputClass}
                value={passwords.confirm}
                onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                placeholder="••••••••"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={savingPwd} className={saveBtn}>
              {savingPwd ? 'Modification…' : 'Changer le mot de passe'}
            </button>
          </div>
        </form>
      </SectionCard>

      {/* ── Section 3: Integrations ─────────────────────────────────────────── */}
      <SectionCard icon={Plug} title="Intégrations">
        <div className="space-y-4">
          {/* Meta Ads block */}
          <div className="border border-gray-100 dark:border-white/[0.06] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-50 dark:border-white/[0.04]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <MetaIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-gray-900 dark:text-white">Meta Ads</p>
                  <p className="text-[11px] text-gray-400">Facebook & Instagram Lead Forms</p>
                </div>
              </div>
              {isConnected && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Connecté
                </span>
              )}
            </div>

            <div className="p-4">
              {metaLoading ? (
                <p className="text-sm text-gray-400">Chargement…</p>
              ) : isConnected ? (
                /* ── Connected state ── */
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-1 bg-gray-50 dark:bg-white/[0.03] rounded-lg p-3">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Page connectée</p>
                      <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{connection.page_name}</p>
                      <p className="text-[11px] text-gray-400">ID: {connection.page_id}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-white/[0.03] rounded-lg p-3 text-center min-w-[80px]">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Leads reçus</p>
                      <p className="text-[20px] font-bold text-blue-600 dark:text-blue-400">{connection.meta_leads_count ?? 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleResubscribe}
                      disabled={resubscribing}
                      className="flex items-center gap-1.5 text-[12px] font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <RefreshCw size={12} className={resubscribing ? 'animate-spin' : ''} />
                      {resubscribing ? 'Réactivation…' : 'Réactiver webhook'}
                    </button>
                    <button
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                      className="text-[12px] text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {disconnecting ? 'Déconnexion…' : 'Déconnecter'}
                    </button>
                  </div>
                </div>
              ) : hasPending ? (
                /* ── Pending page selection ── */
                <div className="space-y-3">
                  <p className="text-[13px] text-gray-600 dark:text-gray-300">
                    Plusieurs pages détectées sur ce compte. Sélectionnez la page liée aux campagnes Meta Ads.
                  </p>
                  <button
                    onClick={() => setPendingPages(pendingPages)}
                    className="text-[13px] font-semibold bg-[#E8A838] text-[#0A0A0A] px-4 py-2 rounded-lg hover:bg-[#d4952a] transition-colors"
                  >
                    Choisir la page Facebook
                  </button>
                </div>
              ) : (
                /* ── Disconnected state ── */
                <div className="space-y-3">
                  <p className="text-[13px] text-gray-500 dark:text-gray-400">
                    {isImpersonating
                      ? 'Connectez le compte Meta Ads de cet utilisateur pour activer l\'importation automatique des leads.'
                      : 'Importez automatiquement vos leads Meta dans ArchiCRM en temps réel.'}
                  </p>
                  <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-[13px] font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    <MetaIcon className="w-4 h-4" />
                    {connecting ? 'Connexion en cours…' : 'Connecter Meta Ads'}
                  </button>
                  <p className="text-[11px] text-gray-400">
                    Une fenêtre Facebook s'ouvrira pour autoriser l'accès aux pages et leads.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Coming soon tiles */}
          <div className="grid grid-cols-2 gap-3">
            {['Google Ads', 'WhatsApp Business', 'TikTok Ads', 'Zapier / Make'].map(name => (
              <div key={name} className="border border-gray-100 dark:border-white/[0.04] rounded-xl p-3 opacity-40 select-none">
                <p className="text-[12px] font-medium text-gray-700 dark:text-white">{name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Bientôt disponible</p>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* ── Section 4: Appearance ───────────────────────────────────────────── */}
      <SectionCard icon={Palette} title="Apparence">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-gray-900 dark:text-white">Thème de l'interface</p>
            <p className="text-[12px] text-gray-400 mt-0.5">{theme === 'dark' ? 'Mode sombre actif' : 'Mode clair actif'}</p>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-[13px] font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors"
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            {theme === 'dark' ? 'Passer en clair' : 'Passer en sombre'}
          </button>
        </div>
      </SectionCard>

      {/* Page selector modal */}
      {hasPending && pendingPages?.length > 0 && (
        <PageSelectorModal
          pages={pendingPages}
          onSelect={() => { setPendingPages(null); loadConnection() }}
          onClose={() => setPendingPages(null)}
        />
      )}
    </div>
  )
}
