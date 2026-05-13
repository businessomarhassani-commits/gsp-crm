import { useState, useEffect, useCallback } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import {
  ChevronDown, Save, Loader2, Plus, Trash2, ExternalLink,
  Layout, Wand2, Check, X,
} from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────
function tryParseJSON(str, fallback) {
  try { return JSON.parse(str) } catch { return fallback }
}

function flatToStructured(flat) {
  const get = (s, f) => flat[`${s}|${f}`] ?? ''

  const featureCount = Object.keys(flat).filter(k => k.startsWith('features|feature_') && k.endsWith('_title')).length
  const features = Array.from({ length: featureCount }, (_, i) => ({
    title: get('features', `feature_${i}_title`),
    desc: get('features', `feature_${i}_desc`),
    icon: get('features', `feature_${i}_icon`),
  }))

  const testimonialCount = Object.keys(flat).filter(k => k.startsWith('testimonials|testimonial_') && k.endsWith('_name')).length
  const testimonials = Array.from({ length: testimonialCount }, (_, i) => ({
    name: get('testimonials', `testimonial_${i}_name`),
    role: get('testimonials', `testimonial_${i}_role`),
    text: get('testimonials', `testimonial_${i}_text`),
    stars: Number(get('testimonials', `testimonial_${i}_stars`) || 5),
  }))

  const faqCount = Object.keys(flat).filter(k => k.startsWith('faq|faq_') && k.endsWith('_question')).length
  const faq = Array.from({ length: faqCount }, (_, i) => ({
    question: get('faq', `faq_${i}_question`),
    answer: get('faq', `faq_${i}_answer`),
  }))

  return {
    hero: {
      title: get('hero', 'title'),
      subtitle: get('hero', 'subtitle'),
      button_primary_text: get('hero', 'button_primary_text'),
      button_primary_link: get('hero', 'button_primary_link'),
      button_secondary_text: get('hero', 'button_secondary_text'),
      badge_urgency: get('hero', 'badge_urgency'),
    },
    features,
    pricing: {
      plan_name: get('pricing', 'plan_name'),
      price: get('pricing', 'price'),
      currency: get('pricing', 'currency'),
      badge_text: get('pricing', 'badge_text'),
      cta_text: get('pricing', 'cta_text'),
      features: tryParseJSON(get('pricing', 'features'), []),
    },
    testimonials,
    faq,
    cta: {
      headline: get('cta', 'headline'),
      subheadline: get('cta', 'subheadline'),
      button_text: get('cta', 'button_text'),
    },
  }
}

function structuredToFlat(structured) {
  const flat = {}
  Object.entries(structured.hero || {}).forEach(([k, v]) => { flat[`hero|${k}`] = String(v ?? '') })
  ;(structured.features || []).forEach((f, i) => {
    flat[`features|feature_${i}_title`] = f.title ?? ''
    flat[`features|feature_${i}_desc`] = f.desc ?? ''
    flat[`features|feature_${i}_icon`] = f.icon ?? 'Users'
  })
  const pf = structured.pricing || {}
  Object.entries(pf).forEach(([k, v]) => {
    flat[`pricing|${k}`] = k === 'features' ? JSON.stringify(v) : String(v ?? '')
  })
  ;(structured.testimonials || []).forEach((t, i) => {
    flat[`testimonials|testimonial_${i}_name`] = t.name ?? ''
    flat[`testimonials|testimonial_${i}_role`] = t.role ?? ''
    flat[`testimonials|testimonial_${i}_text`] = t.text ?? ''
    flat[`testimonials|testimonial_${i}_stars`] = String(t.stars ?? 5)
  })
  ;(structured.faq || []).forEach((f, i) => {
    flat[`faq|faq_${i}_question`] = f.question ?? ''
    flat[`faq|faq_${i}_answer`] = f.answer ?? ''
  })
  Object.entries(structured.cta || {}).forEach(([k, v]) => { flat[`cta|${k}`] = String(v ?? '') })
  return flat
}

