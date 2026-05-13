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
const SYSTEM_PROMPT_VITRINE = `CRITICAL: Generate a COMPLETE full-length HTML portfolio website. Do not stop. Do not truncate. Include all 10 sections fully implemented. Minimum 800 lines.

You are an expert luxury web developer. Generate a premium portfolio website for a Moroccan architect. This must look like it cost 50,000 DH to build.

Architect data provided in the user message below.
API endpoint: provided in user message.
API key: provided in user message.

DESIGN SYSTEM (use CSS variables in :root):
--gold:#E8A838; --gold-light:#F5C842; --dark:#0A0A0A; --darker:#050505; --card:#111111; --card-hover:#161616; --border:#1E1E1E; --text:#FFFFFF; --text-muted:#888888; --red:#C0392B; --green:#27AE60;
FONT: Inter from Google Fonts. NO EMOJIS. SVG icons only. ★ for stars.

IMAGES — use exact URLs:
Hero bg: https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1920&h=1080&fit=crop&q=80
Portfolio (use all 6 as <img> object-fit:cover aspect-ratio:4/3):
  https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop&q=80
  https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop&q=80
  https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop&q=80
  https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop&q=80
  https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&h=600&fit=crop&q=80
  https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&h=600&fit=crop&q=80
About image: https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop&q=80

ALL 10 SECTIONS REQUIRED — DO NOT SKIP ANY:

1. FIXED NAVBAR: rgba(10,10,10,0.97) backdrop-filter:blur(20px), 2px gold bottom border, architect name + 'ARCHITECTE' in gold small-caps, nav links (Accueil/A Propos/Services/Portfolio/Temoignages/Contact), gold 'Demander un Devis' CTA button, mobile hamburger with JS toggle

2. HERO (min-height:100vh): CSS background-image on hero with overlay linear-gradient(135deg,rgba(10,10,10,0.92),rgba(10,10,10,0.65)), gold badge 'ARCHITECTE DIPLOME D ETAT', H1 architect name (clamp(2.5rem,5vw,4.5rem)), H2 specialty in gold, dual CTA buttons (gold primary + outline secondary), animated gold scroll chevron

3. STATS BAR (background:#0D0D0D, borders): 4 columns with large gold numbers — projects realised, years experience, clients satisfaits, villes couvertes. Use data from architect's prompt.

4. ABOUT: two-column (about image left, text right), bio paragraph, 3 gold-bordered credential cards (Diplome/Agree/Assure), specialty tags

5. SERVICES (3-col grid, 6 cards): dark card, 3px gold top-border, inline architecture SVG icon, title, description. Based on specialties in prompt. Hover: translateY(-4px) + gold glow.

6. PORTFOLIO (3-col 2-row = 6 cards): each card has image + hover overlay (dark 80% + project name + city in white)

7. TESTIMONIALS (3 cards): Karim Bensouda/Casablanca, Nadia El Fassi/Rabat, Youssef Chraibi/Marrakech. Avatars from ui-avatars.com (bg=E8A838). 5 ★ in gold. Italic quote. Dark card, gold left border.

8. PROCESS: 4-step horizontal timeline (01-04), large gold numbers, step title + description, connected by gold line on desktop

9. CONTACT: two-column (info left with SVG icons, form right). Form: Nom/Telephone/Email/Type-projet/Message. Gold submit button. POST to API in prompt.

10. FOOTER: dark, architect name + tagline, links, copyright

FLOATING WHATSAPP: fixed bottom-right, background:#25D366, 60px circle, white WhatsApp SVG, pulse animation

ANIMATIONS: Intersection Observer fade-in (opacity:0→1, translateY(30px)→0) on all sections. Navbar background change on scroll. Portfolio hover overlays.

All CSS in <style>, all JS in <script> before </body>. Fully mobile responsive. Return ONLY complete HTML from <!DOCTYPE html> to </html>. No truncation.`

