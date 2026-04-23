import { Component } from 'react'
import { LogOut } from 'lucide-react'

function hardLogout() {
  try {
    localStorage.removeItem('archicrm_token')
    localStorage.removeItem('archicrm_admin_token')
    sessionStorage.removeItem('archicrm_impersonation_token')
  } catch (_) {}
  window.location.href = '/'
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ArchiCRM] Render error caught by ErrorBoundary:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-white font-bold text-[18px] mb-2">Une erreur est survenue</h1>
          <p className="text-white/40 text-[13px] leading-relaxed mb-6">
            L'application a rencontré un problème inattendu. Veuillez vous déconnecter et réessayer.
          </p>

          <button
            onClick={hardLogout}
            className="inline-flex items-center justify-center gap-2 w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors text-[14px]"
          >
            <LogOut size={16} />
            Se déconnecter
          </button>

          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-white/30 hover:text-white/60 text-[12px] transition-colors"
          >
            Recharger la page
          </button>

          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-4 text-left text-red-400/70 text-[10px] bg-red-500/5 border border-red-500/10 rounded-lg p-3 overflow-auto max-h-40">
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      </div>
    )
  }
}
