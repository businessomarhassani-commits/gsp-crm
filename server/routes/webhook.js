const express = require('express')
const crypto = require('crypto')
const supabase = require('../db')
const router = express.Router()

const META_APP_SECRET = process.env.META_APP_SECRET
const META_WEBHOOK_VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'archicrm_webhook_2024'
const IS_PROD = process.env.NODE_ENV === 'production'

// Fuzzy field name → ArchiCRM field mapping
const FIELD_MAP = {
  full_name: 'name', 'full name': 'name', name: 'name', 'nom complet': 'name', nom_complet: 'name',
  first_name: 'first_name', prénom: 'first_name', prenom: 'first_name',
  last_name: 'last_name', nom: 'last_name',
  phone_number: 'phone', phone: 'phone', téléphone: 'phone', telephone: 'phone',
  mobile: 'phone', 'numéro de téléphone': 'phone', numero_telephone: 'phone',
  email: 'email', email_address: 'email',
  city: 'city', ville: 'city',
  project_type: 'project_type', type_projet: 'project_type', 'type de projet': 'project_type',
  budget: 'budget', 'budget estimé': 'budget', budget_estime: 'budget',
}

function mapMetaFields(fieldData) {
  const result = {}
  const nameParts = { first: '', last: '' }

  for (const field of fieldData) {
    const key = (field.name || '').toLowerCase().trim().replace(/\s+/g, '_')
    const keySpaced = (field.name || '').toLowerCase().trim()
    const mapped = FIELD_MAP[key] || FIELD_MAP[keySpaced]
    const value = (field.values || [])[0] || ''
    console.log(`[webhook] field mapping: "${field.name}" → key="${key}" → mapped="${mapped || 'UNKNOWN'}" → value="${value}"`)
    if (!mapped) continue

    if (mapped === 'first_name') nameParts.first = value
    else if (mapped === 'last_name') nameParts.last = value
    else result[mapped] = value
  }

  if (!result.name) {
    const composed = `${nameParts.first} ${nameParts.last}`.trim()
    if (composed) result.name = composed
  }

  return result
}

// GET /api/webhook/test — sanity check
router.get('/test', (req, res) => {
  res.json({ status: 'ok', message: 'webhook route is reachable', env: process.env.NODE_ENV || 'undefined' })
})

// GET /api/webhook/meta — Meta webhook verification challenge
router.get('/meta', (req, res) => {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  console.log('[webhook] GET /meta verification attempt — mode:', mode, 'token:', token)

  if (mode === 'subscribe' && token === META_WEBHOOK_VERIFY_TOKEN) {
    console.log('[webhook] Meta webhook verified ✓')
    return res.status(200).send(challenge)
  }
  console.warn('[webhook] Meta webhook verification FAILED. Received token:', token, '— Expected:', META_WEBHOOK_VERIFY_TOKEN)
  res.status(403).send('Forbidden')
})

// POST /api/webhook/meta — incoming lead event
router.post('/meta', async (req, res) => {
  console.log('[webhook] POST /meta received')
  console.log('[webhook] Headers:', JSON.stringify({
    'content-type':       req.headers['content-type'],
    'x-hub-signature-256': req.headers['x-hub-signature-256'] || '(missing)',
    'user-agent':         req.headers['user-agent'],
  }))

  // Log raw body
  const rawBody = req.body
  const bodyStr = Buffer.isBuffer(rawBody) ? rawBody.toString() : String(rawBody || '')
  console.log('[webhook] Raw body:', bodyStr.slice(0, 2000)) // cap at 2000 chars

  // ── Signature verification ────────────────────────────────────────────────
  if (META_APP_SECRET) {
    const sig = req.headers['x-hub-signature-256']
    if (!sig) {
      if (IS_PROD) {
        console.warn('[webhook] REJECT — Missing x-hub-signature-256 (production mode)')
        return res.status(403).json({ error: 'Missing signature' })
      }
      console.warn('[webhook] WARNING — Missing x-hub-signature-256 (non-production: continuing anyway)')
    } else {
      const expected = 'sha256=' + crypto
        .createHmac('sha256', META_APP_SECRET)
        .update(rawBody)
        .digest('hex')
      console.log('[webhook] Signature check — received:', sig)
      console.log('[webhook] Signature check — expected:', expected)
      if (sig !== expected) {
        if (IS_PROD) {
          console.warn('[webhook] REJECT — Invalid signature (production mode)')
          return res.status(403).json({ error: 'Invalid signature' })
        }
        console.warn('[webhook] WARNING — Signature mismatch (non-production: continuing anyway)')
      } else {
        console.log('[webhook] Signature verified ✓')
      }
    }
  } else {
    console.warn('[webhook] META_APP_SECRET not set — skipping signature verification')
  }

  // Respond immediately — Meta requires fast 200
  res.status(200).send('OK')
  console.log('[webhook] Sent 200 OK to Meta')

  // ── Parse body ────────────────────────────────────────────────────────────
  let payload
  try {
    payload = JSON.parse(bodyStr)
    console.log('[webhook] Parsed payload — object:', JSON.stringify(payload).slice(0, 1000))
  } catch (e) {
    console.error('[webhook] JSON parse error:', e.message, '— body was:', bodyStr.slice(0, 500))
    return
  }

  // ── Route each leadgen change to processLead ──────────────────────────────
  const entries = payload.entry || []
  console.log(`[webhook] entries count: ${entries.length}`)

  for (const entry of entries) {
    console.log(`[webhook] entry id (page_id from Meta): ${entry.id}`)
    const changes = entry.changes || []
    console.log(`[webhook] changes count in entry: ${changes.length}`)

    for (const change of changes) {
      console.log(`[webhook] change.field: "${change.field}" — value:`, JSON.stringify(change.value))
      if (change.field !== 'leadgen') {
        console.log('[webhook] Skipping non-leadgen change field:', change.field)
        continue
      }
      const { leadgen_id, page_id, form_id } = change.value || {}
      console.log(`[webhook] Leadgen event — leadgen_id: ${leadgen_id}, page_id: ${page_id}, form_id: ${form_id}`)

      if (!leadgen_id || !page_id) {
        console.warn('[webhook] Missing leadgen_id or page_id — skipping')
        continue
      }

      processLead({ leadgen_id, page_id, form_id: form_id || null }).catch(err =>
        console.error('[webhook] processLead unhandled error:', err)
      )
    }
  }
})

