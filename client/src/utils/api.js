/**
 * api.js — smart API adapter.
 * - In Electron desktop: routes all calls through window.db (IPC → SQLite)
 * - In browser: uses axios to call the HTTP API
 *
 * Both paths return { data: ... } so callers are identical in both modes.
 */
import axios from 'axios'

// ── Detect Electron desktop mode ──────────────────────────────────────────────
export const isDesktop = typeof window !== 'undefined' && !!window.db

// Helper: get the current desktop user ID from token
function getDesktopUserId() {
  const token = localStorage.getItem('archicrm_token') || ''
  return token.startsWith('desktop:') ? token.replace('desktop:', '') : null
}

// ── Desktop adapter ───────────────────────────────────────────────────────────
class DesktopAdapter {
  constructor() {
    // Mimic axios instance shape so callers can set headers without errors
    this.defaults = { headers: { common: {} } }
    this.interceptors = {
      request: { use: () => {} },
      response: { use: () => {} }
    }
  }

  // Parses url and delegates to window.db.* calls
  async _dispatch(method, url, data, config) {
    const db = window.db
    const userId = getDesktopUserId()
    const params = config?.params || {}

    // ── Auth ─────────────────────────────────────────────────────────────────
    if (method === 'POST' && url === '/api/auth/login') {
      const res = await db.auth.login(data.email, data.password)
      if (res.error) throw { response: { status: 401, data: res } }
      return { data: res }
    }
    if (method === 'POST' && url === '/api/auth/signup') {
      const res = await db.auth.createUser(data)
      if (res.error) throw { response: { status: 409, data: res } }
      return { data: { pending: false, user: res.user, token: res.token } }
    }
    if (method === 'GET' && url === '/api/auth/me') {
      const user = await db.auth.getUser(userId)
      if (!user) throw { response: { status: 401 } }
      return { data: user }
    }
    if (method === 'PUT' && url === '/api/auth/profile') {
      const user = await db.auth.updateProfile(userId, data)
      return { data: user }
    }
    if (method === 'PUT' && url === '/api/auth/password') {
      const res = await db.auth.updatePassword(userId, data.current_password, data.new_password)
      if (res.error) throw { response: { status: 401, data: res } }
      return { data: res }
    }

    // ── Dashboard ─────────────────────────────────────────────────────────────
    if (method === 'GET' && url === '/api/dashboard') {
      return { data: await db.dashboard.getStats(userId) }
    }

    // ── Leads ─────────────────────────────────────────────────────────────────
    if (method === 'GET' && url === '/api/leads') {
      return { data: await db.leads.getAll(userId, params) }
    }
    {
      const m = url.match(/^\/api\/leads\/([^/?]+)$/)
      if (m) {
        if (method === 'GET')    return { data: await db.leads.getById(m[1]) }
        if (method === 'PUT')    return { data: await db.leads.update(m[1], data) }
        if (method === 'DELETE') return { data: await db.leads.delete(m[1], userId) }
      }
    }
    if (method === 'POST' && url === '/api/leads') {
      const res = await db.leads.create({ ...data, user_id: userId })
      return { data: res }
    }

    // ── Clients ───────────────────────────────────────────────────────────────
    if (method === 'GET' && url === '/api/clients') {
      return { data: await db.clients.getAll(userId, params) }
    }
    {
      const m = url.match(/^\/api\/clients\/([^/?]+)$/)
      if (m) {
        if (method === 'GET')    return { data: await db.clients.getById(m[1]) }
        if (method === 'PUT')    return { data: await db.clients.update(m[1], data) }
        if (method === 'DELETE') return { data: await db.clients.delete(m[1], userId) }
      }
    }

    // ── Reminders ─────────────────────────────────────────────────────────────
    if (method === 'GET' && url === '/api/reminders') {
      return { data: await db.reminders.getAll(userId) }
    }
    {
      const m = url.match(/^\/api\/reminders\/([^/?]+)$/)
      if (m) {
        if (method === 'PUT')    return { data: await db.reminders.update(m[1], data) }
        if (method === 'DELETE') return { data: await db.reminders.delete(m[1], userId) }
      }
    }
    if (method === 'POST' && url === '/api/reminders') {
      return { data: await db.reminders.create({ ...data, user_id: userId }) }
    }

    // ── Finance ───────────────────────────────────────────────────────────────
    if (method === 'GET' && url === '/api/finance/summary') {
      return { data: await db.finance.summary(userId, params) }
    }
    if (method === 'GET' && url === '/api/finance/monthly') {
      return { data: await db.finance.monthly(userId, params) }
    }
    if (method === 'GET' && url === '/api/finance/deals') {
      return { data: await db.finance.deals(userId, params) }
    }

    // ── History ───────────────────────────────────────────────────────────────
    {
      const m = url.match(/^\/api\/history\/lead\/([^/?]+)$/)
      if (m && method === 'GET') return { data: await db.history.getByLead(m[1]) }
    }
    {
      const m = url.match(/^\/api\/history\/client\/([^/?]+)$/)
      if (m && method === 'GET') return { data: await db.history.getByClient(m[1]) }
    }

    // ── Sync status (desktop UI) ───────────────────────────────────────────────
    if (method === 'GET' && url === '/api/sync/status') {
      return { data: await db.sync.getStatus() }
    }

    // ── Unhandled — log and return null gracefully ─────────────────────────────
    console.warn(`[DesktopAPI] Unhandled ${method} ${url}`)
    return { data: null }
  }

  get(url, config)          { return this._dispatch('GET',    url, null, config) }
  post(url, data, config)   { return this._dispatch('POST',   url, data, config) }
  put(url, data, config)    { return this._dispatch('PUT',    url, data, config) }
  delete(url, config)       { return this._dispatch('DELETE', url, null, config) }
  patch(url, data, config)  { return this._dispatch('PATCH',  url, data, config) }
}

// ── Web (Axios) adapter ───────────────────────────────────────────────────────
function createAxiosAdapter() {
  const instance = axios.create({
    baseURL: import.meta.env?.VITE_API_URL || '',
    headers: { 'Content-Type': 'application/json' }
  })

  // Restore token
  const token = localStorage.getItem('archicrm_token')
  if (token) instance.defaults.headers.common['Authorization'] = `Bearer ${token}`

  // Auto-logout on 401
  instance.interceptors.response.use(
    res => res,
    err => {
      if (err.response?.status === 401) {
        localStorage.removeItem('archicrm_token')
        delete instance.defaults.headers.common['Authorization']
        window.location.href = '/login'
      }
      return Promise.reject(err)
    }
  )

  return instance
}

// ── Export single API instance ────────────────────────────────────────────────
const api = isDesktop ? new DesktopAdapter() : createAxiosAdapter()
export default api
