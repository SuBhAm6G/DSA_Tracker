'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { useCurriculum } from '@/hooks/useCurriculum';
import { createClient } from '@/lib/supabase/client';
import { computeStreaks, toDateKey } from '@/lib/utils';
import type { Profile } from '@/lib/supabase/types';
import { LogOut, User } from 'lucide-react';
import { format } from 'date-fns';

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const { lists, loading } = useCurriculum();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [streaks, setStreaks]  = useState({ current: 0, longest: 0, activeDays: 0 });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await (supabase.from('profiles') as any).select('*').eq('id', user.id).single() as unknown as { data: Profile | null };
      setProfile(prof);

      const { data: events } = await (supabase
        .from('activity_events') as any)
        .select('created_at')
        .eq('user_id', user.id)
        .eq('event_type', 'topic_completed') as unknown as { data: Array<{ created_at: string }> | null };

      const dates = (events ?? []).map(e => toDateKey(e.created_at));
      setStreaks(computeStreaks(dates));
    }
    load();
  }, [supabase]);

  const totalCompleted = lists.reduce((a, l) => a + l.completedCount, 0);
  const totalTopics    = lists.reduce((a, l) => a + l.totalCount, 0);

  const initials = (profile?.display_name ?? profile?.email ?? 'U')
    .split(' ')
    .map(s => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/auth/login');
  }

  return (
    <AppShell title="Profile">
      <div className="page-inner">
        <div className="page-header">
          <h1>Profile</h1>
        </div>

        <div className="responsive-grid-2" style={{ maxWidth: 720 }}>
          {/* Profile card */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="responsive-card-row">
              <div style={{
                width: 56, height: 56,
                background: 'var(--accent)',
                border: '2px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem', fontWeight: 800, color: '#fff',
                flexShrink: 0,
              }}>
                {initials}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ marginBottom: '0.125rem' }}>{profile?.display_name ?? 'User'}</h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{profile?.email}</div>
                {profile?.created_at && (
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-faint)', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                    Member since {format(new Date(profile.created_at), 'MMMM yyyy')}
                  </div>
                )}
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleLogout}
                id="logout-btn"
              >
                <LogOut size={12} /> Sign out
              </button>
            </div>
          </div>

          {/* Stats */}
          {[
            { l: 'Topics Completed', v: String(totalCompleted) },
            { l: 'Total Topics',     v: String(totalTopics) },
            { l: 'Current Streak',   v: `${streaks.current} days` },
            { l: 'Longest Streak',   v: `${streaks.longest} days` },
            { l: 'Active Days',      v: String(streaks.activeDays) },
            { l: 'Completion',       v: `${totalTopics ? Math.round((totalCompleted / totalTopics) * 100) : 0}%` },
          ].map(({ l, v }) => (
            <div key={l} className="card card-sm">
              <div className="card-title">{l}</div>
              <div className="card-value-sm">{v}</div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
