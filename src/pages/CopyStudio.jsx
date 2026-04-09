import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PenTool, Copy, RefreshCw, Save, Trash2, Settings, CheckCircle } from 'lucide-react'
import { generateCopy } from '../lib/claude'
import { useNiches } from '../hooks/useNiches'
import { useCopyLibrary, useSaveCopy, useDeleteCopy } from '../hooks/useCopyLibrary'
import { useSettingsStore } from '../store/useSettingsStore'
import { useUIStore } from '../store/useUIStore'
import { GlassCard } from '../components/ui/GlassCard'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { Input, Textarea, FormSelect } from '../components/ui/Input'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { NicheBadge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { COPY_TYPES, TONES, LANGUAGES } from '../lib/constants'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function CopyStudio() {
  const { theme } = useUIStore()
  const isDark = theme === 'dark'
  const navigate = useNavigate()
  const { claudeApiKey } = useSettingsStore()
  const { data: niches } = useNiches()
  const { data: library } = useCopyLibrary()
  const { mutate: saveCopy, isPending: saving } = useSaveCopy()
  const { mutate: deleteCopy } = useDeleteCopy()

  const [form, setForm] = useState({
    niche_id: '', outreach_type: 'cold_email', target_business: '',
    pain_point: '', offer: '', tone: 'professional', language: 'English'
  })
  const [output, setOutput] = useState('')
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [libNiche, setLibNiche] = useState('')
  const [libType, setLibType] = useState('')

  async function handleGenerate() {
    if (!claudeApiKey) {
      toast.error('No API key set. Go to Settings → AI to add your Claude API key.')
      navigate('/settings')
      return
    }
    setGenerating(true)
    try {
      const nicheName = niches?.find(n => n.id === form.niche_id)?.name || form.niche_id || 'General'
      const text = await generateCopy({ apiKey: claudeApiKey, niche: nicheName, ...form })
      setOutput(text)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setGenerating(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Copied to clipboard!')
  }

  function handleSave() {
    if (!output) return
    saveCopy({ ...form, content: output })
  }

  const filteredLib = library?.filter(c => {
    if (libNiche && c.niche_id !== libNiche) return false
    if (libType && c.outreach_type !== libType) return false
    return true
  })

  const inputClass = `w-full ${isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-white/30' : 'bg-black/4 border-black/10 text-slate-900 placeholder:text-slate-400'} border rounded-xl px-3 py-2 text-sm outline-none transition-all`

  return (
    <div className="space-y-5">
      <PageHeader title="Copy Studio" subtitle="AI-powered sales copy generation" />

      {!claudeApiKey && (
        <div className={`flex items-center justify-between p-4 rounded-xl border ${isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
          <p className={`text-sm ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>Add your Claude API key in Settings to use AI generation.</p>
          <Button variant="secondary" size="sm" icon={Settings} onClick={() => navigate('/settings')}>Settings</Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Form */}
        <GlassCard className="p-5">
          <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white/80' : 'text-slate-700'}`}>Configure Copy</h3>
          <div className="space-y-3">
            <FormSelect label="Niche" value={form.niche_id} onChange={e => setForm(f => ({ ...f, niche_id: e.target.value }))}>
              <option value="">Select niche…</option>
              {niches?.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
            </FormSelect>
            <FormSelect label="Outreach Type" value={form.outreach_type} onChange={e => setForm(f => ({ ...f, outreach_type: e.target.value }))}>
              {COPY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </FormSelect>
            <Input label="Target Business Type" placeholder="e.g. Restaurant owner in Casablanca"
              value={form.target_business} onChange={e => setForm(f => ({ ...f, target_business: e.target.value }))} />
            <Textarea label="Pain Point" placeholder="What problem does your target face?" rows={2}
              value={form.pain_point} onChange={e => setForm(f => ({ ...f, pain_point: e.target.value }))} />
            <Textarea label="Your Offer" placeholder="What do you offer to solve it?" rows={2}
              value={form.offer} onChange={e => setForm(f => ({ ...f, offer: e.target.value }))} />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`text-sm font-medium block mb-1.5 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>Tone</label>
                <div className="flex flex-wrap gap-1.5">
                  {TONES.map(t => (
                    <button key={t.value} type="button" onClick={() => setForm(f => ({ ...f, tone: t.value }))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                        form.tone === t.value
                          ? 'bg-blue-500 text-white'
                          : (isDark ? 'bg-white/6 text-white/50 hover:bg-white/10' : 'bg-black/5 text-slate-500 hover:bg-black/10')
                      }`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <FormSelect label="Language" value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))}>
                {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </FormSelect>
            </div>

            <Button onClick={handleGenerate} loading={generating} className="w-full" icon={PenTool}>
              {generating ? 'Generating…' : 'Generate Copy'}
            </Button>
          </div>
        </GlassCard>

        {/* Right: Output */}
        <GlassCard className="p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-semibold ${isDark ? 'text-white/80' : 'text-slate-700'}`}>Generated Copy</h3>
            {output && (
              <div className="flex gap-2">
                <Button variant="secondary" size="xs" icon={copied ? CheckCircle : Copy} onClick={handleCopy}>
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                <Button variant="ghost" size="xs" icon={RefreshCw} onClick={handleGenerate} loading={generating}>
                  Regen
                </Button>
                <Button variant="success" size="xs" icon={Save} onClick={handleSave} loading={saving}>
                  Save
                </Button>
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {generating ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center gap-3 min-h-48">
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <motion.div key={i} className="w-2 h-2 rounded-full bg-blue-500"
                      animate={{ y: [0, -8, 0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }} />
                  ))}
                </div>
                <p className={`text-sm ${isDark ? 'text-white/40' : 'text-slate-400'}`}>Generating copy…</p>
              </motion.div>
            ) : output ? (
              <motion.div key="output" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex-1">
                <textarea
                  value={output}
                  onChange={e => setOutput(e.target.value)}
                  className={`w-full h-full min-h-64 resize-none text-sm leading-relaxed outline-none bg-transparent ${isDark ? 'text-white/85' : 'text-slate-800'}`}
                />
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center min-h-48">
                <PenTool size={28} className={isDark ? 'text-white/15 mb-3' : 'text-slate-200 mb-3'} />
                <p className={`text-sm ${isDark ? 'text-white/30' : 'text-slate-400'}`}>Fill the form and click Generate</p>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </div>

      {/* Library */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-sm font-semibold ${isDark ? 'text-white/70' : 'text-slate-600'}`}>Saved Copy Library</h3>
          <div className="flex gap-2">
            <FormSelect value={libNiche} onChange={e => setLibNiche(e.target.value)} wrapperClass="">
              <option value="">All Niches</option>
              {niches?.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
            </FormSelect>
            <FormSelect value={libType} onChange={e => setLibType(e.target.value)} wrapperClass="">
              <option value="">All Types</option>
              {COPY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </FormSelect>
          </div>
        </div>

        {!filteredLib?.length ? (
          <GlassCard>
            <EmptyState icon={PenTool} title="No saved copies" message="Generate and save copy to build your library." />
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredLib.map(item => (
              <GlassCard key={item.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex flex-wrap gap-1.5">
                    {item.niches && <NicheBadge niche={item.niches} size="xs" />}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-white/8 text-white/50' : 'bg-black/6 text-slate-500'}`}>
                      {COPY_TYPES.find(t => t.value === item.outreach_type)?.label || item.outreach_type}
                    </span>
                  </div>
                  <button onClick={() => setDeleteId(item.id)} className={`p-1 rounded cursor-pointer ${isDark ? 'hover:bg-red-500/15 text-white/20 hover:text-red-400' : 'hover:bg-red-50 text-slate-300 hover:text-red-400'}`}>
                    <Trash2 size={11} />
                  </button>
                </div>
                <p className={`text-xs leading-relaxed line-clamp-4 ${isDark ? 'text-white/55' : 'text-slate-600'}`}>{item.content}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className={`text-xs ${isDark ? 'text-white/25' : 'text-slate-300'}`}>{format(new Date(item.created_at), 'MMM d, yyyy')}</span>
                  <button
                    onClick={async () => { await navigator.clipboard.writeText(item.content); toast.success('Copied!') }}
                    className={`text-xs px-2 py-1 rounded-lg cursor-pointer transition-colors ${isDark ? 'hover:bg-white/8 text-white/35 hover:text-white' : 'hover:bg-black/6 text-slate-400 hover:text-slate-600'}`}>
                    Copy
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { deleteCopy(deleteId); setDeleteId(null) }}
        title="Delete Copy"
        message="Remove this copy from your library?"
      />
    </div>
  )
}
