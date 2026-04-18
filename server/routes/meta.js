const express = require('express')
const supabase = require('../db')
const { auth } = require('../middleware/auth')
const router = express.Router()

const META_APP_ID = process.env.META_APP_ID
const META_APP_SECRET = process.env.META_APP_SECRET
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://project-ibkk1.vercel.app'

// Subscribe the ArchiCRM app to leadgen events for a given page
async function subscribePageToLeadgen(pageId, pageAccessToken) {
  const url = `https://graph.facebook.com/v18.0/${pageId}/subscribed_apps`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      subscribed_fields: 'leadgen',
      access_token: pageAccessToken,
    }),
  })
  const data = await res.json()
  if (data.error) {
    console.error(`subscribed_apps error for page ${pageId}:`, data.error)
    return { success: false, error: data.error }
  }
  console.log(`✓ Subscribed app to leadgen for page ${pageId}:`, data)
  return { success: true }
}

// The callback URL must match exactly what is registered in the Meta App dashboard
function callbackUrl(req) {
  const base = process.env.SERVER_URL || FRONTEND_URL
  return `${base}/api/meta/callback`
}

// GET /api/meta/auth-url — returns Meta OAuth URL
router.get('/auth-url', auth, (req, res) => {
  if (!META_APP_ID) {
    return res.status(503).json({ error: 'Meta App ID not configured. Add META_APP_ID to environment variables.' })
  }
  const params = new URLSearchParams({
    client_id: META_APP_ID,
    redirect_uri: callbackUrl(req),
    scope: 'leads_retrieval,pages_manage_ads,pages_show_list,pages_read_engagement,pages_manage_metadata,business_management,pages_manage_posts',
    state: req.user.id,
    response_type: 'code',
  })
  res.json({ url: `https://www.facebook.com/v18.0/dialog/oauth?${params}` })
})

