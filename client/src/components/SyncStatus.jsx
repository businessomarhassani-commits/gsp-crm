/**
 * SyncStatus.jsx — shows cloud sync state in the sidebar bottom.
 * Only renders when running inside Electron (window.db exists).
 */
import { useState, useEffect } from 'react'
import { Cloud, CloudOff, RefreshCw, Check } from 'lucide-react'

export default function SyncStatus() {
  const [status, setStatus] = useState({ status: 'idle', pending: 0 })
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (!window.db) return

    // Initial fetch
    window.db.sync.getStatus().then(setStatus)

    // Listen to real-time updates from main process
    if (window.electronEvents) {
      window.electronEvents.onSyncStatus(s => setStatus(s))
    }

    // Poll every 30s as backup
    const t = setInterval(() => window.db.sync.getStatus().then(setStatus), 30_000)
    return () => {
      clearInterval(t)
      if (window.electronEvents) window.electronEvents.removeAll()
    }
  }, [])

  if (!window.db) return null

  const handleSync = async () => {
    setSyncing(true)
    await window.db.sync.trigger()
    const s = await window.db.sync.getStatus()
    setStatus(s)
    setSyncing(false)
  }

  const { status: state, pending } = status

  const config = {
    idle:    { dot: 'bg-green-400',  text: 'Synchronisé',        Icon: Check },
    synced:  { dot: 'bg-green-400',  text: 'Synchronisé',        Icon: Check },
    syncing: { dot: 'bg-orange-400 animate-pulse', text: 'Synchronisation…', Icon: RefreshCw },
    offline: { dot: 'bg-red-400',    text: pending > 0 ? `Hors ligne — ${pending} en attente` : 'Hors ligne', Icon: CloudOff },
    error:   { dot: 'bg-red-400',    text: 'Erreur de sync',     Icon: CloudOff },
  }[state] || { dot: 'bg-white/20', text: 'Statut inconnu', Icon: Cloud }

  return (
    <button
      onClick={handleSync}
      disabled={syncing || state === 'syncing'}
      title="Cliquer pour synchroniser maintenant"
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors group"
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${config.dot}`} />
      <span className="text-white/30 text-[11px] truncate flex-1 text-left">
        {syncing ? 'Synchronisation…' : config.text}
      </span>
      {(syncing || state === 'syncing')
        ? <RefreshCw size={11} className="text-white/20 animate-spin flex-shrink-0" />
        : <RefreshCw size={11} className="text-white/10 group-hover:text-white/30 flex-shrink-0 transition-colors" />
      }
    </button>
  )
}
