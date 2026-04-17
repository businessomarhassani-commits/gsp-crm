const express = require('express')
const supabase = require('../db')
const { auth, apiKeyAuth } = require('../middleware/auth')
const router = express.Router()

const logHistory = async (userId, leadId, clientId, action, description) => {
  await supabase.from('history').insert({ user_id: userId, lead_id: leadId, client_id: clientId, action, description })
}

// GET /api/leads
router.get('/', auth, async (req, res) => {
  const { status, search } = req.query
  let query = supabase.from('leads').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)
  if (search) query = query.ilike('name', `%${search}%`)
  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// POST /api/leads  (JWT auth)
router.post('/', auth, async (req, res) => {
  const { name, phone, email, project_type, city, budget, status, source, last_contact_date } = req.body
  if (!name) return res.status(400).json({ error: 'Le nom est requis' })

  const { data, error } = await supabase
    .from('leads')
    .insert({ user_id: req.user.id, name, phone, email, project_type, city, budget, status: status || 'Nouveau', source, last_contact_date })
    .select().single()

  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Un lead avec ce numéro existe déjà' })
    return res.status(500).json({ error: error.message })
  }
  await logHistory(req.user.id, data.id, null, 'Nouveau lead', `Lead créé: ${name}`)
  res.status(201).json(data)
})

// POST /api/leads  (API Key auth — external)
router.post('/external', apiKeyAuth, async (req, res) => {
  const { name, phone, email, project_type, city, budget, source } = req.body
  if (!name || !phone) return res.status(400).json({ error: 'Nom et téléphone requis' })

  const { data, error } = await supabase
    .from('leads')
    .insert({ user_id: req.user.id, name, phone, email, project_type, city, budget, source, status: 'Nouveau' })
    .select().single()

  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Lead en double (même téléphone)' })
    return res.status(500).json({ error: error.message })
  }
  await logHistory(req.user.id, data.id, null, 'Lead externe', `Lead reçu via API: ${name}`)
  res.status(201).json(data)
})

// PUT /api/leads/:id
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params
  const updates = req.body

  // Fetch current status first
  const { data: current } = await supabase.from('leads').select('status, name').eq('id', id).eq('user_id', req.user.id).single()
  if (!current) return res.status(404).json({ error: 'Lead introuvable' })

  const { data, error } = await supabase
    .from('leads').update(updates).eq('id', id).eq('user_id', req.user.id).select().single()
  if (error) return res.status(500).json({ error: error.message })

  // Auto-create client when status becomes 'Gagné'
  if (updates.status === 'Gagné' && current.status !== 'Gagné') {
    const { data: lead } = await supabase.from('leads').select('*').eq('id', id).single()
    const { data: existingClient } = await supabase.from('clients').select('id').eq('lead_id', id).single()
    if (!existingClient) {
      const { data: newClient } = await supabase.from('clients').insert({
        user_id: req.user.id,
        lead_id: id,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        project_type: lead.project_type,
        city: lead.city,
        closing_date: new Date().toISOString().split('T')[0]
      }).select().single()
      if (newClient) {
        await logHistory(req.user.id, id, newClient.id, 'Client gagné', `${lead.name} converti en client`)
      }
    }
  }

  if (updates.status && updates.status !== current.status) {
    await logHistory(req.user.id, id, null, 'Changement de statut', `Statut: ${current.status} → ${updates.status}`)
  }

  res.json(data)
})

// DELETE /api/leads/:id
router.delete('/:id', auth, async (req, res) => {
  const { error } = await supabase.from('leads').delete().eq('id', req.params.id).eq('user_id', req.user.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
})

module.exports = router
