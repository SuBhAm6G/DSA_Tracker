-- ============================================================
-- USER IMPORTANT SUBTOPICS
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Table
CREATE TABLE IF NOT EXISTS user_important_subtopics (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subtopic_id  TEXT NOT NULL,          -- slug of the subtopic
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, subtopic_id)
);

CREATE INDEX IF NOT EXISTS idx_uis_user_id ON user_important_subtopics(user_id);

-- Enable RLS
ALTER TABLE user_important_subtopics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own important subtopics" ON user_important_subtopics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own important subtopics" ON user_important_subtopics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own important subtopics" ON user_important_subtopics
  FOR DELETE USING (auth.uid() = user_id);
