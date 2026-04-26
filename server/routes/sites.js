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
const SYSTEM_PROMPT_VITRINE = `You are an expert luxury web developer. Generate a COMPLETE, fully-styled, self-contained HTML portfolio website for a Moroccan architect. This must look like it cost 50,000 DH to build.

STRICT RULES:
- NO emojis anywhere in the page. Instead use: SVG icons inline for features, CSS shapes for decorative elements, Unicode checkmarks (✓) and arrows (→), CSS red border + bold text for urgency sections, CSS gold stars (★) for ratings
- Use exact image URLs provided below — do NOT use source.unsplash.com or generate/guess any URLs
- All CSS must be embedded in <style> tags in <head>
- All JavaScript must be embedded in <script> tags before </body>
- Return ONLY complete HTML starting with <!DOCTYPE html>

DESIGN SYSTEM:
- Colors: --dark:#0A0A0A; --darker:#050505; --gold:#E8A838; --gold-light:#F0C060; --text:#FFFFFF; --text-muted:#888888; --card:#111111; --border:#1E1E1E;
- Font: Inter from Google Fonts
- Border radius: 12px cards, 8px buttons
- Transitions: all 0.3s ease
- Box shadows: 0 4px 24px rgba(0,0,0,0.4)

SECTIONS:

1. FIXED NAVBAR:
- Background: rgba(10,10,10,0.95) backdrop-filter:blur(20px)
- 2px gold bottom border
- Logo: architect name white + 'ARCHITECTE' in gold small caps
- Links: Accueil, A Propos, Services, Portfolio, Temoignages, Contact
- CTA button gold 'Demander un Devis'
- Mobile: hamburger menu with JS toggle

2. HERO (100vh):
- Background image: https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1920&h=1080&fit=crop&q=80
- Use as CSS background-image on hero div with overlay: linear-gradient(135deg, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.65) 100%)
- Small gold badge: 'ARCHITECTE DIPLOME D ETAT - MAROC' with gold border
- H1: large, white, architect name
- H2: specialty tagline in gold
- City badge
- Two CTA buttons: gold primary + outline secondary
- Scroll indicator: animated gold chevron

3. STATS BAR (dark background, gold numbers):
- 4 stats: Projets Realises | Annees d Experience | Clients Satisfaits | Villes Couvertes
- Use data from the user's prompt

4. ABOUT SECTION:
- Two columns: left=portfolio image https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&h=600&fit=crop&q=80, right=text
- Bio paragraph, 3 gold-bordered highlight cards: Diplome | Agree | Assure
- Specialties as tags

5. SERVICES (3-col grid):
- Each card: dark bg, 3px gold top border, inline SVG icon (architecture-related), title, description
- Based on architect's specialties from the prompt
- Hover: translateY(-4px) + gold box-shadow

6. PORTFOLIO (3-col grid, 2 rows = 6 cards):
- Use these EXACT images as <img> tags with object-fit:cover, aspect-ratio:4/3:
  img1: https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop&q=80
  img2: https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop&q=80
  img3: https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop&q=80
  img4: https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop&q=80
  img5: https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&h=600&fit=crop&q=80
  img6: https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop&q=80
- Each: hover overlay (dark 80% + project name + city in white)

7. TESTIMONIALS (3 cards):
- Names: Karim Bensouda (Casablanca), Nadia El Fassi (Rabat), Youssef Chraibi (Marrakech)
- Avatars: https://ui-avatars.com/api/?name=X&background=E8A838&color=000&size=60
- 5 gold stars using ★ symbols
- Italic quote, dark card, gold left border 3px

8. CONTACT:
- Two columns: contact info left (phone, email, city, inline SVG icons), form right
- Form: Nom, Telephone, Email, Type de projet (select), Message
- Gold submit button full-width

9. FOOTER:
- Dark, architect name + tagline, nav links, copyright

10. FLOATING WHATSAPP BUTTON:
- Fixed bottom-right, background #25D366, 60px circle
- WhatsApp SVG icon (white)
- Pulse ring animation

ANIMATIONS: Fade-in on scroll via Intersection Observer (add .visible class, CSS opacity:0->1 translateY). Navbar bg changes on scroll. Portfolio hover overlays. Button hover states.`

