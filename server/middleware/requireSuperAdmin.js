const requireSuperAdmin = (req, res, next) => {
  if (!req.adminUser || req.adminUser.role !== 'superadmin') {
    return res.status(403).json({ error: 'Accès réservé au super administrateur' })
  }
  next()
}

module.exports = requireSuperAdmin
