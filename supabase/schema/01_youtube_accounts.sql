-- ============================================================
-- YOUTUBE ACCOUNTS
-- Stores OAuth tokens + channel metadata per user.
-- One row per linked YouTube channel.
-- ============================================================

CREATE TABLE youtube_accounts (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Channel identity
  channel_id                TEXT        NOT NULL,
  channel_name              TEXT        NOT NULL,
  channel_avatar            TEXT,
  subscriber_count          INTEGER     DEFAULT 0,
  video_count               INTEGER     DEFAULT 0,

  -- OAuth tokens
  access_token              TEXT        NOT NULL,
  refresh_token             TEXT,
  token_expires_at          TIMESTAMPTZ,

  -- AI channel profile (populated by analyze-channel)
  niche                     TEXT,                     -- e.g. "tech", "gaming"
  avg_video_duration_seconds INTEGER,
  upload_frequency          TEXT,                     -- e.g. "weekly", "2x/week"
  top_tags                  TEXT[]      DEFAULT '{}',
  recent_video_titles       TEXT[]      DEFAULT '{}', -- last ~20 titles for AI context

  last_synced_at            TIMESTAMPTZ DEFAULT NOW(),
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, channel_id)
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER youtube_accounts_updated_at
  BEFORE UPDATE ON youtube_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE youtube_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own youtube accounts"
  ON youtube_accounts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
