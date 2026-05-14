/**
 * sync.js — bidirectional sync between local SQLite and Supabase cloud.
 * Runs every 5 minutes when internet is available.
 * Strategy: last-write-wins using updated_at timestamp.
 */
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://gzdlaugncthmartempcg.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6ZGxhdWduY3RobWFydGVtcGNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNDIxNzgsImV4cCI6MjA5MDkxODE3OH0.rxpQpksuZY8CCJB6s-bLFV2_tVSj5ALePvHA70NxRrY'

const SYNC_TABLES = ['leads', 'clients', 'reminders', 'history']
const SYNC_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

let supabase = null
let syncTimer = null
let db = null
let mainWindow = null
let syncStatus = 'idle' // 'idle' | 'syncing' | 'offline' | 'error'
let pendingCount = 0

function init(database, win) {
  db = database
  mainWindow = win
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

function getPendingCount() {
  try {
    const row = db.prepare('SELECT COUNT(*) as n FROM sync_log WHERE is_synced = 0').get()
    return row?.n || 0
  } catch { return 0 }
}

function updateStatus(status) {
  syncStatus = status
  pendingCount = getPendingCount()
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('sync:status', { status: syncStatus, pending: pendingCount })
  }
}

async function isOnline() {
  try {
    const res = await fetch('https://gzdlaugncthmartempcg.supabase.co/rest/v1/', {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    })
    return res.status < 500
  } catch { return false }
}

// ── PUSH: local → cloud ───────────────────────────────────────────────────────
async function push(cloudUserId) {
  const unsynced = db.prepare(
    'SELECT * FROM sync_log WHERE is_synced = 0 ORDER BY created_at ASC LIMIT 100'
  ).all()

  if (unsynced.length === 0) return

  for (const log of unsynced) {
    try {
      if (log.operation === 'delete') {
        await supabase.from(log.table_name).delete().eq('id', log.record_id).eq('user_id', cloudUserId)
      } else {
        // create / update — get the local record
        const row = db.prepare(`SELECT * FROM ${log.table_name} WHERE id = ?`).get(log.record_id)
        if (row) {
          // Map local user_id (uuid) to the cloud user_id
          const cloudRow = { ...row, user_id: cloudUserId }
          if (cloudRow.password_hash) delete cloudRow.password_hash // never sync password

          await supabase.from(log.table_name).upsert(cloudRow, { onConflict: 'id' })
        }
      }

      // Mark as synced
      db.prepare('UPDATE sync_log SET is_synced = 1, synced_at = ? WHERE id = ?').run(
        new Date().toISOString(), log.id
      )
    } catch (err) {
      console.error('[sync] push error for', log.table_name, log.record_id, err.message)
    }
  }
}

// ── PULL: cloud → local ───────────────────────────────────────────────────────
async function pull(userId, cloudUserId) {
  const lastSync = db.prepare("SELECT value FROM app_settings WHERE key = 'last_sync_time'").get()
  const lastSyncTime = lastSync?.value || '1970-01-01T00:00:00Z'

  for (const table of SYNC_TABLES) {
    try {
      const { data: rows, error } = await supabase
        .from(table)
        .select('*')
        .eq('user_id', cloudUserId)
        .gt('updated_at', lastSyncTime)

      if (error || !rows?.length) continue

      const insertOrUpdate = db.prepare(`
        INSERT INTO ${table} SELECT * FROM json_each(?) ON CONFLICT(id) DO UPDATE SET
          updated_at = CASE WHEN excluded.updated_at > ${table}.updated_at THEN excluded.updated_at ELSE ${table}.updated_at END
      `)
      // Simpler approach: check each row individually
      for (const row of rows) {
        const existing = db.prepare(`SELECT updated_at FROM ${table} WHERE id = ?`).get(row.id)
        const cloudRow = { ...row, user_id: userId } // remap to local user_id

        if (!existing) {
          // Insert new record
          const cols = Object.keys(cloudRow).join(', ')
          const placeholders = Object.keys(cloudRow).map(() => '?').join(', ')
          db.prepare(`INSERT OR IGNORE INTO ${table} (${cols}) VALUES (${placeholders})`).run(
            ...Object.values(cloudRow)
          )
        } else if (new Date(row.updated_at) > new Date(existing.updated_at)) {
          // Cloud is newer — update local
          const sets = Object.keys(cloudRow)
            .filter(k => k !== 'id')
            .map(k => `${k} = ?`)
            .join(', ')
          db.prepare(`UPDATE ${table} SET ${sets} WHERE id = ?`).run(
            ...Object.keys(cloudRow).filter(k => k !== 'id').map(k => cloudRow[k]),
            row.id
          )
        }
      }
    } catch (err) {
      console.error('[sync] pull error for', table, err.message)
    }
  }

  // Update last sync time
  db.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('last_sync_time', ?)").run(
    new Date().toISOString()
  )
}

