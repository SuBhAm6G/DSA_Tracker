-- ============================================================
-- DSA TRACKER — ROW LEVEL SECURITY POLICIES
-- Run AFTER schema.sql in the Supabase SQL Editor
-- ============================================================

-- ============================================================
-- CURRICULUM (read-only for everyone)
-- ============================================================

ALTER TABLE curriculum_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtopics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read curriculum_lists" ON curriculum_lists
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read modules" ON modules
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read topics" ON topics
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read subtopics" ON subtopics
  FOR SELECT USING (true);

-- ============================================================
-- PROFILES (own row only)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- USER TOPIC PROGRESS (own rows only)
-- ============================================================

ALTER TABLE user_topic_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own progress" ON user_topic_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON user_topic_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON user_topic_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress" ON user_topic_progress
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- USER SUBTOPIC PROGRESS (own rows only)
-- ============================================================

ALTER TABLE user_subtopic_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subtopic progress" ON user_subtopic_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subtopic progress" ON user_subtopic_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subtopic progress" ON user_subtopic_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subtopic progress" ON user_subtopic_progress
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- TOPIC NOTES (own rows only)
-- ============================================================

ALTER TABLE topic_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notes" ON topic_notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes" ON topic_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON topic_notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON topic_notes
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- ACTIVITY EVENTS (own rows only)
-- ============================================================

ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own activity" ON activity_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity" ON activity_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- USER MILESTONES (own rows only)
-- ============================================================

ALTER TABLE user_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own milestones" ON user_milestones
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own milestones" ON user_milestones
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- USER PREFERENCES (own row only)
-- ============================================================

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = id);
