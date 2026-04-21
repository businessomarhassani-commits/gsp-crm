import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import Logo from '../components/Logo'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

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

        <p className="text-center text-white/[0.12] text-[11px] mt-6">
          <Link to="/privacy" className="hover:text-white/30 transition-colors">Confidentialité</Link>
          {' · '}
          <Link to="/terms" className="hover:text-white/30 transition-colors">CGU</Link>
        </p>
      </div>
    </div>
  )
}
