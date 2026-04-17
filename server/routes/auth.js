const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid')
const supabase = require('../db')
const { auth } = require('../middleware/auth')
const router = express.Router()

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Tous les champs sont requis' })
  if (password.length < 6)
    return res.status(400).json({ error: 'Mot de passe trop court (min 6 caractères)' })

  const { data: existing } = await supabase
    .from('users').select('id').eq('email', email.toLowerCase()).single()
  if (existing) return res.status(409).json({ error: 'Email déjà utilisé' })

  const hashed = await bcrypt.hash(password, 12)
  const { data: user, error } = await supabase
    .from('users')
    .insert({ name, email: email.toLowerCase(), password: hashed, api_key: uuidv4() })
    .select('id, name, email, role, status, api_key')
    .single()

  if (error) return res.status(500).json({ error: 'Erreur lors de la création du compte' })

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' })
  res.status(201).json({ token, user })
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password)
    return res.status(400).json({ error: 'Email et mot de passe requis' })

  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, role, status, api_key, password')
    .eq('email', email.toLowerCase())
    .single()

  if (error || !user) return res.status(401).json({ error: 'Email ou mot de passe incorrect' })
  if (user.status === 'suspended') return res.status(403).json({ error: 'Compte suspendu' })

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(401).json({ error: 'Email ou mot de passe incorrect' })

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' })
  const { password: _, ...safeUser } = user
  res.json({ token, user: safeUser })
})

// GET /api/auth/me
router.get('/me', auth, (req, res) => {
  const { password, ...safeUser } = req.user
  res.json(safeUser)
})

// PUT /api/auth/profile
router.put('/profile', auth, async (req, res) => {
  const { name, email, password } = req.body
  const updates = {}
  if (name) updates.name = name
  if (email) updates.email = email.toLowerCase()
  if (password) {
    if (password.length < 6) return res.status(400).json({ error: 'Mot de passe trop court (min 6 caractères)' })
    updates.password = await bcrypt.hash(password, 12)
  }
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', req.user.id)
    .select('id, name, email, role, status, api_key')
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

module.exports = router
