'use client';

import { useEffect, useState, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import { createClient } from '@/lib/supabase/client';
import type { ActivityEvent } from '@/lib/supabase/types';
import { relativeTime, exactDate } from '@/lib/utils';
import { CheckCircle2, RotateCcw, Play, Trophy } from 'lucide-react';

type EventFilter = 'all' | 'topic_completed' | 'topic_reopened' | 'milestone_achieved';

const EVENT_ICONS: Record<string, React.ReactNode> = {
  topic_completed:   <CheckCircle2 size={12} />,
  topic_reopened:    <RotateCcw size={12} />,
  topic_started:     <Play size={12} />,
  milestone_achieved:<Trophy size={12} />,
};

const EVENT_LABELS: Record<string, string> = {
  topic_completed:   'Completed',
  topic_reopened:    'Reopened',
  topic_started:     'Started',
  milestone_achieved:'Milestone',
};

export default function ActivityPage() {
  const supabase = createClient();
  const [events, setEvents]   = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<EventFilter>('all');
  const [page, setPage]       = useState(0);
  const PAGE_SIZE = 30;

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const supabaseAny = supabase as any;
    let q = supabaseAny
      .from('activity_events')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (filter !== 'all') q = q.eq('event_type', filter);

    const { data } = await q as unknown as { data: ActivityEvent[] | null };
    setEvents(prev => page === 0 ? (data ?? []) : [...prev, ...(data ?? [])]);
    setLoading(false);
  }, [supabase, filter, page]);

  useEffect(() => { setPage(0); }, [filter]);
  useEffect(() => { load(); }, [load]);

  return (
    <AppShell title="Activity">
      <div className="page-inner">
        <div className="page-header">
          <h1>Activity History</h1>
          <p>A log of your DSA learning actions</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
          {(['all','topic_completed','topic_reopened','milestone_achieved'] as EventFilter[]).map(f => (
            <button
              key={f}
              className={`btn btn-sm${filter === f ? ' btn-primary' : ' btn-secondary'}`}
              onClick={() => setFilter(f)}
              id={`activity-filter-${f}`}
            >
              {f === 'all' ? 'All' : EVENT_LABELS[f]}
            </button>
          ))}
        </div>

        {/* Events */}
        <div className="card" style={{ padding: '0.5rem 1rem' }}>
          {loading && events.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-faint)', fontSize: '0.8rem' }}>
              Loading activity…
            </div>
          ) : events.length === 0 ? (
            <div className="empty-state">
              <p>No activity yet. Complete a topic to see it here!</p>
            </div>
          ) : (
            events.map(ev => {
              const topicName = (ev.metadata as any)?.topic_slug ?? 'Topic';
              const listName  = null;
              const modName   = null;

              return (
                <div key={ev.id} className="activity-item">
                  <div className={`activity-dot${ev.event_type === 'topic_reopened' ? ' activity-dot-reopen' : ''}`}>
                    <span className="visually-hidden">{EVENT_LABELS[ev.event_type]}</span>
                  </div>
                  <div className="activity-content">
                    <div className="activity-text">
                      <span style={{ color: 'var(--text-faint)', fontSize: '0.75rem', marginRight: '0.375rem' }}>
                        {EVENT_ICONS[ev.event_type]}
                      </span>
                      {EVENT_LABELS[ev.event_type]}: <strong>{topicName}</strong>
                    </div>
                    <div className="activity-meta">
                      {listName && modName && `${listName} › ${modName} · `}
                      {relativeTime(ev.created_at)}
                      <span title={exactDate(ev.created_at)} style={{ marginLeft: '0.375rem', cursor: 'help' }}>
                        ({exactDate(ev.created_at)})
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Load more */}
        {events.length >= PAGE_SIZE && (
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPage(p => p + 1)}
              id="load-more-activity"
            >
              Load more
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
