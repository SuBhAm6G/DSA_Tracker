'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import curriculumJson from '@/app/data/curriculum.json';

interface FlatTopic {
  slug: string;
  name: string;
  listSlug: string;
  listName: string;
  moduleName: string;
}

// Build flat search index from curriculum.json (static, no DB needed)
const FLAT_TOPICS: FlatTopic[] = (curriculumJson as any).lists.flatMap((list: any) =>
  list.modules.flatMap((mod: any) =>
    mod.topics.map((t: any) => ({
      slug:       t.slug,
      name:       t.name,
      listSlug:   list.slug,
      listName:   list.shortName,
      moduleName: mod.name,
    }))
  )
);

interface Props {
  onClose: () => void;
}

export default function SearchModal({ onClose }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    if (query.trim().length < 2) return [];
    const q = query.toLowerCase().trim();
    return FLAT_TOPICS
      .filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.moduleName.toLowerCase().includes(q) ||
        t.listName.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [query]);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') { setFocused(f => Math.min(f + 1, results.length - 1)); e.preventDefault(); }
    if (e.key === 'ArrowUp')   { setFocused(f => Math.max(f - 1, 0)); e.preventDefault(); }
    if (e.key === 'Enter' && results[focused]) {
      navigate(results[focused]);
    }
  }

  function navigate(topic: FlatTopic) {
    const listNum = topic.listSlug.match(/list-(\d)/)?.[1] ?? '1';
    router.push(`/curriculum/list-${listNum}?topic=${topic.slug}`);
    onClose();
  }

  return (
    <div className="search-overlay" onClick={onClose} role="dialog" aria-modal aria-label="Search">
      <div className="search-box" onClick={e => e.stopPropagation()} onKeyDown={handleKey}>
        {/* Input */}
        <div className="search-input-wrap">
          <Search size={14} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search topics, modules, lists..."
            value={query}
            onChange={e => { setQuery(e.target.value); setFocused(0); }}
            id="search-input"
            aria-label="Search"
          />
          <button className="btn-icon" onClick={onClose} aria-label="Close search">
            <X size={12} />
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div role="listbox">
            {results.map((r, i) => (
              <div
                key={r.slug}
                className={`search-result${i === focused ? ' focused' : ''}`}
                onClick={() => navigate(r)}
                onMouseEnter={() => setFocused(i)}
                role="option"
                aria-selected={i === focused}
                id={`search-result-${i}`}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="search-result-name truncate">{r.name}</div>
                  <div className="search-result-path truncate">
                    {r.listName} › {r.moduleName}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {query.length >= 2 && results.length === 0 && (
          <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-faint)', fontSize: '0.8rem' }}>
            No results for &ldquo;{query}&rdquo;
          </div>
        )}

        {query.length < 2 && (
          <div style={{ padding: '0.75rem 1rem', color: 'var(--text-faint)', fontSize: '0.75rem' }}>
            Type at least 2 characters to search across 308 topics
          </div>
        )}
      </div>
    </div>
  );
}
