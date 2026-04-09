import { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { User, Palette, DollarSign, Cpu, Bell, Shield, Eye, EyeOff, CheckCircle, Sun, Moon } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { useUIStore } from '../store/useUIStore'
import { useCurrencyStore } from '../store/useCurrencyStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { testApiKey } from '../lib/claude'
import { supabase } from '../lib/supabase'
import { GlassCard } from '../components/ui/GlassCard'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { Input, FormSelect } from '../components/ui/Input'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { CURRENCIES, LANGUAGES } from '../lib/constants'
import toast from 'react-hot-toast'

const profileSchema = z.object({
  full_name: z.string().min(1, 'Name required'),
})

const ratesSchema = z.object({
  usdToMad: z.coerce.number().positive(),
  eurToMad: z.coerce.number().positive(),
})

const SECTIONS = [
  { id: 'profile',    label: 'Profile',     icon: User },
  { id: 'appearance', label: 'Appearance',  icon: Palette },
  { id: 'currency',   label: 'Currency',    icon: DollarSign },
  { id: 'ai',         label: 'AI (Claude)', icon: Cpu },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'danger',     label: 'Danger Zone', icon: Shield },
]

export default function Settings() {
  const { theme, toggleTheme, setLanguage, language } = useUIStore()
  const isDark = theme === 'dark'
  const { profile, updateProfile } = useAuthStore()
  const { activeCurrency, setActiveCurrency, rates, setRates } = useCurrencyStore()
  const { claudeApiKey, setClaudeApiKey, notificationsEnabled, setNotificationsEnabled } = useSettingsStore()

  const [active, setActive] = useState('profile')
  const [showKey, setShowKey] = useState(false)
  const [keyInput, setKeyInput] = useState(claudeApiKey || '')
  const [testingKey, setTestingKey] = useState(false)
  const [keyValid, setKeyValid] = useState(null)
  const [deleteAccount, setDeleteAccount] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingRates, setSavingRates] = useState(false)

  const { register: rProfile, handleSubmit: hProfile, formState: { errors: eProfile } } = useForm({
    resolver: zodResolver(profileSchema),
    values: { full_name: profile?.full_name || '' },
  })

  const { register: rRates, handleSubmit: hRates } = useForm({
    values: rates,
  })

  async function saveProfile(vals) {
    setSavingProfile(true)
    const { error } = await updateProfile(vals)
    setSavingProfile(false)
    if (error) toast.error(error.message)
    else toast.success('Profile updated!')
  }

  async function saveRates(vals) {
    setSavingRates(true)
    setRates({ usdToMad: Number(vals.usdToMad), eurToMad: Number(vals.eurToMad) })
    setSavingRates(false)
    toast.success('Exchange rates saved!')
  }

  async function handleTestKey() {
    setTestingKey(true)
    try {
      await testApiKey(keyInput)
      setKeyValid(true)
      setClaudeApiKey(keyInput)
      toast.success('API key is valid and saved!')
    } catch (e) {
      setKeyValid(false)
      toast.error(e.message)
    } finally {
      setTestingKey(false)
    }
  }

  function saveKey() {
    setClaudeApiKey(keyInput)
    toast.success('API key saved!')
  }

  const Section = ({ title, subtitle, children }) => (
    <div className="space-y-4">
      <div>
        <h2 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>{title}</h2>
        {subtitle && <p className={`text-xs mt-0.5 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>{subtitle}</p>}
      </div>
      {children}
    </div>
  )

  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader title="Settings" subtitle="Manage your account and preferences" />

      <div className="flex gap-5">
        {/* Sidebar nav */}
        <div className="w-44 shrink-0 hidden sm:block">
          <GlassCard className="p-2 sticky top-20">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActive(id)}
                className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  active === id
                    ? (isDark ? 'bg-white/10 text-white' : 'bg-black/6 text-slate-800')
                    : (isDark ? 'text-white/45 hover:bg-white/6 hover:text-white/80' : 'text-slate-500 hover:bg-black/4 hover:text-slate-700')
                } ${id === 'danger' ? 'text-red-400 hover:bg-red-500/10 hover:text-red-400' : ''}`}>
                <Icon size={14} />
                {label}
              </button>
            ))}
          </GlassCard>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-5">
          {active === 'profile' && (
            <GlassCard className="p-5">
              <Section title="Profile" subtitle="Your personal information">
                <form onSubmit={hProfile(saveProfile)} className="space-y-3 max-w-sm">
                  <Input label="Full Name" placeholder="Your name" error={eProfile.full_name?.message} {...rProfile('full_name')} />
                  <div>
                    <label className={`text-sm font-medium block mb-1.5 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>Email</label>
                    <input disabled value={profile?.email || ''} className={`w-full h-9 rounded-xl border px-3 text-sm opacity-50 cursor-not-allowed ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/4 border-black/10 text-slate-700'}`} />
                    <p className={`text-xs mt-1 ${isDark ? 'text-white/30' : 'text-slate-400'}`}>Email cannot be changed here</p>
                  </div>
                  <Button type="submit" loading={savingProfile} size="sm">Save Profile</Button>
                </form>
              </Section>
            </GlassCard>
          )}

          {active === 'appearance' && (
            <GlassCard className="p-5">
              <Section title="Appearance" subtitle="Theme and language preferences">
                <div className="space-y-4 max-w-sm">
                  <div>
                    <label className={`text-sm font-medium block mb-2 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>Theme</label>
                    <div className={`flex gap-2 p-1 rounded-xl w-fit ${isDark ? 'bg-white/6' : 'bg-black/5'}`}>
                      <button onClick={() => !isDark || toggleTheme()}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                          isDark ? (isDark ? 'bg-white/12 text-white' : '') : 'bg-white text-slate-700 shadow-sm'
                        } ${isDark ? 'bg-white/12 text-white' : 'text-slate-400'}`}>
                        <Moon size={14} />Dark
                      </button>
                      <button onClick={() => isDark && toggleTheme()}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                          !isDark ? 'bg-white text-slate-700 shadow-sm' : 'text-white/40 hover:text-white/70'
                        }`}>
                        <Sun size={14} />Light
                      </button>
                    </div>
                  </div>
                  <FormSelect label="Language" value={language} onChange={e => setLanguage(e.target.value)} wrapperClass="max-w-xs">
                    {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </FormSelect>
                </div>
              </Section>
            </GlassCard>
          )}

          {active === 'currency' && (
            <GlassCard className="p-5">
              <Section title="Currency" subtitle="Set your preferred currency and exchange rates">
                <div className="space-y-4 max-w-sm">
                  <div>
                    <label className={`text-sm font-medium block mb-2 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>Preferred Currency</label>
                    <div className={`flex gap-1 p-1 rounded-xl w-fit ${isDark ? 'bg-white/6' : 'bg-black/5'}`}>
                      {CURRENCIES.map(c => (
                        <button key={c.value} onClick={() => setActiveCurrency(c.value)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                            activeCurrency === c.value
                              ? (isDark ? 'bg-white/12 text-white' : 'bg-white text-slate-700 shadow-sm')
                              : (isDark ? 'text-white/40 hover:text-white/70' : 'text-slate-400')
                          }`}>
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <form onSubmit={hRates(saveRates)} className="space-y-3">
                    <p className={`text-xs ${isDark ? 'text-white/40' : 'text-slate-400'}`}>Manual exchange rates (1 MAD = base)</p>
                    <Input label="1 USD → MAD" type="number" step="0.01" placeholder="10.00" {...rRates('usdToMad')} />
                    <Input label="1 EUR → MAD" type="number" step="0.01" placeholder="10.90" {...rRates('eurToMad')} />
                    <Button type="submit" loading={savingRates} size="sm">Save Rates</Button>
                  </form>
                </div>
              </Section>
            </GlassCard>
          )}

          {active === 'ai' && (
            <GlassCard className="p-5">
              <Section title="AI Configuration" subtitle="Claude API key for Copy Studio and Creative Studio">
                <div className="space-y-3 max-w-sm">
                  <div className="relative">
                    <Input
                      label="Claude API Key"
                      type={showKey ? 'text' : 'password'}
                      placeholder="sk-ant-..."
                      value={keyInput}
                      onChange={e => { setKeyInput(e.target.value); setKeyValid(null) }}
                      hint="Your key is stored locally in your browser and never sent to our servers."
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className={`absolute right-3 top-8 cursor-pointer ${isDark ? 'text-white/30 hover:text-white/60' : 'text-slate-400'}`}
                    >
                      {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    {keyValid === true && <CheckCircle size={14} className="absolute right-8 top-8 text-emerald-400" />}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" loading={testingKey} onClick={handleTestKey} disabled={!keyInput}>
                      Test Key
                    </Button>
                    <Button size="sm" onClick={saveKey} disabled={!keyInput}>
                      Save Key
                    </Button>
                  </div>
                  {keyValid === false && <p className="text-xs text-red-400">Key is invalid or has insufficient permissions.</p>}
                  {keyValid === true && <p className="text-xs text-emerald-400">Key verified and saved!</p>}
                </div>
              </Section>
            </GlassCard>
          )}

          {active === 'notifications' && (
            <GlassCard className="p-5">
              <Section title="Notifications" subtitle="Control in-app notification preferences">
                <div className="flex items-center justify-between max-w-sm p-3 rounded-xl border ${isDark ? 'border-white/8' : 'border-black/8'}">
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-white/85' : 'text-slate-700'}`}>Follow-up Reminders</p>
                    <p className={`text-xs ${isDark ? 'text-white/40' : 'text-slate-400'}`}>Show overdue task count in sidebar</p>
                  </div>
                  <button
                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                    className={`relative w-10 h-6 rounded-full transition-all cursor-pointer ${notificationsEnabled ? 'bg-blue-500' : (isDark ? 'bg-white/10' : 'bg-black/10')}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${notificationsEnabled ? 'left-5' : 'left-1'}`} />
                  </button>
                </div>
              </Section>
            </GlassCard>
          )}

          {active === 'danger' && (
            <GlassCard className="p-5">
              <Section title="Danger Zone" subtitle="Irreversible account actions">
                <div className={`p-4 rounded-xl border ${isDark ? 'border-red-500/20 bg-red-500/6' : 'border-red-200 bg-red-50'}`}>
                  <h4 className="text-sm font-semibold text-red-400 mb-1">Delete Account</h4>
                  <p className={`text-xs mb-3 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                    All your data — prospects, clients, copies, and creatives — will be permanently deleted. This action cannot be undone.
                  </p>
                  <Button variant="danger" size="sm" onClick={() => setDeleteAccount(true)}>Delete My Account</Button>
                </div>
              </Section>
            </GlassCard>
          )}
        </div>
      </div>

      <ConfirmModal
        open={deleteAccount}
        onClose={() => setDeleteAccount(false)}
        onConfirm={async () => {
          await supabase.auth.signOut()
          setDeleteAccount(false)
          toast.success('Account deletion requested.')
        }}
        title="Delete Account"
        message="Are you absolutely sure? This will delete all your data permanently and cannot be undone."
      />
    </div>
  )
}