const SYSTEM_PROMPT_LANDING = `CRITICAL: Generate a COMPLETE full-length HTML landing page. Do not stop. Do not truncate. Include every section listed below. The page must be at minimum 800 lines of HTML.

You are an expert conversion rate optimizer. Generate a high-converting lead generation landing page for a Moroccan architect.

Architect data, form fields, API endpoint and API key are all provided in the user message below.

DESIGN SYSTEM (CSS :root variables):
--gold:#E8A838; --gold-light:#F5C842; --dark:#0A0A0A; --darker:#050505; --card:#111111; --card-hover:#161616; --border:#1E1E1E; --text:#FFFFFF; --text-muted:#888888; --red:#C0392B; --green:#27AE60;
FONT: Inter from Google Fonts. NO EMOJIS. SVG icons only. ★ for stars. CSS shapes for decorative elements.

IMAGES — use exact URLs:
Hero: https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&h=1080&fit=crop&q=80
Section: https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1920&h=1080&fit=crop&q=80
Portfolio strip: https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop&q=80 / https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&h=600&fit=crop&q=80 / https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop&q=80

ALL 12 SECTIONS REQUIRED — DO NOT SKIP ANY:

SECTION 1 - STICKY HEADER (hidden by default, shows after 100px scroll):
position:fixed; top:0; z-index:1000; width:100%; background:rgba(10,10,10,0.97); backdrop-filter:blur(20px); border-bottom:2px solid var(--gold); padding:12px 40px; display:flex; justify-content:space-between; align-items:center;
Left: architect name (bold white) + specialty (small gold text)
Right: phone number + gold 'Appeler Maintenant' button
JS: window.addEventListener('scroll', () => header.classList.toggle('visible', scrollY>100))

SECTION 2 - HERO (min-height:100vh):
background-image: hero URL above, overlay rgba(10,10,10,0.80)
Centered content (max-width:800px):
- Small gold badge 'ARCHITECTE AGREE — ORDRE NATIONAL DU MAROC' (border:1px solid gold, padding:8px 20px, border-radius:50px)
- H1 (font-size:clamp(2.5rem,5vw,4.5rem), font-weight:700): Pain-focused headline NOT architect name. Example: 'Votre Projet du Permis a la Livraison — Sans Stress'
- H2 subtitle (color:var(--text-muted)): benefit statement
- Large gold CTA button (padding:18px 48px, font-size:1.1rem, border-radius:8px, href:#lead-form)
- 3 trust badges row (inline SVG checkmark + text)

SECTION 3 - SOCIAL PROOF BAR (background:#0D0D0D, border-top/bottom:1px solid var(--border)):
3 columns: large gold numbers + labels (Projects Realises, Ans d Experience, Clients Satisfaits)
Row 2: 'Membre — Ordre National des Architectes du Maroc'

SECTION 4 - PAIN POINTS (background:var(--dark)):
Title: 'Vous Reconnaissez-Vous ?'
4 cards (2x2 grid): background:var(--card); border-left:3px solid var(--red); border-radius:12px; padding:24px;
Inline SVG X icon in red + bold problem title + description

SECTION 5 - SOLUTION PROCESS (background:#080808):
Title: 'Notre Methode en 4 Etapes'
4 steps in a row (stack on mobile): large gold number (4rem, opacity:0.3) + step title + description. Connected by gold line on desktop.

SECTION 6 - WHY CHOOSE US (background:var(--dark)):
Title: 'Pourquoi Nous Choisir ?'
6 cards (3-col desktop): var(--card) bg, border:1px solid var(--border), hover:border-color var(--gold)
Inline SVG gold checkmark circle + feature title + description

SECTION 7 - RESULTS STATS (background:linear-gradient(135deg,#0D0D0D,#111)):
Title: 'Nos Resultats Parlent'
3 large stat cards: gold numbers (4rem), description. Counter animation via Intersection Observer.

SECTION 8 - TESTIMONIALS (background:var(--dark)):
Title: 'Ce Que Disent Nos Clients'
3 cards: var(--card) bg, padding:32px, border-radius:16px
Gold quote marks (4rem, opacity:0.3) + italic review + ★★★★★ gold + avatar (ui-avatars.com bg=E8A838) + name + city
Names: Karim Bensouda/Casablanca, Nadia El Fassi/Rabat, Youssef Chraibi/Marrakech

SECTION 9 - URGENCY BANNER (background:#1A0500, border:2px solid #C0392B top/bottom):
CSS red triangle left. Bold text: 'Places Limitees — Nous n acceptons que 3 nouveaux projets par mois'
Subtext in muted. Gold CTA button.

SECTION 10 - LEAD FORM (id="lead-form", background:var(--darker)):
Centered container max-width:600px.
Card: background:var(--card); border-top:3px solid var(--gold); border-radius:16px; padding:48px;
Title: 'Obtenez Votre Consultation Gratuite' (bold white, 1.8rem)
Subtitle: 'Repondez a ces questions — nous vous rappelons sous 24h' (muted)
FORM FIELDS: Use EXACTLY the fields listed in the user message (same labels, types, options)
  Field wrapper: margin-bottom:20px
  Label: display:block; color:var(--text-muted); font-size:0.85rem; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px
  Input/Select/Textarea: width:100%; background:#1A1A1A; border:1px solid var(--border); border-radius:8px; padding:14px 16px; color:white; font-size:1rem
  Focus: border-color:var(--gold); outline:none; box-shadow:0 0 0 3px rgba(232,168,56,0.1)
Submit button: width:100%; background:var(--gold); color:#000; font-weight:700; font-size:1.1rem; padding:18px; border-radius:8px; display:flex; align-items:center; justify-content:center; gap:8px; border:none; cursor:pointer
  Include inline arrow SVG icon. Hover: background:var(--gold-light); transform:translateY(-2px)
  Loading state: show spinner SVG, disable button, text='Envoi en cours...'
On submit: validate required fields (add red border if empty). POST JSON to API URL from prompt with X-API-Key header.
On success: hide form div, show success div (green checkmark SVG, 'Merci ! Nous vous contactons sous 24h', green card bg).
On error: show red error message.
Trust row below button: SVG lock + 'Donnees securisees' | SVG check + 'Sans engagement' | SVG lightning + 'Reponse sous 24h'

SECTION 11 - FAQ ACCORDION (background:var(--dark)):
Title: 'Questions Frequentes'
4 questions about Moroccan architecture services.
Each: border-bottom:1px solid var(--border); padding:20px 0
Question: cursor:pointer; display:flex; justify-content:space-between; align-items:center
SVG chevron rotates 180deg when open. Answer: max-height transition (0 to auto via JS class toggle).

SECTION 12 - FOOTER (background:#050505, border-top:1px solid var(--border)):
Architect name + tagline. Links row. Copyright 2025.

FLOATING WHATSAPP: position:fixed; bottom:24px; right:24px; z-index:9999; width:60px; height:60px; background:#25D366; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 20px rgba(37,211,102,0.4). White WhatsApp SVG icon. Pulse ring animation (::before pseudo).

SCROLL ANIMATIONS: Intersection Observer on all sections. Start: opacity:0; transform:translateY(30px). Visible: opacity:1; transform:translateY(0); transition:0.6s ease. Stagger children with animation-delay.
JS also: smooth scroll, sticky header on scroll, FAQ accordion toggle, form submit with fetch(), counter animation.

All CSS in <style> in <head>. All JS in <script> before </body>. Fully mobile responsive. Return ONLY complete HTML from <!DOCTYPE html> to </html>. No truncation.`

