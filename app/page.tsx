'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Flame, TrendingUp, CheckCircle2, Calendar, Zap } from 'lucide-react';
import AppShell from '@/components/AppShell';
import Heatmap from '@/components/Heatmap';
import { useCurriculum } from '@/hooks/useCurriculum';
import { createClient } from '@/lib/supabase/client';
import { pct, computeStreaks, toDateKey, startOfWeekISO, relativeTime } from '@/lib/utils';
import type { ActivityEvent, EventType } from '@/lib/supabase/types';
import MilestoneTrackers from '@/components/MilestoneTrackers';
import { getRank, getNextRank } from '@/lib/levels';

const LIST_COLORS = ['var(--accent)', 'var(--accent-2)', 'var(--success)', 'var(--danger)'];
const LIST_FILL_CLASSES = ['', 'progress-fill-2', 'progress-fill-3', 'progress-fill-4'];

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const { lists, loading } = useCurriculum();

  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [dayCounts, setDayCounts] = useState<Record<string, number>>({});
  const [streakData, setStreakData] = useState({ current: 0, longest: 0, activeDays: 0 });
  const [todayCount, setTodayCount] = useState(0);
  const [weekCount, setWeekCount] = useState(0);

  const loadActivity = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: events } = await (supabase
      .from('activity_events') as any)
      .select('*')
      .eq('user_id', user.id)
      .in('event_type', ['topic_completed', 'subtopic_completed'])
      .order('created_at', { ascending: false })
      .limit(500) as unknown as { data: Array<{ id: string; user_id: string; created_at: string; event_type: EventType; topic_id: string | null; metadata: any }> | null };

    if (!events) return;
    setActivity(events.slice(0, 10));

    // Build day counts - Deduplicating same item per day
    const counts: Record<string, number> = {};
    const dates: string[] = [];
    const seenEvents = new Set<string>();

    events.forEach(e => {
      const d = toDateKey(e.created_at);
      const itemId = e.metadata?.subtopic_slug || e.metadata?.topic_slug || e.topic_id;
      const dedupeKey = `${d}-${itemId}`;
      
      if (!seenEvents.has(dedupeKey)) {
        seenEvents.add(dedupeKey);
        counts[d] = (counts[d] ?? 0) + 1;
        dates.push(d);
      }
    });
    setDayCounts(counts);
    setStreakData(computeStreaks(dates));

    // Today
    const todayKey = toDateKey(new Date().toISOString());
    setTodayCount(counts[todayKey] ?? 0);

    // This week
    const weekStart = startOfWeekISO();
    let wc = 0;
    Object.entries(counts).forEach(([d, c]) => {
      if (new Date(d) >= weekStart) wc += c;
    });
    setWeekCount(wc);
  }, [supabase]);

  useEffect(() => { loadActivity(); }, [loadActivity]);

  const totalCompleted = lists.reduce((a, l) => a + l.completedCount, 0);
  const totalTopics    = lists.reduce((a, l) => a + l.totalCount, 0);
  const overallPct     = pct(totalCompleted, totalTopics);

  let totalCompletedConcepts = 0;
  lists.forEach(l => l.modules.forEach(m => m.topics.forEach(t => {
    if (t.subtopics) totalCompletedConcepts += t.subtopics.filter(st => st.progress?.status === 'completed').length;
  })));

  const currentRank = getRank(totalCompleted);
  const nextRank = getNextRank(totalCompleted);

  // Find next incomplete topic across all lists in order
  const nextTopic = (() => {
    for (const list of lists) {
      for (const mod of list.modules) {
        for (const topic of mod.topics) {
          if (topic.progress?.status !== 'completed') {
            return { topic, mod, list };
          }
        }
      }
    }
    return null;
  })();

  return (
    <AppShell title="Dashboard">
      <div className="page-inner">
        {/* ── Header ── */}
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1>Progress Overview</h1>
            <p>Your DSA learning dashboard</p>
          </div>
          
          <div className="glass-card" style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', color: 'white', fontWeight: 800 }}>
              {currentRank.level}
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-faint)', fontWeight: 700 }}>Current Rank</div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent)' }}>{currentRank.name}</div>
              {nextRank && (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                  {nextRank.threshold - totalCompleted} topics to Level {nextRank.level}
                </div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            <MilestoneTrackers lists={lists} />
            
            {/* ── Top stats row ── */}
            <div className="stats-grid stats-grid-4 section">
              <StatCard
                label="Overall"
                value={`${overallPct}%`}
                sub={`${totalCompleted} / ${totalTopics} topics`}
                icon={<TrendingUp size={14} />}
              />
              <StatCard
                label="Current Streak"
                value={`${streakData.current}d`}
                sub={`Longest: ${streakData.longest} days`}
                icon={<Flame size={14} />}
                accent
              />
              <StatCard
                label="Today"
                value={String(todayCount)}
                sub={`${weekCount} this week`}
                icon={<CheckCircle2 size={14} />}
              />
              <StatCard
                label="Active Days"
                value={String(streakData.activeDays)}
                sub="Total days with activity"
                icon={<Calendar size={14} />}
              />
            </div>

            {/* ── List progression ── */}
            <div className="section">
              <div className="section-header">
                <span className="section-title">List Progression</span>
              </div>
              <div className="list-progression">
                {lists.map((list, idx) => {
                  let listSubtopicsCount = 0;
                  let listCompletedSubtopicsCount = 0;
                  list.modules.forEach(m => m.topics.forEach(t => {
                    if (t.subtopics) {
                      listSubtopicsCount += t.subtopics.length;
                      listCompletedSubtopicsCount += t.subtopics.filter(st => st.progress?.status === 'completed').length;
                    }
                  }));
                  return (
                  <div key={list.slug}>
                    <div
                      className="list-prog-item"
                      style={{ cursor: 'pointer' }}
                      onClick={() => router.push(`/curriculum/list-${idx + 1}`)}
                    >
                      <div className="list-prog-header">
                        <div>
                          <div className="list-prog-num">0{idx + 1}</div>
                          <div className="list-prog-name">{list.short_name}</div>
                        </div>
                        <div className="list-prog-pct" style={{ color: LIST_COLORS[idx] }}>
                          {list.completionPct}%
                        </div>
                      </div>
                      <div className="progress-bar">
                        <div
                          className={`progress-fill ${LIST_FILL_CLASSES[idx]}`}
                          style={{ width: `${list.completionPct}%` }}
                        />
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                        {list.completedCount} / {list.totalCount} topics {listSubtopicsCount > 0 ? `| ${listCompletedSubtopicsCount} / ${listSubtopicsCount} concepts` : ''}
                      </div>
                    </div>
                    {idx < lists.length - 1 && <div className="list-prog-arrow" />}
                  </div>
                )})}
              </div>
            </div>

            {/* ── Bottom section: Continue + Activity + Heatmap ── */}
            <div className="responsive-grid-2">

              {/* Continue Learning */}
              <div className="section" style={{ margin: 0 }}>
                <div className="section-header">
                  <span className="section-title">Continue Learning</span>
                </div>
                {nextTopic ? (
                  <div className="card">
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', marginBottom: '0.375rem' }}>
                      {nextTopic.list.short_name} › {nextTopic.mod.name}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.875rem', lineHeight: 1.3 }}>
                      {nextTopic.topic.name}
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        const listNum = nextTopic.list.slug.match(/list-(\d)/)?.[1] ?? '1';
                        router.push(`/curriculum/list-${listNum}?topic=${nextTopic.topic.slug}`);
                      }}
                      id="continue-learning-btn"
                    >
                      Open Topic <ArrowRight size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="card">
                    <div style={{ color: 'var(--success)', fontWeight: 700 }}>
                      🎉 All topics completed!
                    </div>
                  </div>
                )}

                {/* Recent Activity */}
                <div className="section-header mt-4">
                  <span className="section-title">Recent Activity</span>
                </div>
                <div className="card" style={{ padding: '0.5rem 1rem' }}>
                  {activity.length === 0 ? (
                    <div className="empty-state" style={{ padding: '1.5rem 0' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-faint)' }}>No activity yet — complete a topic to start!</span>
                    </div>
                  ) : (
                    activity.slice(0, 6).map(ev => (
                      <div key={ev.id} className="activity-item">
                        <div className="activity-dot" />
                        <div className="activity-content">
                          <div className="activity-text">
                            Completed a topic
                          </div>
                          <div className="activity-meta">{relativeTime(ev.created_at)}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Heatmap */}
              <div className="section" style={{ margin: 0 }}>
                <div className="section-header">
                  <span className="section-title">Activity Heatmap — {new Date().getFullYear()}</span>
                </div>
                <div className="card" style={{ overflowX: 'auto' }}>
                  <Heatmap dayCounts={dayCounts} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, sub, icon, accent }: {
  label: string; value: string; sub: string;
  icon?: React.ReactNode; accent?: boolean;
}) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">{label}</div>
        <span style={{ color: accent ? 'var(--accent)' : 'var(--text-faint)' }}>{icon}</span>
      </div>
      <div className="card-value" style={{ color: accent ? 'var(--accent)' : undefined }}>{value}</div>
      <div style={{ fontSize: '0.725rem', color: 'var(--text-faint)', marginTop: '0.25rem' }}>{sub}</div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {[1,2,3].map(i => (
        <div key={i} style={{ height: 80, background: 'var(--bg-raised)', border: '2px solid var(--border-light)', animation: 'pulse 1.5s infinite' }} />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:.5} }`}</style>
    </div>
  );
}
