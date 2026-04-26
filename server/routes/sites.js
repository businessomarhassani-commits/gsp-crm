const express = require('express')
const router = express.Router()
const supabase = require('../db')
const { auth } = require('../middleware/auth')

// ─── Helpers ──────────────────────────────────────────────────────────────────
function slugify(str) {
  return (str || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Always strip markdown code fences — unconditional, runs all three replaces
function stripFences(raw = '') {
  return raw
    .trim()
    .replace(/^```html\s*/i, '')   // leading ```html
    .replace(/^```\s*/i, '')        // leading ``` (if no 'html' tag)
    .replace(/```\s*$/i, '')        // trailing ```
    .trim()
}

// ─── GET /api/sites/my-data — architect data for prompt pre-fill ─────────────
router.get('/my-data', auth, async (req, res) => {
  try {
    const uid = req.user.id

    const [
      { data: userData },
      { data: leads },
      { data: clients },
    ] = await Promise.all([
      supabase.from('users').select('id, name, email, api_key, created_at').eq('id', uid).single(),
      supabase.from('leads').select('project_type, city, status').eq('user_id', uid),
      supabase.from('clients').select('id').eq('user_id', uid),
    ])

    const leadsCount = leads?.length || 0
    const wonCount = leads?.filter(l => l.status === 'Gagné').length || 0

    const projectTypes = [...new Set(leads?.map(l => l.project_type).filter(Boolean))].slice(0, 4)
    const cities = [...new Set(leads?.map(l => l.city).filter(Boolean))].slice(0, 3)
    const clientsCount = clients?.length || 0

    res.json({
      name: userData?.name || '',
      email: userData?.email || '',
      apiKey: userData?.api_key || '',
      slug: slugify(userData?.name || ''),
      leadsCount,
      wonCount,
      clientsCount,
      projectTypes: projectTypes.length ? projectTypes : ['résidentiel', 'commercial'],
      cities: cities.length ? cities : ['Casablanca'],
      memberSince: userData?.created_at,
    })
  } catch (err) {
    console.error('sites/my-data error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── System prompts ───────────────────────────────────────────────────────────
const SYSTEM_PROMPT_VITRINE = `You are an expert web developer. Generate a COMPLETE, fully-styled, self-contained HTML portfolio website for a Moroccan architect. Premium design.

DESIGN: Dark #0A0A0A background, gold #E8A838 accents, Inter font from Google Fonts (import in <head>), fully responsive with media queries. Use CSS custom properties: --gold: #E8A838; --dark: #0A0A0A; --card: #111111;

SECTIONS:
1. NAV: Fixed navbar, logo left (architect name in gold), links right (Accueil, A Propos, Services, Portfolio, Contact), gold CTA button 'Nous Contacter'
2. HERO: Full viewport height (100vh), architect name large, specialty and city, two CTAs (primary gold + secondary outline), animated scroll indicator, subtle gold gradient overlay
3. ABOUT: Two columns - text left (bio, philosophy, experience, diplomas), stats right (projects count, years, cities) with large gold numbers
4. SERVICES: 3-4 service cards with SVG icons, title, description. Dark cards (#111) with gold left border
5. PORTFOLIO: 6-card grid with images from Unsplash (https://source.unsplash.com/600x400/?architecture,morocco&sig=N where N=1..6), hover overlay showing project name
6. TESTIMONIALS: 3 cards with Moroccan client names, avatars (https://ui-avatars.com/api/?name=NAME&background=E8A838&color=000&size=80), 5 gold stars, quote, city
7. CONTACT: Two columns - form left (name, phone, email, project type dropdown, message, gold submit), contact info right
8. FOOTER: Dark minimal, architect name + tagline, copyright

CSS: Buttons border-radius 8px, padding 14px 28px, font-weight 600, transition 0.3s. Cards border-radius 12px, padding 24px. Sections 80px 20px desktop, 48px 16px mobile. Max-width 1200px centered. Smooth scroll. Fade-in animations via Intersection Observer.

Return ONLY complete HTML starting with <!DOCTYPE html>. No markdown. No backticks.`

const SYSTEM_PROMPT_LANDING = `You are an expert web developer and conversion rate optimizer. Generate a COMPLETE, fully-styled, self-contained HTML landing page for a Moroccan architecture firm. The page must look premium and professional with full CSS included.

DESIGN REQUIREMENTS:
- Dark background: #0A0A0A
- Gold accent color: #E8A838
- Font: Inter from Google Fonts (import in <head>)
- All sections have proper padding, margins, and spacing
- Mobile responsive with media queries
- Smooth scroll, hover effects on buttons and cards
- Fade-in animations via Intersection Observer
- CSS custom properties: --gold: #E8A838; --dark: #0A0A0A; --card: #111111;

MANDATORY SECTIONS:

1. HERO (100vh):
- Dark background with subtle gold gradient overlay
- Badge: 'ARCHITECTE AGREE MAROC' with gold border
- H1: Pain-focused headline in French
- Subheadline: benefit statement
- Two CTAs: primary gold 'Demander un devis gratuit' + secondary outline 'Voir nos realisations'
- Trust bar: 3 stats with large gold numbers

2. PROBLEMS (dark cards):
- Title: 'Vous reconnaissez-vous dans ces situations ?'
- 4 problem cards with red X icons, dark card #111, subtle red border

3. SOLUTION:
- Title: 'La Solution Professionnelle'
- 4 step cards with gold numbers 01-04, icon + title + description, gold left border

4. WHY US:
- Title: 'Pourquoi Nous Choisir ?'
- 6 feature cards in 3-col grid, gold checkmarks

5. TESTIMONIALS (3 cards):
- Moroccan names, avatars (https://ui-avatars.com/api/?name=NAME&background=E8A838&color=000&size=80)
- 5 gold stars, quote, city

6. LEAD CAPTURE FORM (most important):
- Dark card with gold border, max-width 600px centered
- Title: 'Obtenez Votre Consultation Gratuite'
- Subtitle: 'Repondez a ces questions et nous vous contactons sous 24h'
- Use EXACTLY the form fields listed in the user's prompt
- Full-width gold submit button 'Envoyer ma demande'
- Trust text: 'Gratuit | Sans engagement | Reponse sous 24h'
- On submit: POST JSON to API URL in prompt with X-API-Key header
- On success: hide form, show green: 'Merci ! Nous vous contactons dans les 24h.'

7. FOOTER: Dark minimal, architect name, copyright

CSS: Buttons border-radius 8px, padding 14px 28px, font-weight 600, transition 0.3s. Cards border-radius 12px, padding 24px. Sections 80px 20px desktop, 48px 16px mobile. Max-width 1200px centered. Form inputs: dark background #1a1a1a, gold border on focus, border-radius 8px, padding 14px.

Return ONLY complete HTML starting with <!DOCTYPE html>. No markdown. No backticks.`

const SYSTEM_PROMPT_VOICE = `You are an expert web developer. The user spoke in Moroccan Darija (Moroccan Arabic dialect mixed with French). Understand their intent fully even if the transcription is imperfect.

Common Darija words: bghit=I want, dir=make/do, zwin=beautiful, kbir=big, sghir=small, lmohandis=the architect, landing page=lead capture page, leads=prospects, chhal=how much/how many, wach=is/are, ana=I, nta=you, dyali=mine/my, dyal=of/for.

Extract their intent and generate a complete, professional, fully-styled, self-contained HTML website for a Moroccan architecture firm. Use dark elegant design (#0A0A0A background, #E8A838 gold accents), Inter font from Google Fonts, fully mobile responsive. Include: fixed navbar, hero (100vh), about, services, portfolio with images, testimonials, contact form. Full CSS with proper styling — cards, spacing, animations. Return ONLY the complete HTML starting with <!DOCTYPE html>. No markdown. No backticks.`

// ─── POST /api/sites/generate — call Anthropic Claude ────────────────────────
router.post('/generate', auth, async (req, res) => {
  const { prompt, voice, type } = req.body
  if (!prompt?.trim()) return res.status(400).json({ error: 'Prompt requis' })

  // Guard: API key must be configured
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('[sites/generate] ANTHROPIC_API_KEY is not set')
    return res.status(500).json({ error: 'Clé API Anthropic non configurée. Contactez l\'administrateur.' })
  }

  let anthropic
  try {
    const Anthropic = require('@anthropic-ai/sdk')
    anthropic = new Anthropic({ apiKey })
  } catch (initErr) {
    console.error('[sites/generate] Failed to init Anthropic SDK:', initErr.message)
    return res.status(500).json({ error: 'Erreur d\'initialisation du SDK Anthropic.' })
  }

  // Select system prompt: voice → Darija-aware, landing → conversion-focused, else vitrine
  let systemPrompt
  if (voice === true) systemPrompt = SYSTEM_PROMPT_VOICE
  else if (type === 'landing') systemPrompt = SYSTEM_PROMPT_LANDING
  else systemPrompt = SYSTEM_PROMPT_VITRINE
  // Try claude-sonnet-4-5 first, fall back to claude-opus-4-5
  const MODELS = ['claude-sonnet-4-5', 'claude-opus-4-5']
  let lastErr = null

  for (const model of MODELS) {
    try {
      console.log(`[sites/generate] Trying model: ${model} voice:${!!voice}`)
      const message = await anthropic.messages.create({
        model,
        max_tokens: 8000,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      })

      const html = stripFences(message.content[0]?.text || '')
      console.log(`[sites/generate] Success with ${model}, html length: ${html.length}`)
      return res.json({ html, model })
    } catch (err) {
      lastErr = err
      const status = err.status || err.statusCode
      console.error(`[sites/generate] Model ${model} failed — status:${status} type:${err.error?.type} msg:${err.message}`)

      // Only try the next model if this one was genuinely not found
      if (status !== 404 && err.error?.type !== 'not_found_error') break
    }
  }

  // Both models failed — return the real error to the frontend
  const status = lastErr?.status || lastErr?.statusCode || 500
  const userMessage = lastErr?.error?.type === 'authentication_error'
    ? 'Clé API Anthropic invalide. Vérifiez la configuration.'
    : lastErr?.error?.type === 'not_found_error'
    ? 'Modèle Claude non disponible. Contactez l\'administrateur.'
    : lastErr?.error?.message || lastErr?.message || 'Erreur lors de la génération du site'

  console.error('[sites/generate] All models failed. Last error:', lastErr?.message)
  return res.status(status >= 400 && status < 600 ? status : 500).json({ error: userMessage })
})

// ─── POST /api/sites/modify — AI-edit existing HTML ──────────────────────────
router.post('/modify', auth, async (req, res) => {
  const { html, instruction } = req.body
  if (!html || !instruction?.trim()) return res.status(400).json({ error: 'Données manquantes' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Clé API Anthropic non configurée.' })

  let anthropic
  try {
    const Anthropic = require('@anthropic-ai/sdk')
    anthropic = new Anthropic({ apiKey })
  } catch (initErr) {
    return res.status(500).json({ error: 'Erreur d\'initialisation du SDK Anthropic.' })
  }

  const MODELS = ['claude-sonnet-4-5', 'claude-opus-4-5']
  let lastErr = null

  for (const model of MODELS) {
    try {
      console.log(`[sites/modify] Trying model: ${model}`)
      const message = await anthropic.messages.create({
        model,
        max_tokens: 8000,
        system: `You are editing an existing HTML website. The user will describe a change. Apply ONLY the requested change to the HTML and return the complete updated HTML. Preserve all existing content, styles, and structure not mentioned in the change. Return ONLY the complete HTML code, nothing else, no explanations, no markdown fences.`,
        messages: [{ role: 'user', content: `Current HTML:\n${html}\n\nChange requested: ${instruction}` }],
      })
      const updatedHtml = stripFences(message.content[0]?.text || '')
      console.log(`[sites/modify] Success with ${model}, length: ${updatedHtml.length}`)
      return res.json({ html: updatedHtml, model })
    } catch (err) {
      lastErr = err
      const status = err.status || err.statusCode
      console.error(`[sites/modify] Model ${model} failed — status:${status} msg:${err.message}`)
      if (status !== 404 && err.error?.type !== 'not_found_error') break
    }
  }

  const status = lastErr?.status || 500
  const userMessage = lastErr?.error?.message || lastErr?.message || 'Erreur lors de la modification'
  return res.status(status >= 400 && status < 600 ? status : 500).json({ error: userMessage })
})

// ─── POST /api/sites/publish — save to Supabase ──────────────────────────────
router.post('/publish', auth, async (req, res) => {
  try {
    const { html, type, slug } = req.body
    const uid = req.user.id

    if (!html || !type || !slug) return res.status(400).json({ error: 'Données manquantes' })
    if (!['vitrine', 'landing'].includes(type)) return res.status(400).json({ error: 'Type invalide' })

    // Always strip fences before saving — regardless of where the HTML came from
    const cleanHtml = stripFences(html)

    const { error } = await supabase.from('architect_sites').upsert(
      { user_id: uid, slug, type, html_content: cleanHtml, published_at: new Date().toISOString(), is_active: true },
      { onConflict: 'user_id,type' }
    )
    if (error) throw error

    res.json({ url: `https://${slug}.archicrm.ma`, slug })
  } catch (err) {
    console.error('sites/publish error:', err)
    res.status(500).json({ error: 'Erreur lors de la publication' })
  }
})

// ─── PUT /api/sites/settings — update tracking settings ──────────────────────
router.put('/settings', auth, async (req, res) => {
  try {
    const { type, customDomain, metaPixelId, googleTagId, conversionApiToken } = req.body
    const uid = req.user.id

    const { error } = await supabase.from('architect_sites')
      .update({ custom_domain: customDomain, meta_pixel_id: metaPixelId, google_tag_id: googleTagId, conversion_api_token: conversionApiToken })
      .eq('user_id', uid)
      .eq('type', type || 'vitrine')
    if (error) throw error

    res.json({ ok: true })
  } catch (err) {
    console.error('sites/settings error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── GET /api/sites/published — get user's published sites ───────────────────
router.get('/published', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('architect_sites')
      .select('id, slug, type, published_at, is_active, custom_domain, meta_pixel_id, google_tag_id, conversion_api_token')
      .eq('user_id', req.user.id)
    if (error) throw error
    res.json(data || [])
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── GET /api/sites/serve/:slug/:type — PUBLIC: serve cleaned HTML ───────────
router.get('/serve/:slug/:type', async (req, res) => {
  try {
    const { slug, type } = req.params
    const { data, error } = await supabase
      .from('architect_sites')
      .select('html_content')
      .eq('slug', slug)
      .eq('type', type)
      .eq('is_active', true)
      .single()

    if (error || !data) return res.status(404).send('<html><body style="background:#0A0A0A;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><h1 style="color:#E8A838">Site non trouvé</h1></body></html>')

    // Strip fences from any records saved before this fix
    const html = stripFences(data.html_content)
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.send(html)
  } catch (err) {
    console.error('sites/serve error:', err)
    res.status(500).send('<html><body style="background:#0A0A0A;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><h1>Erreur serveur</h1></body></html>')
  }
})

module.exports = router