const SYSTEM_PROMPT_LANDING = `You are an expert conversion rate optimizer. Generate a COMPLETE, high-converting lead generation landing page for a Moroccan architect. This must convert visitors into leads.

STRICT RULES:
- NO emojis — use SVG icons, CSS shapes, ★ for stars, ✓ for checkmarks
- Use exact image URLs provided below
- Embedded CSS and JS only
- Return ONLY complete HTML starting with <!DOCTYPE html>

DESIGN SYSTEM:
- Colors: --dark:#0A0A0A; --gold:#E8A838; --gold-light:#F0C060; --card:#111111; --border:#1E1E1E; --red:#C0392B;
- Font: Inter from Google Fonts
- CSS custom properties in :root

SECTIONS:

1. STICKY HEADER (appears after 200px scroll, hidden by default):
- Fixed top, dark bg, architect name + phone + 'Appeler' CTA button

2. HERO (100vh):
- Background: https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&h=1080&fit=crop&q=80
- Use as CSS background-image with overlay rgba(10,10,10,0.85)
- Pain-focused H1 in French (NOT architect name — address the prospect's problem)
- Benefit subheadline
- Large gold CTA button scrolling to form section
- Trust row: 3 items with inline SVG checkmark icons

3. SOCIAL PROOF BAR (dark): 3 large gold stats

4. PROBLEMS SECTION:
- Title: 'Vous faites face a ces defis ?'
- 4 problem cards: dark bg, red 3px left border, inline SVG X icon, problem title + description
- Real Moroccan construction pain points

5. SOLUTION STEPS:
- Title: 'Notre Approche en 4 Etapes'
- 4 steps with large gold numbers 01-04, connected by vertical line
- Each: title + description

6. WHY US (feature grid):
- 6 cards, inline gold SVG checkmark icons, dark cards, hover lift

7. PORTFOLIO STRIP (horizontal scroll or 3 images):
- Use: https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop&q=80
       https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&h=600&fit=crop&q=80
       https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop&q=80

8. TESTIMONIALS: 3 cards, Moroccan names, ★★★★★ in gold

9. URGENCY BANNER: dark-red background, bold text about limited availability — NO emojis, use CSS arrow shapes

10. LEAD FORM (most important — id="contact-form"):
- Centered, max-width 580px
- Dark card with 3px gold border-top
- Title: 'Obtenez Votre Consultation Gratuite'
- Subtitle: 'Repondez a ces questions et nous vous contactons sous 24h'
- Use EXACTLY the form fields listed in the user's prompt (labels, types, options)
- Each input: dark bg #1a1a1a, gold border on focus, border-radius 8px, padding 14px, label above
- Select inputs: same dark styling
- Submit: full-width gold button with inline arrow SVG, loading state (spinner) on click
- Success: hide form, show green success message 'Merci ! Nous vous contactons dans les 24h.'
- Error: show red error message
- POST JSON to API URL from prompt with X-API-Key header
- Trust row below button: lock SVG + 3 trust points

11. FAQ (3-4 questions, accordion):
- Gold arrow SVG that rotates 90deg on open
- Common questions about working with a Moroccan architect

12. FOOTER: minimal dark, architect name, copyright

13. FLOATING WHATSAPP: same as vitrine (fixed bottom-right, #25D366, pulse)

JS: smooth scroll, form submit with fetch(), Intersection Observer animations, FAQ accordion, sticky header on scroll`

// buildVoicePrompt: dynamic system prompt that names the detected language
function buildVoicePrompt(voiceLang) {
  const langLabel =
    voiceLang === 'ar'    ? 'Moroccan Darija (Arabic/French mix)' :
    voiceLang === 'fr-FR' ? 'French' :
    voiceLang === 'en-US' ? 'English' : 'Moroccan Darija'

  return `You are an expert luxury web developer specializing in high-converting websites for Moroccan architecture firms. The user described what they want verbally in ${langLabel}.

IMPORTANT LANGUAGE NOTES:
- If Darija/Arabic: understand mixed Arabic-French-Darija instructions
  Common Darija: bghit=I want, dir/diri=make, zwin=beautiful, professional=احترافي, landing page=صفحة هبوط, leads=عملاء محتملين, lmohandis=the architect, khdm=work on, bla=without, m3a=with, hsen=better, kbir=big, sghir=small, raki=you are, bghina=we want
- Extract the full intent even from imperfect speech recognition

STRICT RULES:
- NO emojis anywhere — SVG icons only
- Use exact Unsplash image URLs provided below (images.unsplash.com only)
- All CSS embedded in <style> tags, all JS in <script> tags before </body>

GENERATE a COMPLETE, self-contained HTML page with:
- Premium dark design (#0A0A0A background, #E8A838 gold accents, Inter font from Google Fonts)
- Fully mobile responsive
- High-converting structure if landing page requested; professional portfolio if website requested
- Fixed navbar, hero (100vh) with background-image + dark overlay, about/services sections, portfolio grid, testimonials, contact form
- Hero background: https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1920&h=1080&fit=crop&q=80
- Portfolio images (use as <img> tags, object-fit:cover):
  https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop&q=80
  https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop&q=80
  https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop&q=80
  https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop&q=80
- WhatsApp float button (fixed bottom-right, #25D366, pulse animation)
- Intersection Observer scroll animations
- Form submission to architect's API endpoint if a form is needed
- Smooth scroll, hover effects, mobile hamburger menu

Return ONLY complete HTML starting with <!DOCTYPE html>. No markdown. No backticks. No explanations.`
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
