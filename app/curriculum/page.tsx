'use client';

import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { useCurriculum } from '@/hooks/useCurriculum';

export default function CurriculumIndexPage() {
  const router = useRouter();
  const { lists, loading } = useCurriculum();

  return (
    <AppShell title="Curriculum">
      <div className="page-inner">
        <div className="page-header">
          <h1>Curriculum</h1>
          <p>Four progressive levels — from Data Roles to Very High Tier</p>
        </div>
        {loading ? (
          <div style={{ color: 'var(--text-faint)' }}>Loading…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {lists.map((list, idx) => (
              <div
                key={list.slug}
                className="card"
                style={{ cursor: 'pointer' }}
                onClick={() => router.push(`/curriculum/list-${idx + 1}`)}
                role="button"
                id={`list-card-${idx + 1}`}
              >
                <div className="responsive-card-row">
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>0{idx + 1}</div>
                    <h2 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{list.name}</h2>
                    <p style={{ fontSize: '0.775rem' }}>{list.description}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '1.5rem' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                      {list.completionPct}%
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>
                      {list.completedCount} / {list.totalCount}
                    </div>
                  </div>
                </div>
                <div className="progress-bar mt-3">
                  <div className="progress-fill" style={{ width: `${list.completionPct}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
