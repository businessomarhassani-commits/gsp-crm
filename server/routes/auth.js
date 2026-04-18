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
    .insert({ name, email: email.toLowerCase(), password: hashed, api_key: uuidv4(), account_status: 'pending' })
    .select('id, name, email, role, status, account_status')
    .single()

  if (error) return res.status(500).json({ error: 'Erreur lors de la création du compte' })

  // Do NOT return a token — account must be approved by admin first
  res.status(201).json({
    pending: true,
    message: "Votre compte est en attente d'approbation par l'administrateur. Vous recevrez une confirmation sous 24h.",
  })
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password)
    return res.status(400).json({ error: 'Email et mot de passe requis' })

  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, role, status, account_status, api_key, password')
    .eq('email', email.toLowerCase())
    .single()

  if (error || !user) return res.status(401).json({ error: 'Email ou mot de passe incorrect' })

  if (user.account_status === 'pending') {
    return res.status(403).json({ error: "Votre compte est en attente d'approbation par l'administrateur." })
  }
  if (user.account_status === 'suspended' || user.status === 'suspended') {
    return res.status(403).json({ error: "Votre compte a été suspendu. Contactez l'administrateur." })
  }

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

// PUT /api/auth/profile — update name / email only
router.put('/profile', auth, async (req, res) => {
  const { name, email } = req.body
  const updates = {}
  if (name) updates.name = name
  if (email) updates.email = email.toLowerCase()
  const { data, error } = await supabase
    .from('users').update(updates).eq('id', req.user.id)
    .select('id, name, email, role, status, account_status, api_key').single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// PUT /api/auth/password — change password with current-password verification
router.put('/password', auth, async (req, res) => {
  const { current_password, new_password } = req.body
  if (!current_password || !new_password)
    return res.status(400).json({ error: 'Mot de passe actuel et nouveau mot de passe requis' })
  if (new_password.length < 8)
    return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caractères' })

  const { data: user } = await supabase.from('users').select('password').eq('id', req.user.id).single()
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

  const valid = await bcrypt.compare(current_password, user.password)
  if (!valid) return res.status(401).json({ error: 'Mot de passe actuel incorrect' })

  const hashed = await bcrypt.hash(new_password, 12)
  const { error } = await supabase.from('users').update({ password: hashed }).eq('id', req.user.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
})

// PUT /api/auth/force-password — admin sets user password via impersonation (no current password required)
router.put('/force-password', auth, async (req, res) => {
  if (!req.user.isImpersonation) {
    return res.status(403).json({ error: 'Réservé aux sessions d\'administration' })
  }
  const { new_password } = req.body
  if (!new_password) return res.status(400).json({ error: 'Nouveau mot de passe requis' })
  if (new_password.length < 8) return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères' })

  const hashed = await bcrypt.hash(new_password, 12)
  const { error } = await supabase.from('users').update({ password: hashed }).eq('id', req.user.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
})

module.exports = router
