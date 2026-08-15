'use client';

import { useState, useEffect } from 'react';
import { X, Check, Clock, AlertCircle } from 'lucide-react';
import type { TopicWithProgress } from '@/lib/supabase/types';
import { humanDate, exactDate, relativeTime } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface Props {
  topic: TopicWithProgress & { listName: string; moduleName: string };
  onClose: () => void;
  onToggle: () => void;
  userId: string;
}

export default function TopicDrawer({ topic, onClose, onToggle, userId }: Props) {
  const supabase = createClient();
  const [note, setNote]       = useState('');
  const [saving, setSaving]   = useState(false);
  const [noteTimer, setNoteTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const status = topic.progress?.status ?? 'not_started';

  // Load note
  useEffect(() => {
    (supabase
      .from('topic_notes') as any)
      .select('content')
      .eq('user_id', userId)
      .eq('topic_id', topic.id)
      .maybeSingle()
      .then(({ data }: { data: { content: string } | null }) => {
        if (data) setNote(data.content ?? '');
      });
  }, [topic.id, userId, supabase]);

  // Debounced note save
  function handleNoteChange(val: string) {
    setNote(val);
    if (noteTimer) clearTimeout(noteTimer);
    const t = setTimeout(() => saveNote(val), 800);
    setNoteTimer(t);
  }

  async function saveNote(content: string) {
    setSaving(true);
    await (supabase
      .from('topic_notes') as any)
      .upsert({ user_id: userId, topic_id: topic.id, content }, { onConflict: 'user_id,topic_id' });
    setSaving(false);
  }

  const statusColor =
    status === 'completed'  ? 'var(--success)'  :
    status === 'in_progress'? 'var(--warning)'  :
    'var(--text-faint)';

  const statusLabel =
    status === 'completed'  ? 'Completed'   :
    status === 'in_progress'? 'In Progress' :
    'Not Started';

  return (
    <div className="drawer-overlay" onClick={onClose} role="dialog" aria-modal aria-labelledby="drawer-title">
      <div className="drawer" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="drawer-header">
          <div>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
              {topic.listName} › {topic.moduleName}
            </span>
            <h3 id="drawer-title" style={{ marginTop: '0.125rem', fontSize: '0.9rem', lineHeight: 1.3 }}>
              {topic.name}
            </h3>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <X size={14} />
          </button>
        </div>

        <div className="drawer-body">
          {/* Status */}
          <div className="card card-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="card-title">Status</div>
                <div className="flex items-center gap-2 mt-1">
                  <div style={{
                    width: 8, height: 8,
                    background: statusColor,
                    border: '2px solid var(--border)',
                    flexShrink: 0,
                  }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{statusLabel}</span>
                </div>
              </div>
              <button
                className={`btn ${status === 'completed' ? 'btn-secondary' : 'btn-primary'}`}
                onClick={onToggle}
                id="topic-toggle-btn"
              >
                {status === 'completed' ? (
                  <><AlertCircle size={12} /> Reopen</>
                ) : (
                  <><Check size={12} /> Complete</>
                )}
              </button>
            </div>
          </div>

          {/* Timestamps */}
          {topic.progress?.completed_at && (
            <div className="card card-sm">
              <div className="card-title mb-2">Completion</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text)' }}>
                {humanDate(topic.progress.completed_at)}
              </div>
              <div
                style={{ fontSize: '0.7rem', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', marginTop: '0.25rem' }}
                title={exactDate(topic.progress.completed_at)}
              >
                {exactDate(topic.progress.completed_at)}
              </div>
              {topic.progress.updated_at && topic.progress.updated_at !== topic.progress.completed_at && (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)', marginTop: '0.25rem' }}>
                  <Clock size={10} style={{ display: 'inline', marginRight: '0.25rem' }} />
                  Updated {relativeTime(topic.progress.updated_at)}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="section-title">Notes</span>
              {saving && (
                <span style={{ fontSize: '0.65rem', color: 'var(--text-faint)' }}>Saving…</span>
              )}
            </div>
            <textarea
              className="form-input"
              placeholder="Add notes, links, or reminders about this topic..."
              value={note}
              onChange={e => handleNoteChange(e.target.value)}
              rows={5}
              id={`note-${topic.slug}`}
              aria-label="Topic notes"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
