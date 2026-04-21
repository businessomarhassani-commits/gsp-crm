const express = require('express')
const bcrypt = require('bcryptjs')
const supabase = require('../db')
const adminAuth = require('../middleware/adminAuth')
const requireSuperAdmin = require('../middleware/requireSuperAdmin')
const router = express.Router()

router.use(adminAuth, requireSuperAdmin)

// GET /api/admin/team
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, name, email, role, permissions, is_active, created_at')
    .order('created_at', { ascending: true })
  if (error) return res.status(500).json({ error: 'Erreur serveur' })
  res.json(data)
})

// POST /api/admin/team
router.post('/', async (req, res) => {
  const { name, email, password, permissions } = req.body
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nom, email et mot de passe requis' })
  }
  const hash = await bcrypt.hash(password, 12)
  const { data, error } = await supabase
    .from('admin_users')
    .insert({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hash,
      role: 'team_member',
      permissions: permissions || { users: false, analytics: false, settings: false },
      is_active: true,
    })
    .select('id, name, email, role, permissions, is_active, created_at')
    .single()

  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Email déjà utilisé' })
    return res.status(500).json({ error: 'Erreur serveur' })
  }
  res.status(201).json(data)
})

// PUT /api/admin/team/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params
  const { data: existing } = await supabase
    .from('admin_users').select('role').eq('id', id).single()
  if (existing?.role === 'superadmin') {
    return res.status(403).json({ error: 'Impossible de modifier le super administrateur' })
  }
  const updates = {}
  if (req.body.name) updates.name = req.body.name.trim()
  if (req.body.email) updates.email = req.body.email.toLowerCase().trim()
  if (req.body.password) updates.password = await bcrypt.hash(req.body.password, 12)
  if (req.body.permissions) updates.permissions = req.body.permissions
  if (typeof req.body.is_active === 'boolean') updates.is_active = req.body.is_active

  const { data, error } = await supabase
    .from('admin_users')
    .update(updates)
    .eq('id', id)
    .select('id, name, email, role, permissions, is_active, created_at')
    .single()
  if (error) return res.status(500).json({ error: 'Erreur serveur' })
  res.json(data)
})

// DELETE /api/admin/team/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params
  if (id === req.adminUser.id) {
    return res.status(400).json({ error: 'Impossible de supprimer votre propre compte' })
  }
  const { data: existing } = await supabase
    .from('admin_users').select('role').eq('id', id).single()
  if (existing?.role === 'superadmin') {
    return res.status(403).json({ error: 'Impossible de supprimer le super administrateur' })
  }
  const { error } = await supabase.from('admin_users').delete().eq('id', id)
  if (error) return res.status(500).json({ error: 'Erreur serveur' })
  res.json({ success: true })
})

module.exports = router
