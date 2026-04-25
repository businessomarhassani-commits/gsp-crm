import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import {
  Globe, Mic, MicOff, Wand2, Copy, ExternalLink, Send,
  Code2, Eye, Settings, Loader2, CheckCircle, RefreshCw,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function slugify(str) {
  return (str || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

// Extract text nodes from HTML using regex for visual editor
function extractFields(html) {
  const get = (tag, idx = 0) => {
    const matches = [...html.matchAll(new RegExp(`<${tag}[^>]*>(.*?)<\/${tag}>`, 'gis'))]
    return matches[idx]?.[1]?.replace(/<[^>]+>/g, '').trim() || ''
  }
  return {
    h1: get('h1'),
    subtitle: get('p'),
    about: get('p', 1),
    cta: (() => {
      const m = html.match(/<a[^>]*class="[^"]*btn[^"]*"[^>]*>(.*?)<\/a>/is)
        || html.match(/<button[^>]*>(.*?)<\/button>/is)
      return m ? m[1].replace(/<[^>]+>/g, '').trim() : ''
    })(),
    email: (html.match(/([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/)?.[1] || ''),
    phone: (html.match(/(\+?[\d\s\-\.]{9,15})/)?.[1]?.trim() || ''),
  }
}

function applyFields(html, fields) {
  let out = html
  if (fields.h1) out = out.replace(/(<h1[^>]*>)(.*?)(<\/h1>)/is, `$1${fields.h1}$3`)
  if (fields.email) out = out.replace(/([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/g, fields.email)
  if (fields.phone) out = out.replace(/(\+?[\d\s\-\.]{9,15})/, fields.phone)
  if (fields.cta) {
    out = out.replace(/(<a[^>]*class="[^"]*btn[^"]*"[^>]*>)(.*?)(<\/a>)/is, `$1${fields.cta}$3`)
    out = out.replace(/(<button[^>]*>)(.*?)(<\/button>)/is, `$1${fields.cta}$3`)
  }
  return out
}

// ─── Prompt templates ─────────────────────────────────────────────────────────
function buildVitrinePrompt(d) {
  return `Génère un site vitrine professionnel et moderne pour ${d.name}, architecte basé à ${d.cities?.join(', ') || 'Casablanca'}, spécialisé en ${d.projectTypes?.join(', ') || 'architecture résidentielle'}. Le cabinet a réalisé ${d.clientsCount} projets clients. Style: élégant, noir et or, mobile-first. Inclure: hero avec accroche forte, section à propos, services détaillés, portfolio (projets fictifs visuels), témoignages clients marocains, formulaire de contact. Les soumissions du formulaire doivent envoyer les données en JSON à POST https://app.archicrm.ma/api/leads/external avec l'en-tête X-API-Key: ${d.apiKey}.`
}

function buildLandingPrompt(d) {
  return `Génère une landing page de capture de leads pour ${d.name}, architecte à ${d.cities?.[0] || 'Casablanca'}. Spécialité: ${d.projectTypes?.join(', ') || 'architecture résidentielle'}. Objectif: convaincre un visiteur de laisser son contact pour un projet architectural. Inclure: hero avec urgence et bénéfice clair, section bénéfices (3-4 points), témoignages fictifs marocains réalistes, formulaire simple (nom, téléphone, type de projet, ville), CTA fort et visible. Soumission du formulaire vers POST https://app.archicrm.ma/api/leads/external avec X-API-Key: ${d.apiKey}. Landing page ultra-conversion, sobre et percutante.`
}

// ─── Voice recorder hook ──────────────────────────────────────────────────────
const LANGS = ['fr-FR', 'ar-MA', 'en-US']
function useVoiceRecorder(onResult) {
  const [recording, setRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [langIdx, setLangIdx] = useState(0)
  const [statusMsg, setStatusMsg] = useState('')
  const recognRef = useRef(null)
  const triedRef = useRef(0)

  const tryLang = useCallback((idx) => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRec) { toast.error("Reconnaissance vocale non supportée par ce navigateur"); return }

    const rec = new SpeechRec()
    rec.lang = LANGS[idx]
    rec.continuous = false
    rec.interimResults = true
    recognRef.current = rec

    const langNames = { 'fr-FR': 'Français', 'ar-MA': 'Arabe / Darija', 'en-US': 'Anglais' }
    setStatusMsg(`Écoute en ${langNames[LANGS[idx]]}…`)

    rec.onresult = (e) => {
      const text = Array.from(e.results).map(r => r[0].transcript).join(' ')
      setTranscript(text)
      if (e.results[e.results.length - 1].isFinal) {
        onResult(text)
        setRecording(false)
        setStatusMsg('')
      }
    }
    rec.onerror = () => {
      const next = idx + 1
      if (next < LANGS.length) { tryLang(next) } else { setRecording(false); setStatusMsg('') }
    }
    rec.onend = () => {
      if (!transcript && triedRef.current < LANGS.length - 1) {
        triedRef.current += 1
        tryLang(triedRef.current)
      } else {
        setRecording(false)
        setStatusMsg('')
      }
    }
    rec.start()
  }, [onResult, transcript])

  const start = useCallback(() => {
    setTranscript('')
    triedRef.current = 0
    setRecording(true)
    tryLang(0)
  }, [tryLang])

  const stop = useCallback(() => {
    recognRef.current?.stop()
    setRecording(false)
    setStatusMsg('')
  }, [])

  return { recording, transcript, statusMsg, start, stop }
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function TabBar({ active, onChange }) {
  const tabs = [
    { id: 'vitrine', label: 'Site Vitrine' },
    { id: 'landing', label: 'Landing Page' },
    { id: 'settings', label: 'Paramètres' },
  ]
  return (
    <div className="flex gap-1 bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-xl p-1 mb-6 w-fit">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
            active === t.id
              ? 'bg-[#E8A838] text-[#0A0A0A] shadow-sm'
              : 'text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

function SectionCard({ title, children }) {
  return (
    <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/[0.08] rounded-2xl p-5 sm:p-6">
      <h3 className="text-[13px] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/30 mb-4">{title}</h3>
      {children}
    </div>
  )
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
function SettingsTab({ published }) {
  const [form, setForm] = useState({ vitrine: { customDomain: '', metaPixelId: '', googleTagId: '', conversionApiToken: '' }, landing: { customDomain: '', metaPixelId: '', googleTagId: '', conversionApiToken: '' } })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!published?.length) return
    const next = { ...form }
    published.forEach(s => {
      next[s.type] = { customDomain: s.custom_domain || '', metaPixelId: s.meta_pixel_id || '', googleTagId: s.google_tag_id || '', conversionApiToken: s.conversion_api_token || '' }
    })
    setForm(next)
  }, [published])

  const save = async (type) => {
    setSaving(type)
    try {
      await api.put('/api/sites/settings', { type, ...form[type] })
      toast.success('Paramètres enregistrés')
    } catch { toast.error('Erreur lors de la sauvegarde') }
    finally { setSaving(false) }
  }

  const Field = ({ label, value, onChange, type = 'text', placeholder }) => (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/30 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-lg text-[13px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20 focus:outline-none focus:border-[#E8A838]/60 focus:ring-2 focus:ring-[#E8A838]/20 transition" />
    </div>
  )

  return (
    <div className="space-y-6">
      {(['vitrine', 'landing']).map(type => {
        const pub = published?.find(s => s.type === type)
        const f = form[type]
        const set = (k) => (v) => setForm(prev => ({ ...prev, [type]: { ...prev[type], [k]: v } }))
        return (
          <SectionCard key={type} title={type === 'vitrine' ? 'Site Vitrine' : 'Landing Page'}>
            {pub ? (
              <div className="flex items-center gap-2 mb-4 text-green-600 dark:text-green-400 text-[12px]">
                <CheckCircle size={14} />
                <span>Publié sur <a href={`https://${pub.slug}.archicrm.ma`} target="_blank" rel="noopener noreferrer" className="underline">{pub.slug}.archicrm.ma</a></span>
              </div>
            ) : (
              <p className="text-gray-400 dark:text-white/30 text-[12px] mb-4">Pas encore publié.</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Domaine personnalisé" value={f.customDomain} onChange={set('customDomain')} placeholder="monsite.ma" />
              <Field label="Meta Pixel ID" value={f.metaPixelId} onChange={set('metaPixelId')} placeholder="1234567890" />
              <Field label="Google Tag ID" value={f.googleTagId} onChange={set('googleTagId')} placeholder="GTM-XXXXXXX" />
              <Field label="Conversion API Token" value={f.conversionApiToken} onChange={set('conversionApiToken')} placeholder="Clé secrète Meta CAPI" type="password" />
            </div>
            <button onClick={() => save(type)} disabled={saving === type}
              className="mt-4 flex items-center gap-2 bg-[#E8A838] hover:bg-[#d4952a] disabled:opacity-50 text-[#0A0A0A] font-bold px-5 py-2.5 rounded-xl text-[13px] transition-colors">
              {saving === type ? <Loader2 size={14} className="animate-spin" /> : null}
              Enregistrer
            </button>
          </SectionCard>
        )
      })}
    </div>
  )
}

// ─── Generator Tab ────────────────────────────────────────────────────────────
function GeneratorTab({ type, siteData }) {
  const { user } = useAuth()
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [html, setHtml] = useState('')
  const [htmlEdited, setHtmlEdited] = useState('')
  const [viewMode, setViewMode] = useState('preview') // 'preview'|'code'
  const [fields, setFields] = useState({ h1: '', subtitle: '', about: '', cta: '', email: '', phone: '' })
  const [publishing, setPublishing] = useState(false)
  const [publishedUrl, setPublishedUrl] = useState('')
  const iframeRef = useRef(null)

  // Build default prompt when site data loads
  useEffect(() => {
    if (!siteData) return
    setPrompt(type === 'vitrine' ? buildVitrinePrompt(siteData) : buildLandingPrompt(siteData))
  }, [siteData, type])

  // Reset on tab change
  useEffect(() => {
    setHtml(''); setHtmlEdited(''); setPublishedUrl('')
  }, [type])

  // Voice recorder
  const onVoiceResult = useCallback((text) => {
    setPrompt(prev => prev ? `${prev}\n\n${text}` : text)
  }, [])
  const voice = useVoiceRecorder(onVoiceResult)

  const generate = async () => {
    if (!prompt.trim()) { toast.error('Entrez un prompt'); return }
    setGenerating(true)
    try {
      const { data } = await api.post('/api/sites/generate', { prompt })
      const generated = data.html || ''
      setHtml(generated)
      setHtmlEdited(generated)
      setFields(extractFields(generated))
      setViewMode('preview')
      toast.success('Site généré avec succès !')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la génération')
    } finally {
      setGenerating(false)
    }
  }

  const applyVisualEdits = () => {
    const updated = applyFields(htmlEdited, fields)
    setHtmlEdited(updated)
    toast.success('Modifications appliquées')
  }

  const openInTab = () => {
    const blob = new Blob([htmlEdited], { type: 'text/html' })
    window.open(URL.createObjectURL(blob), '_blank')
  }

  const copyCode = () => {
    navigator.clipboard.writeText(htmlEdited)
    toast.success('Code copié')
  }

  const publish = async () => {
    if (!htmlEdited) { toast.error('Générez d\'abord un site'); return }
    const slug = siteData?.slug || slugify(user?.name || 'architecte')
    setPublishing(true)
    try {
      const { data } = await api.post('/api/sites/publish', { html: htmlEdited, type, slug })
      setPublishedUrl(data.url)
      toast.success('Site publié !')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la publication')
    } finally {
      setPublishing(false)
    }
  }

  const slug = siteData?.slug || slugify(user?.name || 'architecte')

  return (
    <div className="space-y-5">
      {/* AI Prompt Generator */}
      <SectionCard title="Générer avec l'IA">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            rows={6}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-xl text-[13px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20 focus:outline-none focus:border-[#E8A838]/60 focus:ring-2 focus:ring-[#E8A838]/20 transition resize-none pr-12 font-mono"
            placeholder="Décrivez le site que vous souhaitez générer…"
          />
          {/* Mic button inside textarea */}
          <button
            onClick={voice.recording ? voice.stop : voice.start}
            title="Dictée vocale (fr / ar / en)"
            className={`absolute right-3 top-3 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              voice.recording
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-[#E8A838]/10 text-[#E8A838] hover:bg-[#E8A838]/20'
            }`}
          >
            {voice.recording ? <MicOff size={15} /> : <Mic size={15} />}
          </button>
        </div>

        {/* Live transcription */}
        {(voice.recording || voice.transcript) && (
          <div className="mt-2 px-3 py-2 bg-[#E8A838]/5 border border-[#E8A838]/20 rounded-lg text-[12px]">
            {voice.statusMsg && <p className="text-[#E8A838] font-medium mb-1">{voice.statusMsg}</p>}
            {voice.transcript && <p className="text-gray-600 dark:text-white/50 italic">"{voice.transcript}"</p>}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 mt-4">
          <button
            onClick={generate}
            disabled={generating || !prompt.trim()}
            className="flex items-center gap-2 bg-[#E8A838] hover:bg-[#d4952a] disabled:opacity-50 text-[#0A0A0A] font-bold px-6 py-3 rounded-xl text-[14px] transition-all active:scale-95"
          >
            {generating ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
            {generating ? 'Claude génère votre site…' : 'Générer le site'}
          </button>
          {siteData && (
            <button onClick={() => setPrompt(type === 'vitrine' ? buildVitrinePrompt(siteData) : buildLandingPrompt(siteData))}
              className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-600 dark:hover:text-white/60 transition-colors">
              <RefreshCw size={12} /> Réinitialiser le prompt
            </button>
          )}
        </div>
      </SectionCard>

      {/* Generated result */}
      {htmlEdited && (
        <>
          <SectionCard title="Résultat généré">
            {/* View mode toggle */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-1 bg-gray-100 dark:bg-white/[0.06] rounded-lg p-1">
                {[['preview', <Eye size={13} />, 'Aperçu'], ['code', <Code2 size={13} />, 'Code']].map(([id, icon, label]) => (
                  <button key={id} onClick={() => setViewMode(id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
                      viewMode === id ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-white/40'
                    }`}>
                    {icon}{label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={copyCode} className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white/10 px-3 py-1.5 rounded-lg transition-colors">
                  <Copy size={12} /> Copier
                </button>
                <button onClick={openInTab} className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white/10 px-3 py-1.5 rounded-lg transition-colors">
                  <ExternalLink size={12} /> Ouvrir
                </button>
              </div>
            </div>

            {viewMode === 'preview' ? (
              <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-white/10" style={{ height: '520px' }}>
                <iframe
                  ref={iframeRef}
                  srcDoc={htmlEdited}
                  title="Aperçu du site"
                  className="w-full h-full"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            ) : (
              <textarea
                value={htmlEdited}
                onChange={e => setHtmlEdited(e.target.value)}
                className="w-full h-[520px] px-4 py-3 bg-gray-950 dark:bg-black/40 text-green-400 text-[11px] font-mono border border-gray-200 dark:border-white/10 rounded-xl resize-none focus:outline-none focus:border-[#E8A838]/40"
              />
            )}
          </SectionCard>

          {/* Visual editor */}
          <SectionCard title="Éditeur rapide">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                ['h1', 'Titre principal (H1)', 'text'],
                ['subtitle', 'Sous-titre', 'text'],
                ['about', 'Texte à propos', 'text'],
                ['cta', 'Texte du bouton CTA', 'text'],
                ['email', 'Email de contact', 'email'],
                ['phone', 'Téléphone', 'tel'],
              ].map(([key, label, type]) => (
                <div key={key}>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/30 mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={fields[key]}
                    onChange={e => setFields(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-lg text-[13px] text-gray-900 dark:text-white focus:outline-none focus:border-[#E8A838]/60 focus:ring-2 focus:ring-[#E8A838]/20 transition"
                  />
                </div>
              ))}
            </div>
            <button onClick={applyVisualEdits}
              className="mt-4 flex items-center gap-2 bg-[#0A0A0A] dark:bg-white/10 hover:bg-[#1a1a1a] dark:hover:bg-white/[0.15] text-white font-semibold px-5 py-2.5 rounded-xl text-[13px] transition-colors">
              <RefreshCw size={14} />
              Appliquer les modifications
            </button>
          </SectionCard>

          {/* Publish */}
          <div className="bg-[#0A0A0A] dark:bg-[#111] border border-white/[0.08] rounded-2xl p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <p className="text-white font-semibold text-[15px] mb-1">Publier le site</p>
                <p className="text-white/40 text-[13px]">
                  Votre site sera disponible sur{' '}
                  <span className="text-[#E8A838]">https://{slug}.archicrm.ma</span>
                </p>
              </div>
              <button
                onClick={publish}
                disabled={publishing}
                className="flex items-center gap-2 bg-[#E8A838] hover:bg-[#d4952a] disabled:opacity-50 text-[#0A0A0A] font-bold px-6 py-3 rounded-xl text-[14px] transition-all active:scale-95 whitespace-nowrap"
              >
                {publishing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {publishing ? 'Publication…' : `Publier sur ${slug}.archicrm.ma`}
              </button>
            </div>

            {publishedUrl && (
              <div className="mt-4 flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-[13px] px-4 py-3 rounded-xl">
                <CheckCircle size={16} />
                <span>Site publié sur{' '}
                  <a href={publishedUrl} target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                    {publishedUrl}
                  </a>
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Sites() {
  const [tab, setTab] = useState('vitrine')
  const [siteData, setSiteData] = useState(null)
  const [loadingData, setLoadingData] = useState(true)
  const [published, setPublished] = useState([])

  useEffect(() => {
    Promise.all([
      api.get('/api/sites/my-data'),
      api.get('/api/sites/published'),
    ]).then(([d, p]) => {
      setSiteData(d.data)
      setPublished(p.data || [])
    }).catch(() => toast.error('Erreur lors du chargement des données'))
      .finally(() => setLoadingData(false))
  }, [])

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 size={24} className="animate-spin text-[#E8A838]" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-[#E8A838]/10 flex items-center justify-center">
            <Globe size={18} className="text-[#E8A838]" />
          </div>
          <h1 className="text-[20px] font-bold text-gray-900 dark:text-white">Sites Web</h1>
        </div>
        <p className="text-gray-400 dark:text-white/40 text-[13px] ml-12">
          Générez et publiez votre site vitrine ou landing page en quelques clics grâce à l'IA.
        </p>
      </div>

      <TabBar active={tab} onChange={setTab} />

      {tab === 'vitrine' && <GeneratorTab type="vitrine" siteData={siteData} />}
      {tab === 'landing' && <GeneratorTab type="landing" siteData={siteData} />}
      {tab === 'settings' && <SettingsTab published={published} />}
    </div>
  )
}
