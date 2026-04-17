const express = require('express')
const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')
const supabase = require('../db')
const { auth } = require('../middleware/auth')
const requireAdmin = require('../middleware/requireAdmin')
const router = express.Router()

router.use(auth, requireAdmin)

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  const [{ data: users }, { data: leads }, { data: clients }] = await Promise.all([
    supabase.from('users').select('id, status'),
    supabase.from('leads').select('id'),
    supabase.from('clients').select('project_value')
  ])
  const totalRevenue = clients?.reduce((sum, c) => sum + (Number(c.project_value) || 0), 0) || 0
  res.json({
    total_users: users?.length || 0,
    total_leads: leads?.length || 0,
    total_revenue: totalRevenue,
    active_users: users?.filter(u => u.status === 'active').length || 0
  })
})

// GET /api/admin/users
router.get('/users', async (req, res) => {
  const { data: users } = await supabase.from('users').select('id, name, email, role, status, api_key, created_at').order('created_at', { ascending: false })

  const usersWithStats = await Promise.all((users || []).map(async u => {
    const { data: leads } = await supabase.from('leads').select('id').eq('user_id', u.id)
    const { data: clients } = await supabase.from('clients').select('project_value').eq('user_id', u.id)
    const ca = clients?.reduce((sum, c) => sum + (Number(c.project_value) || 0), 0) || 0
    return { ...u, lead_count: leads?.length || 0, ca }
  }))

  res.json(usersWithStats)
})

// POST /api/admin/users
router.post('/users', async (req, res) => {
  const { name, email, password, role } = req.body
  if (!name || !email || !password) return res.status(400).json({ error: 'Champs requis manquants' })
  const hashed = await bcrypt.hash(password, 12)
  const { data, error } = await supabase
    .from('users')
    .insert({ name, email: email.toLowerCase(), password: hashed, role: role || 'user', api_key: uuidv4() })
    .select('id, name, email, role, status, api_key, created_at').single()
  if (error) return res.status(error.code === '23505' ? 409 : 500).json({ error: error.message })
  res.status(201).json(data)
})

// PUT /api/admin/users/:id
router.put('/users/:id', async (req, res) => {
  const allowed = {}
  if (req.body.name) allowed.name = req.body.name
  if (req.body.role) allowed.role = req.body.role
  if (req.body.status) allowed.status = req.body.status
  const { data, error } = await supabase.from('users').update(allowed).eq('id', req.params.id).select('id, name, email, role, status').single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// PUT /api/admin/users/:id/suspend
router.put('/users/:id/suspend', async (req, res) => {
  const { data: user } = await supabase.from('users').select('status').eq('id', req.params.id).single()
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })
  const newStatus = user.status === 'active' ? 'suspended' : 'active'
  const { data, error } = await supabase.from('users').update({ status: newStatus }).eq('id', req.params.id).select('id, status').single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Impossible de supprimer votre propre compte' })
  const { error } = await supabase.from('users').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
})

module.exports = router
