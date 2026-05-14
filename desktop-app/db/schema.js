/**
 * SQLite schema — mirrors the Supabase cloud tables.
 * All records have updated_at for conflict-resolution (last-write-wins).
 */
function initDatabase(db) {
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    -- ── Users ──────────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'user',
      api_key       TEXT,
      plan          TEXT DEFAULT 'pro',
      account_status TEXT DEFAULT 'active',
      created_at    TEXT NOT NULL,
      updated_at    TEXT NOT NULL
    );

    -- ── Leads ──────────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS leads (
      id                TEXT PRIMARY KEY,
      user_id           TEXT NOT NULL,
      name              TEXT NOT NULL,
      phone             TEXT,
      email             TEXT,
      project_type      TEXT,
      city              TEXT,
      budget            REAL,
      status            TEXT DEFAULT 'Nouveau',
      source            TEXT,
      notes             TEXT,
      last_contact_date TEXT,
      created_at        TEXT NOT NULL,
      updated_at        TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- ── Clients ────────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS clients (
      id            TEXT PRIMARY KEY,
      user_id       TEXT NOT NULL,
      lead_id       TEXT,
      name          TEXT NOT NULL,
      phone         TEXT,
      email         TEXT,
      project_type  TEXT,
      city          TEXT,
      project_value REAL DEFAULT 0,
      closing_date  TEXT,
      notes         TEXT,
      created_at    TEXT NOT NULL,
      updated_at    TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- ── Reminders ──────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS reminders (
      id            TEXT PRIMARY KEY,
      user_id       TEXT NOT NULL,
      title         TEXT NOT NULL,
      description   TEXT,
      reminder_date TEXT NOT NULL,
      status        TEXT DEFAULT 'pending',
      lead_id       TEXT,
      client_id     TEXT,
      created_at    TEXT NOT NULL,
      updated_at    TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- ── History ────────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS history (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      lead_id     TEXT,
      client_id   TEXT,
      action      TEXT NOT NULL,
      description TEXT,
      created_at  TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- ── Sync log — tracks which records need to be pushed to Supabase ──────────
    CREATE TABLE IF NOT EXISTS sync_log (
      id         TEXT PRIMARY KEY,
      table_name TEXT NOT NULL,
      record_id  TEXT NOT NULL,
      operation  TEXT NOT NULL,   -- 'create' | 'update' | 'delete'
      created_at TEXT NOT NULL,
      synced_at  TEXT,
      is_synced  INTEGER DEFAULT 0
    );

    -- ── App settings (last_sync_time, setup_done, cloud_email …) ───────────────
    CREATE TABLE IF NOT EXISTS app_settings (
      key   TEXT PRIMARY KEY,
      value TEXT
    );
  `)
}

module.exports = { initDatabase }