// GET /api/meta/callback — OAuth code exchange (public, called by Meta redirect)
router.get('/callback', async (req, res) => {
  const { code, state: userId, error: oauthError } = req.query

  if (oauthError || !code || !userId) {
    console.error('Meta OAuth error:', oauthError)
    return res.redirect(`${FRONTEND_URL}/integrations?meta=error`)
  }

  try {
    // 1. Exchange code for short-lived token
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?${new URLSearchParams({
      client_id: META_APP_ID,
      redirect_uri: callbackUrl(req),
      client_secret: META_APP_SECRET,
      code,
    })}`
    const tokenRes = await fetch(tokenUrl)
    const tokenData = await tokenRes.json()
    if (tokenData.error || !tokenData.access_token) {
      console.error('Meta token exchange error:', tokenData)
      return res.redirect(`${FRONTEND_URL}/integrations?meta=error`)
    }

    // 2. Exchange for long-lived token (60 days)
    const longTokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?${new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: META_APP_ID,
      client_secret: META_APP_SECRET,
      fb_exchange_token: tokenData.access_token,
    })}`
    const longTokenRes = await fetch(longTokenUrl)
    const longTokenData = await longTokenRes.json()
    const userLongToken = longTokenData.access_token || tokenData.access_token

    // 3. Get ALL user's pages (paginate through all results)
    const allPages = []
    let nextUrl = `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,category&limit=100&access_token=${userLongToken}`
    while (nextUrl) {
      const pagesRes = await fetch(nextUrl)
      const pagesData = await pagesRes.json()
      if (pagesData.error) {
        console.error('Meta pages fetch error:', pagesData.error)
        break
      }
      const batch = pagesData.data || []
      allPages.push(...batch)
      nextUrl = pagesData.paging?.next || null
    }
    const pages = allPages

    console.log(`Meta OAuth: found ${pages.length} page(s) for user ${userId}`)

    if (pages.length === 0) {
      return res.redirect(`${FRONTEND_URL}/integrations?meta=no_pages`)
    }

    // 4a. Single page → auto-connect
    if (pages.length === 1) {
      const page = pages[0]
      await supabase.from('meta_connections').upsert({
        user_id: userId,
        page_id: page.id,
        page_name: page.name,
        access_token: page.access_token,
        form_ids: [],
        pending_pages: null,
        is_active: true,
        connected_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      // Subscribe app to leadgen events for this page
      await subscribePageToLeadgen(page.id, page.access_token)
      return res.redirect(`${FRONTEND_URL}/integrations?meta=success`)
    }

    // 4b. Multiple pages → store as pending, user selects
    const pendingPages = pages.map(p => ({ id: p.id, name: p.name, token: p.access_token }))
    await supabase.from('meta_connections').upsert({
      user_id: userId,
      page_id: null,
      page_name: null,
      access_token: null,
      form_ids: [],
      pending_pages: pendingPages,
      is_active: false,
      connected_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    return res.redirect(`${FRONTEND_URL}/integrations?meta=select`)
  } catch (err) {
    console.error('Meta callback error:', err)
    res.redirect(`${FRONTEND_URL}/integrations?meta=error`)
  }
})

// GET /api/meta/connection — current user's active connection
router.get('/connection', auth, async (req, res) => {
  const { data } = await supabase
    .from('meta_connections')
    .select('id, page_id, page_name, form_ids, connected_at, is_active, pending_pages')
    .eq('user_id', req.user.id)
    .single()

  if (!data) return res.json(null)

  // Count leads received via Meta for this user
  const { count } = await supabase
    .from('meta_leads_log')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', req.user.id)

  res.json({ ...data, meta_leads_count: count || 0 })
})

// GET /api/meta/pending-pages — pages awaiting selection
router.get('/pending-pages', auth, async (req, res) => {
  const { data } = await supabase
    .from('meta_connections')
    .select('pending_pages')
    .eq('user_id', req.user.id)
    .eq('is_active', false)
    .single()

  const pages = (data?.pending_pages || []).map(p => ({ id: p.id, name: p.name })) // omit tokens
  res.json(pages)
})

// POST /api/meta/select-page — activate a chosen page from pending list
router.post('/select-page', auth, async (req, res) => {
  const { page_id } = req.body
  if (!page_id) return res.status(400).json({ error: 'page_id requis' })

  // Fetch the pending record to get the token for selected page
  const { data: pending } = await supabase
    .from('meta_connections')
    .select('pending_pages')
    .eq('user_id', req.user.id)
    .single()

  const page = (pending?.pending_pages || []).find(p => p.id === page_id)
  if (!page) return res.status(404).json({ error: 'Page introuvable' })

  const { data, error } = await supabase
    .from('meta_connections')
    .update({
      page_id: page.id,
      page_name: page.name,
      access_token: page.token,
      pending_pages: null,
      is_active: true,
      connected_at: new Date().toISOString(),
    })
    .eq('user_id', req.user.id)
    .select('id, page_id, page_name, form_ids, connected_at, is_active')
    .single()

  if (error) return res.status(500).json({ error: error.message })

  // Subscribe app to leadgen events for the newly activated page
  await subscribePageToLeadgen(page.id, page.token)

  res.json(data)
})

// POST /api/meta/subscribe-page — (re)subscribe app to leadgen for user's active page
router.post('/subscribe-page', auth, async (req, res) => {
  const { data: connection } = await supabase
    .from('meta_connections')
    .select('page_id, access_token')
    .eq('user_id', req.user.id)
    .eq('is_active', true)
    .single()

  if (!connection || !connection.page_id) {
    return res.status(404).json({ error: 'Aucune page active trouvée. Reconnectez votre compte Meta.' })
  }
  if (!connection.access_token) {
    return res.status(400).json({ error: 'Token d\'accès manquant. Reconnectez votre compte Meta.' })
  }

  const result = await subscribePageToLeadgen(connection.page_id, connection.access_token)
  if (!result.success) {
    return res.status(502).json({ error: 'Échec de la souscription Meta.', detail: result.error })
  }
  res.json({ success: true, page_id: connection.page_id })
})

// DELETE /api/meta/connection — disconnect
router.delete('/connection', auth, async (req, res) => {
  await supabase
    .from('meta_connections')
    .update({ is_active: false, page_id: null, page_name: null, access_token: null, pending_pages: null })
    .eq('user_id', req.user.id)
  res.json({ success: true })
})

module.exports = router
