-- ============================================================
-- PROJECT INSPIRATIONS
-- Thumbnail inspiration board per project.
-- Each row = one saved YouTube video thumbnail.
-- user_id is stored directly for simple RLS (no join needed).
-- ============================================================

CREATE TABLE project_inspirations (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  video_id       TEXT        NOT NULL,   -- YouTube video ID
  thumbnail_url  TEXT        NOT NULL,   -- YouTube thumbnail URL
  title          TEXT        NOT NULL,

  saved_at       TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(project_id, video_id)
);

-- RLS
ALTER TABLE project_inspirations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own project inspirations"
  ON project_inspirations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
