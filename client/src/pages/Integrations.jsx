import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'

function MetaIcon({ className = 'w-6 h-6' }) {
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
      <div className="relative bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-white/10 w-full max-w-md shadow-2xl">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-white/5">
          <h3 className="font-semibold text-gray-900 dark:text-white">Choisir une page Facebook</h3>
          <p className="text-gray-400 text-xs mt-1">Sélectionnez la page liée à vos formulaires Meta Ads</p>
        </div>
        <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
          {pages.map(page => (
            <label
              key={page.id}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${
                selected === page.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10'
              }`}
            >
              <input
                type="radio"
                name="page"
                value={page.id}
                checked={selected === page.id}
                onChange={() => setSelected(page.id)}
                className="accent-blue-500"
              />
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <MetaIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{page.name}</p>
                <p className="text-xs text-gray-400">ID: {page.id}</p>
              </div>
            </label>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Annuler
          </button>
          <button
            disabled={!selected || saving}
            onClick={handleConfirm}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
          >
            {saving ? 'Connexion…' : 'Connecter cette page'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Integrations() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [connection, setConnection] = useState(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [resubscribing, setResubscribing] = useState(false)
  const [pendingPages, setPendingPages] = useState(null)

  // Handle OAuth callback redirect — runs inside popup window
  useEffect(() => {
    const metaParam = searchParams.get('meta')
    if (!metaParam) return
    // Remove query param so it doesn't re-fire on refresh
    setSearchParams({}, { replace: true })

    if (window.opener) {
      const typeMap = {
        success:  'META_OAUTH_SUCCESS',
        select:   'META_OAUTH_SELECT',
        error:    'META_OAUTH_ERROR',
        no_pages: 'META_OAUTH_NO_PAGES',
      }
      window.opener.postMessage({ type: typeMap[metaParam] || 'META_OAUTH_ERROR' }, '*')
      window.close()
    }
    // If not in a popup (direct navigation), handle inline
    else if (metaParam === 'success') {
      toast.success('Compte Meta connecté !')
    } else if (metaParam === 'error') {
      toast.error('Échec de la connexion Meta')
    } else if (metaParam === 'no_pages') {
      toast.error('Aucune page Facebook trouvée')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadConnection = useCallback(async () => {
    try {
      const { data } = await api.get('/api/meta/connection')
      setConnection(data)

      // If there's a pending page selection, load the options
      if (data && !data.is_active && data.pending_pages) {
        const { data: pages } = await api.get('/api/meta/pending-pages')
        setPendingPages(pages)
      } else {
        setPendingPages(null)
      }
    } catch {
      setConnection(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConnection()
  }, [loadConnection])

  // Listen for postMessage from OAuth popup
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === 'META_OAUTH_SUCCESS') {
        setConnecting(false)
        loadConnection()
        toast.success('Compte Meta connecté !')
      } else if (e.data?.type === 'META_OAUTH_SELECT') {
        setConnecting(false)
        loadConnection()
      } else if (e.data?.type === 'META_OAUTH_ERROR') {
        setConnecting(false)
        toast.error('Échec de la connexion Meta. Vérifiez vos permissions.')
      } else if (e.data?.type === 'META_OAUTH_NO_PAGES') {
        setConnecting(false)
        toast.error("Aucune page Facebook trouvée sur ce compte.")
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [loadConnection])

  const handleConnect = async () => {
    try {
      setConnecting(true)
      const { data } = await api.get('/api/meta/auth-url')
      const popup = window.open(
        data.url,
        'meta_oauth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      )
      // Poll for popup close as fallback
      const timer = setInterval(() => {
        if (popup?.closed) {
          clearInterval(timer)
          setConnecting(false)
          loadConnection()
        }
      }, 1000)
    } catch {
      setConnecting(false)
      toast.error('Impossible de générer le lien de connexion Meta')
    }
  }

  const handleResubscribe = async () => {
    setResubscribing(true)
    try {
      await api.post('/api/meta/subscribe-page')
      toast.success('Webhook leadgen réactivé avec succès !')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la réactivation du webhook')
    } finally {
      setResubscribing(false)
    }
  }

  const handleDisconnect = async () => {
    if (!window.confirm('Déconnecter votre compte Meta Ads ? Les leads déjà importés seront conservés.')) return
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

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy dark:text-white">Intégrations</h1>
        <p className="text-gray-500 text-sm mt-1">Connectez vos outils marketing pour importer automatiquement vos leads</p>
      </div>

      {/* Meta Ads Card */}
      <div className="card overflow-hidden">
        {/* Card header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <MetaIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-semibold text-navy dark:text-white">Meta Ads (Facebook & Instagram)</h2>
              <p className="text-gray-400 text-xs mt-0.5">Importation automatique des leads depuis vos formulaires instantanés</p>
            </div>
          </div>
          {isConnected && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/30 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              Connecté
            </span>
          )}
          {hasPending && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700/30 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
              Sélection requise
            </span>
          )}
          {!isConnected && !hasPending && !loading && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 dark:text-gray-500">
              Non connecté
            </span>
          )}
        </div>

        {/* Card body */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-4 text-gray-400 text-sm">Chargement…</div>
          ) : isConnected ? (
            /* Connected state */
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1.5">Page connectée</p>
                  <p className="text-sm font-semibold text-navy dark:text-white truncate">{connection.page_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">ID: {connection.page_id}</p>
                </div>
                <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1.5">Leads reçus</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{connection.meta_leads_count ?? 0}</p>
                </div>
                <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1.5">Connecté le</p>
                  <p className="text-sm font-medium text-navy dark:text-white">
                    {connection.connected_at
                      ? new Date(connection.connected_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">✓ Webhook actif</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Les nouveaux leads de vos formulaires Meta Instant Forms sont importés automatiquement dans ArchiCRM avec le statut <strong>Nouveau</strong> et la source <strong>Meta Ads</strong>.
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResubscribe}
                    disabled={resubscribing}
                    className="flex items-center gap-2 text-sm font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800/40 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                  >
                    <svg className={`w-3.5 h-3.5 ${resubscribing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {resubscribing ? 'Réactivation…' : 'Réactiver le webhook'}
                  </button>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    Si les leads n'arrivent plus, cliquez ici pour forcer la re-souscription
                  </span>
                </div>
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="text-sm text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 px-4 py-2 rounded-xl transition-colors disabled:opacity-50 shrink-0"
                >
                  {disconnecting ? 'Déconnexion…' : 'Déconnecter Meta Ads'}
                </button>
              </div>
            </div>
          ) : hasPending ? (
            /* Pending page selection */
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Plusieurs pages Facebook ont été trouvées sur votre compte. Choisissez la page liée à vos campagnes Meta Ads.
              </p>
              <button
                onClick={() => setPendingPages(p => (p?.length ? p : pendingPages))}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
              >
                Choisir ma page Facebook
              </button>
            </div>
          ) : (
            /* Disconnected state */
            <div className="space-y-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Connectez votre compte Meta Business pour recevoir automatiquement les leads de vos formulaires Facebook et Instagram Ads dans ArchiCRM.
              </p>

              <ul className="space-y-2">
                {[
                  'Les leads arrivent en temps réel dès qu\'un prospect remplit votre formulaire',
                  'Champs mappés automatiquement (nom, téléphone, email, ville, budget…)',
                  'Source "Meta Ads" tracée sur chaque lead pour vos analytics',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>

              <button
                onClick={handleConnect}
                disabled={connecting}
                className="flex items-center gap-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
              >
                <MetaIcon className="w-4 h-4" />
                {connecting ? 'Connexion en cours…' : 'Connecter Meta Ads'}
              </button>

              <p className="text-xs text-gray-400">
                Une fenêtre Facebook s'ouvrira pour autoriser l'accès à vos pages et leads. Permissions requises : <code className="bg-gray-100 dark:bg-white/10 px-1 py-0.5 rounded text-[11px]">leads_retrieval</code>, <code className="bg-gray-100 dark:bg-white/10 px-1 py-0.5 rounded text-[11px]">pages_manage_ads</code>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Coming soon */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Bientôt disponible</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { name: 'Google Ads', icon: '🔍', desc: 'Importation des leads Google Lead Form' },
            { name: 'TikTok Ads', icon: '🎵', desc: 'Leads depuis vos formulaires TikTok' },
            { name: 'WhatsApp Business', icon: '💬', desc: 'Sync automatique des nouveaux contacts' },
            { name: 'Zapier / Make',    icon: '⚡', desc: 'Connectez n\'importe quel outil via webhook' },
          ].map(item => (
            <div key={item.name} className="card p-4 opacity-50 select-none">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="text-sm font-medium text-navy dark:text-white">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

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
