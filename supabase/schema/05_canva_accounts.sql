-- ============================================================
-- CANVA ACCOUNTS
-- Stores OAuth tokens per user for Canva Connect integration.
-- One row per user (UNIQUE user_id).
-- ============================================================

CREATE TABLE canva_accounts (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Canva identity
  canva_user_id     TEXT        NOT NULL,
  display_name      TEXT,

  -- OAuth tokens (PKCE flow)
  access_token      TEXT        NOT NULL,
  refresh_token     TEXT,
  token_expires_at  TIMESTAMPTZ,

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Auto-update updated_at
CREATE TRIGGER canva_accounts_updated_at
  BEFORE UPDATE ON canva_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- Note: update_updated_at() is defined in 01_youtube_accounts.sql

-- RLS
ALTER TABLE canva_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own canva account"
  ON canva_accounts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
