// ============================================================
// Supabase database types (generated schema)
// ============================================================

export type CompletionStatus = 'not_started' | 'in_progress' | 'completed';
export type EventType = 'topic_completed' | 'topic_reopened' | 'topic_started' | 'milestone_achieved' | 'subtopic_completed' | 'subtopic_reopened';

export interface Profile {
  id: string;
  display_name: string | null;
  email: string | null;
  timezone: string;
  programming_language: string | null;
  created_at: string;
}

export interface CurriculumList {
  id: string;
  slug: string;
  name: string;
  short_name: string;
  description: string | null;
  order_index: number;
}

export interface Module {
  id: string;
  list_id: string;
  slug: string;
  name: string;
  order_index: number;
}

export interface Topic {
  id: string;
  module_id: string;
  slug: string;
  name: string;
  order_index: number;
  is_trackable: boolean;
}

export interface Subtopic {
  id: string;
  topic_id: string;
  slug: string;
  name: string;
  order_index: number;
}

export interface UserTopicProgress {
  id: string;
  user_id: string;
  topic_id: string;
  status: CompletionStatus;
  completed_at: string | null;
  updated_at: string;
}

export interface UserSubtopicProgress {
  id: string;
  user_id: string;
  subtopic_id: string;
  status: CompletionStatus;
  completed_at: string | null;
  updated_at: string;
}

export interface TopicNote {
  id: string;
  user_id: string;
  topic_id: string;
  content: string;
  updated_at: string;
}

export interface ActivityEvent {
  id: string;
  user_id: string;
  event_type: EventType;
  topic_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface UserMilestone {
  id: string;
  user_id: string;
  milestone_key: string;
  achieved_at: string;
}

export interface UserPreferences {
  id: string;
  theme: 'light' | 'dark' | 'system';
  timezone_display: string;
}

export interface SubtopicWithProgress extends Subtopic {
  progress?: UserSubtopicProgress;
}

// Joined types for UI
export interface TopicWithProgress extends Topic {
  progress?: UserTopicProgress;
  note?: TopicNote;
  subtopics?: SubtopicWithProgress[];
}

export interface ModuleWithTopics extends Module {
  topics: TopicWithProgress[];
  completedCount: number;
  totalCount: number;
}

export interface ListWithModules extends CurriculumList {
  modules: ModuleWithTopics[];
  completedCount: number;
  totalCount: number;
  completionPct: number;
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile };
      curriculum_lists: { Row: CurriculumList };
      modules: { Row: Module };
      topics: { Row: Topic };
      subtopics: { Row: Subtopic };
      user_topic_progress: { Row: UserTopicProgress };
      topic_notes: { Row: TopicNote };
      activity_events: { Row: ActivityEvent };
      user_milestones: { Row: UserMilestone };
      user_preferences: { Row: UserPreferences };
    };
  };
}
