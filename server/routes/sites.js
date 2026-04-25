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

// System prompts
const SYSTEM_PROMPT_DEFAULT = `You are an expert web developer specializing in beautiful, conversion-optimized websites for Moroccan architecture firms. Generate complete, self-contained HTML files with embedded CSS and JavaScript. Use modern design: dark elegant style with gold accents (#E8A838), Inter font from Google Fonts, fully mobile responsive. No external dependencies except Google Fonts. All text in French unless the prompt specifies otherwise. Make it look premium and professional. Return ONLY the complete HTML code, nothing else, no explanations, no markdown. Start with <!DOCTYPE html>`

const SYSTEM_PROMPT_VOICE = `You are an expert web developer. The user spoke in Moroccan Darija, French, or Arabic describing what they want on their website. Extract their intent and generate a complete, professional, self-contained HTML website for a Moroccan architecture firm. Use dark elegant design with gold accents (#E8A838), Inter font from Google Fonts, fully mobile responsive. No external dependencies except Google Fonts. Include: hero section, about, services, portfolio, and contact form. Return ONLY the complete HTML, nothing else. Start with <!DOCTYPE html>`

// ─── POST /api/sites/generate — call Anthropic Claude ────────────────────────
router.post('/generate', auth, async (req, res) => {
  const { prompt, voice } = req.body
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

  const systemPrompt = voice === true ? SYSTEM_PROMPT_VOICE : SYSTEM_PROMPT_DEFAULT
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
