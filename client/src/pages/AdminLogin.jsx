import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { useAdminAuth } from '../context/AdminAuthContext'
import Logo from '../components/Logo'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function AdminLogin() {
  const { login } = useAdminAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/api/admin/login', form)
      login(data.token, data.admin)
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Identifiants invalides')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <Logo size={40} />
          <div className="mt-3 text-center">
            <p className="font-bold text-2xl">
              <span className="text-white">Archi</span><span className="text-[#E8A838]">CRM</span>
            </p>
            <p className="text-white/40 text-xs tracking-widest uppercase mt-0.5">Administration</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8">
          {/* Title */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-[#E8A838]/15 border border-[#E8A838]/30 flex items-center justify-center">
              <Lock size={16} className="text-[#E8A838]" />
            </div>
            <div>
              <h1 className="text-white font-semibold text-[15px]">Accès Administrateur</h1>
              <p className="text-white/35 text-[11px]">Espace sécurisé — accès restreint</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white/50 text-xs font-medium mb-1.5">Adresse email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                required
                autoFocus
                placeholder="admin@crm.archi"
                className="w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-4 py-3 text-white text-[13px] placeholder-white/20 focus:outline-none focus:border-[#E8A838]/60 focus:bg-white/[0.08] transition-colors"
              />
            </div>

            <div>
              <label className="block text-white/50 text-xs font-medium mb-1.5">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-4 py-3 pr-11 text-white text-[13px] placeholder-white/20 focus:outline-none focus:border-[#E8A838]/60 focus:bg-white/[0.08] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-[#E8A838] hover:bg-[#d4962e] active:scale-[0.98] text-[#0A0A0A] font-bold text-[14px] py-3 rounded-xl transition-all disabled:opacity-60"
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/20 text-[11px] mt-6">
          ArchiCRM Admin · Accès réservé au personnel autorisé
        </p>
      </div>
    </div>
  )
}