// ── UI primitives ─────────────────────────────────────────────────────────────
const card = 'bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-white/5'
const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white text-[13px] focus:outline-none focus:ring-2 focus:ring-[#E8A838]/50 transition-all'
const labelCls = 'block text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5'
const goldBtn = 'flex items-center gap-2 bg-[#E8A838] hover:bg-[#d4952a] active:scale-95 text-[#0A0A0A] text-[13px] font-bold px-4 py-2 rounded-lg transition-all'

function Field({ label, value, saved, onChange, type = 'text', rows = 3 }) {
  return (
    <div className="space-y-1">
      <label className={labelCls}>{label}</label>
      {type === 'textarea' ? (
        <textarea
          className={`${inputCls} resize-y`}
          rows={rows}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      ) : (
        <input
          type="text"
          className={inputCls}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      )}
      {saved !== undefined && saved !== value && (
        <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
          Enregistré : {saved || <em>vide</em>}
        </p>
      )}
    </div>
  )
}

function AccordionCard({ title, defaultOpen = false, children, onSave, saving }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={`${card} overflow-hidden`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
      >
        <span className="font-semibold text-gray-900 dark:text-white text-[14px]">{title}</span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-100 dark:border-white/5 pt-4">
          {children}
          <button onClick={onSave} disabled={saving} className={goldBtn}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Enregistrer cette section
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminLandingEditor() {
  const [activeTab, setActiveTab] = useState('visual')
  const [content, setContent] = useState({})
  const [savedContent, setSavedContent] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)

  // AI tab state
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiDiff, setAiDiff] = useState(null) // { oldFlat, newFlat, changes }
  const [confirming, setConfirming] = useState(false)

  const loadContent = useCallback(async () => {
    try {
      const { data } = await api.get('/api/admin/landing-content')
      const flat = {}
      data.forEach(r => { flat[`${r.section}|${r.field}`] = r.value })
      setContent(flat)
      setSavedContent(flat)
    } catch {
      toast.error('Impossible de charger le contenu')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadContent() }, [loadContent])

  const get = (s, f) => content[`${s}|${f}`] ?? ''
  const set = (s, f, v) => setContent(c => ({ ...c, [`${s}|${f}`]: v }))
  const getSaved = (s, f) => savedContent[`${s}|${f}`]

  async function saveSection(section) {
    const updates = Object.entries(content)
      .filter(([k]) => k.startsWith(`${section}|`))
      .map(([k, v]) => ({ section, field: k.split('|')[1], value: v }))
    if (updates.length === 0) return

    setSaving(section)
    try {
      await api.put('/api/admin/landing-content', { updates })
      setSavedContent(prev => {
        const next = { ...prev }
        updates.forEach(u => { next[`${section}|${u.field}`] = u.value })
        return next
      })
      toast.success('Section sauvegardée !')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(null)
    }
  }

  // ── Feature helpers ───────────────────────────────────────────────────────
  function getFeatureCount() {
    return Object.keys(content).filter(k => k.startsWith('features|feature_') && k.endsWith('_title')).length
  }

  function addFeature() {
    const i = getFeatureCount()
    setContent(c => ({
      ...c,
      [`features|feature_${i}_title`]: '',
      [`features|feature_${i}_desc`]: '',
      [`features|feature_${i}_icon`]: 'Users',
    }))
  }

  function deleteFeature(index) {
    const count = getFeatureCount()
    const remaining = Array.from({ length: count }, (_, i) => i).filter(i => i !== index)
    setContent(c => {
      const next = { ...c }
      for (let i = 0; i < count; i++) {
        delete next[`features|feature_${i}_title`]
        delete next[`features|feature_${i}_desc`]
        delete next[`features|feature_${i}_icon`]
      }
      remaining.forEach((orig, newIdx) => {
        next[`features|feature_${newIdx}_title`] = c[`features|feature_${orig}_title`] ?? ''
        next[`features|feature_${newIdx}_desc`] = c[`features|feature_${orig}_desc`] ?? ''
        next[`features|feature_${newIdx}_icon`] = c[`features|feature_${orig}_icon`] ?? 'Users'
      })
      return next
    })
  }

  // ── Pricing features list helpers ─────────────────────────────────────────
  function getPricingFeatures() {
    return tryParseJSON(get('pricing', 'features'), [])
  }

  function setPricingFeatures(arr) {
    set('pricing', 'features', JSON.stringify(arr))
  }

  // ── FAQ helpers ───────────────────────────────────────────────────────────
  function getFaqCount() {
    return Object.keys(content).filter(k => k.startsWith('faq|faq_') && k.endsWith('_question')).length
  }

  function addFaq() {
    const i = getFaqCount()
    setContent(c => ({
      ...c,
      [`faq|faq_${i}_question`]: '',
      [`faq|faq_${i}_answer`]: '',
    }))
  }

  function deleteFaq(index) {
    const count = getFaqCount()
    const remaining = Array.from({ length: count }, (_, i) => i).filter(i => i !== index)
    setContent(c => {
      const next = { ...c }
      for (let i = 0; i < count; i++) {
        delete next[`faq|faq_${i}_question`]
        delete next[`faq|faq_${i}_answer`]
      }
      remaining.forEach((orig, newIdx) => {
        next[`faq|faq_${newIdx}_question`] = c[`faq|faq_${orig}_question`] ?? ''
        next[`faq|faq_${newIdx}_answer`] = c[`faq|faq_${orig}_answer`] ?? ''
      })
      return next
    })
  }

  // ── Testimonial helpers ───────────────────────────────────────────────────
  function getTestimonialCount() {
    return Object.keys(content).filter(k => k.startsWith('testimonials|testimonial_') && k.endsWith('_name')).length
  }

  // ── AI tab ────────────────────────────────────────────────────────────────
  async function handleAI() {
    if (!aiPrompt.trim()) { toast.error('Décrivez les modifications souhaitées'); return }
    setAiLoading(true)
    setAiDiff(null)
    try {
      const structured = flatToStructured(content)
      const { data } = await api.post('/api/admin/landing-ai', {
        content: structured,
        prompt: aiPrompt,
      })
      const newFlat = structuredToFlat(data.content)
      const changes = []
      const allKeys = new Set([...Object.keys(content), ...Object.keys(newFlat)])
      allKeys.forEach(k => {
        const oldVal = content[k] ?? ''
        const newVal = newFlat[k] ?? ''
        if (oldVal !== newVal) changes.push({ key: k, old: oldVal, new: newVal })
      })
      setAiDiff({ oldFlat: content, newFlat, changes })
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors de l'appel IA")
    } finally {
      setAiLoading(false)
    }
  }

  async function confirmAIChanges() {
    if (!aiDiff) return
    setConfirming(true)
    try {
      const updates = aiDiff.changes.map(({ key, new: newVal }) => {
        const [section, ...rest] = key.split('|')
        return { section, field: rest.join('|'), value: newVal }
      })
      await api.put('/api/admin/landing-content', { updates })
      setContent(aiDiff.newFlat)
      setSavedContent(prev => {
        const next = { ...prev }
        updates.forEach(u => { next[`${u.section}|${u.field}`] = u.value })
        return next
      })
      setAiDiff(null)
      setAiPrompt('')
      toast.success('Modifications IA appliquées !')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setConfirming(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-[#E8A838]" />
      </div>
    )
  }

  const featureCount = getFeatureCount()
  const faqCount = getFaqCount()
  const testimonialCount = getTestimonialCount()
  const pricingFeatures = getPricingFeatures()

  return (
    <div className="space-y-6 max-w-4xl pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
          <Layout size={22} className="text-[#E8A838]" />
          Éditeur Landing Page
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Modifiez votre page de vente en temps réel
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl w-fit">
        {[
          { id: 'visual', label: 'Éditeur Visuel', Icon: Layout },
          { id: 'ai', label: 'Prompt IA', Icon: Wand2 },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
              activeTab === id
                ? 'bg-white dark:bg-[#1a2332] text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: VISUAL EDITOR ─────────────────────────────────────────────── */}
      {activeTab === 'visual' && (
        <div className="space-y-3">

          {/* HERO */}
          <AccordionCard title="🦸 Hero" defaultOpen onSave={() => saveSection('hero')} saving={saving === 'hero'}>
            <Field label="Titre principal" type="textarea" rows={2}
              value={get('hero', 'title')} saved={getSaved('hero', 'title')}
              onChange={v => set('hero', 'title', v)} />
            <Field label="Sous-titre" type="textarea" rows={3}
              value={get('hero', 'subtitle')} saved={getSaved('hero', 'subtitle')}
              onChange={v => set('hero', 'subtitle', v)} />
            <Field label="Texte bouton principal"
              value={get('hero', 'button_primary_text')} saved={getSaved('hero', 'button_primary_text')}
              onChange={v => set('hero', 'button_primary_text', v)} />
            <Field label="Lien bouton principal"
              value={get('hero', 'button_primary_link')} saved={getSaved('hero', 'button_primary_link')}
              onChange={v => set('hero', 'button_primary_link', v)} />
            <Field label="Texte bouton secondaire"
              value={get('hero', 'button_secondary_text')} saved={getSaved('hero', 'button_secondary_text')}
              onChange={v => set('hero', 'button_secondary_text', v)} />
            <Field label="Badge urgence"
              value={get('hero', 'badge_urgency')} saved={getSaved('hero', 'badge_urgency')}
              onChange={v => set('hero', 'badge_urgency', v)} />
          </AccordionCard>

          {/* FEATURES */}
          <AccordionCard title="⚡ Fonctionnalités" onSave={() => saveSection('features')} saving={saving === 'features'}>
            <div className="space-y-6">
              {Array.from({ length: featureCount }, (_, i) => (
                <div key={i} className="relative p-4 bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-100 dark:border-white/5">
                  <div className="absolute top-3 right-3">
                    <button onClick={() => deleteFeature(i)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <p className="text-[11px] font-bold text-[#E8A838] uppercase tracking-wider mb-3">Feature {i + 1}</p>
                  <div className="space-y-3 pr-8">
                    <Field label="Titre"
                      value={get('features', `feature_${i}_title`)}
                      saved={getSaved('features', `feature_${i}_title`)}
                      onChange={v => set('features', `feature_${i}_title`, v)} />
                    <Field label="Description" type="textarea" rows={2}
                      value={get('features', `feature_${i}_desc`)}
                      saved={getSaved('features', `feature_${i}_desc`)}
                      onChange={v => set('features', `feature_${i}_desc`, v)} />
                    <Field label="Icône (ex: Users, Kanban, Zap, Bell, TrendingUp, BarChart2, Link2)"
                      value={get('features', `feature_${i}_icon`)}
                      saved={getSaved('features', `feature_${i}_icon`)}
                      onChange={v => set('features', `feature_${i}_icon`, v)} />
                  </div>
                </div>
              ))}
              <button onClick={addFeature}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-gray-300 dark:border-white/20 text-gray-500 dark:text-gray-400 hover:text-[#E8A838] hover:border-[#E8A838]/50 text-[13px] transition-colors w-full justify-center">
                <Plus size={14} />
                Ajouter une feature
              </button>
            </div>
          </AccordionCard>

          {/* PRICING */}
          <AccordionCard title="💰 Tarifs" onSave={() => saveSection('pricing')} saving={saving === 'pricing'}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nom du plan"
                value={get('pricing', 'plan_name')} saved={getSaved('pricing', 'plan_name')}
                onChange={v => set('pricing', 'plan_name', v)} />
              <Field label="Prix"
                value={get('pricing', 'price')} saved={getSaved('pricing', 'price')}
                onChange={v => set('pricing', 'price', v)} />
              <Field label="Devise"
                value={get('pricing', 'currency')} saved={getSaved('pricing', 'currency')}
                onChange={v => set('pricing', 'currency', v)} />
              <Field label="Badge (ex: Populaire)"
                value={get('pricing', 'badge_text')} saved={getSaved('pricing', 'badge_text')}
                onChange={v => set('pricing', 'badge_text', v)} />
            </div>
            <Field label="Texte CTA"
              value={get('pricing', 'cta_text')} saved={getSaved('pricing', 'cta_text')}
              onChange={v => set('pricing', 'cta_text', v)} />
            <div>
              <label className={labelCls}>Liste des features incluses</label>
              <div className="space-y-2">
                {pricingFeatures.map((feat, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="text" className={`${inputCls} flex-1`} value={feat}
                      onChange={e => {
                        const arr = [...pricingFeatures]
                        arr[i] = e.target.value
                        setPricingFeatures(arr)
                      }} />
                    <button onClick={() => {
                      const arr = [...pricingFeatures]
                      arr.splice(i, 1)
                      setPricingFeatures(arr)
                    }} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shrink-0">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                <button onClick={() => setPricingFeatures([...pricingFeatures, ''])}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-300 dark:border-white/20 text-gray-500 dark:text-gray-400 hover:text-[#E8A838] hover:border-[#E8A838]/50 text-[13px] transition-colors">
                  <Plus size={13} />
                  Ajouter un item
                </button>
              </div>
            </div>
          </AccordionCard>

          {/* TESTIMONIALS */}
          <AccordionCard title="💬 Témoignages" onSave={() => saveSection('testimonials')} saving={saving === 'testimonials'}>
            <div className="space-y-6">
              {Array.from({ length: testimonialCount }, (_, i) => (
                <div key={i} className="p-4 bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-100 dark:border-white/5 space-y-3">
                  <p className="text-[11px] font-bold text-[#E8A838] uppercase tracking-wider">Témoignage {i + 1}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Nom"
                      value={get('testimonials', `testimonial_${i}_name`)}
                      saved={getSaved('testimonials', `testimonial_${i}_name`)}
                      onChange={v => set('testimonials', `testimonial_${i}_name`, v)} />
                    <Field label="Rôle / Ville"
                      value={get('testimonials', `testimonial_${i}_role`)}
                      saved={getSaved('testimonials', `testimonial_${i}_role`)}
                      onChange={v => set('testimonials', `testimonial_${i}_role`, v)} />
                  </div>
                  <Field label="Citation" type="textarea" rows={3}
                    value={get('testimonials', `testimonial_${i}_text`)}
                    saved={getSaved('testimonials', `testimonial_${i}_text`)}
                    onChange={v => set('testimonials', `testimonial_${i}_text`, v)} />
                  <div>
                    <label className={labelCls}>Étoiles (1-5)</label>
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map(star => (
                        <button key={star}
                          onClick={() => set('testimonials', `testimonial_${i}_stars`, String(star))}
                          className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${
                            Number(get('testimonials', `testimonial_${i}_stars`)) >= star
                              ? 'bg-[#E8A838] text-[#0A0A0A]'
                              : 'bg-gray-100 dark:bg-white/10 text-gray-400'
                          }`}>
                          {star}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AccordionCard>

          {/* FAQ */}
          <AccordionCard title="❓ FAQ" onSave={() => saveSection('faq')} saving={saving === 'faq'}>
            <div className="space-y-4">
              {Array.from({ length: faqCount }, (_, i) => (
                <div key={i} className="relative p-4 bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-100 dark:border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-[#E8A838] uppercase tracking-wider">Question {i + 1}</p>
                    <button onClick={() => deleteFaq(i)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <Field label="Question"
                    value={get('faq', `faq_${i}_question`)}
                    saved={getSaved('faq', `faq_${i}_question`)}
                    onChange={v => set('faq', `faq_${i}_question`, v)} />
                  <Field label="Réponse" type="textarea" rows={3}
                    value={get('faq', `faq_${i}_answer`)}
                    saved={getSaved('faq', `faq_${i}_answer`)}
                    onChange={v => set('faq', `faq_${i}_answer`, v)} />
                </div>
              ))}
              <button onClick={addFaq}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-gray-300 dark:border-white/20 text-gray-500 dark:text-gray-400 hover:text-[#E8A838] hover:border-[#E8A838]/50 text-[13px] transition-colors w-full justify-center">
                <Plus size={14} />
                Ajouter une question
              </button>
            </div>
          </AccordionCard>

          {/* FINAL CTA */}
          <AccordionCard title="🚀 CTA Final" onSave={() => saveSection('cta')} saving={saving === 'cta'}>
            <Field label="Titre principal" type="textarea" rows={2}
              value={get('cta', 'headline')} saved={getSaved('cta', 'headline')}
              onChange={v => set('cta', 'headline', v)} />
            <Field label="Sous-titre" type="textarea" rows={2}
              value={get('cta', 'subheadline')} saved={getSaved('cta', 'subheadline')}
              onChange={v => set('cta', 'subheadline', v)} />
            <Field label="Texte bouton"
              value={get('cta', 'button_text')} saved={getSaved('cta', 'button_text')}
              onChange={v => set('cta', 'button_text', v)} />
          </AccordionCard>
        </div>
      )}

      {/* ── TAB 2: AI PROMPT ─────────────────────────────────────────────────── */}
      {activeTab === 'ai' && (
        <div className="space-y-4">
          <div className={`${card} p-6 space-y-4`}>
            <div>
              <label className={labelCls}>Décrivez les modifications souhaitées</label>
              <textarea
                className={`${inputCls} resize-y`}
                rows={6}
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="Ex: Rends le titre hero plus accrocheur et urgent. Améliore la description du pricing pour convaincre davantage."
              />
            </div>
            <button onClick={handleAI} disabled={aiLoading}
              className={`${goldBtn} w-full justify-center py-3`}>
              {aiLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  L'IA réfléchit…
                </>
              ) : (
                <>
                  <Wand2 size={16} />
                  Appliquer avec l'IA
                </>
              )}
            </button>
          </div>

          {/* AI Diff View */}
          {aiDiff && (
            <div className={`${card} p-6 space-y-4`}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white text-[15px]">
                  {aiDiff.changes.length} modification{aiDiff.changes.length > 1 ? 's' : ''} détectée{aiDiff.changes.length > 1 ? 's' : ''}
                </h3>
                <div className="flex gap-2">
                  <button onClick={() => setAiDiff(null)} disabled={confirming}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-red-500 hover:border-red-300 text-[13px] font-medium transition-colors">
                    <X size={13} />
                    Annuler
                  </button>
                  <button onClick={confirmAIChanges} disabled={confirming}
                    className={goldBtn}>
                    {confirming ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    Confirmer les changements
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {aiDiff.changes.map(({ key, old: oldVal, new: newVal }) => {
                  const [section, field] = key.split('|')
                  return (
                    <div key={key} className="rounded-xl overflow-hidden border border-gray-100 dark:border-white/5">
                      <div className="px-3 py-1.5 bg-gray-50 dark:bg-white/[0.03] border-b border-gray-100 dark:border-white/5">
                        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {section} › {field.replace(/_/g, ' ')}
                        </span>
                      </div>
                      {oldVal && (
                        <div className="px-3 py-2 bg-red-50 dark:bg-red-500/10 border-b border-red-100 dark:border-red-500/10">
                          <p className="text-[12px] text-red-600 dark:text-red-400 whitespace-pre-wrap line-through opacity-75">{oldVal}</p>
                        </div>
                      )}
                      <div className="px-3 py-2 bg-green-50 dark:bg-green-500/10">
                        <p className="text-[12px] text-green-700 dark:text-green-400 whitespace-pre-wrap">{newVal}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Floating preview button ───────────────────────────────────────────── */}
      <a
        href="https://crm.archi"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 flex items-center gap-2 bg-[#0A0A0A] hover:bg-[#1a1a1a] text-white text-[13px] font-medium px-4 py-3 rounded-xl shadow-xl shadow-black/20 transition-all hover:scale-105 z-50 border border-white/10"
      >
        <ExternalLink size={14} className="text-[#E8A838]" />
        Voir la landing page
      </a>
    </div>
  )
}
