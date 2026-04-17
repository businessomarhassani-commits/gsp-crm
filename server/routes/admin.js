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

// GET /api/admin/analytics
router.get('/analytics', async (req, res) => {
  const { data: clients } = await supabase
    .from('clients')
    .select('project_value, closing_date')
    .order('closing_date', { ascending: true })

  const { data: leads } = await supabase.from('leads').select('id, status')
  const { data: users } = await supabase.from('users').select('id, created_at, status').order('created_at', { ascending: true })

  // Build monthly revenue & new users for last 12 months
  const now = new Date()
  const months = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1, revenue: 0, new_users: 0 })
  }

  clients?.forEach(c => {
    if (!c.closing_date) return
    const d = new Date(c.closing_date)
    const entry = months.find(m => m.year === d.getFullYear() && m.month === d.getMonth() + 1)
    if (entry) entry.revenue += Number(c.project_value) || 0
  })

  users?.forEach(u => {
    if (!u.created_at) return
    const d = new Date(u.created_at)
    const entry = months.find(m => m.year === d.getFullYear() && m.month === d.getMonth() + 1)
    if (entry) entry.new_users += 1
  })

  const wonLeads = leads?.filter(l => l.status === 'Gagné').length || 0
  const totalLeads = leads?.length || 0
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0

  res.json({ monthly: months, conversion_rate: conversionRate, total_leads: totalLeads, won_leads: wonLeads })
})

// GET /api/admin/users
router.get('/users', async (req, res) => {
  const { data: users } = await supabase
    .from('users')
    .select('id, name, email, role, status, plan, api_key, created_at')
    .order('created_at', { ascending: false })

  const usersWithStats = await Promise.all((users || []).map(async u => {
    const { data: leads } = await supabase.from('leads').select('id').eq('user_id', u.id)
    const { data: clients } = await supabase.from('clients').select('project_value').eq('user_id', u.id)
    const ca = clients?.reduce((sum, c) => sum + (Number(c.project_value) || 0), 0) || 0
    return { ...u, lead_count: leads?.length || 0, ca }
  }))

  res.json(usersWithStats)
})

// GET /api/admin/users/:id/detail
router.get('/users/:id/detail', async (req, res) => {
  const { data: user } = await supabase
    .from('users')
    .select('id, name, email, role, status, plan, created_at')
    .eq('id', req.params.id)
    .single()
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

  const [{ data: leads }, { data: clients }] = await Promise.all([
    supabase.from('leads').select('id, name, status, phone, city, created_at').eq('user_id', req.params.id).order('created_at', { ascending: false }),
    supabase.from('clients').select('id, name, project_type, project_value, closing_date').eq('user_id', req.params.id).order('closing_date', { ascending: false })
  ])

  const ca = clients?.reduce((sum, c) => sum + (Number(c.project_value) || 0), 0) || 0
  res.json({ user: { ...user, ca }, leads: leads || [], clients: clients || [] })
})

// POST /api/admin/users
router.post('/users', async (req, res) => {
  const { name, email, password, role, plan } = req.body
  if (!name || !email || !password) return res.status(400).json({ error: 'Champs requis manquants' })
  const hashed = await bcrypt.hash(password, 12)
  const { data, error } = await supabase
    .from('users')
    .insert({ name, email: email.toLowerCase(), password: hashed, role: role || 'user', plan: plan || 'free', api_key: uuidv4() })
    .select('id, name, email, role, status, plan, api_key, created_at').single()
  if (error) return res.status(error.code === '23505' ? 409 : 500).json({ error: error.message })
  res.status(201).json(data)
})

// PUT /api/admin/users/:id
router.put('/users/:id', async (req, res) => {
  const allowed = {}
  if (req.body.name) allowed.name = req.body.name
  if (req.body.role) allowed.role = req.body.role
  if (req.body.status) allowed.status = req.body.status
  if (req.body.plan) allowed.plan = req.body.plan
  const { data, error } = await supabase.from('users').update(allowed).eq('id', req.params.id).select('id, name, email, role, status, plan').single()
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
