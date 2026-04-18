require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/auth')
const leadRoutes = require('./routes/leads')
const clientRoutes = require('./routes/clients')
const reminderRoutes = require('./routes/reminders')
const financeRoutes = require('./routes/finance')
const dashboardRoutes = require('./routes/dashboard')
const adminRoutes = require('./routes/admin')
const metaRoutes = require('./routes/meta')
const webhookRoutes = require('./routes/webhook')
const { apiKeyAuth: _unused } = require('./middleware/auth') // kept for potential future use

const app = express()

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}))

// express.json() with verify callback — captures raw body for webhook HMAC verification.
// This is the Vercel-compatible pattern: no separate express.raw() needed.
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf
  }
}))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/leads', leadRoutes)
app.use('/api/clients', clientRoutes)
app.use('/api/reminders', reminderRoutes)
app.use('/api/finance', financeRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/meta', metaRoutes)
app.use('/api/webhook', webhookRoutes)

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'ArchiCRM' }))

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Erreur interne du serveur' })
})

module.exports = app
