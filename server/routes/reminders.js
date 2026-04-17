const express = require('express')
const supabase = require('../db')
const { auth } = require('../middleware/auth')
const router = express.Router()

// GET /api/reminders
router.get('/', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('reminders')
    .select('*, clients(name)')
    .eq('user_id', req.user.id)
    .order('reminder_date', { ascending: true })
  if (error) return res.status(500).json({ error: error.message })
  // Flatten client name for convenience
  const rows = (data || []).map(r => ({ ...r, client_name: r.clients?.name || null, clients: undefined }))
  const pending = rows.filter(r => r.status === 'pending')
  const done = rows.filter(r => r.status === 'done')
  res.json({ pending, done })
})

// POST /api/reminders
router.post('/', auth, async (req, res) => {
  const { title, description, reminder_date, lead_id, client_id } = req.body
  if (!title || !reminder_date) return res.status(400).json({ error: 'Titre et date requis' })
  const { data, error } = await supabase
    .from('reminders')
    .insert({ user_id: req.user.id, title, description, reminder_date, lead_id: lead_id || null, client_id: client_id || null })
    .select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

// PUT /api/reminders/:id
router.put('/:id', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('reminders').update(req.body).eq('id', req.params.id).eq('user_id', req.user.id).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// DELETE /api/reminders/:id
router.delete('/:id', auth, async (req, res) => {
  const { error } = await supabase.from('reminders').delete().eq('id', req.params.id).eq('user_id', req.user.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
})

module.exports = router