// buildVoicePrompt: dynamic system prompt that names the detected language
function buildVoicePrompt(voiceLang) {
  const langLabel =
    voiceLang === 'ar'    ? 'Moroccan Darija (Arabic/French mix)' :
    voiceLang === 'fr-FR' ? 'French' :
    voiceLang === 'en-US' ? 'English' : 'Moroccan Darija'

  return `CRITICAL: Generate a COMPLETE HTML page. Do not stop early. Do not truncate. Every section fully implemented.

The user spoke in ${langLabel} and their request is in the user message below.

Darija glossary: bghit=I want, dir/diri=make, zwin=beautiful, landing page=lead capture page, lmohandis=the architect, leads=prospects, khdm=work on, bla=without, m3a=with, hsen=better/improve, kbir=big, sghir=small, bghina=we want, professional=احترافي

Understand their full intent even from imperfect speech recognition.

Generate either:
- A FULL landing page (if they want leads/landing/capture/form)
- A FULL portfolio site (if they want website/vitrine/portfolio)

DESIGN: dark #0A0A0A background, gold #E8A838 accents, Inter from Google Fonts, NO emojis (SVG icons only).
IMAGES — use exact URLs (images.unsplash.com only):
  Hero: https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1920&h=1080&fit=crop&q=80
  Portfolio: https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop&q=80
             https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop&q=80
             https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop&q=80
             https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop&q=80

Include all appropriate sections: fixed navbar, hero (100vh with bg-image + overlay), about, services (SVG icons), portfolio grid, testimonials (★ stars), contact form, WhatsApp float button, Intersection Observer animations.
All CSS in <style>, all JS in <script> before </body>. Fully mobile responsive.

Return ONLY complete HTML from <!DOCTYPE html> to </html>. No markdown. No backticks.`
}

// ─── POST /api/sites/generate — call Anthropic Claude ────────────────────────
router.post('/generate', auth, async (req, res) => {
  const { prompt, voice, type, voiceLang } = req.body
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

  // Select system prompt: voice → dynamic lang-aware, landing → conversion, else vitrine
  let systemPrompt
  if (voice === true) systemPrompt = buildVoicePrompt(voiceLang || 'ar')
  else if (type === 'landing') systemPrompt = SYSTEM_PROMPT_LANDING
  else systemPrompt = SYSTEM_PROMPT_VITRINE
  // Opus first for longer/richer output, sonnet as fallback
  const MODELS = ['claude-opus-4-5', 'claude-sonnet-4-5']
  let lastErr = null

  for (const model of MODELS) {
    try {
      console.log(`[sites/generate] Trying model: ${model} voice:${!!voice}`)
      const message = await anthropic.messages.create({
        model,
        max_tokens: 16000,
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

    res.json({ url: `https://${slug}.crm.archi`, slug })
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
