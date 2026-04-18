const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
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
  const { count: metaConnectionsCount } = await supabase.from('meta_connections').select('id', { count: 'exact', head: true }).eq('is_active', true)

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

  res.json({ monthly: months, conversion_rate: conversionRate, total_leads: totalLeads, won_leads: wonLeads, meta_connections_count: metaConnectionsCount || 0 })
})

// GET /api/admin/users/pending-count  — returns count of pending accounts
router.get('/users/pending-count', async (req, res) => {
  const { count } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('account_status', 'pending')
  res.json({ count: count || 0 })
})

// GET /api/admin/users
router.get('/users', async (req, res) => {
  const { data: users } = await supabase
    .from('users')
    .select('id, name, email, role, status, account_status, plan, api_key, created_at')
    .neq('role', 'admin')
    .order('created_at', { ascending: false })

  const usersWithStats = await Promise.all((users || []).map(async u => {
    const [{ data: leads }, { data: clients }, { data: metaConn }] = await Promise.all([
      supabase.from('leads').select('id').eq('user_id', u.id),
      supabase.from('clients').select('project_value').eq('user_id', u.id),
      supabase.from('meta_connections').select('is_active').eq('user_id', u.id).eq('is_active', true).maybeSingle()
    ])
    const ca = clients?.reduce((sum, c) => sum + (Number(c.project_value) || 0), 0) || 0
    return { ...u, lead_count: leads?.length || 0, ca, has_meta_connection: !!metaConn }
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

// PUT /api/admin/users/:id/approve — approve pending account
router.put('/users/:id/approve', async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .update({ account_status: 'active' })
    .eq('id', req.params.id)
    .eq('account_status', 'pending')
    .select('id, name, email, account_status')
    .single()
  if (error || !data) return res.status(404).json({ error: 'Utilisateur introuvable ou déjà approuvé' })
  res.json(data)
})

// DELETE /api/admin/users/:id/reject — reject (delete) a pending account
router.delete('/users/:id/reject', async (req, res) => {
  const { data: user } = await supabase.from('users').select('account_status').eq('id', req.params.id).single()
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })
  if (user.account_status !== 'pending') return res.status(400).json({ error: 'Ce compte n\'est pas en attente' })
  const { error } = await supabase.from('users').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
})

// POST /api/admin/impersonate/:userId — generate short-lived impersonation token
router.post('/impersonate/:userId', async (req, res) => {
  if (req.params.userId === req.user.id) {
    return res.status(400).json({ error: 'Impossible de vous impersonner vous-même' })
  }
  const { data: target } = await supabase
    .from('users')
    .select('id, name, email, role')
    .eq('id', req.params.userId)
    .single()
  if (!target) return res.status(404).json({ error: 'Utilisateur introuvable' })
  if (target.role === 'admin') return res.status(403).json({ error: 'Impossible d\'impersonner un administrateur' })

  const token = jwt.sign(
    { userId: target.id, impersonatedBy: req.user.id, isImpersonation: true },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  )
  res.json({ token, user: target })
})

// ─── Meta subscription management ────────────────────────────────────────────

// GET /api/admin/meta/check-subscriptions
// For each active meta_connection, call Graph API to see which apps are subscribed
router.get('/meta/check-subscriptions', async (req, res) => {
  const { data: connections, error } = await supabase
    .from('meta_connections')
    .select('user_id, page_id, page_name, access_token, is_active')
    .eq('is_active', true)

  if (error) return res.status(500).json({ error: error.message })
  if (!connections || connections.length === 0) {
    return res.json({ message: 'No active meta connections found', results: [] })
  }

  const results = await Promise.all(connections.map(async (conn) => {
    if (!conn.page_id || !conn.access_token) {
      return {
        page_id: conn.page_id,
        page_name: conn.page_name,
        user_id: conn.user_id,
        error: 'Missing page_id or access_token',
        subscribed_apps: null,
      }
    }

    try {
      const url = `https://graph.facebook.com/v18.0/${conn.page_id}/subscribed_apps?access_token=${conn.access_token}`
      console.log(`[admin/meta] Checking subscriptions for page ${conn.page_id} (${conn.page_name})`)
      const apiRes = await fetch(url)
      const data = await apiRes.json()

      return {
        page_id: conn.page_id,
        page_name: conn.page_name,
        user_id: conn.user_id,
        token_prefix: conn.access_token?.slice(0, 20) + '…',
        subscribed_apps: data.data || [],
        raw_response: data,
      }
    } catch (err) {
      return {
        page_id: conn.page_id,
        page_name: conn.page_name,
        user_id: conn.user_id,
        error: err.message,
        subscribed_apps: null,
      }
    }
  }))

  res.json({ total: results.length, results })
})

// POST /api/admin/meta/subscribe-all-pages
// Subscribe the ArchiCRM app to leadgen + leadgen_update for every active page
router.post('/meta/subscribe-all-pages', async (req, res) => {
  const { data: connections, error } = await supabase
    .from('meta_connections')
    .select('user_id, page_id, page_name, access_token, is_active')
    .eq('is_active', true)

  if (error) return res.status(500).json({ error: error.message })
  if (!connections || connections.length === 0) {
    return res.json({ message: 'No active meta connections found', results: [] })
  }

  const results = await Promise.all(connections.map(async (conn) => {
    if (!conn.page_id || !conn.access_token) {
      return {
        page_id: conn.page_id,
        page_name: conn.page_name,
        user_id: conn.user_id,
        success: false,
        error: 'Missing page_id or access_token',
      }
    }

    try {
      // IMPORTANT: must use the PAGE access token, not the user access token
      const url = `https://graph.facebook.com/v18.0/${conn.page_id}/subscribed_apps`
      console.log(`[admin/meta] Subscribing page ${conn.page_id} (${conn.page_name}) using PAGE token`)

      const apiRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          subscribed_fields: 'leadgen,leadgen_update',
          access_token: conn.access_token,  // PAGE access token stored in meta_connections
        }),
      })
      const data = await apiRes.json()
      console.log(`[admin/meta] subscribed_apps response for page ${conn.page_id}:`, JSON.stringify(data))

      if (data.error) {
        return {
          page_id: conn.page_id,
          page_name: conn.page_name,
          user_id: conn.user_id,
          success: false,
          error: data.error,
          raw_response: data,
        }
      }

      return {
        page_id: conn.page_id,
        page_name: conn.page_name,
        user_id: conn.user_id,
        success: data.success === true,
        raw_response: data,
      }
    } catch (err) {
      console.error(`[admin/meta] Network error subscribing page ${conn.page_id}:`, err)
      return {
        page_id: conn.page_id,
        page_name: conn.page_name,
        user_id: conn.user_id,
        success: false,
        error: err.message,
      }
    }
  }))

  const succeeded = results.filter(r => r.success).length
  const failed    = results.filter(r => !r.success).length
  console.log(`[admin/meta] subscribe-all-pages complete — ${succeeded} succeeded, ${failed} failed`)

  res.json({ total: results.length, succeeded, failed, results })
})

module.exports = router
