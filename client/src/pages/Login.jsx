import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'

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
      toast.success(`Bienvenue, ${data.user.name} !`)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gold rounded-2xl flex items-center justify-center mx-auto mb-3 text-navy text-2xl font-bold shadow-lg shadow-gold/20">A</div>
          <h1 className="text-white text-2xl font-bold">ArchiCRM</h1>
          <p className="text-white/40 text-sm mt-1">Connexion à votre espace</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-7 shadow-2xl space-y-4">
          <div>
            <label className="label">Adresse email</label>
            <input type="email" required placeholder="vous@cabinet.ma" className="input"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="label">Mot de passe</label>
            <input type="password" required placeholder="••••••••" className="input"
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-navy hover:bg-navy-light text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50 text-sm mt-2">
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
          <p className="text-center text-xs text-gray-500">
            Pas de compte ?{' '}
            <Link to="/signup" className="text-gold font-medium hover:underline">S'inscrire</Link>
          </p>
        </form>

        <p className="text-center text-white/25 text-xs mt-6">
          Test : admin@archicrm.ma / Admin2024!
        </p>
      </div>
    </div>
  )
}
