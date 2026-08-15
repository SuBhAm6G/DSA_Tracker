-- ============================================================
-- DSA TRACKER — DATABASE SCHEMA
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- CURRICULUM TABLES (shared, read-only for users)
-- ============================================================

CREATE TABLE IF NOT EXISTS curriculum_lists (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  short_name  TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS modules (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id     UUID NOT NULL REFERENCES curriculum_lists(id) ON DELETE CASCADE,
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS topics (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id     UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  slug          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  order_index   INTEGER NOT NULL,
  is_trackable  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subtopics (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id    UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast joins
CREATE INDEX IF NOT EXISTS idx_modules_list_id ON modules(list_id, order_index);
CREATE INDEX IF NOT EXISTS idx_topics_module_id ON topics(module_id, order_index);
CREATE INDEX IF NOT EXISTS idx_subtopics_topic_id ON subtopics(topic_id, order_index);

-- ============================================================
-- USER PROFILE
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT,
  email         TEXT,
  timezone      TEXT NOT NULL DEFAULT 'UTC',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- USER TOPIC PROGRESS
-- ============================================================

CREATE TABLE IF NOT EXISTS user_topic_progress (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id     UUID NOT NULL REFERENCES topics(id) ON DELETE RESTRICT,
  status       TEXT NOT NULL DEFAULT 'not_started'
                 CHECK (status IN ('not_started', 'in_progress', 'completed')),
  completed_at TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_utp_user_id ON user_topic_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_utp_user_topic ON user_topic_progress(user_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_utp_completed_at ON user_topic_progress(user_id, completed_at);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER utp_updated_at
  BEFORE UPDATE ON user_topic_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TOPIC NOTES
-- ============================================================

CREATE TABLE IF NOT EXISTS topic_notes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id   UUID NOT NULL REFERENCES topics(id) ON DELETE RESTRICT,
  content    TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_notes_user_id ON topic_notes(user_id);

CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON topic_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ACTIVITY EVENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS activity_events (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL
               CHECK (event_type IN ('topic_completed','topic_reopened','topic_started','milestone_achieved')),
  topic_id   UUID REFERENCES topics(id) ON DELETE SET NULL,
  metadata   JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ae_user_id ON activity_events(user_id);
CREATE INDEX IF NOT EXISTS idx_ae_user_created ON activity_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ae_created_date ON activity_events(user_id, ((created_at AT TIME ZONE 'UTC')::DATE));

-- ============================================================
-- USER MILESTONES
-- ============================================================

CREATE TABLE IF NOT EXISTS user_milestones (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_key TEXT NOT NULL,
  achieved_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, milestone_key)
);

CREATE INDEX IF NOT EXISTS idx_milestones_user_id ON user_milestones(user_id);

-- ============================================================
-- USER PREFERENCES
-- ============================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme            TEXT NOT NULL DEFAULT 'light'
                     CHECK (theme IN ('light','dark','system')),
  timezone_display TEXT NOT NULL DEFAULT 'UTC'
);

-- Auto-create preferences on signup
CREATE OR REPLACE FUNCTION handle_new_user_prefs()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_prefs ON auth.users;
CREATE TRIGGER on_auth_user_created_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_prefs();

-- ============================================================
-- HELPER: daily activity counts view
-- ============================================================

CREATE OR REPLACE VIEW user_daily_activity AS
SELECT
  user_id,
  (created_at AT TIME ZONE 'UTC')::DATE AS activity_date,
  COUNT(*) FILTER (WHERE event_type = 'topic_completed') AS topics_completed
FROM activity_events
GROUP BY user_id, (created_at AT TIME ZONE 'UTC')::DATE;
