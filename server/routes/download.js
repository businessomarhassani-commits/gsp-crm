/**
 * download.js — Public download endpoints for ArchiCRM Desktop
 *
 * Routes:
 *   GET /api/download/windows  → redirect to .exe + track in Supabase
 *   GET /api/download/mac      → redirect to .dmg (or 404 if not built)
 *   GET /api/download/stats    → returns download counts (no auth needed, not sensitive)
 *
 * Supabase table required (create manually in Supabase dashboard):
 *   CREATE TABLE download_stats (
 *     id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *     platform     text NOT NULL,          -- 'windows' | 'mac'
 *     downloaded_at timestamptz DEFAULT now(),
 *     ip_address   text
 *   );
 */

const express = require('express')
const router  = express.Router()
const supabase = require('../db')

// ── GitHub releases base URL ──────────────────────────────────────────────────
// Update these when new versions are released
const RELEASES = {
  windows: 'https://github.com/businessomarhassani-commits/gsp-crm/releases/download/v1.0.1/ArchiCRM-Setup.exe',
  mac:     'https://github.com/businessomarhassani-commits/gsp-crm/releases/download/v1.0.1/ArchiCRM-Setup.dmg',
}

// ── Helper: track download in Supabase ───────────────────────────────────────
async function trackDownload(platform, ip) {
  try {
    await supabase.from('download_stats').insert({
      platform,
      downloaded_at: new Date().toISOString(),
      ip_address: ip || null,
    })
  } catch (_) {
    // Silent fail — table may not exist yet; downloads still work
  }
}

// ── GET /api/download/windows ─────────────────────────────────────────────────
router.get('/windows', async (req, res) => {
  if (!RELEASES.windows) {
    return res.status(404).json({ available: false, error: 'Windows version not yet released.' })
  }
  // Fire-and-forget tracking
  trackDownload('windows', req.ip || req.headers['x-forwarded-for'])
  // Redirect to GitHub release — browser will trigger the file download
  res.redirect(302, RELEASES.windows)
})

// ── GET /api/download/mac ─────────────────────────────────────────────────────
router.get('/mac', async (req, res) => {
  if (!RELEASES.mac) {
    return res.status(404).json({ available: false, error: 'Mac version not yet built. Coming soon!' })
  }
  trackDownload('mac', req.ip || req.headers['x-forwarded-for'])
  res.redirect(302, RELEASES.mac)
})

// ── GET /api/download/stats ───────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    // Total counts per platform
    const { data: rows, error } = await supabase
      .from('download_stats')
      .select('platform, downloaded_at')
      .order('downloaded_at', { ascending: false })

    if (error) throw error

    const windows = rows.filter(r => r.platform === 'windows').length
    const mac     = rows.filter(r => r.platform === 'mac').length
    const last    = rows[0]?.downloaded_at || null

    return res.json({ windows, mac, total: windows + mac, last_download: last })
  } catch (_) {
    // Table doesn't exist yet — return zeros
    return res.json({ windows: 0, mac: 0, total: 0, last_download: null })
  }
})

module.exports = router
