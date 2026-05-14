/**
 * ArchiCRM Desktop — offline-first Electron main process.
 * Embeds React frontend + SQLite backend.
 * All data lives in: %LOCALAPPDATA%/ArchiCRM/data.db
 */
const { app, BrowserWindow, ipcMain, dialog, Menu, shell, nativeTheme } = require('electron')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const Database = require('better-sqlite3')
const { initDatabase } = require('./db/schema')
const sync = require('./sync/sync')

// ── Database singleton ────────────────────────────────────────────────────────
let db
let mainWindow
let splashWindow

// ── Helpers ───────────────────────────────────────────────────────────────────
const now = () => new Date().toISOString()
const uid = () => crypto.randomUUID()

function logSync(table, recordId, operation) {
  try {
    db.prepare(
      'INSERT OR IGNORE INTO sync_log (id, table_name, record_id, operation, created_at) VALUES (?,?,?,?,?)'
    ).run(uid(), table, recordId, operation, now())
  } catch {}
}

function getSetting(key) {
  return db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key)?.value ?? null
}
function setSetting(key, value) {
  db.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)').run(key, String(value))
}

// ── Window helpers ────────────────────────────────────────────────────────────
const SETTINGS_FILE = path.join(app.getPath('userData'), 'window.json')
function loadWinBounds() {
  try { return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')) } catch { return {} }
}
function saveWinBounds(win) {
  if (!win || win.isDestroyed()) return
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ ...win.getBounds(), maximized: win.isMaximized() }))
}

// ── Splash ────────────────────────────────────────────────────────────────────
function createSplash() {
  splashWindow = new BrowserWindow({
    width: 420, height: 280, frame: false, resizable: false,
    center: true, alwaysOnTop: true, skipTaskbar: true,
    backgroundColor: '#0A0A0A',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  })
  splashWindow.loadFile('splash.html')
}
function closeSplash() {
  if (splashWindow && !splashWindow.isDestroyed()) { splashWindow.close(); splashWindow = null }
}

// ── Dev / prod detection ──────────────────────────────────────────────────────
const isDev = !app.isPackaged

// ── Client dist path ──────────────────────────────────────────────────────────
function getClientDist() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'client', 'dist')
    : path.join(__dirname, '..', 'client', 'dist')
}

