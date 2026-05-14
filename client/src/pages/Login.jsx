import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import Logo from '../components/Logo'
import { AlertTriangle, Monitor, Download } from 'lucide-react'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const sessionError = new URLSearchParams(location.search).get('session_error')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/login', form)
      login(data.token, data.user)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <Logo size={32} />
          <span className="font-bold text-[18px]">
            <span className="text-white">Archi</span><span className="text-[#E8A838]">CRM</span>
          </span>
        </div>

        {/* Session error banner */}
        {sessionError && (
          <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/25 text-red-400 text-[12px] rounded-xl px-4 py-3 mb-4">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <span>Session invalide — veuillez vous reconnecter avec votre compte utilisateur.</span>
          </div>
        )}

        <div className="bg-[#111111] border border-white/[0.08] rounded-2xl p-7">
          <h1 className="text-white font-bold text-[18px] mb-1">Connexion</h1>
          <p className="text-white/35 text-[12px] mb-6">Accédez à votre espace de travail</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/30 mb-1.5">Adresse email</label>
              <input type="email" required placeholder="vous@cabinet.ma"
                className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-white/10 rounded-lg text-[13px] text-white placeholder-white/20 focus:outline-none focus:border-[#E8A838]/60 focus:ring-2 focus:ring-[#E8A838]/20 transition"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/30 mb-1.5">Mot de passe</label>
              <input type="password" required placeholder="••••••••"
                className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-white/10 rounded-lg text-[13px] text-white placeholder-white/20 focus:outline-none focus:border-[#E8A838]/60 focus:ring-2 focus:ring-[#E8A838]/20 transition"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-[#E8A838] hover:bg-[#d4952a] text-[#0A0A0A] font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50 text-[13px] mt-2">
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-[12px] text-white/30 mt-5">
            Pas de compte ?{' '}
            <Link to="/signup" className="text-[#E8A838] font-semibold hover:underline">S'inscrire</Link>
          </p>
        </div>

        {/* ── Desktop download section ── */}
        <div className="mt-4 relative flex items-center gap-3">
          <div className="flex-1 h-px bg-white/[0.07]" />
          <span className="text-white/20 text-[11px] font-medium">ou</span>
          <div className="flex-1 h-px bg-white/[0.07]" />
        </div>

        <div className="mt-3 bg-[#111] border border-[#E8A838]/25 rounded-xl p-4">
          <div className="flex items-center gap-2.5 mb-1.5">
            <Monitor size={15} className="text-[#E8A838] flex-shrink-0" />
            <span className="text-white text-[13px] font-semibold">Utiliser ArchiCRM hors ligne</span>
          </div>
          <p className="text-white/35 text-[11.5px] mb-3 leading-relaxed">
            Téléchargez l'application de bureau pour travailler sans internet
          </p>
          <div className="flex gap-2">
            <Link
              to="/download#windows"
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#E8A838]/10 hover:bg-[#E8A838]/20 border border-[#E8A838]/30 text-[#E8A838] text-[11.5px] font-semibold py-2 rounded-lg transition-colors"
            >
              <Download size={11} />
              Windows .exe
            </Link>
            <Link
              to="/download#mac"
              className="flex-1 flex items-center justify-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-white/40 hover:text-white/60 text-[11.5px] font-medium py-2 rounded-lg transition-colors"
            >
              <Download size={11} />
              Mac .dmg
            </Link>
          </div>
          <p className="text-white/15 text-[10.5px] text-center mt-2.5">
            Version 1.0.0 · Données locales + sync cloud
          </p>
        </div>

        <p className="text-center text-white/[0.12] text-[11px] mt-5">
          <Link to="/privacy" className="hover:text-white/30 transition-colors">Confidentialité</Link>
          {' · '}
          <Link to="/terms" className="hover:text-white/30 transition-colors">CGU</Link>
        </p>
      </div>
    </div>
  )
}
