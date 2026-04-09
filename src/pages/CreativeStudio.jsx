import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Film, Zap, ExternalLink, Upload, Trash2, Play, Edit3 } from 'lucide-react'
import { generateVideoScript } from '../lib/claude'
import { useNiches } from '../hooks/useNiches'
import { useCreatives, useCreateCreative, useUpdateCreative, useDeleteCreative } from '../hooks/useCreatives'
import { useSettingsStore } from '../store/useSettingsStore'
import { useUIStore } from '../store/useUIStore'
import { GlassCard } from '../components/ui/GlassCard'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { Input, Textarea, FormSelect } from '../components/ui/Input'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { NicheBadge, Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { VIDEO_DURATIONS } from '../lib/constants'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const VISUAL_STYLES = ['Cinematic','Talking Head','UGC / Authentic','Text on Screen','Voiceover B-roll','Animation','Product Demo']
const STATUS_COLORS = { draft: '#94a3b8', active: '#10b981', paused: '#f59e0b' }

export default function CreativeStudio() {
  const { theme } = useUIStore()
  const isDark = theme === 'dark'
  const navigate = useNavigate()
  const { claudeApiKey } = useSettingsStore()
  const { data: niches } = useNiches()
  const { data: creatives } = useCreatives()
  const { mutate: createCreative, isPending: saving } = useCreateCreative()
  const { mutate: updateCreative } = useUpdateCreative()
  const { mutate: deleteCreative } = useDeleteCreative()

  const [form, setForm] = useState({ ad_concept: '', target_audience: '', niche_id: '', hook: '', visual_style: 'Cinematic', duration: '30s' })
  const [script, setScript] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [saved, setSaved] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  async function handleGenerate() {
    if (!claudeApiKey) {
      toast.error('Add your Claude API key in Settings.')
      navigate('/settings')
      return
    }
    setGenerating(true)
    setSaved(false)
    try {
      const nicheName = niches?.find(n => n.id === form.niche_id)?.name || 'General'
      const result = await generateVideoScript({ apiKey: claudeApiKey, ...form, niche: nicheName })
      setScript(result)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setGenerating(false)
    }
  }

  function handleOpenHiggsfield() {
    if (!script) return
    const prompt = `
VIDEO AD SCRIPT
Duration: ${form.duration}
Visual Style: ${form.visual_style}

SCRIPT:
${script.script}

SCENE BREAKDOWN:
${Array.isArray(script.scenes) ? script.scenes.map(s => `Scene ${s.number}: ${s.description} (${s.duration})`).join('\n') : script.scenes}

VOICEOVER:
${script.voiceover}

ON-SCREEN TEXT:
${script.onscreen_text}

CALL TO ACTION:
${script.cta}
`.trim()
    navigator.clipboard.writeText(prompt)
    toast.success('Script copied to clipboard! Opening Higgsfield…')
    window.open('https://higgsfield.ai', '_blank')
  }

  function handleSaveCreative() {
    if (!script) return
    createCreative({
      ...form,
      script: script.script,
      scene_breakdown: typeof script.scenes === 'string' ? script.scenes : JSON.stringify(script.scenes),
      voiceover: script.voiceover,
      onscreen_text: script.onscreen_text,
      cta: script.cta,
      status: 'draft',
    })
    setSaved(true)
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Creative Studio" subtitle="AI video ad scripts + Higgsfield.ai workflow" />

      {/* Brief + Script */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brief Form */}
        <GlassCard className="p-7">
          <h3 className={`text-base font-semibold mb-5 ${isDark ? 'text-white/80' : 'text-slate-700'}`}>Ad Brief</h3>
          <div className="space-y-4">
            <FormSelect label="Niche" value={form.niche_id} onChange={e => setForm(f => ({ ...f, niche_id: e.target.value }))}>
              <option value="">Select niche…</option>
              {niches?.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
            </FormSelect>
            <Textarea label="Ad Concept" placeholder="What is this ad about? What's the core message?" rows={2}
              value={form.ad_concept} onChange={e => setForm(f => ({ ...f, ad_concept: e.target.value }))} />
            <Input label="Target Audience" placeholder="e.g. Restaurant owners in Casablanca aged 30-50"
              value={form.target_audience} onChange={e => setForm(f => ({ ...f, target_audience: e.target.value }))} />
            <Textarea label="Hook Idea" placeholder="First 3 seconds — what grabs attention?" rows={2}
              value={form.hook} onChange={e => setForm(f => ({ ...f, hook: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <FormSelect label="Visual Style" value={form.visual_style} onChange={e => setForm(f => ({ ...f, visual_style: e.target.value }))}>
                {VISUAL_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
              </FormSelect>
              <FormSelect label="Duration" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}>
                {VIDEO_DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </FormSelect>
            </div>
            <Button onClick={handleGenerate} loading={generating} icon={Zap} className="w-full">
              {generating ? 'Generating Script…' : 'Generate Video Script'}
            </Button>
          </div>
        </GlassCard>

        {/* Script Output */}
        <GlassCard className="p-7 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h3 className={`text-base font-semibold ${isDark ? 'text-white/80' : 'text-slate-700'}`}>Generated Script</h3>
            {script && (
              <div className="flex gap-2">
                <Button variant="purple" size="xs" icon={ExternalLink} onClick={handleOpenHiggsfield}>
                  Open in Higgsfield
                </Button>
                <Button variant="success" size="xs" onClick={handleSaveCreative} loading={saving} disabled={saved}>
                  {saved ? 'Saved!' : 'Save'}
                </Button>
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {generating ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center gap-3 min-h-64">
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <motion.div key={i} className="w-2 h-2 rounded-full bg-purple-500"
                      animate={{ y: [0,-8,0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }} />
                  ))}
                </div>
                <p className={`text-sm ${isDark ? 'text-white/40' : 'text-slate-400'}`}>Writing your script…</p>
              </motion.div>
            ) : script ? (
              <motion.div key="script" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex-1 space-y-4 overflow-y-auto max-h-[60vh] pr-1">
                {[
                  { label: 'Full Script', content: script.script },
                  { label: 'Scene Breakdown', content: Array.isArray(script.scenes) ? script.scenes.map(s => `Scene ${s.number}: ${s.description}`).join('\n') : script.scenes },
                  { label: 'Voiceover', content: script.voiceover },
                  { label: 'On-Screen Text', content: script.onscreen_text },
                  { label: 'Call to Action', content: script.cta },
                ].map(({ label, content }) => content ? (
                  <div key={label}>
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-white/35' : 'text-slate-400'}`}>{label}</p>
                    <div className={`text-sm leading-relaxed whitespace-pre-wrap p-3 rounded-xl ${isDark ? 'bg-white/4' : 'bg-black/3'} ${isDark ? 'text-white/75' : 'text-slate-700'}`}>
                      {content}
                    </div>
                  </div>
                ) : null)}
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center min-h-64">
                <Film size={28} className={isDark ? 'text-white/15 mb-3' : 'text-slate-200 mb-3'} />
                <p className={`text-sm ${isDark ? 'text-white/30' : 'text-slate-400'}`}>Fill the brief and click Generate</p>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </div>

      {/* Creative Library */}
      <div>
        <h3 className={`text-base font-semibold mb-4 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>Creative Library</h3>
        {!creatives?.length ? (
          <GlassCard>
            <EmptyState icon={Film} title="No creatives yet" message="Generate a script and save it to build your creative library." />
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {creatives.map(c => (
              <GlassCard key={c.id} className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex flex-wrap gap-1.5">
                    {c.niches && <NicheBadge niche={c.niches} size="xs" />}
                    <Badge color={STATUS_COLORS[c.status] || '#94a3b8'} size="xs">{c.status}</Badge>
                    {c.duration && <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-white/8 text-white/40' : 'bg-black/6 text-slate-400'}`}>{c.duration}</span>}
                  </div>
                  <button onClick={() => setDeleteId(c.id)} className={`p-1 rounded cursor-pointer ${isDark ? 'hover:bg-red-500/15 text-white/20 hover:text-red-400' : 'hover:bg-red-50 text-slate-300 hover:text-red-400'}`}>
                    <Trash2 size={11} />
                  </button>
                </div>
                {c.ad_concept && <p className={`text-xs font-medium mb-1 ${isDark ? 'text-white/75' : 'text-slate-700'}`}>{c.ad_concept}</p>}
                {c.script && <p className={`text-xs leading-relaxed line-clamp-3 ${isDark ? 'text-white/45' : 'text-slate-500'}`}>{c.script}</p>}
                <div className="flex items-center justify-between mt-3">
                  <span className={`text-xs ${isDark ? 'text-white/25' : 'text-slate-300'}`}>{format(new Date(c.created_at), 'MMM d, yyyy')}</span>
                  <div className="flex gap-1">
                    {['active','paused','draft'].filter(s => s !== c.status).slice(0,1).map(s => (
                      <button key={s} onClick={() => updateCreative({ id: c.id, status: s })}
                        className={`text-xs px-2 py-0.5 rounded-lg cursor-pointer transition-colors ${isDark ? 'hover:bg-white/8 text-white/30 hover:text-white' : 'hover:bg-black/6 text-slate-400'}`}>
                        → {s}
                      </button>
                    ))}
                  </div>
                </div>
                {c.performance_notes && (
                  <p className={`text-xs mt-2 pt-2 border-t ${isDark ? 'border-white/6 text-white/35' : 'border-black/6 text-slate-400'}`}>{c.performance_notes}</p>
                )}
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { deleteCreative(deleteId); setDeleteId(null) }}
        title="Delete Creative"
        message="Remove this creative from your library?"
      />
    </div>
  )
}
