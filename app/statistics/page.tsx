'use client';

import { useEffect, useState, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import Heatmap from '@/components/Heatmap';
import { useCurriculum } from '@/hooks/useCurriculum';
import { createClient } from '@/lib/supabase/client';
import { computeStreaks, toDateKey, pct, startOfWeekISO } from '@/lib/utils';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid
} from 'recharts';
import { format, subDays } from 'date-fns';
import MilestoneTrackers from '@/components/MilestoneTrackers';

export default function StatisticsPage() {
  const supabase = createClient();
  const { lists, loading } = useCurriculum();

  const [streaks, setStreaks]       = useState({ current: 0, longest: 0, activeDays: 0 });
  const [dayCounts, setDayCounts]   = useState<Record<string, number>>({});
  const [cumulativeData, setCumulativeData] = useState<Array<{ date: string; total: number }>>([]);
  const [weekData, setWeekData]     = useState<Array<{ day: string; count: number }>>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [weekCount, setWeekCount]   = useState(0);
  const [monthCount, setMonthCount] = useState(0);
  const [heatYear, setHeatYear]     = useState(new Date().getFullYear());

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: events } = await (supabase
      .from('activity_events') as any)
      .select('created_at, metadata, topic_id')
      .eq('user_id', user.id)
      .in('event_type', ['topic_completed', 'subtopic_completed'])
      .order('created_at', { ascending: true }) as unknown as { data: Array<{ created_at: string; metadata: any; topic_id: string | null }> | null };

    if (!events) return;

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
    setStreaks(computeStreaks(dates));

    // Today / week / month
    const now = new Date();
    const todayKey = toDateKey(now.toISOString());
    setTodayCount(counts[todayKey] ?? 0);
    const weekStart = startOfWeekISO();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    let wc = 0, mc = 0;
    Object.entries(counts).forEach(([d, c]) => {
      const dt = new Date(d);
      if (dt >= weekStart) wc += c;
      if (dt >= monthStart) mc += c;
    });
    setWeekCount(wc);
    setMonthCount(mc);

    // Cumulative line chart
    const sortedDates = [...new Set(dates)].sort();
    let total = 0;
    const cum = sortedDates.map(d => {
      total += counts[d];
      return { date: d, total };
    });
    setCumulativeData(cum.filter((_, i) => i % Math.max(1, Math.floor(cum.length / 60)) === 0 || i === cum.length - 1));

    // Last 7 days bar chart
    const week = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(now, 6 - i);
      const key = d.toLocaleDateString('en-CA');
      return { day: format(d, 'EEE'), count: counts[key] ?? 0 };
    });
    setWeekData(week);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const totalCompleted = lists.reduce((a, l) => a + l.completedCount, 0);
  const totalTopics    = lists.reduce((a, l) => a + l.totalCount, 0);
  
  let totalSubtopics = 0;
  let completedSubtopics = 0;
  lists.forEach(l => l.modules.forEach(m => m.topics.forEach(t => {
    if (t.subtopics) {
      totalSubtopics += t.subtopics.length;
      completedSubtopics += t.subtopics.filter(st => st.progress?.status === 'completed').length;
    }
  })));

  const avgPerDay = streaks.activeDays
    ? ((totalCompleted + completedSubtopics) / Math.max(1, streaks.activeDays)).toFixed(1)
    : '0';

  return (
    <AppShell title="Statistics">
      <div className="page-inner">
        <div className="page-header">
          <h1>Statistics</h1>
          <p>Detailed progress metrics and trends</p>
        </div>

        <MilestoneTrackers lists={lists} />

        {/* Summary cards */}
        <div className="stats-grid stats-grid-4 section">
          {[
            { l: 'Total Topics', v: String(totalTopics) },
            { l: 'Total Concepts', v: String(totalSubtopics) },
            { l: 'Completed Topics',    v: String(totalCompleted) },
            { l: 'Completed Concepts',  v: String(completedSubtopics) },
            { l: 'Remaining',    v: String(totalTopics - totalCompleted) },
            { l: 'Completion',   v: `${pct(totalCompleted, totalTopics)}%` },
            { l: 'Current Streak', v: `${streaks.current}d` },
            { l: 'Longest Streak', v: `${streaks.longest}d` },
            { l: 'Active Days',    v: String(streaks.activeDays) },
            { l: 'Avg / Day',      v: avgPerDay },
            { l: 'Today',   v: String(todayCount) },
            { l: 'This Week', v: String(weekCount) },
            { l: 'This Month', v: String(monthCount) },
          ].map(({ l, v }) => (
            <div key={l} className="card card-sm">
              <div className="card-title">{l}</div>
              <div className="card-value-sm">{v}</div>
            </div>
          ))}
        </div>

        {/* Per-list breakdown */}
        <div className="section">
          <div className="section-header"><span className="section-title">By List</span></div>
          <div className="card table-scroll" style={{ padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-raised)', borderBottom: '2px solid var(--border)' }}>
                  {['List','Modules','Topics','Completed','%'].map(h => (
                    <th key={h} style={{ padding: '0.5rem 1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lists.map(list => (
                  <tr key={list.slug} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '0.5rem 1rem', fontWeight: 600 }}>{list.short_name}</td>
                    <td style={{ padding: '0.5rem 1rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{list.modules.length}</td>
                    <td style={{ padding: '0.5rem 1rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{list.totalCount}</td>
                    <td style={{ padding: '0.5rem 1rem', fontFamily: 'var(--font-mono)' }}>{list.completedCount}</td>
                    <td style={{ padding: '0.5rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="progress-bar" style={{ width: 60 }}>
                          <div className="progress-fill" style={{ width: `${list.completionPct}%` }} />
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{list.completionPct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts */}
        <div className="responsive-grid-2" style={{ marginBottom: '2rem' }}>
          {/* Cumulative progress */}
          <div className="card">
            <div className="card-title mb-4">Cumulative Topics Completed</div>
            {cumulativeData.length > 1 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={cumulativeData}>
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--text-faint)' }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 9, fill: 'var(--text-faint)' }} width={30} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-card)', border: '2px solid var(--border)', fontSize: 11, borderRadius: 0 }}
                    labelStyle={{ color: 'var(--text)', fontWeight: 600 }}
                  />
                  <Line type="monotone" dataKey="total" stroke="var(--accent)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ height: 200 }}><p>Complete topics to see progress</p></div>
            )}
          </div>

          {/* Weekly bar chart */}
          <div className="card">
            <div className="card-title mb-4">Last 7 Days</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weekData}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--text-faint)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-faint)' }} width={25} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '2px solid var(--border)', fontSize: 11, borderRadius: 0 }}
                />
                <Bar dataKey="count" fill="var(--accent)" radius={[0, 0, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Heatmap */}
        <div className="section">
          <div className="section-header">
            <span className="section-title">Activity Heatmap</span>
            <div className="flex items-center gap-2">
              <button className="btn btn-sm btn-secondary" onClick={() => setHeatYear(y => y - 1)} id="heat-prev-year">←</button>
              <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{heatYear}</span>
              <button className="btn btn-sm btn-secondary" onClick={() => setHeatYear(y => Math.min(y + 1, new Date().getFullYear()))} id="heat-next-year">→</button>
            </div>
          </div>
          <div className="card" style={{ overflowX: 'auto' }}>
            <Heatmap dayCounts={dayCounts} year={heatYear} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
