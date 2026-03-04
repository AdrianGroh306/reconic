-- Add gear_checks column to projects table
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS gear_checks JSONB DEFAULT '{}';
