const express = require('express')
const supabase = require('../db')
const adminAuth = require('../middleware/adminAuth')
const requireSuperAdmin = require('../middleware/requireSuperAdmin')
const router = express.Router()

// ── PUBLIC — no auth ──────────────────────────────────────────────────────────
router.get('/public/landing-content', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('landing_content')
      .select('section, field, value')
    if (error) throw error
    res.json(data || [])
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ── ADMIN GET ─────────────────────────────────────────────────────────────────
router.get('/admin/landing-content', adminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('landing_content')
      .select('section, field, value, updated_at')
      .order('section', { ascending: true })
    if (error) throw error
    res.json(data || [])
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ── ADMIN PUT — superadmin only ───────────────────────────────────────────────
router.put('/admin/landing-content', adminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { updates } = req.body
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'updates requis' })
    }
    const rows = updates.map(({ section, field, value }) => ({
      section,
      field,
      value: String(value ?? ''),
      updated_at: new Date().toISOString(),
    }))
    const { data, error } = await supabase
      .from('landing_content')
      .upsert(rows, { onConflict: 'section,field' })
      .select('section, field, value, updated_at')
    if (error) throw error
    res.json(data || [])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ── ADMIN AI — call Anthropic API, superadmin only ────────────────────────────
router.post('/admin/landing-ai', adminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { content, prompt } = req.body
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY non configuré sur le serveur' })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: 'You are a landing page copywriting expert for a French SaaS CRM called ArchiCRM targeting Moroccan architects. You will receive the current landing page content as JSON and a modification request. Return ONLY a valid JSON object with the exact same structure (same keys, same nesting) but with the requested changes applied. Keep all text in French.',
        messages: [
          {
            role: 'user',
            content: `${JSON.stringify(content, null, 2)}\n\nModification demandée: ${prompt}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}))
      return res.status(response.status).json({
        error: errBody.error?.message || 'Erreur API Anthropic',
      })
    }

    const result = await response.json()
    const text = result.content?.[0]?.text || ''

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return res.status(500).json({ error: "L'IA n'a pas retourné un JSON valide" })
    }

    const updatedContent = JSON.parse(jsonMatch[0])
    res.json({ content: updatedContent })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router
