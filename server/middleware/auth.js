const jwt = require('jsonwebtoken')
const supabase = require('../db')

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant ou invalide' })
  }
  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Support impersonation tokens: { userId, impersonatedBy, isImpersonation: true }
    const userId = decoded.isImpersonation ? decoded.userId : decoded.id

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role, status, api_key')
      .eq('id', userId)
      .single()
    if (error || !user) return res.status(401).json({ error: 'Utilisateur introuvable' })
    if (user.status === 'suspended') return res.status(403).json({ error: 'Compte suspendu' })

    req.user = {
      ...user,
      isImpersonation: decoded.isImpersonation || false,
      impersonatedBy: decoded.impersonatedBy || null,
    }
    next()
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré' })
  }
}

// API key auth for external lead ingestion
const apiKeyAuth = async (req, res, next) => {
  const apiKey = req.headers['x-api-key']
  if (!apiKey) return res.status(401).json({ error: 'Clé API manquante' })
  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, role, status')
    .eq('api_key', apiKey)
    .single()
  if (error || !user) return res.status(401).json({ error: 'Clé API invalide' })
  if (user.status === 'suspended') return res.status(403).json({ error: 'Compte suspendu' })
  req.user = user
  next()
}

module.exports = { auth, apiKeyAuth }
