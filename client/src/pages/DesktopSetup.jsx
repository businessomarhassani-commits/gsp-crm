/**
 * DesktopSetup.jsx — First-launch wizard for the Electron offline app.
 * Shown only when window.db exists and setup_done is not set.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import { User, Mail, Lock, Cloud, HardDrive, CheckCircle, Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react'

const STEPS = ['welcome', 'create_account', 'cloud_choice', 'done']

export default function DesktopSetup() {
  const navigate = useNavigate()
  const [step, setStep] = useState('welcome')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  // Create account form
  const [form, setForm] = useState({ name: 'Anas', email: '', password: '' })

  // Cloud form
  const [cloudForm, setCloudForm] = useState({ email: '', password: '' })
  const [cloudChoice, setCloudChoice] = useState(null) // 'yes' | 'no'

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setC = (k, v) => setCloudForm(f => ({ ...f, [k]: v }))

  // ── Step: Create local account ─────────────────────────────────────────────
  const handleCreateAccount = async () => {
    setError('')
    if (!form.name.trim() || !form.email.trim() || !form.password.trim())
      return setError('Tous les champs sont requis.')
    if (form.password.length < 6)
      return setError('Mot de passe trop court (min 6 caractères).')

    setLoading(true)
    const res = await window.db.auth.createUser({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password
    })
    setLoading(false)

    if (res.error) return setError(res.error)

    // Store token so auth context picks it up
    localStorage.setItem('archicrm_token', res.token)
    setStep('cloud_choice')
  }

  // ── Step: Connect to cloud ─────────────────────────────────────────────────
  const handleCloudConnect = async () => {
    setError('')
    if (!cloudForm.email.trim() || !cloudForm.password.trim())
      return setError('Email et mot de passe requis.')

    setLoading(true)
    const res = await window.db.sync.connectCloud(cloudForm.email.trim(), cloudForm.password)
    setLoading(false)

    if (res.error) return setError(res.error)
    setStep('done')
  }

  const handleSkipCloud = () => {
    setCloudChoice('no')
    setStep('done')
  }

  const handleFinish = () => {
    localStorage.setItem('archicrm_setup_done', '1')
    window.location.hash = '#/dashboard'
    window.location.reload()
  }

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <Logo size={36} />
            <span className="font-bold text-[22px]">
              <span className="text-white">Archi</span>
              <span className="text-[#E8A838]">CRM</span>
            </span>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className={`h-1.5 w-6 rounded-full transition-all ${
              STEPS.indexOf(step) >= i ? 'bg-[#E8A838]' : 'bg-white/10'
            }`} />
          ))}
        </div>

        <div className="bg-[#111] border border-white/[0.08] rounded-2xl p-7 shadow-2xl">

          {/* ── WELCOME ────────────────────────────────────────────────── */}
          {step === 'welcome' && (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-[#E8A838]/10 border border-[#E8A838]/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <HardDrive size={24} className="text-[#E8A838]" />
                </div>
                <h1 className="text-white font-bold text-[20px] mb-2">Bienvenue, Anas !</h1>
                <p className="text-white/40 text-[13px] leading-relaxed">
                  ArchiCRM Desktop stocke toutes vos données localement sur votre ordinateur.
                  Configurons votre espace de travail en 2 minutes.
                </p>
              </div>
              <div className="space-y-3 mb-6">
                {[
                  { icon: <HardDrive size={14} />, text: 'Données sauvegardées localement (SQLite)' },
                  { icon: <Cloud size={14} />, text: 'Sync cloud automatique quand internet disponible' },
                  { icon: <CheckCircle size={14} />, text: 'Fonctionne 100% hors ligne' },
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-3 text-[13px] text-white/50">
                    <span className="text-[#E8A838]">{f.icon}</span>
                    {f.text}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep('create_account')}
                className="w-full bg-[#E8A838] hover:bg-[#d49730] text-[#0A0A0A] font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                Commencer <ArrowRight size={16} />
              </button>
            </>
          )}

          {/* ── CREATE ACCOUNT ─────────────────────────────────────────── */}
          {step === 'create_account' && (
            <>
              <h2 className="text-white font-bold text-[17px] mb-1">Créer votre compte local</h2>
              <p className="text-white/35 text-[12px] mb-5">Ce compte est stocké sur votre ordinateur uniquement.</p>

              <div className="space-y-3">
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text" placeholder="Nom complet"
                    value={form.name} onChange={e => setF('name', e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-[13px] text-white placeholder-white/25 focus:outline-none focus:border-[#E8A838]/50"
                  />
                </div>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="email" placeholder="Email"
                    value={form.email} onChange={e => setF('email', e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-[13px] text-white placeholder-white/25 focus:outline-none focus:border-[#E8A838]/50"
                  />
                </div>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type={showPass ? 'text' : 'password'} placeholder="Mot de passe (min 6 caractères)"
                    value={form.password} onChange={e => setF('password', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreateAccount()}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-10 py-2.5 text-[13px] text-white placeholder-white/25 focus:outline-none focus:border-[#E8A838]/50"
                  />
                  <button onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {error && <p className="text-red-400 text-[12px] mt-3">{error}</p>}

              <button
                onClick={handleCreateAccount} disabled={loading}
                className="w-full mt-4 bg-[#E8A838] hover:bg-[#d49730] disabled:opacity-50 text-[#0A0A0A] font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                {loading ? 'Création...' : 'Créer mon compte'}
              </button>
            </>
          )}

          {/* ── CLOUD CHOICE ───────────────────────────────────────────── */}
          {step === 'cloud_choice' && (
            <>
              <h2 className="text-white font-bold text-[17px] mb-1">Compte ArchiCRM en ligne ?</h2>
              <p className="text-white/35 text-[12px] mb-5">
                Si vous avez déjà un compte sur app.crm.archi, importez vos données maintenant.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => setCloudChoice('yes')}
                  className={`p-4 rounded-xl border text-[13px] font-medium transition-all flex flex-col items-center gap-2 ${
                    cloudChoice === 'yes'
                      ? 'border-[#E8A838] bg-[#E8A838]/10 text-white'
                      : 'border-white/[0.08] text-white/50 hover:border-white/20'
                  }`}
                >
                  <Cloud size={18} />
                  Oui, j'ai un compte
                </button>
                <button
                  onClick={() => { setCloudChoice('no'); setError('') }}
                  className={`p-4 rounded-xl border text-[13px] font-medium transition-all flex flex-col items-center gap-2 ${
                    cloudChoice === 'no'
                      ? 'border-[#E8A838] bg-[#E8A838]/10 text-white'
                      : 'border-white/[0.08] text-white/50 hover:border-white/20'
                  }`}
                >
                  <HardDrive size={18} />
                  Non, démarrer vide
                </button>
              </div>

              {cloudChoice === 'yes' && (
                <div className="space-y-3 mt-4">
                  <input
                    type="email" placeholder="Email du compte ArchiCRM"
                    value={cloudForm.email} onChange={e => setC('email', e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-[13px] text-white placeholder-white/25 focus:outline-none focus:border-[#E8A838]/50"
                  />
                  <input
                    type="password" placeholder="Mot de passe"
                    value={cloudForm.password} onChange={e => setC('password', e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-[13px] text-white placeholder-white/25 focus:outline-none focus:border-[#E8A838]/50"
                  />
                  {error && <p className="text-red-400 text-[12px]">{error}</p>}
                  <button
                    onClick={handleCloudConnect} disabled={loading}
                    className="w-full bg-[#E8A838] hover:bg-[#d49730] disabled:opacity-50 text-[#0A0A0A] font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Cloud size={16} />}
                    {loading ? 'Import en cours...' : 'Importer mes données'}
                  </button>
                </div>
              )}

              {cloudChoice === 'no' && (
                <button
                  onClick={handleSkipCloud}
                  className="w-full mt-2 bg-[#E8A838] hover:bg-[#d49730] text-[#0A0A0A] font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  Démarrer avec une base vide <ArrowRight size={16} />
                </button>
              )}
            </>
          )}

          {/* ── DONE ───────────────────────────────────────────────────── */}
          {step === 'done' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={28} className="text-green-400" />
              </div>
              <h2 className="text-white font-bold text-[18px] mb-2">Tout est prêt !</h2>
              <p className="text-white/40 text-[13px] mb-6 leading-relaxed">
                ArchiCRM Desktop est configuré. Vos données sont sauvegardées dans&nbsp;:
                <br/>
                <code className="text-white/25 text-[11px]">AppData/Local/ArchiCRM/data.db</code>
              </p>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-left text-[12px] text-white/40 space-y-1.5 mb-6">
                <p>• <span className="text-white/60">Fichier → Exporter</span> pour sauvegarder sur USB</p>
                <p>• <span className="text-white/60">Fichier → Importer</span> pour restaurer depuis USB</p>
                <p>• La sync cloud se déclenche automatiquement toutes les 5 min</p>
              </div>
              <button
                onClick={handleFinish}
                className="w-full bg-[#E8A838] hover:bg-[#d49730] text-[#0A0A0A] font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                Ouvrir ArchiCRM <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
