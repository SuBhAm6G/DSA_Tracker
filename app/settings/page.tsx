'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { useTheme } from '@/components/ThemeProvider';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, Download, Trash2, Sun, Moon, Monitor } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();

  const [displayName, setDisplayName] = useState('');
  const [programmingLanguage, setProgrammingLanguage] = useState('Python');
  const [nameLoading, setNameLoading] = useState(false);
  const [resetConfirm, setResetConfirm] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetDone, setResetDone] = useState(false);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await (supabase.from('profiles') as any).select('display_name, programming_language').eq('id', user.id).single() as unknown as { data: { display_name: string | null; programming_language: string | null } | null };
      if (data) {
        setDisplayName(data.display_name ?? '');
        setProgrammingLanguage(data.programming_language ?? 'Python');
      }
    }
    load();
  }, [supabase]);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setNameLoading(true);
    await (supabase.from('profiles') as any).update({ 
      display_name: displayName,
      programming_language: programmingLanguage
    }).eq('id', userId);
    setNameLoading(false);
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (resetConfirm !== 'RESET') { setResetError('Please type RESET to confirm.'); return; }
    setResetLoading(true);
    setResetError('');
    const { error } = await (supabase
      .from('user_topic_progress') as any)
      .delete()
      .eq('user_id', userId);

    if (!error) {
      await (supabase.from('activity_events') as any).delete().eq('user_id', userId);
      await (supabase.from('user_milestones') as any).delete().eq('user_id', userId);
      setResetDone(true);
      router.refresh();
    } else {
      setResetError('Reset failed: ' + (error as any).message);
    }
    setResetLoading(false);
  }

  async function handleExportJSON() {
    const { data: progress }   = await (supabase.from('user_topic_progress') as any).select('*').eq('user_id', userId);
    const { data: notes }      = await (supabase.from('topic_notes') as any).select('*').eq('user_id', userId);
    const { data: activity }   = await (supabase.from('activity_events') as any).select('*').eq('user_id', userId);
    const { data: milestones } = await (supabase.from('user_milestones') as any).select('*').eq('user_id', userId);

    const payload = { exportedAt: new Date().toISOString(), progress, notes, activity, milestones };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `dsa-tracker-export-${new Date().toLocaleDateString('en-CA')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleExportCSV() {
    const { data: progressRaw } = await (supabase.from('user_topic_progress') as any).select('*').eq('user_id', userId) as unknown as { data: Array<{ topic_id: string; status: string; completed_at: string | null; updated_at: string }> | null };
    const progress = progressRaw ?? [];
    if (!progress.length) { alert('No progress to export.'); return; }
    const header = 'topic_id,status,completed_at,updated_at';
    const rows = progress.map((r) => `${r.topic_id},${r.status},${r.completed_at ?? ''},${r.updated_at}`);
    const csv  = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `dsa-tracker-progress-${new Date().toLocaleDateString('en-CA')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell title="Settings">
      <div className="page-inner" style={{ maxWidth: 640 }}>
        <div className="page-header">
          <h1>Settings</h1>
        </div>

        {/* Theme */}
        <div className="card mb-4">
          <h3 style={{ marginBottom: '0.875rem' }}>Theme</h3>
          <div className="flex items-center gap-2">
            {([
              { val: 'light', label: 'Light', icon: <Sun size={13} /> },
              { val: 'dark',  label: 'Dark',  icon: <Moon size={13} /> },
              { val: 'system',label: 'System',icon: <Monitor size={13} /> },
            ] as const).map(({ val, label, icon }) => (
              <button
                key={val}
                className={`btn btn-sm${theme === val ? ' btn-primary' : ' btn-secondary'}`}
                onClick={() => setTheme(val)}
                id={`theme-${val}`}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>

        {/* Display Name */}
        <div className="card mb-4">
          <h3 style={{ marginBottom: '0.875rem' }}>Account</h3>
          <form onSubmit={saveName} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label" htmlFor="display-name">Display name</label>
              <input
                id="display-name"
                className="form-input"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: 150 }}>
              <label className="form-label" htmlFor="programming-language">Primary Language</label>
              <select
                id="programming-language"
                className="form-input form-select"
                value={programmingLanguage}
                onChange={e => setProgrammingLanguage(e.target.value)}
              >
                <option value="Python">Python</option>
                <option value="C++">C++</option>
                <option value="Java">Java</option>
                <option value="JavaScript/TypeScript">JavaScript/TypeScript</option>
              </select>
            </div>
            <button className="btn btn-primary btn-sm" type="submit" disabled={nameLoading} id="save-name-btn">
              {nameLoading ? 'Saving…' : 'Save'}
            </button>
          </form>
        </div>

        {/* Export */}
        <div className="card mb-4">
          <h3 style={{ marginBottom: '0.5rem' }}>Export Data</h3>
          <p style={{ fontSize: '0.775rem', marginBottom: '0.875rem' }}>
            Download all your progress, notes, and activity history.
          </p>
          <div className="flex items-center gap-2">
            <button className="btn btn-sm btn-secondary" onClick={handleExportJSON} id="export-json-btn">
              <Download size={12} /> Export JSON
            </button>
            <button className="btn btn-sm btn-secondary" onClick={handleExportCSV} id="export-csv-btn">
              <Download size={12} /> Export CSV
            </button>
          </div>
        </div>

        {/* Reset */}
        <div className="card" style={{ borderColor: 'var(--danger)', boxShadow: '4px 4px 0 0 var(--danger)' }}>
          <h3 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>Reset Progress</h3>
          <p style={{ fontSize: '0.775rem', marginBottom: '0.875rem' }}>
            Permanently delete all your topic progress, activity, and milestone data.
            This cannot be undone. Curriculum data is never deleted.
          </p>
          {resetDone ? (
            <div style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.825rem' }}>
              ✓ Progress reset successfully.
            </div>
          ) : (
            <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="reset-confirm">
                  Type <code>RESET</code> to confirm
                </label>
                <input
                  id="reset-confirm"
                  className="form-input"
                  value={resetConfirm}
                  onChange={e => setResetConfirm(e.target.value)}
                  placeholder="RESET"
                  autoComplete="off"
                />
              </div>
              {resetError && (
                <div style={{ fontSize: '0.775rem', color: 'var(--danger)', display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                  <AlertCircle size={12} /> {resetError}
                </div>
              )}
              <button
                type="submit"
                className="btn btn-danger btn-sm"
                disabled={resetLoading || resetConfirm !== 'RESET'}
                id="reset-btn"
                style={{ width: 'fit-content' }}
              >
                <Trash2 size={12} /> {resetLoading ? 'Resetting…' : 'Reset All Progress'}
              </button>
            </form>
          )}
        </div>
      </div>
    </AppShell>
  );
}
