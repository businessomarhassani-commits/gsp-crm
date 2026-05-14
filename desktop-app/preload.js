/**
 * preload.js — bridges the Electron main process (SQLite) to the React renderer.
 * Exposes window.db with a clean async API matching the HTTP API's data shapes.
 */
const { contextBridge, ipcRenderer } = require('electron')

const invoke = (channel, ...args) => ipcRenderer.invoke(channel, ...args)

contextBridge.exposeInMainWorld('db', {
  // ── Auth ─────────────────────────────────────────────────────────────────
  auth: {
    login:          (email, password) => invoke('db:auth:login', { email, password }),
    createUser:     (data)            => invoke('db:auth:createUser', data),
    getUser:        (userId)          => invoke('db:auth:getUser', userId),
    updateProfile:  (userId, data)    => invoke('db:auth:updateProfile', userId, data),
    updatePassword: (userId, cur, nw) => invoke('db:auth:updatePassword', userId, cur, nw),
  },

  // ── Leads ────────────────────────────────────────────────────────────────
  leads: {
    getAll:  (userId, params) => invoke('db:leads:getAll', userId, params),
    getById: (id)             => invoke('db:leads:getById', id),
    create:  (data)           => invoke('db:leads:create', data),
    update:  (id, data)       => invoke('db:leads:update', id, data),
    delete:  (id, userId)     => invoke('db:leads:delete', id, userId),
  },

  // ── Clients ──────────────────────────────────────────────────────────────
  clients: {
    getAll:  (userId, params) => invoke('db:clients:getAll', userId, params),
    getById: (id)             => invoke('db:clients:getById', id),
    update:  (id, data)       => invoke('db:clients:update', id, data),
    delete:  (id, userId)     => invoke('db:clients:delete', id, userId),
  },

  // ── Reminders ────────────────────────────────────────────────────────────
  reminders: {
    getAll:  (userId)         => invoke('db:reminders:getAll', userId),
    create:  (data)           => invoke('db:reminders:create', data),
    update:  (id, data)       => invoke('db:reminders:update', id, data),
    delete:  (id, userId)     => invoke('db:reminders:delete', id, userId),
  },

  // ── Dashboard ────────────────────────────────────────────────────────────
  dashboard: {
    getStats: (userId) => invoke('db:dashboard:getStats', userId),
  },

  // ── Finance ──────────────────────────────────────────────────────────────
  finance: {
    summary: (userId, params) => invoke('db:finance:summary', userId, params),
    monthly: (userId, params) => invoke('db:finance:monthly', userId, params),
    deals:   (userId, params) => invoke('db:finance:deals', userId, params),
  },

  // ── History ──────────────────────────────────────────────────────────────
  history: {
    getByLead:   (leadId)   => invoke('db:history:getByLead', leadId),
    getByClient: (clientId) => invoke('db:history:getByClient', clientId),
  },

  // ── Sync ─────────────────────────────────────────────────────────────────
  sync: {
    getStatus:    ()               => invoke('db:sync:getStatus'),
    trigger:      ()               => invoke('db:sync:trigger'),
    connectCloud: (email, password)=> invoke('db:sync:connectCloud', email, password),
  },

  // ── Settings ─────────────────────────────────────────────────────────────
  settings: {
    get:          (key)        => invoke('db:settings:get', key),
    set:          (key, value) => invoke('db:settings:set', key, value),
    isSetupDone:  ()           => invoke('db:settings:isSetupDone'),
  },

  // ── Export / Import ──────────────────────────────────────────────────────
  export: {
    chooseSavePath: (filename) => invoke('dialog:chooseSavePath', filename),
    chooseOpenPath: ()         => invoke('dialog:chooseOpenPath'),
    exportDB:       (path)     => invoke('db:export', path),
    importDB:       (path)     => invoke('db:import', path),
  },

  platform: process.platform,
  version:  process.env.npm_package_version || '1.0.0',
})

// ── Listen for main-process events sent to renderer ──────────────────────────
contextBridge.exposeInMainWorld('electronEvents', {
  onLogout:     (cb) => ipcRenderer.on('app:logout',  cb),
  onRefresh:    (cb) => ipcRenderer.on('app:refresh', cb),
  onSyncStatus: (cb) => ipcRenderer.on('sync:status', (_e, data) => cb(data)),
  removeAll:    ()   => {
    ipcRenderer.removeAllListeners('app:logout')
    ipcRenderer.removeAllListeners('app:refresh')
    ipcRenderer.removeAllListeners('sync:status')
  }
})
