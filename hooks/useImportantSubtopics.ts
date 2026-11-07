'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useImportantSubtopics() {
  const supabase = createClient();
  const [importantSet, setImportantSet] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);

    const { data } = await (supabase as any)
      .from('user_important_subtopics')
      .select('subtopic_id')
      .eq('user_id', user.id) as { data: { subtopic_id: string }[] | null };

    setImportantSet(new Set((data ?? []).map(r => r.subtopic_id)));
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function markImportant(subtopicSlug: string) {
    if (!userId) return;
    // Optimistic
    setImportantSet(prev => new Set([...prev, subtopicSlug]));
    await (supabase as any).from('user_important_subtopics').insert({
      user_id: userId,
      subtopic_id: subtopicSlug,
    });
  }

  async function unmarkImportant(subtopicSlug: string) {
    if (!userId) return;
    // Optimistic
    setImportantSet(prev => { const n = new Set(prev); n.delete(subtopicSlug); return n; });
    await (supabase as any).from('user_important_subtopics')
      .delete()
      .eq('user_id', userId)
      .eq('subtopic_id', subtopicSlug);
  }

  function toggleImportant(subtopicSlug: string) {
    if (importantSet.has(subtopicSlug)) {
      unmarkImportant(subtopicSlug);
    } else {
      markImportant(subtopicSlug);
    }
  }

  return { importantSet, loading, toggleImportant };
}
