-- ============================================================
-- PROJECTS
-- Core table. One row = one video project.
-- All project data lives here (script, AI output, production).
-- ============================================================

CREATE TABLE projects (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic info
  title             TEXT        NOT NULL DEFAULT '',   -- internal folder name
  topic             TEXT        NOT NULL DEFAULT '',   -- research / search topic
  description       TEXT        DEFAULT '',
  chosen_title      TEXT,                              -- actual video title (the H1)
  status            TEXT,                              -- filming | editing | published
                                                       -- NULL = idea or scripted (derived)
  notes             TEXT        DEFAULT '',
  target_duration   INTEGER,                           -- target video length in minutes

  -- Thumbnail (base64, ~2 MB max)
  thumbnail         TEXT,

  -- Script tab
  script            TEXT        DEFAULT '',
  broll_checks      JSONB       DEFAULT '{}',          -- { [lineHash: string]: boolean }

  -- Concept tab (AI suggestions)
  ai_suggestions    JSONB,
  -- shape: {
  --   scriptOutline: string[],
  --   hookVariants: { type: string, hook: string }[],
  --   chapterMarkers: { title: string, timecode: string }[]
  -- }

  -- Production tab
  editor_notes      TEXT        DEFAULT '',

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- Note: update_updated_at() is defined in 01_youtube_accounts.sql

-- RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own projects"
  ON projects FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