async function processLead({ leadgen_id, page_id, form_id }) {
  console.log(`[processLead] START — leadgen_id: ${leadgen_id}, page_id: ${page_id}`)

  // 1. Find connection for this page
  console.log(`[processLead] Looking up meta_connections for page_id="${page_id}" is_active=true`)
  const { data: connection, error: connError } = await supabase
    .from('meta_connections')
    .select('user_id, access_token, page_id, page_name')
    .eq('page_id', page_id)
    .eq('is_active', true)
    .single()

  if (connError) {
    console.error(`[processLead] Supabase error looking up connection:`, connError)
  }

  if (!connection) {
    // Also log all active connections so we can compare
    const { data: allConns } = await supabase
      .from('meta_connections')
      .select('page_id, page_name, user_id, is_active')
      .eq('is_active', true)
    console.warn(`[processLead] No active connection found for page_id "${page_id}"`)
    console.warn(`[processLead] All active connections in DB:`, JSON.stringify(allConns || []))
    return
  }

  console.log(`[processLead] Found connection — user_id: ${connection.user_id}, page_name: "${connection.page_name}", stored page_id: "${connection.page_id}"`)
  console.log(`[processLead] page_id match check: webhook="${page_id}" === db="${connection.page_id}" → ${page_id === connection.page_id}`)

  // 2. Check for duplicate
  console.log(`[processLead] Checking for duplicate leadgen_id "${leadgen_id}"`)
  const { data: existing } = await supabase
    .from('meta_leads_log')
    .select('id')
    .eq('meta_lead_id', leadgen_id)
    .maybeSingle()

  if (existing) {
    console.log(`[processLead] Duplicate meta_lead_id ${leadgen_id} — skipping`)
    return
  }
  console.log(`[processLead] No duplicate found — proceeding`)

  // 3. Fetch lead from Meta Graph API
  const graphUrl = `https://graph.facebook.com/v18.0/${leadgen_id}?fields=field_data,created_time&access_token=${connection.access_token}`
  console.log(`[processLead] Fetching from Graph API: https://graph.facebook.com/v18.0/${leadgen_id}?fields=field_data,created_time&access_token=***`)

  let leadData
  try {
    const leadRes = await fetch(graphUrl)
    leadData = await leadRes.json()
    console.log(`[processLead] Graph API response:`, JSON.stringify(leadData).slice(0, 1000))
  } catch (fetchErr) {
    console.error(`[processLead] Network error fetching lead from Graph API:`, fetchErr)
    return
  }

  if (leadData.error) {
    console.error(`[processLead] Graph API returned error for lead ${leadgen_id}:`, JSON.stringify(leadData.error))
    return
  }
  if (!leadData.field_data) {
    console.error(`[processLead] Graph API response missing field_data — full response:`, JSON.stringify(leadData))
    return
  }

  console.log(`[processLead] field_data:`, JSON.stringify(leadData.field_data))

  // 4. Map fields
  const mapped = mapMetaFields(leadData.field_data)
  console.log(`[processLead] Mapped fields:`, JSON.stringify(mapped))
  if (!mapped.name) {
    mapped.name = `Lead Meta Ads ${new Date().toLocaleDateString('fr-FR')}`
    console.log(`[processLead] No name mapped — using fallback: "${mapped.name}"`)
  }

  // 5. Insert lead
  console.log(`[processLead] Inserting lead into DB for user_id ${connection.user_id}`)
  const { data: newLead, error: leadError } = await supabase
    .from('leads')
    .insert({
      user_id: connection.user_id,
      name: mapped.name,
      phone: mapped.phone || null,
      email: mapped.email || null,
      city: mapped.city || null,
      project_type: mapped.project_type || null,
      budget: mapped.budget || null,
      source: 'Meta Ads',
      status: 'Nouveau',
    })
    .select('id')
    .single()

  if (leadError) {
    console.error(`[processLead] DB error inserting lead for meta_lead_id ${leadgen_id}:`, JSON.stringify(leadError))
    return
  }
  console.log(`[processLead] Lead inserted — new lead id: ${newLead.id}`)

  // 6. Insert log entry
  console.log(`[processLead] Inserting meta_leads_log entry`)
  const { error: logError } = await supabase.from('meta_leads_log').insert({
    user_id: connection.user_id,
    lead_id: newLead.id,
    meta_lead_id: leadgen_id,
    form_id,
    page_id,
    raw_data: leadData,
    received_at: new Date().toISOString(),
  })

  if (logError) {
    console.error(`[processLead] DB error inserting meta_leads_log:`, JSON.stringify(logError))
  }

  console.log(`[processLead] ✓ Meta lead ${leadgen_id} → lead ${newLead.id} for user ${connection.user_id}`)
}

module.exports = router
