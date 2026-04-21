const jwt = require('jsonwebtoken')
const supabase = require('../db')

const adminAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' })
  }
  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (!decoded.adminUserId) {
      return res.status(401).json({ error: 'Token invalide' })
    }
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('id, name, email, role, permissions, is_active')
      .eq('id', decoded.adminUserId)
      .single()
    if (error || !admin || !admin.is_active) {
      return res.status(401).json({ error: 'Accès refusé' })
    }
    req.adminUser = admin
    next()
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré' })
  }
}

module.exports = adminAuth
