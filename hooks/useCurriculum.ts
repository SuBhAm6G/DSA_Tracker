'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ListWithModules, ModuleWithTopics, TopicWithProgress, UserTopicProgress, UserSubtopicProgress, SubtopicWithProgress } from '@/lib/supabase/types';
import curriculumJson from '@/app/data/curriculum.json';
import { applyLanguageVirtualTopics } from '@/lib/virtualTopics';
import { pct } from '@/lib/utils';

type ProgressMap = Map<string, UserTopicProgress>;
type SubprogressMap = Map<string, UserSubtopicProgress>;

export function useCurriculum() {
  const supabase = createClient();
  const [lists, setLists] = useState<ListWithModules[]>([]);
  const [progressMap, setProgressMap] = useState<ProgressMap>(new Map());
  const [subprogressMap, setSubprogressMap] = useState<SubprogressMap>(new Map());
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [programmingLanguage, setProgrammingLanguage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);

    const { data: profile } = await supabase.from('profiles').select('programming_language').eq('id', user.id).single();
    if (profile) setProgrammingLanguage(profile.programming_language);

    const { data: progressRows } = await supabase.from('user_topic_progress').select('*').eq('user_id', user.id) as unknown as { data: UserTopicProgress[] | null };
    const { data: subprogressRows } = await supabase.from('user_subtopic_progress').select('*').eq('user_id', user.id) as unknown as { data: UserSubtopicProgress[] | null };

    const { data: dbTopicsRaw } = await supabase.from('topics').select('id, slug') as unknown as { data: Array<{ id: string; slug: string }> | null };
    const dbTopics = dbTopicsRaw ?? [];
    const slugToUUID = new Map<string, string>();
    const uuidToSlug = new Map<string, string>();
    dbTopics.forEach(t => { slugToUUID.set(t.slug, t.id); uuidToSlug.set(t.id, t.slug); });

    const pMap = new Map<string, UserTopicProgress>();
    ((progressRows ?? []) as UserTopicProgress[]).forEach(row => {
      const slug = uuidToSlug.get(row.topic_id) || row.topic_id; // Support virtual IDs which are UUID strings
      if (slug) pMap.set(slug, row);
    });
    setProgressMap(pMap);

    const spMap = new Map<string, UserSubtopicProgress>();
    ((subprogressRows ?? []) as UserSubtopicProgress[]).forEach(row => {
      spMap.set(row.subtopic_id, row);
    });
    setSubprogressMap(spMap);

    const enriched: ListWithModules[] = (curriculumJson as any).lists.map((rawList: any) => {
      const modules: ModuleWithTopics[] = rawList.modules.map((rawMod: any) => {
        const topics: TopicWithProgress[] = rawMod.topics.map((rawTopic: any) => {
          const subtopics: SubtopicWithProgress[] = (rawTopic.subtopics || []).map((st: any) => ({
            ...st,
            progress: spMap.get(st.slug)
          }));
          return {
            id:           slugToUUID.get(rawTopic.slug) ?? rawTopic.slug,
            module_id:    '',
            slug:         rawTopic.slug,
            name:         rawTopic.name,
            order_index:  rawTopic.orderIndex,
            is_trackable: rawTopic.isTrackable,
            progress:     pMap.get(rawTopic.slug),
            subtopics:    subtopics,
          } as TopicWithProgress;
        });

        const completedCount = topics.filter(t => t.progress?.status === 'completed').length;
        return {
          id:          '',
          list_id:     '',
          slug:        rawMod.slug,
          name:        rawMod.name,
          order_index: rawMod.orderIndex,
          topics,
          completedCount,
          totalCount: topics.length,
        } as ModuleWithTopics;
      });

      const finalModules = applyLanguageVirtualTopics(modules, profile?.programming_language ?? null);
      const completedCount = finalModules.reduce((a, m) => a + m.completedCount, 0);
      const totalCount     = finalModules.reduce((a, m) => a + m.totalCount, 0);
      
      return {
        id:           '',
        slug:         rawList.slug,
        name:         rawList.name,
        short_name:   rawList.shortName,
        description:  rawList.description,
        order_index:  rawList.orderIndex,
        modules:      finalModules,
        completedCount,
        totalCount,
        completionPct: pct(completedCount, totalCount),
      } as ListWithModules;
    });

    setLists(enriched);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function _upsertSubtopics(stUpdates: {slug: string, status: string, completedAt: string|null}[]) {
    if (!userId || !stUpdates.length) return;
    const rows = stUpdates.map(u => ({
      user_id: userId,
      subtopic_id: u.slug, // using slug as ID
      status: u.status,
      completed_at: u.completedAt,
      updated_at: new Date().toISOString()
    }));
    await supabase.from('user_subtopic_progress').upsert(rows, { onConflict: 'user_id,subtopic_id' });
    
    // Log events
    stUpdates.forEach(async (u) => {
      await supabase.from('activity_events').insert({
        user_id: userId,
        event_type: u.status === 'completed' ? 'subtopic_completed' : 'subtopic_reopened',
        topic_id: null,
        metadata: { subtopic_slug: u.slug }
      });
    });
  }

  async function _upsertTopic(topicSlug: string, topicDbId: string, status: string, completedAt: string|null) {
    if (!userId) return;
    await supabase.from('user_topic_progress').upsert({
      user_id:      userId,
      topic_id:     topicDbId,
      status:       status,
      completed_at: completedAt,
      updated_at:   new Date().toISOString(),
    }, { onConflict: 'user_id,topic_id' });

    await supabase.from('activity_events').insert({
      user_id:    userId,
      event_type: status === 'completed' ? 'topic_completed' : 'topic_reopened',
      topic_id:   topicDbId || null,
      metadata:   { topic_slug: topicSlug },
    });
  }

  async function toggleTopic(
    topicSlug: string,
    topicDbId: string,
    currentStatus: string | undefined,
    onError: (msg: string) => void
  ) {
    if (!userId) return;
    const newStatus = currentStatus === 'completed' ? 'not_started' : 'completed';
    const completedAt = newStatus === 'completed' ? new Date().toISOString() : null;

    // Find the topic to see if it has subtopics
    let theTopic: TopicWithProgress | undefined;
    for (const l of lists) {
      for (const m of l.modules) {
        theTopic = m.topics.find(t => t.slug === topicSlug);
        if (theTopic) break;
      }
      if (theTopic) break;
    }

    const subtopicsToUpdate = theTopic?.subtopics || [];

    // Optimistically update lists
    setLists(prev => prev.map(list => ({
      ...list,
      modules: list.modules.map(mod => {
        const topics = mod.topics.map(t => {
          if (t.slug !== topicSlug) return t;
          return {
            ...t,
            progress: { ...t.progress, user_id: userId, topic_id: topicDbId, status: newStatus as any, completed_at: completedAt, updated_at: new Date().toISOString(), id: t.progress?.id ?? '' },
            subtopics: t.subtopics?.map(st => ({
              ...st,
              progress: { ...st.progress, user_id: userId, subtopic_id: st.slug, status: newStatus as any, completed_at: completedAt, updated_at: new Date().toISOString(), id: st.progress?.id ?? '' }
            }))
          };
        });
        const completedCount = topics.filter(t => t.progress?.status === 'completed').length;
        return { ...mod, topics, completedCount };
      })
    })).map(list => {
      const completedCount = list.modules.reduce((a, m) => a + m.completedCount, 0);
      return { ...list, completedCount, completionPct: pct(completedCount, list.totalCount) };
    }));

    try {
      await _upsertTopic(topicSlug, topicDbId, newStatus, completedAt);
      if (subtopicsToUpdate.length > 0) {
        await _upsertSubtopics(subtopicsToUpdate.map(st => ({ slug: st.slug, status: newStatus, completedAt })));
      }
    } catch (e) {
      onError('Failed to save. Please retry.');
      load();
    }
  }

  async function toggleSubtopic(
    topic: TopicWithProgress,
    subtopicSlug: string,
    currentStatus: string | undefined,
    onError: (msg: string) => void
  ) {
    if (!userId) return;
    const newStatus = currentStatus === 'completed' ? 'not_started' : 'completed';
    const completedAt = newStatus === 'completed' ? new Date().toISOString() : null;

    const siblings = topic.subtopics || [];
    let willCompleteParent = false;
    let willUncompleteParent = false;

    if (newStatus === 'completed') {
      const allOthersDone = siblings.every(st => st.slug === subtopicSlug || st.progress?.status === 'completed');
      if (allOthersDone && topic.progress?.status !== 'completed') {
        willCompleteParent = true;
      }
    } else {
      if (topic.progress?.status === 'completed') {
        willUncompleteParent = true;
      }
    }

    const newParentStatus = willCompleteParent ? 'completed' : willUncompleteParent ? 'not_started' : topic.progress?.status ?? 'not_started';
    const parentCompletedAt = willCompleteParent ? new Date().toISOString() : willUncompleteParent ? null : topic.progress?.completed_at ?? null;

    // Optimistically update lists
    setLists(prev => prev.map(list => ({
      ...list,
      modules: list.modules.map(mod => {
        const topics = mod.topics.map(t => {
          if (t.slug !== topic.slug) return t;
          return {
            ...t,
            progress: { ...t.progress, user_id: userId, topic_id: topic.id, status: newParentStatus as any, completed_at: parentCompletedAt, updated_at: new Date().toISOString(), id: t.progress?.id ?? '' },
            subtopics: t.subtopics?.map(st => {
              if (st.slug !== subtopicSlug) return st;
              return {
                ...st,
                progress: { ...st.progress, user_id: userId, subtopic_id: st.slug, status: newStatus as any, completed_at: completedAt, updated_at: new Date().toISOString(), id: st.progress?.id ?? '' }
              };
            })
          };
        });
        const completedCount = topics.filter(t => t.progress?.status === 'completed').length;
        return { ...mod, topics, completedCount };
      })
    })).map(list => {
      const completedCount = list.modules.reduce((a, m) => a + m.completedCount, 0);
      return { ...list, completedCount, completionPct: pct(completedCount, list.totalCount) };
    }));

    try {
      await _upsertSubtopics([{ slug: subtopicSlug, status: newStatus, completedAt }]);
      if (willCompleteParent || willUncompleteParent) {
        await _upsertTopic(topic.slug, topic.id, newParentStatus, parentCompletedAt);
      }
    } catch (e) {
      onError('Failed to save. Please retry.');
      load();
    }
  }

  return { lists, loading, progressMap, userId, toggleTopic, toggleSubtopic, reload: load, programmingLanguage, setProgrammingLanguage };
}

export function useAllTopics() {
  const { lists, loading } = useCurriculum();
  const all = lists.flatMap(l =>
    l.modules.flatMap(m =>
      m.topics.map(t => ({
        ...t,
        listName:   l.short_name,
        listSlug:   l.slug,
        moduleName: m.name,
      }))
    )
  );
  return { topics: all, loading };
}
