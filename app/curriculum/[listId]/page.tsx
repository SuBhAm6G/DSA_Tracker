'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight, Check, Minus, AlertCircle } from 'lucide-react';
import AppShell from '@/components/AppShell';
import TopicDrawer from '@/components/TopicDrawer';
import LanguageModal from '@/components/LanguageModal';
import { useCurriculum } from '@/hooks/useCurriculum';
import type { TopicWithProgress, ModuleWithTopics } from '@/lib/supabase/types';
import { humanDate } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

const LIST_SLUG_MAP: Record<string, string> = {
  'list-1': 'list-1-data-roles',
  'list-2': 'list-2-indian-placement',
  'list-3': 'list-3-maang-product',
  'list-4': 'list-4-very-high-tier',
};

type StatusFilter = 'all' | 'completed' | 'in_progress' | 'not_started';

export default function CurriculumPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const listId = params.listId as string; // "list-1" .. "list-4"
  const targetTopicSlug = searchParams.get('topic');

  const { lists, loading, toggleTopic, toggleSubtopic, userId, programmingLanguage, setProgrammingLanguage } = useCurriculum();

  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter]       = useState<StatusFilter>('all');
  const [moduleFilter, setModuleFilter]       = useState<string>('all');
  const [selectedTopic, setSelectedTopic]     = useState<any>(null);
  const [error, setError]                     = useState('');
  const [saving, setSaving]                   = useState(false);

  const listSlug = LIST_SLUG_MAP[listId];
  const list     = lists.find(l => l.slug === listSlug);

  // Auto-expand module containing target topic
  useEffect(() => {
    if (!targetTopicSlug || !list) return;
    for (const mod of list.modules) {
      if (mod.topics.some(t => t.slug === targetTopicSlug)) {
        setExpandedModules(prev => new Set([...prev, mod.slug]));
        // Open topic drawer
        const topic = mod.topics.find(t => t.slug === targetTopicSlug);
        if (topic) {
          setSelectedTopic({
            ...topic,
            listName: list.short_name,
            moduleName: mod.name,
          });
        }
        break;
      }
    }
  }, [targetTopicSlug, list]);

  // Restore expanded state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`expanded-${listId}`);
    if (saved) {
      try { setExpandedModules(new Set(JSON.parse(saved))); } catch {}
    }
  }, [listId]);

  function toggleModule(slug: string) {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug); else next.add(slug);
      localStorage.setItem(`expanded-${listId}`, JSON.stringify([...next]));
      return next;
    });
  }

  function filterTopics(topics: TopicWithProgress[]) {
    if (statusFilter === 'all') return topics;
    return topics.filter(t => {
      const s = t.progress?.status ?? 'not_started';
      return s === statusFilter;
    });
  }

  const filteredModules = useMemo(() => {
    if (!list) return [];
    return list.modules
      .filter(m => moduleFilter === 'all' || m.slug === moduleFilter)
      .map(m => ({ ...m, topics: filterTopics(m.topics) }))
      .filter(m => statusFilter === 'all' || m.topics.length > 0);
  }, [list, statusFilter, moduleFilter]);

  async function handleToggle(topic: TopicWithProgress) {
    if (!userId) return;
    setSaving(true);
    await toggleTopic(topic.slug, topic.id, topic.progress?.status, msg => setError(msg));
    setSaving(false);
    // Update drawer if open
    if (selectedTopic?.slug === topic.slug) {
      setSelectedTopic((prev: any) => ({
        ...prev,
        progress: {
          ...prev.progress,
          status: prev.progress?.status === 'completed' ? 'not_started' : 'completed',
          completed_at: prev.progress?.status === 'completed' ? null : new Date().toISOString(),
        },
      }));
    }
  }

  if (!list && !loading) {
    return (
      <AppShell title="Curriculum">
        <div className="page-inner">
          <p>List not found.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={list?.short_name ?? 'Curriculum'}>
      <div className="page-inner">
        {/* List tabs */}
        <div className="tabs" style={{ marginBottom: '1.5rem' }}>
          {['list-1','list-2','list-3','list-4'].map(id => (
            <button
              key={id}
              className={`tab-item${id === listId ? ' active' : ''}`}
              onClick={() => router.push(`/curriculum/${id}`)}
              id={`tab-${id}`}
            >
              {id === 'list-1' ? 'Data Roles' :
               id === 'list-2' ? 'Placement OAs' :
               id === 'list-3' ? 'MAANG / Product' :
               'Very High Tier'}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-faint)', fontSize: '0.8rem' }}>Loading curriculum…</div>
        ) : list ? (
          <>
            {/* Stats header */}
            <div className="card mb-4" style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <div className="card-title mb-1">{list.name}</div>
                <p style={{ fontSize: '0.775rem', maxWidth: 480 }}>{list.description}</p>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '1.5rem', flexShrink: 0 }}>
                {(() => {
                  let listSubtopicsCount = 0;
                  let listCompletedSubtopicsCount = 0;
                  list.modules.forEach(m => m.topics.forEach(t => {
                    if (t.subtopics) {
                      listSubtopicsCount += t.subtopics.length;
                      listCompletedSubtopicsCount += t.subtopics.filter(st => st.progress?.status === 'completed').length;
                    }
                  }));
                  return (
                    <>
                      {listSubtopicsCount > 0 && <MiniStat label="Concepts Done" value={String(listCompletedSubtopicsCount)} />}
                      {listSubtopicsCount > 0 && <MiniStat label="Concepts" value={String(listSubtopicsCount)} />}
                      <MiniStat label="Topics Done" value={String(list.completedCount)} />
                      <MiniStat label="Topics Left" value={String(list.totalCount - list.completedCount)} />
                    </>
                  );
                })()}
                <MiniStat label="%" value={`${list.completionPct}%`} accent />
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
              {(['all','completed','in_progress','not_started'] as StatusFilter[]).map(f => (
                <button
                  key={f}
                  className={`btn btn-sm${statusFilter === f ? ' btn-primary' : ' btn-secondary'}`}
                  onClick={() => setStatusFilter(f)}
                  id={`filter-${f}`}
                >
                  {f === 'all' ? 'All' :
                   f === 'completed' ? '✓ Completed' :
                   f === 'in_progress' ? '~ In Progress' :
                   '○ Not Started'}
                </button>
              ))}
              <select
                className="form-input form-select btn btn-sm btn-secondary"
                value={moduleFilter}
                onChange={e => setModuleFilter(e.target.value)}
                id="module-filter"
                style={{ width: 'auto', padding: '0.3rem 2rem 0.3rem 0.625rem' }}
              >
                <option value="all">All Modules</option>
                {list.modules.map(m => (
                  <option key={m.slug} value={m.slug}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* Error */}
            {error && (
              <div style={{ padding: '0.5rem 0.75rem', background: 'var(--danger)', color: '#fff', fontSize: '0.775rem', marginBottom: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <AlertCircle size={12} /> {error}
                <button style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }} onClick={() => setError('')}>×</button>
              </div>
            )}

            {/* Saving indicator */}
            {saving && (
              <div className="saving-indicator">
                <span style={{ width: 8, height: 8, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
                Saving…
              </div>
            )}

            {/* Modules */}
            {filteredModules.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><Minus size={16} /></div>
                <p>No topics match the current filter.</p>
              </div>
            ) : (
              filteredModules.map(mod => (
                <ModuleAccordion
                  key={mod.slug}
                  module={mod}
                  expanded={expandedModules.has(mod.slug)}
                  onToggle={() => toggleModule(mod.slug)}
                  onTopicClick={t => setSelectedTopic({ ...t, listName: list.short_name, moduleName: mod.name })}
                  onTopicCheck={handleToggle}
                  onSubtopicCheck={(t, st) => toggleSubtopic(t, st.slug, st.progress?.status, msg => setError(msg))}
                />
              ))
            )}
          </>
        ) : null}
      </div>

      {/* Topic Drawer */}
      {selectedTopic && userId && (
        <TopicDrawer
          topic={selectedTopic}
          onClose={() => { setSelectedTopic(null); router.replace(`/curriculum/${listId}`, { scroll: false }); }}
          onToggle={() => handleToggle(selectedTopic)}
          userId={userId}
        />
      )}

      {/* Language Modal (First time login) */}
      {!loading && userId && programmingLanguage === null && (
        <LanguageModal userId={userId} onComplete={setProgrammingLanguage} />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AppShell>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: accent ? 'var(--accent)' : 'var(--text)', fontFamily: 'var(--font-mono)' }}>{value}</div>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    </div>
  );
}

function ModuleAccordion({
  module, expanded, onToggle, onTopicClick, onTopicCheck, onSubtopicCheck
}: {
  module: ModuleWithTopics;
  expanded: boolean;
  onToggle: () => void;
  onTopicClick: (t: TopicWithProgress) => void;
  onTopicCheck: (t: TopicWithProgress) => void;
  onSubtopicCheck: (t: TopicWithProgress, st: any) => void;
}) {
  const pctDone = module.totalCount ? Math.round((module.completedCount / module.totalCount) * 100) : 0;

  return (
    <div className="module-accordion">
      <div className="module-header" onClick={onToggle} id={`module-${module.slug}`} role="button" aria-expanded={expanded}>
        <span style={{ color: 'var(--text-faint)', flexShrink: 0 }}>
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <span className="module-name">{module.name}</span>
        <span className="module-progress-text">{module.completedCount}/{module.totalCount}</span>
        <div style={{ width: 60, flexShrink: 0 }}>
          <div className="progress-bar" style={{ height: 6 }}>
            <div className="progress-fill" style={{ width: `${pctDone}%` }} />
          </div>
        </div>
      </div>

      {expanded && (
        <div className="module-body">
          {module.topics.map(topic => (
            <TopicRow
              key={topic.slug}
              topic={topic}
              onTopicClick={onTopicClick}
              onTopicCheck={onTopicCheck}
              onSubtopicCheck={(st) => onSubtopicCheck(topic, st)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TopicRow({
  topic, onTopicClick, onTopicCheck, onSubtopicCheck
}: {
  topic: TopicWithProgress;
  onTopicClick: (t: TopicWithProgress) => void;
  onTopicCheck: (t: TopicWithProgress) => void;
  onSubtopicCheck: (st: any) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const status = topic.progress?.status ?? 'not_started';
  const done = status === 'completed';
  const inProg = status === 'in_progress';
  const hasSubtopics = topic.subtopics && topic.subtopics.length > 0;
  
  const completedSubtopics = hasSubtopics ? topic.subtopics!.filter(st => st.progress?.status === 'completed').length : 0;
  const totalSubtopics = hasSubtopics ? topic.subtopics!.length : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="topic-row" id={`topic-${topic.slug}`}>
        {/* Subtopics Toggle */}
        <div 
          style={{ width: 24, display: 'flex', justifyContent: 'center', cursor: hasSubtopics ? 'pointer' : 'default', color: hasSubtopics ? 'var(--text-faint)' : 'transparent' }}
          onClick={hasSubtopics ? (e) => { e.stopPropagation(); setExpanded(!expanded); } : undefined}
        >
          {hasSubtopics && (expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
        </div>

        {/* Checkbox */}
        <div
          className={`checkbox${done ? ' checked' : inProg ? ' in-progress' : ''}`}
          onClick={e => { e.stopPropagation(); onTopicCheck(topic); }}
          role="checkbox"
          aria-checked={done}
          aria-label={`Mark ${topic.name} as ${done ? 'incomplete' : 'complete'}`}
        >
          {done && <Check size={10} color="white" />}
          {inProg && <Minus size={10} color="white" />}
        </div>

        {/* Name & Subtopic count */}
        <span
          className={`topic-row-name${done ? ' completed' : ''}`}
          onClick={() => onTopicClick(topic)}
          style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
        >
          {topic.name}
          {hasSubtopics && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)', backgroundColor: 'var(--bg-faint)', padding: '0.1rem 0.4rem', borderRadius: 10 }}>
              {completedSubtopics}/{totalSubtopics}
            </span>
          )}
        </span>

        {/* Timestamp */}
        {topic.progress?.completed_at && (
          <span className="topic-row-ts" title={topic.progress.completed_at}>
            {humanDate(topic.progress.completed_at).replace('Completed ', '')}
          </span>
        )}
      </div>
      
      {/* Subtopics List */}
      {expanded && hasSubtopics && (
        <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: '3.5rem', paddingBottom: '0.5rem', gap: '0.35rem' }}>
          {topic.subtopics!.map(st => {
            const stDone = st.progress?.status === 'completed';
            return (
              <div 
                key={st.slug} 
                style={{ fontSize: '0.825rem', color: stDone ? 'var(--text-faint)' : 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                onClick={() => onSubtopicCheck(st)}
              >
                <div 
                  className={`checkbox${stDone ? ' checked' : ''}`} 
                  style={{ width: 14, height: 14 }}
                >
                  {stDone && <Check size={8} color="white" />}
                </div>
                <span style={{ textDecoration: stDone ? 'line-through' : 'none' }}>{st.name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
