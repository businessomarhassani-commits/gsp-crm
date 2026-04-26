import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import {
  Globe, Mic, MicOff, Wand2, ExternalLink, Send, Settings, Loader2,
  CheckCircle, RefreshCw, ChevronDown, ChevronUp, Plus, X, Check,
  Copy, Monitor, Smartphone, Tablet, Sparkles,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────
const PALETTES = [
  { id: 1, name: 'Prestige Noir & Or',  bg: '#0A0A0A', accent: '#E8A838', text: '#FFFFFF' },
  { id: 2, name: 'Blanc Minimaliste',   bg: '#FFFFFF', accent: '#1A1A1A', text: '#333333' },
  { id: 3, name: 'Bleu Marine Pro',     bg: '#0D1B2A', accent: '#4A90D9', text: '#FFFFFF' },
  { id: 4, name: 'Sable & Terre',       bg: '#F5F0E8', accent: '#8B6914', text: '#2C1810' },
  { id: 5, name: 'Vert Olive Luxe',     bg: '#1C2016', accent: '#8B9E4A', text: '#FFFFFF' },
  { id: 6, name: 'Gris Anthracite',     bg: '#2C2C2C', accent: '#C0C0C0', text: '#FFFFFF' },
  { id: 7, name: 'Bordeaux Élégant',    bg: '#1A0A0A', accent: '#8B1A1A', text: '#F5E6E0' },
  { id: 8, name: 'Blanc & Or Rose',     bg: '#FAF7F2', accent: '#C9956C', text: '#2C2416' },
]

const DEVICE_WIDTHS = { desktop: '100%', tablet: '768px', mobile: '375px' }
const VOICE_LANGS   = ['ar', 'fr-FR', 'en-US']

const MODIFY_CHIPS = [
  'Rends le hero plus accrocheur',
  'Ajoute plus de sections',
  'Texte plus court',
  'Ajoute des témoignages',
  'Change le style',
]

const DEFAULT_PRESET_QUESTIONS = [
  { id: 'name',         label: 'Nom complet',                    type: 'text',   required: true,  locked: true,  enabled: true,  options: [] },
  { id: 'phone',        label: 'Numéro de téléphone',            type: 'tel',    required: true,  locked: true,  enabled: true,  options: [] },
  { id: 'project_type', label: 'Type de projet',                 type: 'select', required: true,  locked: false, enabled: true,  options: ['Résidentiel', 'Commercial', 'Rénovation', 'Extension', 'Autre'] },
  { id: 'city',         label: 'Ville',                          type: 'text',   required: false, locked: false, enabled: true,  options: [] },
  { id: 'email',        label: 'Email',                          type: 'email',  required: false, locked: false, enabled: false, options: [] },
  { id: 'budget',       label: 'Budget estimé',                  type: 'select', required: false, locked: false, enabled: false, options: ['< 200 000 DH', '200 000 – 500 000 DH', '500 000 – 1M DH', '> 1M DH'] },
  { id: 'surface',      label: 'Surface approximative (m²)',     type: 'number', required: false, locked: false, enabled: false, options: [] },
  { id: 'timeline',     label: 'Délai souhaité',                 type: 'select', required: false, locked: false, enabled: false, options: ['< 3 mois', '3–6 mois', '6–12 mois', '> 1 an'] },
  { id: 'how_found',    label: 'Comment nous avez-vous connus ?', type: 'select', required: false, locked: false, enabled: false, options: ['Bouche à oreille', 'Google', 'Facebook', 'Instagram', 'Autre'] },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function slugify(str) {
  return (str || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

// Apply palette to base HTML: string replace default colors + inject override CSS
function applyPaletteToHtml(html, palette) {
  let result = html
    .replace(/#0A0A0A/gi, palette.bg)
    .replace(/#E8A838/gi, palette.accent)
    // Remove any previous palette override
    .replace(/<style id="__palette_override">[\s\S]*?<\/style>\n?/i, '')

  const override = `<style id="__palette_override">
body{background-color:${palette.bg}!important;color:${palette.text}!important}
</style>\n`
  if (result.includes('</head>')) return result.replace('</head>', override + '</head>')
  return override + result
}

// Inject click-to-edit script into srcdoc (NOT saved to published HTML)
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

function buildVitrinePrompt(d) {
  return `Generate a premium, conversion-optimized Site Vitrine for ${d.name}, a professional architect based in ${d.cities?.join(', ') || 'Casablanca'}, Morocco.

Brand Identity:
- Architect name: ${d.name}
- Specializations: ${d.projectTypes?.join(', ') || 'residential architecture'}
- Cities served: ${d.cities?.join(', ') || 'Casablanca'}
- Portfolio: ${d.clientsCount} completed projects
- API endpoint for leads: POST https://app.archicrm.ma/api/leads/external with X-API-Key: ${d.apiKey}

Design Requirements:
- Style: Luxury architectural firm aesthetic
- Color scheme: Dark (#0A0A0A) background with gold (#E8A838) accents
- Typography: Inter for body, elegant serif for headings
- Layout: Full-width sections, generous whitespace, premium feel
- Mobile: Fully responsive, touch-optimized

Include these sections:
1. Hero: Strong headline showcasing expertise (not just the name)
2. About: Personal story, philosophy, credentials
3. Services: Résidentiel, Commercial, Rénovation (based on specializations)
4. Portfolio: Beautiful grid with Unsplash architecture placeholder images
5. Testimonials: 2-3 realistic Moroccan client names and quotes
6. Contact: Form that POSTs JSON to https://app.archicrm.ma/api/leads/external with X-API-Key header

Quality: Premium Moroccan architecture firm website. Make it look like it cost 50,000 DH to build.

Return ONLY complete valid HTML. No markdown, no backticks, no explanations. Start with <!DOCTYPE html>`
}

function buildLandingPrompt(d, enabledFields) {
  const fieldsList = enabledFields.map(f => {
    if (f.type === 'select' && f.options?.length) return `- ${f.label} (dropdown: ${f.options.join(', ')})`
    if (f.type === 'textarea') return `- ${f.label} (long text area)`
    if (f.type === 'boolean') return `- ${f.label} (yes/no radio buttons)`
    return `- ${f.label} (${f.type} input)`
  }).join('\n')

  return `You are an expert conversion rate optimizer and web developer specializing in high-converting lead generation pages for Moroccan architecture firms. Generate a complete, self-contained HTML landing page that converts visitors into leads.

Architect: ${d.name}, based in ${d.cities?.[0] || 'Casablanca'}, specializing in ${d.projectTypes?.join(', ') || 'architecture'}.
Portfolio: ${d.clientsCount} completed projects.

The page MUST include:
1. Hero: Urgent, benefit-focused headline (NOT just the architect's name), strong subheadline, immediate CTA button
2. Pain points: 3 problems the prospect has without a professional architect
3. Benefits: 3-4 key benefits of working with this architect
4. Social proof: 2-3 realistic Moroccan testimonials with avatar photos (https://ui-avatars.com/api/?name=NAME&background=E8A838&color=000&size=80)
5. Lead capture form with EXACTLY these fields — no more, no less:
${fieldsList}
6. Trust signals: years of experience, ${d.clientsCount} projects, satisfaction guarantee
7. Urgency: limited availability this month
8. Minimal footer

Design: Mobile-first, dark (#0A0A0A) background, gold (#E8A838) accents, Inter font from Google Fonts.
Form submission: POST to https://app.archicrm.ma/api/leads/external with header X-API-Key: ${d.apiKey}, send all form fields as JSON.
On successful submission: hide form, show in gold: 'Merci ! Nous vous contacterons dans les 24h.'

Return ONLY complete valid HTML. No markdown, no backticks, no explanations. Start with <!DOCTYPE html>`
}

function buildEnabledFields(presetQuestions, customQuestions) {
  return [
    ...presetQuestions.filter(q => q.enabled),
    ...customQuestions,
  ]
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ enabled, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none
        ${enabled ? 'bg-[#E8A838]' : 'bg-gray-300 dark:bg-white/[0.15]'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition duration-200
        ${enabled ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  )
}

// ─── Form Builder ─────────────────────────────────────────────────────────────
function FormBuilder({ presetQuestions, setPresetQuestions, customQuestions, setCustomQuestions }) {
  const [showAdd, setShowAdd] = useState(false)
  const [newQ, setNewQ] = useState({ label: '', type: 'text', options: '', required: false })

  const addCustomQuestion = () => {
    if (!newQ.label.trim()) return
    setCustomQuestions(prev => [...prev, {
      id: `custom-${Date.now()}`,
      label: newQ.label.trim(),
      type: newQ.type,
      options: newQ.type === 'select' ? newQ.options.split(',').map(o => o.trim()).filter(Boolean) : [],
      required: newQ.required,
    }])
    setNewQ({ label: '', type: 'text', options: '', required: false })
    setShowAdd(false)
  }

  const moveCustomQ = (idx, dir) => {
    setCustomQuestions(prev => {
      const arr = [...prev]
      const ni = idx + dir
      if (ni < 0 || ni >= arr.length) return prev
      ;[arr[idx], arr[ni]] = [arr[ni], arr[idx]]
      return arr
    })
  }

  return (
    <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/[0.08] rounded-2xl p-4">
      <div className="mb-3">
        <p className="text-[12px] font-semibold text-gray-900 dark:text-white">Questions du formulaire</p>
        <p className="text-[11px] text-gray-400 dark:text-white/30 mt-0.5">Personnalisez les questions posées à vos prospects</p>
      </div>

      {/* Preset questions */}
      <div className="space-y-1.5 mb-3">
        {presetQuestions.map(q => (
          <div key={q.id}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl border transition-all
              ${q.enabled ? 'bg-[#E8A838]/5 border-[#E8A838]/20' : 'bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.06]'}`}>
            <span className={`flex-1 text-[12px] font-medium truncate ${q.enabled ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-white/30'}`}>
              {q.label}
              {q.locked && <span className="ml-1 text-[10px] text-gray-400 dark:text-white/20">(requis)</span>}
            </span>
            <Toggle
              enabled={q.enabled}
              onChange={v => setPresetQuestions(prev => prev.map(p => p.id === q.id ? { ...p, enabled: v } : p))}
              disabled={q.locked}
            />
          </div>
        ))}
      </div>

      {/* Custom questions */}
      {customQuestions.length > 0 && (
        <div className="space-y-1.5 mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/30 px-1">Questions personnalisées</p>
          {customQuestions.map((q, idx) => (
            <div key={q.id} className="flex items-center gap-2 px-3 py-2 bg-[#E8A838]/5 border border-[#E8A838]/20 rounded-xl">
              <span className="flex-1 text-[12px] font-medium text-gray-900 dark:text-white truncate">{q.label}</span>
              <span className="text-[10px] text-gray-400 dark:text-white/30 shrink-0">{q.type}</span>
              <div className="flex gap-0.5 shrink-0">
                <button onClick={() => moveCustomQ(idx, -1)} disabled={idx === 0}
                  className="w-5 h-5 flex items-center justify-center text-gray-300 hover:text-gray-600 dark:hover:text-white disabled:opacity-30">
                  <ChevronUp size={10} />
                </button>
                <button onClick={() => moveCustomQ(idx, 1)} disabled={idx === customQuestions.length - 1}
                  className="w-5 h-5 flex items-center justify-center text-gray-300 hover:text-gray-600 dark:hover:text-white disabled:opacity-30">
                  <ChevronDown size={10} />
                </button>
                <button onClick={() => setCustomQuestions(prev => prev.filter(c => c.id !== q.id))}
                  className="w-5 h-5 flex items-center justify-center text-gray-300 hover:text-red-400">
                  <X size={10} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add custom question form */}
      {showAdd ? (
        <div className="border border-[#E8A838]/30 rounded-xl p-3 space-y-2 bg-[#E8A838]/5">
          <input
            type="text"
            value={newQ.label}
            onChange={e => setNewQ(p => ({ ...p, label: e.target.value }))}
            placeholder="Ex: Avez-vous déjà un terrain ?"
            autoFocus
            className="w-full px-3 py-2 bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg text-[12px] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#E8A838]/60 transition"
          />
          <div className="flex gap-2 items-center">
            <select value={newQ.type} onChange={e => setNewQ(p => ({ ...p, type: e.target.value }))}
              className="flex-1 px-2.5 py-2 bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg text-[12px] text-gray-900 dark:text-white focus:outline-none focus:border-[#E8A838]/60 transition">
              <option value="text">Texte court</option>
              <option value="textarea">Texte long</option>
              <option value="boolean">Oui / Non</option>
              <option value="select">Liste de choix</option>
            </select>
            <label className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-white/40 cursor-pointer whitespace-nowrap">
              <input type="checkbox" checked={newQ.required} onChange={e => setNewQ(p => ({ ...p, required: e.target.checked }))}
                className="accent-[#E8A838]" />
              Requis
            </label>
          </div>
          {newQ.type === 'select' && (
            <input
              type="text"
              value={newQ.options}
              onChange={e => setNewQ(p => ({ ...p, options: e.target.value }))}
              placeholder="Option 1, Option 2, Option 3"
              className="w-full px-3 py-2 bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg text-[12px] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#E8A838]/60 transition"
            />
          )}
          <div className="flex gap-2">
            <button onClick={addCustomQuestion} disabled={!newQ.label.trim()}
              className="flex items-center gap-1.5 bg-[#E8A838] hover:bg-[#d4952a] disabled:opacity-50 text-[#0A0A0A] font-bold px-3 py-1.5 rounded-lg text-[12px] transition-all">
              <Check size={12} /> Ajouter
            </button>
            <button onClick={() => setShowAdd(false)}
              className="px-3 py-1.5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/40 text-[12px] rounded-lg hover:text-gray-700 dark:hover:text-white transition-all">
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)}
          className="flex items-center justify-center gap-1.5 text-[12px] text-gray-400 hover:text-[#E8A838] border border-dashed border-gray-300 dark:border-white/20 hover:border-[#E8A838]/40 px-3 py-2 rounded-xl transition-all w-full">
          <Plus size={12} /> Ajouter une question personnalisée
        </button>
      )}

      {/* Form mini preview */}
      {buildEnabledFields(presetQuestions, customQuestions).length > 0 && (
        <div className="mt-4 border-t border-gray-100 dark:border-white/[0.06] pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/30 mb-2">Aperçu du formulaire</p>
          <div className="space-y-2 max-h-44 overflow-y-auto">
            {buildEnabledFields(presetQuestions, customQuestions).map(q => (
              <div key={q.id} className="flex flex-col gap-0.5">
                <label className="text-[10px] font-medium text-gray-500 dark:text-white/40">{q.label}{q.required ? ' *' : ''}</label>
                {q.type === 'select'
                  ? <select disabled className="w-full px-2 py-1.5 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-lg text-[11px] text-gray-400"><option>Choisir…</option></select>
                  : q.type === 'textarea'
                  ? <textarea disabled rows={2} className="w-full px-2 py-1.5 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-lg text-[11px] resize-none" />
                  : q.type === 'boolean'
                  ? <div className="flex gap-4 text-[11px] text-gray-400"><label className="flex items-center gap-1"><input type="radio" disabled /> Oui</label><label className="flex items-center gap-1"><input type="radio" disabled /> Non</label></div>
                  : <input type={q.type} disabled placeholder={q.label} className="w-full px-2 py-1.5 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-lg text-[11px] text-gray-400" />
                }
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
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
        next[s.type] = { customDomain: s.custom_domain || '', metaPixelId: s.meta_pixel_id || '', googleTagId: s.google_tag_id || '', conversionApiToken: s.conversion_api_token || '' }
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
            {pub
              ? <div className="flex items-center gap-2 mb-4 text-green-500 text-[12px]"><CheckCircle size={14} /><span>Publié sur <a href={`https://${pub.slug}.archicrm.ma`} target="_blank" rel="noopener noreferrer" className="underline">{pub.slug}.archicrm.ma</a></span></div>
              : <p className="text-gray-400 dark:text-white/30 text-[12px] mb-4">Pas encore publié.</p>
            }
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

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Sites() {
  const { user } = useAuth()

  // UI state
  const [tab, setTab]               = useState('vitrine')
  const [mobileView, setMobileView] = useState('editor')
  const [deviceMode, setDeviceMode] = useState('desktop')
  const [promptExpanded, setPromptExpanded] = useState(false)

  // Data
  const [siteData, setSiteData]   = useState(null)
  const [published, setPublished] = useState([])
  const [loadingData, setLoadingData] = useState(true)

  // Editor
  const [html, setHtml]           = useState('')       // styled (with palette applied)
  const [htmlBase, setHtmlBase]   = useState('')       // raw AI output (original colors)
  const [generating, setGenerating] = useState(false)
  const [modifying, setModifying]   = useState(false)
  const [selectedPalette, setSelectedPalette] = useState(1)
  const [customPrompt, setCustomPrompt] = useState('')
  const [modifyPrompt, setModifyPrompt] = useState('')

  // Voice
  const [voiceRecording, setVoiceRecording] = useState(false)
  const [voiceTranscriptDisplay, setVoiceTranscriptDisplay] = useState('')
  const voiceRecRef = useRef(null)
  const voiceTranscriptRef = useRef('')   // final text accumulator (no stale-closure issue)
  const voiceManualStopRef = useRef(false) // true when user manually stops, so onend doesn't advance

  // Form builder (landing only)
  const [presetQuestions, setPresetQuestions] = useState(
    () => JSON.parse(JSON.stringify(DEFAULT_PRESET_QUESTIONS))
  )
  const [customQuestions, setCustomQuestions] = useState([])

  // Publish
  const [publishing, setPublishing]     = useState(false)
  const [publishedUrl, setPublishedUrl] = useState('')
  const [publishedAt, setPublishedAt]   = useState(null)

  // Click-to-edit
  const [editPanel, setEditPanel] = useState(null)
  const [editText, setEditText]   = useState('')

  const iframeRef = useRef(null)
  const srcdoc = html ? withEditorScript(html) : ''

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([api.get('/api/sites/my-data'), api.get('/api/sites/published')])
      .then(([d, p]) => {
        setSiteData(d.data)
        setPublished(p.data || [])
        setCustomPrompt(buildVitrinePrompt(d.data))
      })
      .catch(() => toast.error('Erreur lors du chargement'))
      .finally(() => setLoadingData(false))
  }, [])

  // ── Reset on tab change ────────────────────────────────────────────────────
  useEffect(() => {
    if (!siteData || tab === 'settings') return
    const fields = buildEnabledFields(presetQuestions, customQuestions)
    setCustomPrompt(tab === 'vitrine' ? buildVitrinePrompt(siteData) : buildLandingPrompt(siteData, fields))
    setHtml(''); setHtmlBase(''); setPublishedUrl(''); setEditPanel(null)
  }, [tab, siteData])

  // ── Rebuild landing prompt when form config changes ────────────────────────
  useEffect(() => {
    if (!siteData || tab !== 'landing') return
    const fields = buildEnabledFields(presetQuestions, customQuestions)
    setCustomPrompt(buildLandingPrompt(siteData, fields))
  }, [presetQuestions, customQuestions, siteData, tab])

  // ── Close edit panel on HTML change ───────────────────────────────────────
  useEffect(() => { setEditPanel(null) }, [html])

  // ── postMessage for click-to-edit ──────────────────────────────────────────
  useEffect(() => {
    const handler = e => {
      if (e.data?.type !== 'ELEMENT_CLICK') return
      setEditPanel(e.data); setEditText(e.data.text || '')
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  // ── Helpers ────────────────────────────────────────────────────────────────
  const currentPalette = PALETTES.find(p => p.id === selectedPalette) || PALETTES[0]

  // Store raw AI output in htmlBase, apply current palette to get html
  const handleGenerated = useCallback((rawHtml) => {
    const palette = PALETTES.find(p => p.id === selectedPalette) || PALETTES[0]
    setHtmlBase(rawHtml)
    setHtml(applyPaletteToHtml(rawHtml, palette))
    setMobileView('preview')
  }, [selectedPalette])

  // ── Palette apply ──────────────────────────────────────────────────────────
  const applyPalette = (palette) => {
    setSelectedPalette(palette.id)
    if (htmlBase) setHtml(applyPaletteToHtml(htmlBase, palette))
  }

  // ── Voice ──────────────────────────────────────────────────────────────────
  const generateFromVoice = useCallback(async (transcript) => {
    setGenerating(true)
    try {
      const { data } = await api.post('/api/sites/generate', { prompt: transcript, voice: true, type: tab })
      handleGenerated(data.html || '')
      toast.success('Site généré !')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la génération')
    } finally { setGenerating(false) }
  }, [handleGenerated, tab])

  // Stop recording manually → grab accumulated transcript and generate
  const stopVoice = useCallback(() => {
    voiceManualStopRef.current = true
    voiceRecRef.current?.stop()
    setVoiceRecording(false)
    const t = voiceTranscriptRef.current
    voiceTranscriptRef.current = ''
    setVoiceTranscriptDisplay('')
    if (t.trim()) generateFromVoice(t.trim())
  }, [generateFromVoice])

  const tryVoiceLang = useCallback((idx, SR) => {
    if (idx >= VOICE_LANGS.length) { setVoiceRecording(false); return }
    const rec = new SR()
    rec.lang = VOICE_LANGS[idx]
    rec.continuous = true      // keep listening until user manually stops
    rec.interimResults = true  // show live transcript while speaking
    voiceRecRef.current = rec
    let gotResult = false
    let advanced = false

    const advance = () => {
      if (advanced) return
      advanced = true
      if (idx + 1 < VOICE_LANGS.length) tryVoiceLang(idx + 1, SR)
      else setVoiceRecording(false)
    }

    rec.onresult = e => {
      // Accumulate all final results + show interim
      let finalText = ''
      let interimText = ''
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalText += e.results[i][0].transcript + ' '
          gotResult = true
        } else {
          interimText += e.results[i][0].transcript
        }
      }
      voiceTranscriptRef.current = finalText.trim()
      setVoiceTranscriptDisplay((finalText + interimText).trim())
    }

    rec.onerror = e => {
      if (['not-allowed', 'service-not-allowed'].includes(e.error)) {
        toast.error('Accès au microphone refusé')
        advanced = true
        setVoiceRecording(false)
        return
      }
      // language-not-supported or network error without any result → try next lang
      if (!gotResult) advance()
    }

    rec.onend = () => {
      // If the user manually stopped, generation is handled in stopVoice — don't advance
      if (voiceManualStopRef.current) return
      // Otherwise this was an unexpected end (timeout / error already fired) → advance
      if (!gotResult && !advanced) advance()
    }

    try { rec.start() } catch { setVoiceRecording(false) }
  }, [generateFromVoice])

  const startVoice = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { toast.error('Microphone non supporté par ce navigateur'); return }
    voiceManualStopRef.current = false
    voiceTranscriptRef.current = ''
    setVoiceTranscriptDisplay('')
    setVoiceRecording(true)
    tryVoiceLang(0, SR)
  }, [tryVoiceLang])

  // ── Generate from prompt ───────────────────────────────────────────────────
  const generateFromPrompt = async () => {
    if (!customPrompt.trim()) { toast.error('Entrez un prompt'); return }
    setGenerating(true)
    try {
      const { data } = await api.post('/api/sites/generate', { prompt: customPrompt, type: tab })
      handleGenerated(data.html || '')
      toast.success('Site généré !')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la génération')
    } finally { setGenerating(false) }
  }

  // ── AI Modify ──────────────────────────────────────────────────────────────
  const applyModification = async () => {
    if (!modifyPrompt.trim() || !htmlBase) return
    setModifying(true)
    try {
      const { data } = await api.post('/api/sites/modify', { html: htmlBase, instruction: modifyPrompt })
      handleGenerated(data.html || '')
      setModifyPrompt('')
      toast.success('Modification appliquée !')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la modification')
    } finally { setModifying(false) }
  }

  // ── Click-to-edit ──────────────────────────────────────────────────────────
  const saveEdit = () => {
    if (!editPanel) { setEditPanel(null); return }
    const esc = editPanel.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const rep = editText.trim() || editPanel.text
    setHtml(prev => prev.replace(new RegExp(esc), rep))
    setHtmlBase(prev => prev.replace(new RegExp(esc), rep))
    setEditPanel(null)
    toast.success('Texte modifié')
  }

  // ── Publish ────────────────────────────────────────────────────────────────
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
  const resetPrompt = () => {
    const fields = buildEnabledFields(presetQuestions, customQuestions)
    setCustomPrompt(tab === 'vitrine' ? buildVitrinePrompt(siteData) : buildLandingPrompt(siteData, fields))
  }

  if (loadingData) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 size={28} className="animate-spin text-[#E8A838]" />
    </div>
  )

  // ── Render ─────────────────────────────────────────────────────────────────
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
          {/* Mobile view toggle */}
          {html && (
            <div className="flex lg:hidden gap-0.5 bg-gray-100 dark:bg-white/[0.06] rounded-lg p-0.5">
              {[['editor', Monitor, 'Éditeur'], ['preview', Globe, 'Aperçu']].map(([v, Icon, label]) => (
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
          {/* Settings */}
          <button onClick={() => setTab(t => t === 'settings' ? 'vitrine' : 'settings')}
            className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${tab === 'settings' ? 'bg-[#E8A838] border-[#E8A838] text-[#0A0A0A]' : 'border-gray-200 dark:border-white/10 text-gray-400 hover:border-[#E8A838]/40 hover:text-[#E8A838]'}`}>
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* ── Settings full-width ──────────────────────────────────────────────── */}
      {tab === 'settings' ? (
        <SettingsTab published={published} />
      ) : (
        <>
          {/* ── Split screen ──────────────────────────────────────────────── */}
          <div className="flex gap-3" style={{ height: 'calc(100vh - 220px)', minHeight: 540 }}>

            {/* ═══ LEFT PANEL ══════════════════════════════════════════════════ */}
            <div className={`w-full lg:w-[38%] flex-shrink-0 flex flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-[#0d0d0d]
              ${html && mobileView === 'preview' ? 'hidden lg:flex' : 'flex'}`}>

              {/* Scrollable content area */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">

                {/* ── SECTION 1: Voice generation ─────────────────────────── */}
                <style>{`
                  @keyframes waveBar {
                    0%, 100% { transform: scaleY(0.25); }
                    50%       { transform: scaleY(1); }
                  }
                `}</style>
                <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/[0.08] rounded-2xl p-5 text-center">
                  {/* Mic / Stop button */}
                  <button
                    onClick={voiceRecording ? stopVoice : startVoice}
                    disabled={generating || modifying}
                    className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center transition-all
                      ${voiceRecording
                        ? 'bg-red-500 shadow-lg shadow-red-500/40 scale-110'
                        : 'bg-[#E8A838] hover:bg-[#d4952a] shadow-lg shadow-[#E8A838]/30 hover:scale-105 active:scale-95'}
                      disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {voiceRecording
                      ? <MicOff size={24} className="text-white" />
                      : <Mic size={24} className="text-[#0A0A0A]" />}
                  </button>

                  {/* Waveform bars (visible while recording) */}
                  {voiceRecording && (
                    <div className="flex items-center justify-center gap-[3px] h-7 mt-3">
                      {[0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8, 0.4, 0.7, 0.9].map((h, i) => (
                        <div
                          key={i}
                          className="w-[3px] rounded-full bg-red-400"
                          style={{
                            height: `${h * 24}px`,
                            animation: 'waveBar 0.7s ease-in-out infinite',
                            animationDelay: `${i * 70}ms`,
                          }}
                        />
                      ))}
                    </div>
                  )}

                  <p className="text-[13px] font-semibold text-gray-900 dark:text-white mt-3 mb-1">
                    {voiceRecording ? 'En écoute — parlez maintenant'
                      : generating ? 'Génération en cours…'
                      : 'Parlez pour générer'}
                  </p>

                  {/* Live transcript */}
                  {voiceRecording && voiceTranscriptDisplay && (
                    <p className="text-[11px] text-[#E8A838]/80 mt-1.5 px-3 max-h-10 overflow-hidden leading-relaxed italic">
                      &ldquo;{voiceTranscriptDisplay}&rdquo;
                    </p>
                  )}

                  {voiceRecording ? (
                    <p className="text-[11px] text-gray-400 dark:text-white/30 mt-1">
                      {voiceTranscriptDisplay ? 'Continuez à parler, puis cliquez Arrêter' : 'Darija, Français ou Anglais acceptés'}
                    </p>
                  ) : (
                    <p className="text-[11px] text-gray-400 dark:text-white/30">
                      {generating ? 'Génération en cours…' : 'Parlez en Darija, Français ou Anglais'}
                    </p>
                  )}

                  {/* Stop & generate button */}
                  {voiceRecording && (
                    <button
                      onClick={stopVoice}
                      className="mt-3 flex items-center gap-1.5 mx-auto bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 hover:border-red-500/60 rounded-xl px-4 py-2 text-[12px] font-semibold transition-all"
                    >
                      <MicOff size={13} />
                      Arrêter et générer
                    </button>
                  )}

                  {!voiceRecording && !generating && (
                    <p className="text-[11px] text-gray-300 dark:text-white/20 mt-3">ou générez avec un prompt détaillé ↓</p>
                  )}
                </div>

                {/* ── SECTION 2: Smart prompt (collapsible) ───────────────── */}
                <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/[0.08] rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setPromptExpanded(e => !e)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="text-[12px] font-semibold text-gray-700 dark:text-white/70 flex items-center gap-2">
                      <Wand2 size={13} className="text-[#E8A838]" />
                      Générer avec prompt détaillé
                    </span>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${promptExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {promptExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-white/[0.06] pt-3">
                      <textarea
                        value={customPrompt}
                        onChange={e => setCustomPrompt(e.target.value)}
                        rows={9}
                        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-xl text-[11px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20 focus:outline-none focus:border-[#E8A838]/60 focus:ring-2 focus:ring-[#E8A838]/20 transition resize-none leading-relaxed"
                      />
                      <div className="flex gap-2">
                        <button onClick={generateFromPrompt} disabled={generating || !customPrompt.trim()}
                          className="flex-1 flex items-center justify-center gap-2 bg-[#E8A838] hover:bg-[#d4952a] disabled:opacity-50 text-[#0A0A0A] font-bold px-4 py-2.5 rounded-xl text-[13px] transition-all active:scale-95">
                          {generating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                          {generating ? 'Génération…' : 'Générer'}
                        </button>
                        {siteData && (
                          <button onClick={resetPrompt} title="Réinitialiser le prompt"
                            className="w-9 h-9 flex items-center justify-center border border-gray-200 dark:border-white/10 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white transition-all">
                            <RefreshCw size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── SECTION 3: Color palette ────────────────────────────── */}
                <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/[0.08] rounded-2xl p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/30 mb-3">Palette de couleurs</p>
                  <div className="grid grid-cols-4 gap-2">
                    {PALETTES.map(palette => (
                      <button
                        key={palette.id}
                        onClick={() => applyPalette(palette)}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${
                          selectedPalette === palette.id
                            ? 'border-[#E8A838] bg-[#E8A838]/5 shadow-sm'
                            : 'border-transparent hover:border-gray-200 dark:hover:border-white/10'
                        }`}
                      >
                        <div className="flex gap-0.5">
                          {[palette.bg, palette.accent, palette.text].map((color, i) => (
                            <div key={i} className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/10" style={{ background: color }} />
                          ))}
                        </div>
                        <span className="text-[9px] text-gray-500 dark:text-white/30 text-center leading-tight line-clamp-2">{palette.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── SECTION 4: Quick AI edits (after generation) ─────────── */}
                {html && (
                  <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/[0.08] rounded-2xl p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/30 mb-2.5">Modifier avec l'IA</p>
                    <textarea
                      value={modifyPrompt}
                      onChange={e => setModifyPrompt(e.target.value)}
                      rows={2}
                      placeholder="Que voulez-vous modifier ?"
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-xl text-[12px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20 focus:outline-none focus:border-[#E8A838]/60 focus:ring-2 focus:ring-[#E8A838]/20 transition resize-none"
                    />
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

                {/* ── SECTION 5: Form builder (landing only) ───────────────── */}
                {tab === 'landing' && (
                  <FormBuilder
                    presetQuestions={presetQuestions}
                    setPresetQuestions={setPresetQuestions}
                    customQuestions={customQuestions}
                    setCustomQuestions={setCustomQuestions}
                  />
                )}
              </div>

              {/* ── Sticky publish bar ────────────────────────────────────── */}
              <div className="flex-shrink-0 border-t border-gray-200 dark:border-white/[0.08] p-3 bg-white dark:bg-[#111]">
                <div className="bg-[#0A0A0A] rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-white truncate">
                      <span className="text-[#E8A838]">{slug}</span>.archicrm.ma
                    </p>
                    {publishedAt && (
                      <p className="text-white/30 text-[10px] mt-0.5">
                        Publié à {publishedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {publishedUrl && (
                      <a href={publishedUrl} target="_blank" rel="noopener noreferrer"
                        className="w-8 h-8 flex items-center justify-center text-[#E8A838] hover:bg-[#E8A838]/10 rounded-lg transition-all">
                        <ExternalLink size={14} />
                      </a>
                    )}
                    <button onClick={publish} disabled={publishing || !html}
                      className="flex items-center gap-1.5 bg-[#E8A838] hover:bg-[#d4952a] disabled:opacity-40 text-[#0A0A0A] font-bold px-4 py-2 rounded-xl text-[12px] transition-all active:scale-95">
                      {publishing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                      {publishing ? '…' : 'Publier le site'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ RIGHT PANEL — Live Preview ══════════════════════════════════ */}
            <div className={`flex-1 min-w-0 flex flex-col gap-2 ${html && mobileView === 'editor' ? 'hidden lg:flex' : 'flex'}`}>

              {/* Preview controls bar */}
              <div className="flex items-center justify-between flex-shrink-0">
                {/* Device switcher */}
                <div className="flex gap-0.5 bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-xl p-1">
                  {[['desktop', Monitor, 'Bureau'], ['tablet', Tablet, 'Tablette'], ['mobile', Smartphone, 'Mobile']].map(([v, Icon, label]) => (
                    <button key={v} onClick={() => setDeviceMode(v)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${deviceMode === v ? 'bg-[#E8A838] text-[#0A0A0A]' : 'text-gray-400 hover:text-gray-700 dark:hover:text-white'}`}>
                      <Icon size={12} />
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  ))}
                </div>
                {/* Actions */}
                <div className="flex gap-1.5">
                  {html && (
                    <>
                      <button
                        onClick={() => { const b = new Blob([html], { type: 'text/html' }); window.open(URL.createObjectURL(b), '_blank') }}
                        className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white/10 px-2.5 py-1.5 rounded-lg transition-all">
                        <ExternalLink size={11} /> Ouvrir
                      </button>
                      <button
                        onClick={() => { navigator.clipboard.writeText(html); toast.success('Code copié') }}
                        className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white/10 px-2.5 py-1.5 rounded-lg transition-all">
                        <Copy size={11} /> Copier le HTML
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* iframe area */}
              <div className="flex-1 bg-gray-100 dark:bg-[#0a0a0a] rounded-2xl overflow-hidden flex items-start justify-center relative">

                {/* Empty state */}
                {!html && !generating && !voiceRecording && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                    <div className="w-16 h-16 rounded-2xl bg-[#E8A838]/10 flex items-center justify-center mb-4">
                      <Mic size={28} className="text-[#E8A838]" />
                    </div>
                    <p className="text-gray-500 dark:text-white/30 text-[14px] font-semibold mb-2">Prêt à générer</p>
                    <p className="text-gray-400 dark:text-white/20 text-[12px] max-w-xs leading-relaxed">
                      Cliquez sur le micro et décrivez votre site en Darija, Français ou Anglais.
                      Ou utilisez le prompt détaillé pour plus de contrôle.
                    </p>
                  </div>
                )}

                {/* Voice recording state overlay */}
                {voiceRecording && !html && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-2xl">
                    <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center animate-pulse mb-4">
                      <Mic size={32} className="text-red-400" />
                    </div>
                    <p className="text-white font-semibold text-[15px]">En écoute…</p>
                    <p className="text-white/40 text-[12px] mt-1">Parlez maintenant</p>
                  </div>
                )}

                {/* Loading overlay */}
                {(generating || modifying) && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 rounded-2xl">
                    <Loader2 size={36} className="animate-spin text-[#E8A838] mb-3" />
                    <p className="text-white font-medium text-[13px]">
                      {generating ? 'Génération en cours…' : 'Application en cours…'}
                    </p>
                    <p className="text-white/40 text-[11px] mt-1">10–30 secondes</p>
                  </div>
                )}

                {/* iframe with device width constraint */}
                {html && (
                  <div className="w-full h-full flex items-start justify-center overflow-auto">
                    <div
                      className="h-full transition-all duration-300 shadow-2xl"
                      style={{ width: DEVICE_WIDTHS[deviceMode], minWidth: deviceMode !== 'desktop' ? DEVICE_WIDTHS[deviceMode] : undefined }}
                    >
                      <iframe
                        ref={iframeRef}
                        srcDoc={srcdoc}
                        title="Aperçu du site"
                        className="w-full h-full border-0 bg-white"
                        sandbox="allow-scripts allow-same-origin allow-forms"
                      />
                    </div>
                  </div>
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
                      <button onClick={() => setEditPanel(null)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition ml-4">
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
        </>
      )}
    </div>
  )
}
