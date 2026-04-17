const express = require('express')
const supabase = require('../db')
const { auth } = require('../middleware/auth')
const router = express.Router()

// GET /api/clients
router.get('/', auth, async (req, res) => {
  const { search } = req.query
  let query = supabase.from('clients').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false })
  if (search) query = query.ilike('name', `%${search}%`)
  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// GET /api/clients/:id
router.get('/:id', auth, async (req, res) => {
  const { data: client, error } = await supabase
    .from('clients').select('*').eq('id', req.params.id).eq('user_id', req.user.id).single()
  if (error || !client) return res.status(404).json({ error: 'Client introuvable' })

  const { data: history } = await supabase
    .from('history').select('*').eq('client_id', req.params.id).order('created_at', { ascending: false })

  const { data: reminders } = await supabase
    .from('reminders').select('*').eq('client_id', req.params.id).eq('user_id', req.user.id).order('reminder_date', { ascending: true })

  res.json({ ...client, history: history || [], reminders: reminders || [] })
})

// PUT /api/clients/:id
router.put('/:id', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('clients').update(req.body).eq('id', req.params.id).eq('user_id', req.user.id).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// DELETE /api/clients/:id
router.delete('/:id', auth, async (req, res) => {
  const { error } = await supabase.from('clients').delete().eq('id', req.params.id).eq('user_id', req.user.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
})

module.exports = router
