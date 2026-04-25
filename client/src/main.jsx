import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

// ── Architect subdomain detection ─────────────────────────────────────────────
// Must run BEFORE React mounts. If the current hostname is a published architect
// site (e.g. aziz-hassani.archicrm.ma), fetch its HTML and replace the document.
const RESERVED = [
  'archicrm.ma', 'www.archicrm.ma',
  'app.archicrm.ma', 'admin.archicrm.ma',
  'localhost',
]

const NOT_FOUND_HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Site non trouvé — ArchiCRM</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#0A0A0A;color:#fff;font-family:Inter,sans-serif;
         display:flex;align-items:center;justify-content:center;
         min-height:100vh;flex-direction:column;gap:16px;padding:24px;text-align:center}
    h1{color:#E8A838;font-size:2rem;font-weight:700}
    p{color:#888;font-size:1rem;line-height:1.6}
    a{display:inline-block;margin-top:8px;color:#E8A838;text-decoration:none;
      border:1px solid #E8A838;padding:10px 24px;border-radius:8px;font-weight:600;transition:background .15s}
    a:hover{background:#E8A838;color:#0A0A0A}
  </style>
</head>
<body>
  <h1>Site non trouvé</h1>
  <p>Ce site n'existe pas encore ou n'a pas encore été publié.</p>
  <a href="https://archicrm.ma">← Retour à ArchiCRM</a>
</body>
</html>`

const hostname = window.location.hostname
const isArchitectSite =
  !RESERVED.includes(hostname) &&
  hostname.endsWith('.archicrm.ma') &&
  hostname.split('.').length === 3  // exactly one subdomain level

if (isArchitectSite) {
  // Extract slug and requested type from URL
  const slug = hostname.replace('.archicrm.ma', '')
  const type = window.location.pathname === '/landing' ? 'landing' : 'vitrine'

  // Show a minimal loading screen immediately (before the fetch resolves)
  document.documentElement.style.background = '#0A0A0A'
  document.body.innerHTML = `
    <style>
      @keyframes _spin { to { transform: rotate(360deg) } }
      ._loader {
        position: fixed; inset: 0; background: #0A0A0A;
        display: flex; align-items: center; justify-content: center;
        flex-direction: column; gap: 16px; font-family: Inter, sans-serif;
      }
      ._spinner {
        width: 36px; height: 36px;
        border: 3px solid rgba(232,168,56,.25);
        border-top-color: #E8A838;
        border-radius: 50%;
        animation: _spin .7s linear infinite;
      }
      ._text { color: #E8A838; font-size: 13px; font-weight: 500; letter-spacing: .04em; }
    </style>
    <div class="_loader">
      <div class="_spinner"></div>
      <span class="_text">Chargement…</span>
    </div>
  `

  // Fetch the site HTML from the public API endpoint
  fetch(`/api/sites/serve/${encodeURIComponent(slug)}/${encodeURIComponent(type)}`)
    .then(res => {
      if (res.status === 404) return Promise.reject('not_found')
      if (!res.ok) return Promise.reject('server_error')
      return res.text()
    })
    .then(html => {
      // Replace the entire document with the generated site
      document.open()
      document.write(html)
      document.close()
    })
    .catch(() => {
      document.open()
      document.write(NOT_FOUND_HTML)
      document.close()
    })

  // Stop here — do NOT mount React
} else {
  // ── Normal CRM / Landing / Admin app ────────────────────────────────────────
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: { fontSize: '13px', borderRadius: '10px', background: '#1a2332', color: '#fff' },
              success: { iconTheme: { primary: '#E8A838', secondary: '#1a2332' } }
            }}
          />
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>
  )
}
