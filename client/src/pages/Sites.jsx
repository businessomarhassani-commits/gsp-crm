import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import {
  Globe, Mic, MicOff, Wand2, ExternalLink, Send, Settings,
  Loader2, CheckCircle, RefreshCw, Eye, EyeOff, Trash2, Plus,
  ChevronUp, ChevronDown, Sparkles, Palette, Type, X, Check,
  Copy, Monitor,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function slugify(str) {
  return (str || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function buildVitrinePrompt(d) {
  return `Génère un site vitrine professionnel et moderne pour ${d.name}, architecte basé à ${d.cities?.join(', ') || 'Casablanca'}, spécialisé en ${d.projectTypes?.join(', ') || 'architecture résidentielle'}. Le cabinet a réalisé ${d.clientsCount} projets clients. Style: élégant, noir et or, mobile-first. Inclure: hero avec accroche forte, section à propos, services détaillés, portfolio (projets fictifs visuels), témoignages clients marocains, formulaire de contact. Les soumissions du formulaire doivent envoyer les données en JSON à POST https://app.archicrm.ma/api/leads/external avec l'en-tête X-API-Key: ${d.apiKey}.`
}

function buildLandingPrompt(d) {
  return `Génère une landing page de capture de leads pour ${d.name}, architecte à ${d.cities?.[0] || 'Casablanca'}. Spécialité: ${d.projectTypes?.join(', ') || 'architecture résidentielle'}. Objectif: convaincre un visiteur de laisser son contact. Inclure: hero avec urgence et bénéfice clair, bénéfices (3-4 points), témoignages fictifs marocains, formulaire simple (nom, téléphone, type de projet, ville), CTA fort. Soumission vers POST https://app.archicrm.ma/api/leads/external avec X-API-Key: ${d.apiKey}. Ultra-conversion, sobre et percutante.`
}

// Parse <section> tags to get section list for the section manager
function parseSections(html) {
  const sections = []
  const regex = /<section([^>]*)>([\s\S]*?)<\/section>/gi
  let match
  while ((match = regex.exec(html)) !== null) {
    const attrs = match[1]
    const inner = match[2]
    const heading = inner.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/i)?.[1]?.replace(/<[^>]+>/g, '').trim() || ''
    const id = attrs.match(/id="([^"]+)"/)?.[1] || ''
    const name = (heading || id || `Section ${sections.length + 1}`).slice(0, 50)
    const visible = !/display\s*:\s*none/i.test(attrs)
    sections.push({ name, fullMatch: match[0], start: match.index, end: match.index + match[0].length, visible })
  }
  return sections
}

// Inject click-to-edit script into srcdoc (does NOT modify the saved HTML)
function withEditorScript(html) {
  const script = `<script>(function(){
  var c=0;
  function init(){
    document.querySelectorAll('h1,h2,h3,h4,p,button,a,li,span').forEach(function(el){
      if(el.dataset.eid)return;
      el.dataset.eid='e'+(++c);
      el.style.cursor='pointer';
      el.addEventListener('click',function(e){
        e.preventDefault();e.stopPropagation();
        window.parent.postMessage({type:'ELEMENT_CLICK',text:this.innerText.trim().slice(0,500),tag:this.tagName,eid:this.dataset.eid},'*');
      },true);
    });
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();<\/script>`
  return html.includes('</body>') ? html.replace('</body>', script + '\n</body>') : html + script
}

// ─── Voice recorder hook ──────────────────────────────────────────────────────
const LANGS = ['fr-FR', 'ar-MA', 'en-US']

function useVoiceRecorder(onResult) {
  const [recording, setRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const recRef = useRef(null)
  const triedRef = useRef(0)

  const tryLang = useCallback((idx) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { toast.error('Reconnaissance vocale non supportée'); return }
    const rec = new SR()
    rec.lang = LANGS[idx]; rec.continuous = false; rec.interimResults = true
    recRef.current = rec
    const names = { 'fr-FR': 'Français', 'ar-MA': 'Arabe', 'en-US': 'Anglais' }
    setStatusMsg(`Écoute en ${names[LANGS[idx]]}…`)
    let final = ''
    rec.onresult = e => {
      const t = Array.from(e.results).map(r => r[0].transcript).join(' ')
      setTranscript(t)
      if (e.results[e.results.length - 1].isFinal) { final = t; onResult(t); setRecording(false); setStatusMsg('') }
    }
    rec.onerror = () => {
      const next = idx + 1
      if (next < LANGS.length) tryLang(next) else { setRecording(false); setStatusMsg('') }
    }
    rec.onend = () => {
      if (!final && triedRef.current < LANGS.length - 1) { triedRef.current++; tryLang(triedRef.current) }
      else { setRecording(false); setStatusMsg('') }
    }
    rec.start()
  }, [onResult])

  const start = useCallback(() => { setTranscript(''); triedRef.current = 0; setRecording(true); tryLang(0) }, [tryLang])
  const stop  = useCallback(() => { recRef.current?.stop(); setRecording(false); setStatusMsg('') }, [])
  return { recording, transcript, statusMsg, start, stop }
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
function SettingsTab({ published }) {
  const [form, setForm] = useState({
    vitrine: { customDomain: '', metaPixelId: '', googleTagId: '', conversionApiToken: '' },
    landing: { customDomain: '', metaPixelId: '', googleTagId: '', conversionApiToken: '' },
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!published?.length) return
    setForm(prev => {
      const next = { ...prev }
      published.forEach(s => {
        next[s.type] = {
          customDomain: s.custom_domain || '',
          metaPixelId: s.meta_pixel_id || '',
          googleTagId: s.google_tag_id || '',
          conversionApiToken: s.conversion_api_token || '',
        }
      })
      return next
    })
  }, [published])

  const save = async type => {
    setSaving(type)
    try { await api.put('/api/sites/settings', { type, ...form[type] }); toast.success('Paramètres enregistrés') }
    catch { toast.error('Erreur lors de la sauvegarde') }
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
    <div className="space-y-6 max-w-3xl">
      {['vitrine', 'landing'].map(type => {
        const pub = published?.find(s => s.type === type)
        const f = form[type]
        const set = k => v => setForm(p => ({ ...p, [type]: { ...p[type], [k]: v } }))
        return (
          <div key={type} className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/[0.08] rounded-2xl p-5 sm:p-6">
            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/30 mb-4">
              {type === 'vitrine' ? 'Site Vitrine' : 'Landing Page'}
            </h3>
            {pub ? (
              <div className="flex items-center gap-2 mb-4 text-green-500 text-[12px]">
                <CheckCircle size={14} />
                <span>Publié sur <a href={`https://${pub.slug}.archicrm.ma`} target="_blank" rel="noopener noreferrer" className="underline">{pub.slug}.archicrm.ma</a></span>
              </div>
            ) : <p className="text-gray-400 dark:text-white/30 text-[12px] mb-4">Pas encore publié.</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Domaine personnalisé" value={f.customDomain} onChange={set('customDomain')} placeholder="monsite.ma" />
              <Field label="Meta Pixel ID" value={f.metaPixelId} onChange={set('metaPixelId')} placeholder="1234567890" />
              <Field label="Google Tag ID" value={f.googleTagId} onChange={set('googleTagId')} placeholder="GTM-XXXXXXX" />
              <Field label="Conversion API Token" value={f.conversionApiToken} onChange={set('conversionApiToken')} placeholder="Clé secrète Meta CAPI" type="password" />
            </div>
            <button onClick={() => save(type)} disabled={saving === type}
              className="mt-4 flex items-center gap-2 bg-[#E8A838] hover:bg-[#d4952a] disabled:opacity-50 text-[#0A0A0A] font-bold px-5 py-2.5 rounded-xl text-[13px] transition-colors">
              {saving === type && <Loader2 size={14} className="animate-spin" />}
              Enregistrer
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ─── Constants ────────────────────────────────────────────────────────────────
const MODIFY_CHIPS = [
  'Rends le hero plus accrocheur',
  'Change les couleurs en bleu marine',
  'Ajoute une section témoignages',
  'Supprime la section portfolio',
  'Rends le texte plus court',
]
const SECTION_TYPES = ['Hero', 'À Propos', 'Services', 'Portfolio', 'Témoignages', 'Contact', 'FAQ', 'Statistiques']
const FONTS = ['Inter', 'Playfair Display', 'Montserrat', 'Roboto']

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Sites() {
  const { user } = useAuth()

  // Tab & mobile view
  const [tab, setTab] = useState('vitrine')           // vitrine | landing | settings
  const [mobileView, setMobileView] = useState('editor') // editor | preview

  // Remote data
  const [siteData, setSiteData] = useState(null)
  const [published, setPublished] = useState([])
  const [loadingData, setLoadingData] = useState(true)

  // Editor state
  const [prompt, setPrompt]           = useState('')
  const [generating, setGenerating]   = useState(false)
  const [modifying, setModifying]     = useState(false)
  const [html, setHtml]               = useState('')       // current HTML (with any style changes)
  const [htmlBase, setHtmlBase]       = useState('')       // HTML before style changes (for re-apply)
  const [sections, setSections]       = useState([])
  const [modifyPrompt, setModifyPrompt] = useState('')
  const [styles, setStyles]           = useState({ primaryColor: '#E8A838', bgColor: '#0A0A0A', fontFamily: 'Inter' })
  const [addSectionOpen, setAddSectionOpen] = useState(false)

  // Publish state
  const [publishing, setPublishing]   = useState(false)
  const [publishedUrl, setPublishedUrl] = useState('')
  const [publishedAt, setPublishedAt] = useState(null)

  // Click-to-edit state
  const [editPanel, setEditPanel]     = useState(null) // { text, tag, eid }
  const [editText, setEditText]       = useState('')

  const iframeRef = useRef(null)

  // srcdoc = HTML with editor script injected (only for preview, not saved)
  const srcdoc = html ? withEditorScript(html) : ''

  // ── Load data ────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([api.get('/api/sites/my-data'), api.get('/api/sites/published')])
      .then(([d, p]) => { setSiteData(d.data); setPublished(p.data || []) })
      .catch(() => toast.error('Erreur lors du chargement'))
      .finally(() => setLoadingData(false))
  }, [])

  // ── Reset on tab change ───────────────────────────────────────────────────
  useEffect(() => {
    if (!siteData || tab === 'settings') return
    setPrompt(tab === 'vitrine' ? buildVitrinePrompt(siteData) : buildLandingPrompt(siteData))
    setHtml(''); setHtmlBase(''); setSections([]); setPublishedUrl(''); setEditPanel(null)
  }, [tab, siteData])

  // ── Close edit panel when HTML changes (iframe re-renders = new edit IDs) ─
  useEffect(() => { setEditPanel(null) }, [html])

  // ── postMessage listener for click-to-edit ────────────────────────────────
  useEffect(() => {
    const handler = e => {
      if (e.data?.type !== 'ELEMENT_CLICK') return
      setEditPanel(e.data)
      setEditText(e.data.text || '')
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  // ── Voice recorder ────────────────────────────────────────────────────────
  const voice = useVoiceRecorder(useCallback(text => {
    setPrompt(p => p ? `${p}\n\n${text}` : text)
  }, []))

  // ── Handlers ─────────────────────────────────────────────────────────────

  const generate = async () => {
    if (!prompt.trim()) { toast.error('Entrez un prompt'); return }
    setGenerating(true)
    try {
      const { data } = await api.post('/api/sites/generate', { prompt })
      const g = data.html || ''
      setHtml(g); setHtmlBase(g); setSections(parseSections(g))
      setStyles({ primaryColor: '#E8A838', bgColor: '#0A0A0A', fontFamily: 'Inter' })
      setMobileView('preview')
      toast.success('Site généré !')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la génération')
    } finally { setGenerating(false) }
  }

  const applyModification = async () => {
    if (!modifyPrompt.trim() || !html) return
    setModifying(true)
    try {
      const { data } = await api.post('/api/sites/modify', { html, instruction: modifyPrompt })
      const u = data.html || ''
      setHtml(u); setHtmlBase(u); setSections(parseSections(u))
      setModifyPrompt('')
      toast.success('Modification appliquée !')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la modification')
    } finally { setModifying(false) }
  }

  const addSection = async type => {
    setAddSectionOpen(false)
    setModifying(true)
    try {
      const { data } = await api.post('/api/sites/modify', {
        html,
        instruction: `Ajoute une section "${type}" professionnelle et bien stylée après la dernière section existante. Ne modifie rien d'autre.`,
      })
      const u = data.html || ''
      setHtml(u); setHtmlBase(u); setSections(parseSections(u))
      toast.success(`Section ${type} ajoutée !`)
    } catch (err) {
      toast.error('Erreur lors de l\'ajout de section')
    } finally { setModifying(false) }
  }

  const saveEdit = () => {
    if (!editPanel) { setEditPanel(null); return }
    const escaped = editPanel.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const replacement = editText.trim() || editPanel.text
    const updated = html.replace(new RegExp(escaped), replacement)
    setHtml(updated); setHtmlBase(updated); setSections(parseSections(updated))
    setEditPanel(null)
    toast.success('Texte modifié')
  }

  const toggleSection = sec => {
    let updated
    if (sec.visible) {
      updated = html.replace(sec.fullMatch, sec.fullMatch.replace(/^<section(\s|>)/, '<section style="display:none"$1'))
    } else {
      updated = html.replace(
        sec.fullMatch,
        sec.fullMatch.replace(/\s*style="display:none"\s*/i, ' ').replace(/\s*style="display:none;([^"]*)"/i, ' style="$1"')
      )
    }
    setHtml(updated); setSections(parseSections(updated))
  }

  const deleteSection = sec => {
    const updated = html.replace(sec.fullMatch, '')
    setHtml(updated); setHtmlBase(updated); setSections(parseSections(updated))
    toast.success('Section supprimée')
  }

  const moveSection = (idx, dir) => {
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= sections.length) return
    const a = sections[idx], b = sections[newIdx]
    let updated
    if (dir === -1) { // move up: b is before a in document
      updated = html.slice(0, b.start) + a.fullMatch + html.slice(b.end, a.start) + b.fullMatch + html.slice(a.end)
    } else {          // move down: a is before b
      updated = html.slice(0, a.start) + b.fullMatch + html.slice(a.end, b.start) + a.fullMatch + html.slice(b.end)
    }
    setHtml(updated); setHtmlBase(updated); setSections(parseSections(updated))
  }

  const applyStyles = () => {
    // Work from htmlBase so color changes don't stack
    let updated = htmlBase.replace(/#E8A838/gi, styles.primaryColor)
    const fontLink = styles.fontFamily !== 'Inter'
      ? `<link href="https://fonts.googleapis.com/css2?family=${styles.fontFamily.replace(/ /g, '+')}:wght@400;500;600;700&display=swap" rel="stylesheet">\n`
      : ''
    const override = `<style id="__site_override">body,*{font-family:'${styles.fontFamily}',sans-serif!important}body{background-color:${styles.bgColor}!important}</style>\n`
    if (updated.includes('</head>')) {
      updated = updated.replace('</head>', fontLink + override + '</head>')
    }
    setHtml(updated)
    toast.success('Styles appliqués')
  }

  const publish = async () => {
    if (!html) { toast.error('Générez d\'abord un site'); return }
    const slug = siteData?.slug || slugify(user?.name || 'architecte')
    setPublishing(true)
    try {
      const { data } = await api.post('/api/sites/publish', { html, type: tab, slug })
      setPublishedUrl(data.url); setPublishedAt(new Date())
      const { data: pub } = await api.get('/api/sites/published')
      setPublished(pub || [])
      toast.success('Site publié !')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la publication')
    } finally { setPublishing(false) }
  }

  const slug = siteData?.slug || slugify(user?.name || 'architecte')

  if (loadingData) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 size={28} className="animate-spin text-[#E8A838]" />
    </div>
  )

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#E8A838]/10 flex items-center justify-center">
            <Globe size={16} className="text-[#E8A838]" />
          </div>
          <h1 className="text-[17px] font-bold text-gray-900 dark:text-white">Sites Web</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile view toggle — only when HTML exists */}
          {html && (
            <div className="flex lg:hidden gap-0.5 bg-gray-100 dark:bg-white/[0.06] rounded-lg p-0.5">
              {[['editor', Monitor, 'Éditeur'], ['preview', Eye, 'Aperçu']].map(([v, Icon, label]) => (
                <button key={v} onClick={() => setMobileView(v)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${mobileView === v ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-white/40'}`}>
                  <Icon size={11} />{label}
                </button>
              ))}
            </div>
          )}

          {/* Site type tabs */}
          <div className="flex gap-0.5 bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-xl p-1">
            {[['vitrine', 'Site Vitrine'], ['landing', 'Landing']].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${tab === id ? 'bg-[#E8A838] text-[#0A0A0A] shadow-sm' : 'text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Settings toggle */}
          <button onClick={() => setTab(t => t === 'settings' ? 'vitrine' : 'settings')}
            className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${tab === 'settings' ? 'bg-[#E8A838] border-[#E8A838] text-[#0A0A0A]' : 'border-gray-200 dark:border-white/10 text-gray-400 hover:border-[#E8A838]/40 hover:text-[#E8A838]'}`}>
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* ── Settings (full width) ───────────────────────────────────────────── */}
      {tab === 'settings' ? (
        <SettingsTab published={published} />
      ) : (
        <>
          {/* ── Split screen ──────────────────────────────────────────────── */}
          <div className="flex gap-3" style={{ height: 'calc(100vh - 230px)', minHeight: 520 }}>

            {/* LEFT PANEL — scrollable */}
            <div className={`w-full lg:w-[35%] flex-shrink-0 overflow-y-auto flex flex-col gap-3 pr-1
              ${html && mobileView === 'preview' ? 'hidden lg:flex' : 'flex'}`}>

              {/* ── AI Prompt ─────────────────────────────────────────────── */}
              <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/[0.08] rounded-2xl p-4 flex-shrink-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/30 mb-2.5">Générer avec l'IA</p>
                <div className="relative">
                  <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={5}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-xl text-[12px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20 focus:outline-none focus:border-[#E8A838]/60 focus:ring-2 focus:ring-[#E8A838]/20 transition resize-none pr-10 leading-relaxed"
                    placeholder="Décrivez votre site…" />
                  <button onClick={voice.recording ? voice.stop : voice.start}
                    className={`absolute right-2.5 top-2.5 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${voice.recording ? 'bg-red-500 text-white animate-pulse' : 'bg-[#E8A838]/10 text-[#E8A838] hover:bg-[#E8A838]/20'}`}>
                    {voice.recording ? <MicOff size={12} /> : <Mic size={12} />}
                  </button>
                </div>

                {(voice.recording || voice.transcript) && (
                  <div className="mt-2 px-2.5 py-1.5 bg-[#E8A838]/5 border border-[#E8A838]/20 rounded-lg text-[11px]">
                    {voice.statusMsg && <p className="text-[#E8A838] font-medium">{voice.statusMsg}</p>}
                    {voice.transcript && <p className="text-gray-500 dark:text-white/40 italic">"{voice.transcript}"</p>}
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  <button onClick={generate} disabled={generating || !prompt.trim()}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#E8A838] hover:bg-[#d4952a] disabled:opacity-50 text-[#0A0A0A] font-bold px-4 py-2.5 rounded-xl text-[13px] transition-all active:scale-95">
                    {generating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                    {generating ? 'Génération…' : 'Générer'}
                  </button>
                  {siteData && (
                    <button onClick={() => setPrompt(tab === 'vitrine' ? buildVitrinePrompt(siteData) : buildLandingPrompt(siteData))}
                      title="Réinitialiser le prompt"
                      className="w-9 h-9 flex items-center justify-center border border-gray-200 dark:border-white/10 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white transition-all">
                      <RefreshCw size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* ── AI Modify ─────────────────────────────────────────────── */}
              {html && (
                <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/[0.08] rounded-2xl p-4 flex-shrink-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/30 mb-2.5">Modifier avec l'IA</p>
                  <textarea value={modifyPrompt} onChange={e => setModifyPrompt(e.target.value)} rows={2}
                    placeholder="Que voulez-vous modifier ?"
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-xl text-[12px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20 focus:outline-none focus:border-[#E8A838]/60 focus:ring-2 focus:ring-[#E8A838]/20 transition resize-none" />

                  {/* Suggestion chips */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {MODIFY_CHIPS.map(chip => (
                      <button key={chip} onClick={() => setModifyPrompt(chip)}
                        className="px-2 py-1 bg-gray-100 dark:bg-white/[0.06] hover:bg-[#E8A838]/10 hover:text-[#E8A838] text-gray-600 dark:text-white/50 text-[11px] rounded-lg transition-all border border-transparent hover:border-[#E8A838]/20">
                        {chip}
                      </button>
                    ))}
                  </div>

                  <button onClick={applyModification} disabled={modifying || !modifyPrompt.trim()}
                    className="mt-3 w-full flex items-center justify-center gap-2 bg-[#0A0A0A] dark:bg-white/[0.08] hover:bg-[#1a1a1a] dark:hover:bg-white/[0.12] disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-xl text-[13px] transition-all">
                    {modifying ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {modifying ? 'Modification…' : 'Appliquer'}
                  </button>
                </div>
              )}

              {/* ── Section Manager ───────────────────────────────────────── */}
              {html && sections.length > 0 && (
                <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/[0.08] rounded-2xl p-4 flex-shrink-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/30 mb-2.5">Sections</p>

                  <div className="space-y-1">
                    {sections.map((sec, idx) => (
                      <div key={idx}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-white/[0.04] rounded-xl border border-gray-200 dark:border-white/[0.06] hover:border-[#E8A838]/20 transition-all group">
                        <span className="flex-1 text-[12px] text-gray-700 dark:text-white/70 truncate">{sec.name}</span>
                        <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => moveSection(idx, -1)} disabled={idx === 0}
                            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white disabled:opacity-30 transition rounded">
                            <ChevronUp size={12} />
                          </button>
                          <button onClick={() => moveSection(idx, 1)} disabled={idx === sections.length - 1}
                            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white disabled:opacity-30 transition rounded">
                            <ChevronDown size={12} />
                          </button>
                          <button onClick={() => toggleSection(sec)}
                            className={`w-6 h-6 flex items-center justify-center transition rounded ${sec.visible ? 'text-[#E8A838]' : 'text-gray-300 dark:text-white/20 hover:text-gray-500'}`}
                            title={sec.visible ? 'Masquer' : 'Afficher'}>
                            {sec.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                          </button>
                          <button onClick={() => deleteSection(sec)}
                            className="w-6 h-6 flex items-center justify-center text-gray-300 dark:text-white/20 hover:text-red-400 transition rounded">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add section */}
                  <div className="relative mt-3">
                    <button onClick={() => setAddSectionOpen(o => !o)} disabled={modifying}
                      className="flex items-center gap-1.5 text-[12px] text-gray-400 dark:text-white/30 hover:text-[#E8A838] border border-dashed border-gray-300 dark:border-white/20 hover:border-[#E8A838]/40 px-3 py-1.5 rounded-xl transition-all disabled:opacity-40">
                      <Plus size={12} /> Ajouter une section
                    </button>
                    {addSectionOpen && (
                      <div className="absolute left-0 top-10 z-10 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl p-2 flex flex-wrap gap-1 w-60">
                        {SECTION_TYPES.map(type => (
                          <button key={type} onClick={() => addSection(type)}
                            className="px-2.5 py-1.5 text-[12px] text-gray-700 dark:text-white/70 hover:bg-[#E8A838]/10 hover:text-[#E8A838] rounded-lg transition-all w-full text-left">
                            {type}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Style Controls ────────────────────────────────────────── */}
              {html && (
                <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/[0.08] rounded-2xl p-4 flex-shrink-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/30 mb-3">Style</p>

                  <div className="space-y-3">
                    {/* Primary color */}
                    <div>
                      <p className="text-[11px] text-gray-500 dark:text-white/40 mb-1.5 flex items-center gap-1.5">
                        <Palette size={10} /> Couleur principale
                      </p>
                      <div className="flex items-center gap-2">
                        <input type="color" value={styles.primaryColor}
                          onChange={e => setStyles(s => ({ ...s, primaryColor: e.target.value }))}
                          className="w-9 h-8 rounded-lg cursor-pointer border border-gray-200 dark:border-white/10 bg-transparent p-0.5" />
                        <span className="text-[11px] font-mono text-gray-500 dark:text-white/30">{styles.primaryColor.toUpperCase()}</span>
                      </div>
                    </div>

                    {/* Background color */}
                    <div>
                      <p className="text-[11px] text-gray-500 dark:text-white/40 mb-1.5 flex items-center gap-1.5">
                        <Palette size={10} /> Couleur de fond
                      </p>
                      <div className="flex items-center gap-2">
                        <input type="color" value={styles.bgColor}
                          onChange={e => setStyles(s => ({ ...s, bgColor: e.target.value }))}
                          className="w-9 h-8 rounded-lg cursor-pointer border border-gray-200 dark:border-white/10 bg-transparent p-0.5" />
                        <span className="text-[11px] font-mono text-gray-500 dark:text-white/30">{styles.bgColor.toUpperCase()}</span>
                      </div>
                    </div>

                    {/* Font */}
                    <div>
                      <p className="text-[11px] text-gray-500 dark:text-white/40 mb-1.5 flex items-center gap-1.5">
                        <Type size={10} /> Police
                      </p>
                      <select value={styles.fontFamily}
                        onChange={e => setStyles(s => ({ ...s, fontFamily: e.target.value }))}
                        className="w-full px-2.5 py-2 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-lg text-[12px] text-gray-900 dark:text-white focus:outline-none focus:border-[#E8A838]/60 transition">
                        {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button onClick={applyStyles}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-[#0A0A0A] dark:bg-white/[0.08] hover:bg-[#1a1a1a] dark:hover:bg-white/[0.12] text-white font-semibold px-3 py-2 rounded-xl text-[12px] transition-all">
                      <Check size={12} /> Appliquer
                    </button>
                    <button
                      onClick={() => setStyles({ primaryColor: '#E8A838', bgColor: '#0A0A0A', fontFamily: 'Inter' })}
                      className="px-3 py-2 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white text-[12px] rounded-xl transition-all">
                      Réinitialiser
                    </button>
                  </div>
                </div>
              )}

              {/* ── Code actions ──────────────────────────────────────────── */}
              {html && (
                <div className="flex gap-2 flex-shrink-0 pb-3">
                  <button
                    onClick={() => { const b = new Blob([html], { type: 'text/html' }); window.open(URL.createObjectURL(b), '_blank') }}
                    className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white/10 px-3 py-2 rounded-xl transition-all">
                    <ExternalLink size={12} /> Ouvrir
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(html); toast.success('Code copié') }}
                    className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white/10 px-3 py-2 rounded-xl transition-all">
                    <Copy size={12} /> Copier le code
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT PANEL — Live iframe preview */}
            <div className={`flex-1 min-w-0 flex flex-col ${html && mobileView === 'editor' ? 'hidden lg:flex' : 'flex'}`}>
              <div className="flex-1 bg-white dark:bg-[#111] border border-gray-200 dark:border-white/[0.08] rounded-2xl overflow-hidden relative">

                {/* Empty state */}
                {!html && !generating && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                    <div className="w-16 h-16 rounded-2xl bg-[#E8A838]/10 flex items-center justify-center mb-4">
                      <Wand2 size={28} className="text-[#E8A838]" />
                    </div>
                    <p className="text-gray-500 dark:text-white/30 text-[14px] font-semibold mb-2">Aperçu du site</p>
                    <p className="text-gray-400 dark:text-white/20 text-[12px] max-w-xs leading-relaxed">
                      Générez un site avec l'IA, puis cliquez sur n'importe quel élément du site pour le modifier directement.
                    </p>
                  </div>
                )}

                {/* Loading overlay */}
                {(generating || modifying) && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 rounded-2xl">
                    <Loader2 size={36} className="animate-spin text-[#E8A838] mb-3" />
                    <p className="text-white font-medium text-[13px]">
                      {generating ? 'Claude génère votre site…' : 'Application en cours…'}
                    </p>
                    <p className="text-white/40 text-[11px] mt-1">Cela peut prendre 10–30 secondes</p>
                  </div>
                )}

                {/* iframe */}
                {html && (
                  <iframe
                    ref={iframeRef}
                    srcDoc={srcdoc}
                    title="Aperçu du site"
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin allow-forms"
                  />
                )}

                {/* Click-to-edit floating panel */}
                {editPanel && (
                  <div className="absolute inset-x-3 bottom-3 bg-white dark:bg-[#1a1a1a] border border-[#E8A838]/40 rounded-2xl p-4 shadow-2xl z-20">
                    <div className="flex items-start justify-between mb-2.5">
                      <div>
                        <p className="text-[12px] font-semibold text-gray-900 dark:text-white">
                          Modifier — <span className="text-[#E8A838]">{editPanel.tag?.toLowerCase()}</span>
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-white/30">Entrée ou ✓ pour confirmer</p>
                      </div>
                      <button onClick={() => setEditPanel(null)}
                        className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition ml-4 mt-0.5">
                        <X size={15} />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveEdit()}
                      autoFocus
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/10 rounded-xl text-[13px] text-gray-900 dark:text-white focus:outline-none focus:border-[#E8A838]/60 focus:ring-2 focus:ring-[#E8A838]/20 transition"
                    />
                    <div className="flex gap-2 mt-3">
                      <button onClick={saveEdit}
                        className="flex items-center gap-1.5 bg-[#E8A838] hover:bg-[#d4952a] text-[#0A0A0A] font-bold px-4 py-2 rounded-xl text-[12px] transition-all active:scale-95">
                        <Check size={13} /> Confirmer
                      </button>
                      <button onClick={() => setEditPanel(null)}
                        className="px-4 py-2 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white text-[12px] rounded-xl transition-all">
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Publish bar ──────────────────────────────────────────────────── */}
          {html && (
            <div className="flex-shrink-0 bg-[#0A0A0A] dark:bg-[#111] border border-white/[0.08] rounded-2xl px-5 py-3.5 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-[13px]">
                  Publier sur <span className="text-[#E8A838]">{slug}.archicrm.ma</span>
                </p>
                {publishedAt && (
                  <p className="text-white/30 text-[11px] mt-0.5">
                    Dernière publication : {publishedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {publishedUrl && (
                  <a href={publishedUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[12px] text-[#E8A838] border border-[#E8A838]/30 px-3 py-2 rounded-xl hover:bg-[#E8A838]/10 transition-all whitespace-nowrap">
                    <ExternalLink size={12} /> Ouvrir le site
                  </a>
                )}
                <button onClick={publish} disabled={publishing}
                  className="flex items-center gap-2 bg-[#E8A838] hover:bg-[#d4952a] disabled:opacity-50 text-[#0A0A0A] font-bold px-5 py-2.5 rounded-xl text-[13px] transition-all active:scale-95 whitespace-nowrap">
                  {publishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {publishing ? 'Publication…' : 'Publier'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
