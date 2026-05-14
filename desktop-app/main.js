const { app, BrowserWindow, Menu, shell, dialog, ipcMain, nativeTheme } = require('electron')
const path = require('path')
const fs = require('fs')

// ── Constants ─────────────────────────────────────────────────────────────────
const APP_URL = 'https://app.crm.archi'
const SETTINGS_FILE = path.join(app.getPath('userData'), 'settings.json')

// ── Persistent settings (window size/position) ────────────────────────────────
function loadSettings() {
  try { return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')) }
  catch { return {} }
}
function saveSettings(data) {
  try { fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2)) }
  catch {}
}

// ── Window references ─────────────────────────────────────────────────────────
let mainWindow = null
let splashWindow = null

// ── Splash screen ─────────────────────────────────────────────────────────────
function createSplash() {
  splashWindow = new BrowserWindow({
    width: 420,
    height: 280,
    frame: false,
    transparent: false,
    resizable: false,
    center: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    backgroundColor: '#0A0A0A',
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  })
  splashWindow.loadFile('splash.html')
  splashWindow.once('ready-to-show', () => splashWindow.show())
}

// ── Offline page HTML ─────────────────────────────────────────────────────────
function offlinePageHTML() {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>ArchiCRM — Hors ligne</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{
      background:#0A0A0A;color:#fff;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
      display:flex;align-items:center;justify-content:center;
      min-height:100vh;flex-direction:column;gap:20px;text-align:center;padding:32px
    }
    svg{width:64px;height:64px;opacity:.4}
    h1{color:#E8A838;font-size:1.4rem;font-weight:700;margin-top:8px}
    p{color:#666;font-size:.95rem;line-height:1.7;max-width:360px}
    button{
      margin-top:12px;background:#E8A838;color:#0A0A0A;
      border:none;padding:13px 36px;border-radius:10px;
      font-size:.95rem;font-weight:700;cursor:pointer;transition:opacity .15s
    }
    button:hover{opacity:.85}
  </style>
</head>
<body>
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="16,4 30,26 2,26" fill="#E8A838" opacity="0.35"/>
    <polygon points="16,8 28,28 4,28" fill="#E8A838"/>
  </svg>
  <h1>Connexion internet requise</h1>
  <p>ArchiCRM nécessite une connexion internet pour fonctionner.<br/>Vérifiez votre connexion et réessayez.</p>
  <button onclick="location.reload()">↺ &nbsp;Réessayer</button>
</body>
</html>`
}

// ── Main window ───────────────────────────────────────────────────────────────
function createWindow() {
  const settings = loadSettings()
  const bounds = settings.windowBounds || { width: 1280, height: 800 }

  mainWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    minWidth: 900,
    minHeight: 600,
    show: false,
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    title: 'ArchiCRM',
    backgroundColor: '#0A0A0A',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      // Security: prevent running local content
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  })

  // Restore maximized state
  if (bounds.maximized) mainWindow.maximize()

  // ── Persist window bounds ──────────────────────────────────────────────────
  function persistBounds() {
    if (!mainWindow || mainWindow.isDestroyed()) return
    const b = mainWindow.getBounds()
    saveSettings({
      ...loadSettings(),
      windowBounds: { ...b, maximized: mainWindow.isMaximized() }
    })
  }
  mainWindow.on('resize', persistBounds)
  mainWindow.on('move', persistBounds)
  mainWindow.on('maximize', persistBounds)
  mainWindow.on('unmaximize', persistBounds)

  // ── Build application menu ─────────────────────────────────────────────────
  buildMenu()

  // ── Load the web app ───────────────────────────────────────────────────────
  mainWindow.loadURL(APP_URL)

  // ── Handle external links — open in real browser ───────────────────────────
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const internal = url.startsWith('https://app.crm.archi') ||
                     url.startsWith('https://crm.archi') ||
                     url.startsWith('https://archicrm.ma')
    if (!internal) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })

  // Intercept navigation to external domains
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const internal = url.startsWith('https://app.crm.archi') ||
                     url.startsWith('https://crm.archi') ||
                     url.startsWith('https://archicrm.ma') ||
                     url.startsWith('data:')
    if (!internal) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })

  // ── Show window / close splash when app loads ──────────────────────────────
  mainWindow.webContents.on('did-finish-load', () => {
    closeSplash()
    if (!mainWindow.isVisible()) mainWindow.show()
  })

  // ── Offline: show friendly page on load failure ────────────────────────────
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    // Ignore aborted navigations (e.g. SPA route changes)
    if (errorCode === -3) return
    closeSplash()
    if (!mainWindow.isVisible()) mainWindow.show()
    mainWindow.webContents.loadURL(
      'data:text/html;charset=utf-8,' + encodeURIComponent(offlinePageHTML())
    )
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

function closeSplash() {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close()
    splashWindow = null
  }
}

// ── Application menu ──────────────────────────────────────────────────────────
function buildMenu() {
  const isMac = process.platform === 'darwin'
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: 'Fichier',
      submenu: [
        {
          label: 'Déconnexion',
          accelerator: 'Ctrl+Shift+L',
          click: () => {
            if (mainWindow) mainWindow.loadURL(APP_URL + '/login')
          }
        },
        { type: 'separator' },
        {
          label: 'Quitter ArchiCRM',
          accelerator: isMac ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'Affichage',
      submenu: [
        {
          label: 'Actualiser',
          accelerator: 'F5',
          click: () => { if (mainWindow) mainWindow.webContents.reload() }
        },
        { type: 'separator' },
        {
          label: 'Zoom avant',
          accelerator: 'Ctrl+=',
          click: () => {
            if (!mainWindow) return
            const z = mainWindow.webContents.getZoomFactor()
            mainWindow.webContents.setZoomFactor(Math.min(+(z + 0.1).toFixed(1), 2.0))
          }
        },
        {
          label: 'Zoom arrière',
          accelerator: 'Ctrl+-',
          click: () => {
            if (!mainWindow) return
            const z = mainWindow.webContents.getZoomFactor()
            mainWindow.webContents.setZoomFactor(Math.max(+(z - 0.1).toFixed(1), 0.5))
          }
        },
        {
          label: 'Taille normale',
          accelerator: 'Ctrl+0',
          click: () => { if (mainWindow) mainWindow.webContents.setZoomFactor(1.0) }
        },
        { type: 'separator' },
        {
          label: 'Plein écran',
          accelerator: 'F11',
          click: () => {
            if (mainWindow) mainWindow.setFullScreen(!mainWindow.isFullScreen())
          }
        },
        { type: 'separator' },
        {
          label: 'Outils de développement',
          accelerator: isMac ? 'Cmd+Alt+I' : 'Ctrl+Shift+I',
          click: () => { if (mainWindow) mainWindow.webContents.toggleDevTools() }
        }
      ]
    },
    {
      label: 'Aide',
      submenu: [
        {
          label: 'Ouvrir dans le navigateur',
          click: () => shell.openExternal(APP_URL)
        },
        {
          label: 'Support',
          click: () => shell.openExternal('mailto:contact@crm.archi')
        },
        { type: 'separator' },
        {
          label: "À propos d'ArchiCRM",
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: "À propos d'ArchiCRM",
              message: 'ArchiCRM',
              detail: [
                `Version : ${app.getVersion()}`,
                `Electron : ${process.versions.electron}`,
                `Node.js : ${process.versions.node}`,
                '',
                'CRM professionnel pour architectes marocains.',
                'https://crm.archi'
              ].join('\n'),
              buttons: ['OK'],
              icon: path.join(__dirname, 'assets', 'icon.ico')
            })
          }
        }
      ]
    }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createSplash()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// Security: prevent new windows from being created unexpectedly
app.on('web-contents-created', (event, contents) => {
  contents.on('will-attach-webview', (event) => event.preventDefault())
})
