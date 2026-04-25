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
      supabase.from('leads').select('project_type, city, status'),
      supabase.from('clients').select('id'),
    ])

    // Aggregate lead data
    const leadsCount = leads?.length || 0
    const wonCount = leads?.filter(l => l.status === 'Gagné').length || 0

    const projectTypesRaw = leads?.map(l => l.project_type).filter(Boolean)
    const projectTypes = [...new Set(projectTypesRaw)].slice(0, 4)

    const citiesRaw = leads?.map(l => l.city).filter(Boolean)
    const cities = [...new Set(citiesRaw)].slice(0, 3)

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

// ─── POST /api/sites/generate — call Anthropic Claude ───────────────────────
router.post('/generate', auth, async (req, res) => {
  try {
    const { prompt } = req.body
    if (!prompt?.trim()) return res.status(400).json({ error: 'Prompt requis' })

    const Anthropic = require('@anthropic-ai/sdk')
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 8000,
      system: `You are an expert web developer specializing in beautiful, conversion-optimized websites for Moroccan architecture firms. Generate complete, self-contained HTML files with embedded CSS and JavaScript. Use modern design: dark elegant style with gold accents (#E8A838), Inter font from Google Fonts, fully mobile responsive. No external dependencies except Google Fonts. All text in French. Make it look premium and professional. Return ONLY the complete HTML code, nothing else, no explanations.`,
      messages: [{ role: 'user', content: prompt }],
    })

    const html = message.content[0]?.text || ''
    res.json({ html })
  } catch (err) {
    console.error('sites/generate error:', err)
    res.status(500).json({ error: 'Erreur lors de la génération du site' })
  }
})

// ─── POST /api/sites/publish — save to Supabase ──────────────────────────────
router.post('/publish', auth, async (req, res) => {
  try {
    const { html, type, slug } = req.body
    const uid = req.user.id

    if (!html || !type || !slug) return res.status(400).json({ error: 'Données manquantes' })
    if (!['vitrine', 'landing'].includes(type)) return res.status(400).json({ error: 'Type invalide' })

    // Upsert — one record per (user_id, type)
    const { error } = await supabase.from('architect_sites').upsert(
      { user_id: uid, slug, type, html_content: html, published_at: new Date().toISOString(), is_active: true },
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

// ─── GET /api/sites/serve/:slug/:type — PUBLIC: serve site HTML ───────────────
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

    if (error || !data) return res.status(404).send('<html><body><h1>Site non trouvé</h1></body></html>')
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.send(data.html_content)
  } catch (err) {
    res.status(500).send('<html><body><h1>Erreur serveur</h1></body></html>')
  }
})

module.exports = router
