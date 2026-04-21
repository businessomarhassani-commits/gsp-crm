const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const supabase = require('../db')
const adminAuth = require('../middleware/adminAuth')
const router = express.Router()

// POST /api/admin/login — public
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' })
  }
  const { data: admin, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .eq('is_active', true)
    .single()

  if (error || !admin) {
    return res.status(401).json({ error: 'Identifiants invalides' })
  }
  const valid = await bcrypt.compare(password, admin.password)
  if (!valid) {
    return res.status(401).json({ error: 'Identifiants invalides' })
  }
  const token = jwt.sign(
    { adminUserId: admin.id, role: admin.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
  res.json({
    token,
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions,
    },
  })
})

// GET /api/admin/me — protected
router.get('/me', adminAuth, (req, res) => {
  res.json(req.adminUser)
})

// PUT /api/admin/profile — update own profile
router.put('/profile', adminAuth, async (req, res) => {
  const { name, email, password } = req.body
  const updates = {}
  if (name) updates.name = name.trim()
  if (email) updates.email = email.toLowerCase().trim()
  if (password) updates.password = await bcrypt.hash(password, 12)

  const { data, error } = await supabase
    .from('admin_users')
    .update(updates)
    .eq('id', req.adminUser.id)
    .select('id, name, email, role, permissions, is_active')
    .single()

  if (error) return res.status(500).json({ error: 'Erreur serveur' })
  res.json(data)
})

module.exports = router
