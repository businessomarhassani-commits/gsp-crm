require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const express = require('express')
const cors = require('cors')
const supabase = require('./db')

const authRoutes = require('./routes/auth')
const leadRoutes = require('./routes/leads')
const clientRoutes = require('./routes/clients')
const reminderRoutes = require('./routes/reminders')
const financeRoutes = require('./routes/finance')
const dashboardRoutes = require('./routes/dashboard')
const adminAuthRoutes = require('./routes/adminAuthRoutes')
const adminTeamRoutes = require('./routes/adminTeam')
const adminRoutes = require('./routes/admin')
const metaRoutes = require('./routes/meta')
const webhookRoutes = require('./routes/webhook')
const landingContentRoutes = require('./routes/landingContent')
const sitesRoutes = require('./routes/sites')
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

// ── Wildcard subdomain routing — MUST be before all API routes ────────────────
// Handles {slug}.archicrm.ma → serves architect site HTML from Supabase
app.use(async (req, res, next) => {
  const host = req.headers.host || ''

  // Only act on *.archicrm.ma requests
  const match = host.match(/^([^.]+)\.archicrm\.ma(?::\d+)?$/)
  if (!match) return next()

  const subdomain = match[1]

  // Skip reserved subdomains — let them fall through to normal routing
  const reserved = ['www', 'app', 'admin', 'api', 'archicrm', '']
  if (reserved.includes(subdomain)) return next()

  // /landing path → landing page type; everything else → vitrine
  const type = req.path === '/landing' ? 'landing' : 'vitrine'

  try {
    // Try exact type first
    const { data } = await supabase
      .from('architect_sites')
      .select('html_content')
      .eq('slug', subdomain)
      .eq('is_active', true)
      .eq('type', type)
      .single()

    if (data?.html_content) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      return res.send(data.html_content)
    }

    // Fallback: try any active site for this slug (regardless of type)
    const { data: fallback } = await supabase
      .from('architect_sites')
      .select('html_content')
      .eq('slug', subdomain)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (fallback?.html_content) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      return res.send(fallback.html_content)
    }

    // 404 — styled ArchiCRM page
    return res.status(404).send(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Site non trouvé — ArchiCRM</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0A0A0A; color: #fff; font-family: Inter, sans-serif;
           display: flex; align-items: center; justify-content: center;
           min-height: 100vh; flex-direction: column; gap: 16px; padding: 24px; text-align: center; }
    h1 { color: #E8A838; font-size: 2rem; font-weight: 700; }
    p  { color: #888; font-size: 1rem; line-height: 1.6; }
    a  { display: inline-block; margin-top: 8px; color: #E8A838; text-decoration: none;
         border: 1px solid #E8A838; padding: 10px 24px; border-radius: 8px; font-weight: 600;
         transition: background 0.15s; }
    a:hover { background: #E8A838; color: #0A0A0A; }
  </style>
</head>
<body>
  <h1>Site non trouvé</h1>
  <p>Ce site n'existe pas encore ou n'a pas encore été publié.</p>
  <a href="https://archicrm.ma">← Retour à ArchiCRM</a>
</body>
</html>`)
  } catch (err) {
    console.error('[subdomain] routing error:', err.message)
    return next()
  }
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/leads', leadRoutes)
app.use('/api/clients', clientRoutes)
app.use('/api/reminders', reminderRoutes)
app.use('/api/finance', financeRoutes)
app.use('/api/dashboard', dashboardRoutes)
// Admin auth routes first (login/me/profile are public or have their own middleware)
app.use('/api/admin', adminAuthRoutes)
// Admin team routes (superadmin only)
app.use('/api/admin/team', adminTeamRoutes)
// General admin routes (adminAuth middleware applied inside)
app.use('/api/admin', adminRoutes)
app.use('/api/meta', metaRoutes)
app.use('/api/webhook', webhookRoutes)
app.use('/api', landingContentRoutes)
app.use('/api/sites', sitesRoutes)

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'ArchiCRM' }))

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Erreur interne du serveur' })
})

module.exports = app
