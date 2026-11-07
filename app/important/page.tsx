'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Trash2 } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { useCurriculum } from '@/hooks/useCurriculum';
import { useImportantSubtopics } from '@/hooks/useImportantSubtopics';

export default function ImportantPage() {
  const router = useRouter();
  const { lists, loading: currLoading } = useCurriculum();
  const { importantSet, loading: impLoading, toggleImportant } = useImportantSubtopics();

  const loading = currLoading || impLoading;

  // Build a flat lookup: subtopicSlug → { name, topicName, topicOrderIndex, moduleName, listShortName, listHref }
  const subtopicMeta = useMemo(() => {
    const map = new Map<string, {
      name: string;
      topicName: string;
      moduleOrderLabel: string;
      listHref: string;
      topicSlug: string;
    }>();
    const listHrefMap: Record<string, string> = {
      'list-1-data-roles':     '/curriculum/list-1',
      'list-2-indian-placement': '/curriculum/list-2',
      'list-3-maang-product':  '/curriculum/list-3',
      'list-4-very-high-tier': '/curriculum/list-4',
    };
    lists.forEach(list => {
      list.modules.forEach((mod, mIdx) => {
        mod.topics.forEach((topic, tIdx) => {
          topic.subtopics?.forEach(st => {
            map.set(st.slug, {
              name: st.name,
              topicName: topic.name,
              moduleOrderLabel: `${mIdx + 1}.${tIdx + 1} ${topic.name}`,
              listHref: listHrefMap[list.slug] ?? '/curriculum',
              topicSlug: topic.slug,
            });
          });
        });
      });
    });
    return map;
  }, [lists]);

  // Group important subtopics by their parent topic label
  const grouped = useMemo(() => {
    const groups = new Map<string, { label: string; href: string; items: { slug: string; name: string }[] }>();
    importantSet.forEach(slug => {
      const meta = subtopicMeta.get(slug);
      if (!meta) return;
      const key = meta.moduleOrderLabel;
      if (!groups.has(key)) {
        groups.set(key, { label: meta.moduleOrderLabel, href: `${meta.listHref}?topic=${meta.topicSlug}`, items: [] });
      }
      groups.get(key)!.items.push({ slug, name: meta.name });
    });
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [importantSet, subtopicMeta]);

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
          <div className="card" style={{ padding: '1rem 1.25rem' }}>
            {grouped.map(([key, group]) => (
              <div key={key} style={{ marginBottom: '1.25rem' }}>
                <div className="imp-group-header">
                  <button
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', letterSpacing: 'inherit', textTransform: 'inherit', padding: 0 }}
                    onClick={() => router.push(group.href)}
                    title="Go to topic"
                  >
                    ↗ {group.label}
                  </button>
                </div>
                {group.items.map(item => (
                  <div key={item.slug} className="imp-subtopic-row">
                    <Star size={11} style={{ color: '#DC2626', flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{item.name}</span>
                    <button
                      className="imp-btn imp-btn--active"
                      onClick={() => toggleImportant(item.slug)}
                      title="Unmark as Important"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <Trash2 size={9} /> Remove
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