// ── Full sync cycle ───────────────────────────────────────────────────────────
async function runSync() {
  if (syncStatus === 'syncing') return

  const online = await isOnline()
  if (!online) {
    updateStatus('offline')
    return
  }

  // Get cloud credentials
  const cloudEmail = db.prepare("SELECT value FROM app_settings WHERE key = 'cloud_email'").get()?.value
  const cloudToken = db.prepare("SELECT value FROM app_settings WHERE key = 'cloud_token'").get()?.value
  const cloudUserId = db.prepare("SELECT value FROM app_settings WHERE key = 'cloud_user_id'").get()?.value
  const localUser = db.prepare('SELECT id FROM users LIMIT 1').get()

  if (!cloudToken || !cloudUserId || !localUser) {
    updateStatus('idle')
    return
  }

  updateStatus('syncing')

  try {
    // Set cloud auth token for authenticated requests
    supabase.auth.setSession({ access_token: cloudToken, refresh_token: '' })

    await push(cloudUserId)
    await pull(localUser.id, cloudUserId)

    updateStatus('synced')
    // After a moment, go back to idle
    setTimeout(() => { if (syncStatus === 'synced') updateStatus('idle') }, 3000)
  } catch (err) {
    console.error('[sync] cycle error:', err.message)
    updateStatus('error')
  }
}

// ── Download all cloud data on first setup ────────────────────────────────────
async function downloadCloudData(localUserId, cloudEmail, cloudPassword) {
  // Authenticate with Supabase
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: cloudEmail,
    password: cloudPassword
  })
  if (authError) throw new Error('Identifiants cloud invalides')

  const cloudUserId = authData.user.id
  const cloudToken = authData.session.access_token

  // Store cloud credentials for future syncs
  const setSetting = db.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)")
  setSetting.run('cloud_email', cloudEmail)
  setSetting.run('cloud_user_id', cloudUserId)
  setSetting.run('cloud_token', cloudToken)

  // Download all records from each table
  for (const table of SYNC_TABLES) {
    const { data: rows } = await supabase.from(table).select('*').eq('user_id', cloudUserId)
    if (!rows?.length) continue

    for (const row of rows) {
      const localRow = { ...row, user_id: localUserId }
      const cols = Object.keys(localRow).join(', ')
      const placeholders = Object.keys(localRow).map(() => '?').join(', ')
      db.prepare(`INSERT OR REPLACE INTO ${table} (${cols}) VALUES (${placeholders})`).run(
        ...Object.values(localRow)
      )
    }
  }

  return cloudUserId
}

// ── Merge imported database ──────────────────────────────────────────────────
function mergeDatabase(srcPath) {
  const { Database } = require('better-sqlite3')
  const src = new Database(srcPath, { readonly: true })
  const localUserId = db.prepare('SELECT id FROM users LIMIT 1').get()?.id

  for (const table of SYNC_TABLES) {
    try {
      const rows = src.prepare(`SELECT * FROM ${table}`).all()
      for (const row of rows) {
        const mergeRow = localUserId ? { ...row, user_id: localUserId } : row
        const cols = Object.keys(mergeRow).join(', ')
        const placeholders = Object.keys(mergeRow).map(() => '?').join(', ')
        // On conflict: keep the newer record
        db.prepare(`
          INSERT INTO ${table} (${cols}) VALUES (${placeholders})
          ON CONFLICT(id) DO UPDATE SET
            updated_at = CASE
              WHEN excluded.updated_at > ${table}.updated_at THEN excluded.updated_at
              ELSE ${table}.updated_at
            END
        `).run(...Object.values(mergeRow))
      }
    } catch (err) {
      console.error('[merge] error for', table, err.message)
    }
  }

  src.close()
}

function startAutoSync() {
  if (syncTimer) clearInterval(syncTimer)
  syncTimer = setInterval(runSync, SYNC_INTERVAL_MS)
  // Run once after 10 seconds on startup
  setTimeout(runSync, 10_000)
}

function stopAutoSync() {
  if (syncTimer) { clearInterval(syncTimer); syncTimer = null }
}

function getStatus() {
  return { status: syncStatus, pending: getPendingCount() }
}

module.exports = { init, startAutoSync, stopAutoSync, runSync, downloadCloudData, mergeDatabase, getStatus }
