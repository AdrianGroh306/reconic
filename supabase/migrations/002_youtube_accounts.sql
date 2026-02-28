-- YouTube account linking with persistent tokens and channel metadata
CREATE TABLE youtube_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  channel_avatar TEXT,
  subscriber_count INTEGER DEFAULT 0,
  video_count INTEGER DEFAULT 0,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  -- Channel metadata for personalizing AI suggestions
  niche TEXT,                      -- e.g. "tech", "gaming", "cooking"
  avg_video_duration_seconds INTEGER,
  upload_frequency TEXT,           -- e.g. "weekly", "2x/week"
  top_tags TEXT[],                 -- most used tags
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, channel_id)
);

ALTER TABLE youtube_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own youtube accounts"
  ON youtube_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own youtube accounts"
  ON youtube_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own youtube accounts"
  ON youtube_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own youtube accounts"
  ON youtube_accounts FOR DELETE
  USING (auth.uid() = user_id);
