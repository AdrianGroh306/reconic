-- Performance indexes for user-scoped queries
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_youtube_accounts_user_id ON youtube_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_favorited_channels_user_id ON favorited_channels(user_id);
CREATE INDEX IF NOT EXISTS idx_canva_accounts_user_id ON canva_accounts(user_id);
