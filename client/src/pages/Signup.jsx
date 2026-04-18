import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'
import Logo from '../components/Logo'
import { CheckCircle } from 'lucide-react'

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) { toast.error('Mot de passe trop court (min 6 caractères)'); return }
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/signup', form)
      if (data.pending) {
        setDone(true)
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la création du compte')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="flex items-center justify-center gap-2.5 mb-10">
            <Logo size={32} />
            <span className="font-bold text-[18px]"><span className="text-white">Archi</span><span className="text-[#E8A838]">CRM</span></span>
          </div>
          <div className="bg-[#111111] border border-white/[0.08] rounded-2xl p-8">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={32} className="text-emerald-400" />
            </div>
            <h2 className="text-white font-bold text-[20px] mb-2">Demande envoyée !</h2>
            <p className="text-white/50 text-[13px] leading-relaxed mb-6">
              Votre compte est en attente d'approbation par l'administrateur.<br />
              Vous recevrez une confirmation sous 24h.
            </p>
            <Link
              to="/login"
              className="block w-full py-2.5 text-center bg-[#E8A838] text-[#0A0A0A] font-semibold text-[13px] rounded-lg hover:bg-[#d4952a] transition-colors"
            >
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <Logo size={32} />
          <span className="font-bold text-[18px]"><span className="text-white">Archi</span><span className="text-[#E8A838]">CRM</span></span>
        </div>

        <div className="bg-[#111111] border border-white/[0.08] rounded-2xl p-7">
          <h1 className="text-white font-bold text-[18px] mb-1">Créer un compte</h1>
          <p className="text-white/35 text-[12px] mb-6">Votre accès sera validé par l'administrateur</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/30 mb-1.5">Nom complet</label>
              <input type="text" required placeholder="Karim Benali"
                className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-white/10 rounded-lg text-[13px] text-white placeholder-white/20 focus:outline-none focus:border-[#E8A838]/60 focus:ring-2 focus:ring-[#E8A838]/20 transition"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/30 mb-1.5">Email</label>
              <input type="email" required placeholder="vous@cabinet.ma"
                className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-white/10 rounded-lg text-[13px] text-white placeholder-white/20 focus:outline-none focus:border-[#E8A838]/60 focus:ring-2 focus:ring-[#E8A838]/20 transition"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/30 mb-1.5">Mot de passe</label>
              <input type="password" required minLength={6} placeholder="Min 6 caractères"
                className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-white/10 rounded-lg text-[13px] text-white placeholder-white/20 focus:outline-none focus:border-[#E8A838]/60 focus:ring-2 focus:ring-[#E8A838]/20 transition"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-[#E8A838] hover:bg-[#d4952a] text-[#0A0A0A] font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50 text-[13px] mt-2">
              {loading ? 'Envoi en cours…' : "Créer mon compte"}
            </button>
          </form>

          <p className="text-center text-[12px] text-white/30 mt-5">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-[#E8A838] font-semibold hover:underline">Se connecter</Link>
          </p>
        </div>

        <p className="text-center text-white/[0.12] text-[11px] mt-6">
          <Link to="/privacy" className="hover:text-white/30 transition-colors">Confidentialité</Link>
          {' · '}
          <Link to="/terms" className="hover:text-white/30 transition-colors">CGU</Link>
        </p>
      </div>
    </div>
  )
}
