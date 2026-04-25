-- Run this in Supabase SQL editor
-- Creates the architect_sites table for the Sites Web feature

CREATE TABLE IF NOT EXISTS architect_sites (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug             TEXT NOT NULL,
  type             TEXT NOT NULL CHECK (type IN ('vitrine', 'landing')),
  html_content     TEXT NOT NULL DEFAULT '',
  custom_domain    TEXT,
  meta_pixel_id    TEXT,
  google_tag_id    TEXT,
  conversion_api_token TEXT,
  published_at     TIMESTAMPTZ,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, type)
);

-- Index for fast slug lookups (public site serving)
CREATE INDEX IF NOT EXISTS idx_architect_sites_slug_type
  ON architect_sites (slug, type)
  WHERE is_active = true;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_architect_sites_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_architect_sites_updated_at ON architect_sites;
CREATE TRIGGER set_architect_sites_updated_at
  BEFORE UPDATE ON architect_sites
  FOR EACH ROW EXECUTE FUNCTION update_architect_sites_updated_at();

-- RLS: service role can do everything; users can only see their own
ALTER TABLE architect_sites ENABLE ROW LEVEL SECURITY;

-- Allow all operations via service_role (backend uses anon key with full access or service role)
CREATE POLICY "service_role_all" ON architect_sites
  FOR ALL USING (true) WITH CHECK (true);
