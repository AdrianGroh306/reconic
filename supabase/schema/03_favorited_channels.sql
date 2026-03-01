-- ============================================================
-- FAVORITED CHANNELS
-- YouTube channels saved by the user for ongoing research.
-- thumbnail is a URL (not base64) — served directly from YouTube.
-- ============================================================

CREATE TABLE favorited_channels (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  channel_id       TEXT        NOT NULL,  -- YouTube channel ID (e.g. UCxxxxxx)
  title            TEXT        NOT NULL,
  thumbnail        TEXT,                  -- YouTube thumbnail URL
  subscriber_count TEXT,                  -- display string, e.g. "1.2M"

  saved_at         TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, channel_id)
);

-- RLS
ALTER TABLE favorited_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own favorited channels"
  ON favorited_channels FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
