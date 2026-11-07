'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Star, X, ExternalLink } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { useCurriculum } from '@/hooks/useCurriculum';
import { useImportantSubtopics } from '@/hooks/useImportantSubtopics';

interface SubtopicMeta {
  name: string;
  topicName: string;        // e.g. "4.2 Same-direction two pointers"
  moduleName: string;       // e.g. "Module 4 — Two Pointers"
  listShortName: string;    // e.g. "Data Roles"
  listHref: string;
  topicSlug: string;
  groupKey: string;         // unique key per topic
}

const LIST_HREF_MAP: Record<string, string> = {
  'list-1-data-roles':       '/curriculum/list-1',
  'list-2-indian-placement': '/curriculum/list-2',
  'list-3-maang-product':    '/curriculum/list-3',
  'list-4-very-high-tier':   '/curriculum/list-4',
};

export default function ImportantPage() {
  const router = useRouter();
  const { lists, loading: currLoading } = useCurriculum();
  const { importantSet, loading: impLoading, toggleImportant } = useImportantSubtopics();

  const loading = currLoading || impLoading;

  // Build a flat lookup: subtopicSlug → meta
  const subtopicMeta = useMemo(() => {
    const map = new Map<string, SubtopicMeta>();
    lists.forEach(list => {
      list.modules.forEach((mod, mIdx) => {
        mod.topics.forEach((topic, tIdx) => {
          topic.subtopics?.forEach(st => {
            map.set(st.slug, {
              name: st.name,
              topicName: topic.name,                           // already includes "4.2 ..."
              moduleName: mod.name,                            // e.g. "MODULE 4 — TWO POINTERS"
              listShortName: list.short_name,
              listHref: LIST_HREF_MAP[list.slug] ?? '/curriculum',
              topicSlug: topic.slug,
              groupKey: `${mIdx}-${tIdx}`,
            });
          });
        });
      });
    });
    return map;
  }, [lists]);

  // Group by parent topic, sorted by groupKey
  const grouped = useMemo(() => {
    const groups = new Map<string, {
      topicName: string;
      moduleName: string;
      listShortName: string;
      href: string;
      groupKey: string;
      items: { slug: string; name: string }[];
    }>();

    importantSet.forEach(slug => {
      const meta = subtopicMeta.get(slug);
      if (!meta) return;
      const key = meta.groupKey;
      if (!groups.has(key)) {
        groups.set(key, {
          topicName: meta.topicName,
          moduleName: meta.moduleName,
          listShortName: meta.listShortName,
          href: `${meta.listHref}?topic=${meta.topicSlug}`,
          groupKey: meta.groupKey,
          items: [],
        });
      }
      groups.get(key)!.items.push({ slug, name: meta.name });
    });

    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [importantSet, subtopicMeta]);

  // Format module name nicely: "MODULE 4 — TWO POINTERS" → "Module 4 — Two Pointers"
  function formatModuleName(raw: string) {
    return raw.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  }

  return (
    <AppShell title="IMP Marked">
      <div className="page-inner">
        <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <Star size={18} style={{ color: '#DC2626', flexShrink: 0 }} />
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>IMP Marked</h1>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-faint)', margin: 0 }}>
              {loading ? 'Loading…' : `${importantSet.size} subtopic${importantSet.size !== 1 ? 's' : ''} marked as important`}
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-faint)', fontSize: '0.8rem' }}>Loading…</div>
        ) : importantSet.size === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <Star size={32} style={{ color: 'var(--border-muted)', marginBottom: '0.75rem' }} />
            <p style={{ color: 'var(--text-faint)', fontSize: '0.875rem', margin: 0 }}>
              No subtopics marked as important yet.<br />
              Click the <strong>IMP</strong> button next to any subtopic in the curriculum.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {grouped.map(([key, group]) => (
              <div key={key} className="card" style={{ padding: '0' }}>
                {/* Group header — breadcrumb */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 1rem',
                  borderBottom: '1px solid var(--border-light)',
                  gap: '1rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', minWidth: 0 }}>
                    {/* Topic number badge */}
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: '#DC2626',
                      background: 'rgba(220,38,38,0.08)',
                      border: '1px solid rgba(220,38,38,0.25)',
                      borderRadius: 'var(--r-xs)',
                      padding: '0.1rem 0.4rem',
                      flexShrink: 0,
                    }}>
                      {group.topicName.match(/^[\d.]+/)?.[0] ?? ''}
                    </span>

                    {/* Separator */}
                    <span style={{ color: 'var(--border-muted)', fontSize: '0.75rem', flexShrink: 0 }}>|</span>

                    {/* Module name */}
                    <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>
                      {formatModuleName(group.moduleName)}
                    </span>

                    {/* Arrow */}
                    <span style={{ color: 'var(--border-muted)', fontSize: '0.75rem', flexShrink: 0 }}>›</span>

                    {/* Topic name (without leading number) */}
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)', minWidth: 0 }}>
                      {group.topicName.replace(/^[\d.]+\s*/, '')}
                    </span>
                  </div>

                  {/* Go to topic button */}
                  <button
                    onClick={() => router.push(group.href)}
                    title="Open topic in curriculum"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.3rem 0.65rem',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: 'var(--accent)',
                      background: 'transparent',
                      border: '1.5px solid var(--accent)',
                      borderRadius: 'var(--r-sm)',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'background 0.15s, color 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)'; }}
                  >
                    <ExternalLink size={11} />
                    Open
                  </button>
                </div>

                {/* Subtopic rows */}
                <div style={{ padding: '0.3rem 0' }}>
                  {group.items.map(item => (
                    <div key={item.slug} className="imp-subtopic-row" style={{ padding: '0.5rem 1rem' }}>
                      <Star size={11} style={{ color: '#DC2626', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: '0.875rem' }}>{item.name}</span>
                      <button
                        onClick={() => toggleImportant(item.slug)}
                        title="Unmark as Important"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.775rem',
                          fontWeight: 600,
                          color: '#DC2626',
                          background: 'rgba(220,38,38,0.08)',
                          border: '1.5px solid rgba(220,38,38,0.3)',
                          borderRadius: 'var(--r-sm)',
                          cursor: 'pointer',
                          flexShrink: 0,
                          transition: 'background 0.15s, border-color 0.15s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#DC2626'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(220,38,38,0.08)'; (e.currentTarget as HTMLButtonElement).style.color = '#DC2626'; }}
                      >
                        <X size={12} />
                        Unmark
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
