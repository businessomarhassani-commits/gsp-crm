import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Lock, Zap, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/useAuthStore'
import { useUIStore } from '../store/useUIStore'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import toast from 'react-hot-toast'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
const magicSchema = z.object({
  email: z.string().email('Enter a valid email'),
})

export default function Login() {
  const { session } = useAuthStore()
  const { theme } = useUIStore()
  const isDark = theme === 'dark'
  const [tab, setTab] = useState('password')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [magicSent, setMagicSent] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(loginSchema) })
  const { register: rMagic, handleSubmit: hMagic, formState: { errors: eMagic } } = useForm({ resolver: zodResolver(magicSchema) })

  if (session) return <Navigate to="/dashboard" replace />

  async function onLogin({ email, password }) {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { toast.error(error.message); setLoading(false) }
  }

  async function onSignup({ email, password }) {
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) { toast.error(error.message); setLoading(false) }
    else toast.success('Account created! Check your email to confirm.')
    setLoading(false)
  }

  async function onMagicLink({ email }) {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email })
    setLoading(false)
    if (error) toast.error(error.message)
    else setMagicSent(true)
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden ${isDark ? 'dark' : ''}`}>
      {/* Background */}
      <div className={`absolute inset-0 ${isDark ? 'bg-dark-bg' : 'bg-light-bg'}`} />
      {isDark && (
        <>
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)', filter: 'blur(80px)' }} />
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)', filter: 'blur(80px)' }} />
        </>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 shadow-2xl shadow-blue-500/30">
            <Zap size={24} className="text-white" />
          </div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>SuccessPro</h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-white/40' : 'text-slate-500'}`}>Lead generation CRM for pros</p>
        </div>

        {/* Card */}
        <div className={`rounded-2xl p-6 ${isDark ? 'glass' : 'glass-light'}`}>
          {/* Tabs */}
          <div className={`flex rounded-xl p-1 mb-5 ${isDark ? 'bg-white/6' : 'bg-black/5'}`}>
            {[['password', 'Sign In'], ['magic', 'Magic Link']].map(([v, l]) => (
              <button key={v} onClick={() => setTab(v)}
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${tab === v ? (isDark ? 'bg-white/12 text-white' : 'bg-white text-slate-800 shadow-sm') : (isDark ? 'text-white/40 hover:text-white/70' : 'text-slate-400 hover:text-slate-600')}`}>
                {l}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === 'password' ? (
              <motion.form key="pw" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.18 }}
                onSubmit={handleSubmit(onLogin)} className="space-y-3">
                <Input label="Email" type="email" icon={Mail} placeholder="you@company.com" error={errors.email?.message} {...register('email')} />
                <Input label="Password" type={showPw ? 'text' : 'password'} icon={Lock}
                  iconRight={() => (
                    <button type="button" onClick={() => setShowPw(!showPw)} className="cursor-pointer">
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  )}
                  placeholder="••••••••" error={errors.password?.message} {...register('password')} />
                <div className="flex gap-2 pt-1">
                  <Button type="submit" loading={loading} className="flex-1">Sign In</Button>
                  <Button type="button" variant="secondary" loading={loading} onClick={handleSubmit(onSignup)} className="flex-1">Sign Up</Button>
                </div>
              </motion.form>
            ) : (
              <motion.div key="magic" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.18 }}>
                {magicSent ? (
                  <div className={`text-center py-4 px-3 rounded-xl ${isDark ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-200'}`}>
                    <p className={`text-sm font-medium ${isDark ? 'text-green-400' : 'text-green-700'}`}>Magic link sent!</p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>Check your inbox and click the link to sign in.</p>
                    <button onClick={() => setMagicSent(false)} className={`text-xs mt-3 underline cursor-pointer ${isDark ? 'text-white/40' : 'text-slate-400'}`}>Try another email</button>
                  </div>
                ) : (
                  <form onSubmit={hMagic(onMagicLink)} className="space-y-3">
                    <Input label="Email" type="email" icon={Mail} placeholder="you@company.com" error={eMagic.email?.message} {...rMagic('email')} />
                    <Button type="submit" loading={loading} className="w-full mt-1">Send Magic Link</Button>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className={`text-center text-xs mt-4 ${isDark ? 'text-white/25' : 'text-slate-400'}`}>
          By signing in you agree to our Terms of Service
        </p>
      </motion.div>
    </div>
  )
}