// ── Main window ───────────────────────────────────────────────────────────────
function createWindow() {
  const bounds = loadWinBounds()
  mainWindow = new BrowserWindow({
    width: bounds.width || 1280, height: bounds.height || 800,
    x: bounds.x, y: bounds.y,
    minWidth: 900, minHeight: 600, show: false,
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    title: 'ArchiCRM',
    backgroundColor: '#0A0A0A',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false // allow file:// relative assets
    }
  })

  if (bounds.maximized) mainWindow.maximize()

  // Persist bounds
  mainWindow.on('resize', () => saveWinBounds(mainWindow))
  mainWindow.on('move', () => saveWinBounds(mainWindow))
  mainWindow.on('maximize', () => saveWinBounds(mainWindow))
  mainWindow.on('unmaximize', () => saveWinBounds(mainWindow))

  // Load the React app ─────────────────────────────────────────────────────────
  // In dev: use Vite dev server if running (hot reload); fall back to built dist.
  // In prod (packaged): always use the bundled dist from extraResources.
  if (isDev) {
    // Try Vite dev server first; fall back to built dist
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      const indexPath = path.join(getClientDist(), 'index.html')
      console.log('[main] Vite not running, loading built dist:', indexPath)
      mainWindow.loadFile(indexPath)
    })
  } else {
    const indexPath = path.join(getClientDist(), 'index.html')
    console.log('[main] Loading packaged dist:', indexPath)
    mainWindow.loadFile(indexPath)
  }

  // External links open in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Show window after content loads; close splash
  mainWindow.webContents.on('did-finish-load', () => {
    closeSplash()
    mainWindow.show()
    if (isDev) mainWindow.webContents.openDevTools()
  })

  // On load failure: show a styled error page so we know exactly what went wrong
  mainWindow.webContents.on('did-fail-load', (_event, code, description, url) => {
    console.error('[main] did-fail-load:', code, description, url)
    closeSplash()
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
      <!DOCTYPE html>
      <html>
      <head><style>
        body{background:#0A0A0A;color:#fff;font-family:sans-serif;display:flex;
             align-items:center;justify-content:center;min-height:100vh;flex-direction:column;gap:12px}
        h1{color:#E8A838;font-size:1.4rem}
        pre{background:#111;border:1px solid #333;padding:16px;border-radius:8px;font-size:12px;color:#aaa;max-width:600px;word-break:break-all}
        p{color:#666;font-size:13px}
      </style></head>
      <body>
        <h1>⚠ Impossible de charger ArchiCRM</h1>
        <pre>Erreur : ${description}\nCode : ${code}\nURL : ${url}</pre>
        <p>Vérifiez que client/dist/index.html existe et relancez l'application.</p>
      </body>
      </html>
    `)}`)
    mainWindow.show()
  })

  mainWindow.on('closed', () => { mainWindow = null })

  buildMenu()

  // Start sync engine
  sync.init(db, mainWindow)
  sync.startAutoSync()
}

// ── Application menu ──────────────────────────────────────────────────────────
function buildMenu() {
  const template = [
    {
      label: 'Fichier',
      submenu: [
        { label: 'Déconnexion', accelerator: 'Ctrl+Shift+L', click: () => mainWindow?.webContents.send('app:logout') },
        { type: 'separator' },
        {
          label: 'Exporter les données (USB/Backup)',
          click: async () => {
            const { filePath } = await dialog.showSaveDialog(mainWindow, {
              title: 'Exporter ArchiCRM — choisir destination',
              defaultPath: `ArchiCRM-backup-${new Date().toISOString().slice(0,10)}.db`,
              filters: [{ name: 'Base de données', extensions: ['db'] }]
            })
            if (!filePath) return
            const dbPath = path.join(app.getPath('userData'), 'data.db')
            fs.copyFileSync(dbPath, filePath)
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Export réussi',
              message: `Données exportées vers :\n${filePath}`,
              buttons: ['OK']
            })
          }
        },
        {
          label: 'Importer des données (fusion)',
          click: async () => {
            const { filePaths } = await dialog.showOpenDialog(mainWindow, {
              title: 'Importer une base de données ArchiCRM',
              filters: [{ name: 'Base de données', extensions: ['db'] }],
              properties: ['openFile']
            })
            if (!filePaths?.length) return
            const { response } = await dialog.showMessageBox(mainWindow, {
              type: 'question',
              title: 'Confirmer l\'import',
              message: 'Fusionner avec les données existantes ?',
              detail: 'Les enregistrements plus récents seront conservés (last-write-wins). Vos données actuelles ne seront pas effacées.',
              buttons: ['Annuler', 'Fusionner'],
              defaultId: 1
            })
            if (response !== 1) return
            try {
              sync.mergeDatabase(filePaths[0])
              mainWindow?.webContents.send('app:refresh')
              dialog.showMessageBox(mainWindow, { type: 'info', title: 'Import réussi', message: 'Données importées et fusionnées avec succès.', buttons: ['OK'] })
            } catch (err) {
              dialog.showErrorBox('Erreur import', err.message)
            }
          }
        },
        { type: 'separator' },
        { label: 'Quitter ArchiCRM', accelerator: 'Ctrl+Q', click: () => app.quit() }
      ]
    },
    {
      label: 'Affichage',
      submenu: [
        { label: 'Actualiser', accelerator: 'F5', click: () => mainWindow?.webContents.reload() },
        { type: 'separator' },
        { label: 'Zoom avant', accelerator: 'Ctrl+=', click: () => { const z = mainWindow?.webContents.getZoomFactor(); mainWindow?.webContents.setZoomFactor(Math.min(+(z+0.1).toFixed(1), 2)) } },
        { label: 'Zoom arrière', accelerator: 'Ctrl+-', click: () => { const z = mainWindow?.webContents.getZoomFactor(); mainWindow?.webContents.setZoomFactor(Math.max(+(z-0.1).toFixed(1), 0.5)) } },
        { label: 'Taille normale', accelerator: 'Ctrl+0', click: () => mainWindow?.webContents.setZoomFactor(1) },
        { type: 'separator' },
        { label: 'Plein écran', accelerator: 'F11', click: () => mainWindow?.setFullScreen(!mainWindow?.isFullScreen()) },
        { label: 'Outils développeur', accelerator: 'Ctrl+Shift+I', click: () => mainWindow?.webContents.toggleDevTools() }
      ]
    },
    {
      label: 'Synchronisation',
      submenu: [
        { label: 'Synchroniser maintenant', accelerator: 'Ctrl+Shift+S', click: () => sync.runSync() },
        { label: 'Statut de sync', click: () => {
          const s = sync.getStatus()
          dialog.showMessageBox(mainWindow, {
            type: 'info', title: 'Statut de synchronisation',
            message: `État : ${s.status}\nModifications en attente : ${s.pending}`, buttons: ['OK']
          })
        }}
      ]
    },
    {
      label: 'Aide',
      submenu: [
        { label: "À propos d'ArchiCRM", click: () => {
          dialog.showMessageBox(mainWindow, {
            type: 'info', title: "À propos d'ArchiCRM Desktop",
            message: 'ArchiCRM Desktop',
            detail: `Version : ${app.getVersion()}\nMode : Hors ligne (SQLite)\nBase de données : ${path.join(app.getPath('userData'), 'data.db')}\n\nCRM professionnel pour architectes marocains.`,
            buttons: ['OK'], icon: path.join(__dirname, 'assets', 'icon.ico')
          })
        }}
      ]
    }
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// ── Register all IPC handlers ─────────────────────────────────────────────────
function registerIpcHandlers() {

  // ── AUTH ──────────────────────────────────────────────────────────────────

  ipcMain.handle('db:auth:login', async (_, { email, password }) => {
    try {
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim())
      if (!user) return { error: 'Email ou mot de passe incorrect' }
      const valid = bcrypt.compareSync(password, user.password_hash)
      if (!valid) return { error: 'Email ou mot de passe incorrect' }
      const { password_hash: _, ...safe } = user
      return { user: safe, token: `desktop:${user.id}` }
    } catch (err) { return { error: err.message } }
  })

  ipcMain.handle('db:auth:createUser', async (_, { name, email, password }) => {
    try {
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase())
      if (existing) return { error: 'Email déjà utilisé' }
      const hash = bcrypt.hashSync(password, 12)
      const id = uid(); const t = now()
      db.prepare(
        'INSERT INTO users (id,name,email,password_hash,role,plan,account_status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)'
      ).run(id, name, email.toLowerCase(), hash, 'user', 'pro', 'active', t, t)
      setSetting('setup_done', '1')
      const user = db.prepare('SELECT id,name,email,role,plan,account_status,created_at FROM users WHERE id=?').get(id)
      return { user, token: `desktop:${id}` }
    } catch (err) { return { error: err.message } }
  })

  ipcMain.handle('db:auth:getUser', async (_, userId) => {
    if (!userId) return null
    const user = db.prepare('SELECT id,name,email,role,plan,account_status,api_key,created_at FROM users WHERE id=?').get(userId)
    return user || null
  })

  ipcMain.handle('db:auth:updateProfile', async (_, userId, { name, email }) => {
    const t = now()
    db.prepare('UPDATE users SET name=?,email=?,updated_at=? WHERE id=?').run(name, email?.toLowerCase() || undefined, t, userId)
    return db.prepare('SELECT id,name,email,role,plan,account_status FROM users WHERE id=?').get(userId)
  })

  ipcMain.handle('db:auth:updatePassword', async (_, userId, currentPass, newPass) => {
    const user = db.prepare('SELECT password_hash FROM users WHERE id=?').get(userId)
    if (!user) return { error: 'Utilisateur introuvable' }
    const valid = bcrypt.compareSync(currentPass, user.password_hash)
    if (!valid) return { error: 'Mot de passe actuel incorrect' }
    const hash = bcrypt.hashSync(newPass, 12)
    db.prepare('UPDATE users SET password_hash=?,updated_at=? WHERE id=?').run(hash, now(), userId)
    return { success: true }
  })

  // ── LEADS ─────────────────────────────────────────────────────────────────

  ipcMain.handle('db:leads:getAll', async (_, userId, params = {}) => {
    let sql = 'SELECT * FROM leads WHERE user_id=?'
    const args = [userId]
    if (params.status) { sql += ' AND status=?'; args.push(params.status) }
    if (params.search) { sql += ' AND name LIKE ?'; args.push(`%${params.search}%`) }
    sql += ' ORDER BY created_at DESC'
    return db.prepare(sql).all(...args)
  })

  ipcMain.handle('db:leads:getById', async (_, id) => {
    const lead = db.prepare('SELECT * FROM leads WHERE id=?').get(id)
    if (!lead) return null
    lead.history = db.prepare('SELECT * FROM history WHERE lead_id=? ORDER BY created_at DESC').all(id)
    return lead
  })

  ipcMain.handle('db:leads:create', async (_, data) => {
    const id = uid(); const t = now()
    db.prepare(`INSERT INTO leads
      (id,user_id,name,phone,email,project_type,city,budget,status,source,notes,last_contact_date,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).run(id, data.user_id, data.name, data.phone||null, data.email||null, data.project_type||null,
      data.city||null, data.budget||null, data.status||'Nouveau', data.source||null, data.notes||null,
      data.last_contact_date||null, t, t)
    logSync('leads', id, 'create')
    // Log history
    db.prepare('INSERT INTO history (id,user_id,lead_id,action,description,created_at) VALUES (?,?,?,?,?,?)')
      .run(uid(), data.user_id, id, 'Nouveau lead', `Lead créé : ${data.name}`, t)
    return db.prepare('SELECT * FROM leads WHERE id=?').get(id)
  })

  ipcMain.handle('db:leads:update', async (_, id, data) => {
    const existing = db.prepare('SELECT status,name,user_id FROM leads WHERE id=?').get(id)
    if (!existing) return null
    const t = now()
    const sets = Object.keys(data)
      .filter(k => !['id','user_id','created_at'].includes(k))
      .map(k => `${k}=?`).join(', ')
    const vals = Object.keys(data)
      .filter(k => !['id','user_id','created_at'].includes(k))
      .map(k => data[k])
    db.prepare(`UPDATE leads SET ${sets}, updated_at=? WHERE id=?`).run(...vals, t, id)
    logSync('leads', id, 'update')

    // Auto-create client when lead status → Gagné
    if (data.status === 'Gagné' && existing.status !== 'Gagné') {
      const existing2 = db.prepare('SELECT id FROM clients WHERE lead_id=?').get(id)
      if (!existing2) {
        const lead = db.prepare('SELECT * FROM leads WHERE id=?').get(id)
        const clientId = uid()
        db.prepare(`INSERT INTO clients
          (id,user_id,lead_id,name,phone,email,project_type,city,closing_date,project_value,created_at,updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,0,?,?)`
        ).run(clientId, existing.user_id, id, lead.name, lead.phone, lead.email,
          lead.project_type, lead.city, t.slice(0,10), t, t)
        logSync('clients', clientId, 'create')
        db.prepare('INSERT INTO history (id,user_id,lead_id,client_id,action,description,created_at) VALUES (?,?,?,?,?,?,?)')
          .run(uid(), existing.user_id, id, clientId, 'Client gagné', `${lead.name} converti en client`, t)
      }
    }

    // Status change history
    if (data.status && data.status !== existing.status) {
      db.prepare('INSERT INTO history (id,user_id,lead_id,action,description,created_at) VALUES (?,?,?,?,?,?)')
        .run(uid(), existing.user_id, id, 'Changement de statut', `${existing.status} → ${data.status}`, t)
    }

    return db.prepare('SELECT * FROM leads WHERE id=?').get(id)
  })

  ipcMain.handle('db:leads:delete', async (_, id, userId) => {
    db.prepare('DELETE FROM leads WHERE id=? AND user_id=?').run(id, userId)
    logSync('leads', id, 'delete')
    return { success: true }
  })

  // ── CLIENTS ───────────────────────────────────────────────────────────────

  ipcMain.handle('db:clients:getAll', async (_, userId, params = {}) => {
    let sql = 'SELECT * FROM clients WHERE user_id=?'
    const args = [userId]
    if (params.search) { sql += ' AND name LIKE ?'; args.push(`%${params.search}%`) }
    sql += ' ORDER BY created_at DESC'
    return db.prepare(sql).all(...args)
  })

  ipcMain.handle('db:clients:getById', async (_, id) => {
    const client = db.prepare('SELECT * FROM clients WHERE id=?').get(id)
    if (!client) return null
    client.history = db.prepare('SELECT * FROM history WHERE client_id=? ORDER BY created_at DESC').all(id)
    client.reminders = db.prepare('SELECT * FROM reminders WHERE client_id=? ORDER BY reminder_date ASC').all(id)
    return client
  })

  ipcMain.handle('db:clients:update', async (_, id, data) => {
    const t = now()
    const sets = Object.keys(data).filter(k => k !== 'id').map(k => `${k}=?`).join(', ')
    const vals = Object.keys(data).filter(k => k !== 'id').map(k => data[k])
    db.prepare(`UPDATE clients SET ${sets}, updated_at=? WHERE id=?`).run(...vals, t, id)
    logSync('clients', id, 'update')
    return db.prepare('SELECT * FROM clients WHERE id=?').get(id)
  })

  ipcMain.handle('db:clients:delete', async (_, id, userId) => {
    db.prepare('DELETE FROM clients WHERE id=? AND user_id=?').run(id, userId)
    logSync('clients', id, 'delete')
    return { success: true }
  })

  // ── REMINDERS ─────────────────────────────────────────────────────────────

  ipcMain.handle('db:reminders:getAll', async (_, userId) => {
    const rows = db.prepare(`
      SELECT r.*, c.name as client_name
      FROM reminders r
      LEFT JOIN clients c ON r.client_id = c.id
      WHERE r.user_id=?
      ORDER BY r.reminder_date ASC
    `).all(userId)
    return {
      pending: rows.filter(r => r.status === 'pending'),
      done: rows.filter(r => r.status === 'done')
    }
  })

  ipcMain.handle('db:reminders:create', async (_, data) => {
    const id = uid(); const t = now()
    db.prepare(`INSERT INTO reminders
      (id,user_id,title,description,reminder_date,status,lead_id,client_id,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)`
    ).run(id, data.user_id, data.title, data.description||null, data.reminder_date,
      data.status||'pending', data.lead_id||null, data.client_id||null, t, t)
    logSync('reminders', id, 'create')
    return db.prepare('SELECT * FROM reminders WHERE id=?').get(id)
  })

  ipcMain.handle('db:reminders:update', async (_, id, data) => {
    const t = now()
    const sets = Object.keys(data).filter(k => k !== 'id').map(k => `${k}=?`).join(', ')
    const vals = Object.keys(data).filter(k => k !== 'id').map(k => data[k])
    db.prepare(`UPDATE reminders SET ${sets}, updated_at=? WHERE id=?`).run(...vals, t, id)
    logSync('reminders', id, 'update')
    return db.prepare('SELECT * FROM reminders WHERE id=?').get(id)
  })

  ipcMain.handle('db:reminders:delete', async (_, id, userId) => {
    db.prepare('DELETE FROM reminders WHERE id=? AND user_id=?').run(id, userId)
    logSync('reminders', id, 'delete')
    return { success: true }
  })

  // ── DASHBOARD ─────────────────────────────────────────────────────────────

  ipcMain.handle('db:dashboard:getStats', async (_, userId) => {
    const leads = db.prepare('SELECT id,name,project_type,status,created_at,budget,city,source FROM leads WHERE user_id=? ORDER BY created_at DESC').all(userId)
    const clients = db.prepare('SELECT project_value,closing_date FROM clients WHERE user_id=?').all(userId)
    const reminders = db.prepare(`SELECT id,title,description,reminder_date,lead_id,client_id FROM reminders WHERE user_id=? AND status='pending' ORDER BY reminder_date ASC LIMIT 5`).all(userId)

    const totalLeads = leads.length
    const wonLeads = leads.filter(l => l.status === 'Gagné').length
    const totalRevenue = clients.reduce((s, c) => s + (Number(c.project_value)||0), 0)
    const clientCount = clients.length
    const avgDeal = clientCount > 0 ? totalRevenue / clientCount : 0
    const conversionRate = totalLeads > 0 ? +((wonLeads/totalLeads)*100).toFixed(1) : 0

    const monthLabels = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth()-i)
      months.push({ label: monthLabels[d.getMonth()], year: d.getFullYear(), month: d.getMonth()+1, leads: 0, clients: 0 })
    }
    leads.forEach(l => {
      if (!l.created_at) return
      const d = new Date(l.created_at)
      const m = months.find(m => m.year===d.getFullYear() && m.month===d.getMonth()+1)
      if (m) m.leads++
    })
    clients.forEach(c => {
      if (!c.closing_date) return
      const d = new Date(c.closing_date)
      const m = months.find(m => m.year===d.getFullYear() && m.month===d.getMonth()+1)
      if (m) m.clients++
    })
    const statusCounts = {}
    leads.forEach(l => { statusCounts[l.status] = (statusCounts[l.status]||0)+1 })
    const status_distribution = Object.entries(statusCounts).map(([status,count])=>({status,count}))

    return { total_revenue: totalRevenue, closed_clients: clientCount, average_deal_value: avgDeal,
      conversion_rate: conversionRate, total_leads: totalLeads, won_leads: wonLeads,
      monthly_chart: months, status_distribution, recent_leads: leads.slice(0,5), upcoming_reminders: reminders }
  })

  // ── FINANCE ───────────────────────────────────────────────────────────────

  ipcMain.handle('db:finance:summary', async (_, userId, params={}) => {
    let sql = 'SELECT project_value FROM clients WHERE user_id=?'
    const args = [userId]
    if (params.from) { sql += ' AND closing_date>=?'; args.push(params.from) }
    if (params.to) { sql += ' AND closing_date<=?'; args.push(params.to) }
    const rows = db.prepare(sql).all(...args)
    const values = rows.map(r => Number(r.project_value)||0)
    const total = values.reduce((s,v)=>s+v,0)
    const count = values.length
    return { total_revenue:total, total_clients:count, average_value:count>0?total/count:0, max_value:count>0?Math.max(...values):0 }
  })

  ipcMain.handle('db:finance:monthly', async (_, userId, params={}) => {
    const now2 = new Date()
    const fromDate = params.from ? new Date(params.from) : new Date(now2.getFullYear()-1, now2.getMonth()+1, 1)
    const toDate = params.to ? new Date(params.to) : new Date(now2.getFullYear(), now2.getMonth()+1, 0)
    const rows = db.prepare('SELECT project_value,closing_date FROM clients WHERE user_id=? AND closing_date>=? AND closing_date<=?')
      .all(userId, fromDate.toISOString().slice(0,10), toDate.toISOString().slice(0,10))
    const months = []
    const cur = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1)
    const end = new Date(toDate.getFullYear(), toDate.getMonth(), 1)
    while (cur<=end) { months.push({month:cur.getMonth()+1,year:cur.getFullYear(),total:0}); cur.setMonth(cur.getMonth()+1) }
    rows.forEach(c => {
      if (!c.closing_date) return
      const d=new Date(c.closing_date)
      const m=months.find(m=>m.year===d.getFullYear()&&m.month===d.getMonth()+1)
      if (m) m.total+=Number(c.project_value)||0
    })
    return months
  })

  ipcMain.handle('db:finance:deals', async (_, userId, params={}) => {
    let sql = 'SELECT id,name,project_type,project_value,closing_date,city FROM clients WHERE user_id=?'
    const args = [userId]
    if (params.from) { sql += ' AND closing_date>=?'; args.push(params.from) }
    if (params.to) { sql += ' AND closing_date<=?'; args.push(params.to) }
    sql += ' ORDER BY closing_date DESC'
    return db.prepare(sql).all(...args)
  })

  // ── HISTORY ───────────────────────────────────────────────────────────────

  ipcMain.handle('db:history:getByLead', async (_, leadId) => {
    return db.prepare('SELECT * FROM history WHERE lead_id=? ORDER BY created_at DESC').all(leadId)
  })
  ipcMain.handle('db:history:getByClient', async (_, clientId) => {
    return db.prepare('SELECT * FROM history WHERE client_id=? ORDER BY created_at DESC').all(clientId)
  })

  // ── SYNC ──────────────────────────────────────────────────────────────────

  ipcMain.handle('db:sync:getStatus', () => sync.getStatus())
  ipcMain.handle('db:sync:trigger', async () => { await sync.runSync(); return sync.getStatus() })

  ipcMain.handle('db:sync:connectCloud', async (_, email, password) => {
    try {
      const localUser = db.prepare('SELECT id FROM users LIMIT 1').get()
      if (!localUser) return { error: 'Aucun utilisateur local trouvé' }
      const cloudUserId = await sync.downloadCloudData(localUser.id, email, password)
      setSetting('cloud_email', email)
      setSetting('cloud_user_id', cloudUserId)
      return { success: true }
    } catch (err) { return { error: err.message } }
  })

  // ── SETTINGS ──────────────────────────────────────────────────────────────

  ipcMain.handle('db:settings:get', (_, key) => getSetting(key))
  ipcMain.handle('db:settings:set', (_, key, value) => { setSetting(key, value); return true })
  ipcMain.handle('db:settings:isSetupDone', () => getSetting('setup_done') === '1')

  // ── FILE DIALOGS ──────────────────────────────────────────────────────────

  ipcMain.handle('dialog:chooseSavePath', async (_, filename) => {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      defaultPath: filename || 'ArchiCRM-backup.db',
      filters: [{ name: 'Base de données', extensions: ['db'] }]
    })
    return filePath || null
  })
  ipcMain.handle('dialog:chooseOpenPath', async () => {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      filters: [{ name: 'Base de données', extensions: ['db'] }],
      properties: ['openFile']
    })
    return filePaths?.[0] || null
  })

  // ── EXPORT / IMPORT ───────────────────────────────────────────────────────

  ipcMain.handle('db:export', (_, destPath) => {
    if (!destPath) return { error: 'Chemin invalide' }
    const dbPath = path.join(app.getPath('userData'), 'data.db')
    fs.copyFileSync(dbPath, destPath)
    return { success: true, path: destPath }
  })
  ipcMain.handle('db:import', async (_, srcPath) => {
    if (!srcPath) return { error: 'Chemin invalide' }
    try { sync.mergeDatabase(srcPath); return { success: true } }
    catch (err) { return { error: err.message } }
  })
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  // Init SQLite
  const dbPath = path.join(app.getPath('userData'), 'data.db')
  db = new Database(dbPath)
  initDatabase(db)

  createSplash()
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('will-quit', () => { sync.stopAutoSync(); if (db) db.close() })
