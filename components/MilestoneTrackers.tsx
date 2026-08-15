import { ListWithModules } from '@/lib/supabase/types';
import { Target, Briefcase, Building2, Trophy } from 'lucide-react';
import Link from 'next/link';

interface Props {
  lists: ListWithModules[];
}

export default function MilestoneTrackers({ lists }: Props) {
  // Milestone 1: Data Role Ready (List 1)
  const list1 = lists.find(l => l.slug === 'list-1-data-roles');
  
  // Milestone 2: Placement OAs (List 1 + 2)
  const list2 = lists.find(l => l.slug === 'list-2-indian-placement');
  
  // Milestone 3: MAANG / Product (List 1 + 2 + 3)
  const list3 = lists.find(l => l.slug === 'list-3-maang-product');

  const milestones = [
    {
      id: 'm1',
      title: 'Data Role Ready',
      desc: 'Complete List 1',
      icon: <Briefcase size={16} color="var(--accent)" />,
      completed: list1?.completedCount ?? 0,
      total: list1?.totalCount ?? 0,
      color: 'var(--accent)'
    },
    {
      id: 'm2',
      title: 'Placement Ready',
      desc: 'Complete List 1 & 2',
      icon: <Building2 size={16} color="var(--accent-2)" />,
      completed: (list1?.completedCount ?? 0) + (list2?.completedCount ?? 0),
      total: (list1?.totalCount ?? 0) + (list2?.totalCount ?? 0),
      color: 'var(--accent-2)'
    },
    {
      id: 'm3',
      title: 'MAANG Ready',
      desc: 'Complete List 1, 2 & 3',
      icon: <Trophy size={16} color="var(--success)" />,
      completed: (list1?.completedCount ?? 0) + (list2?.completedCount ?? 0) + (list3?.completedCount ?? 0),
      total: (list1?.totalCount ?? 0) + (list2?.totalCount ?? 0) + (list3?.totalCount ?? 0),
      color: 'var(--success)'
    }
  ];

  return (
    <div className="section" style={{ marginBottom: '2rem' }}>
      <div className="section-header">
        <span className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Target size={14} /> Career Milestones
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {milestones.map((m, i) => {
          const pct = m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0;
          // Determine link slug based on the milestone number
          const linkSlug = i === 0 ? 'list-1-data-roles' : i === 1 ? 'list-2-indian-placement' : 'list-3-maang-product';
          
          return (
            <Link key={m.id} href={`/curriculum/${linkSlug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', cursor: 'pointer', transition: 'transform 0.1s', height: '100%' }}
                   onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                   onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ padding: '0.5rem', background: 'var(--bg-card)', borderRadius: '50%' }}>
                    {m.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{m.title}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>{m.desc}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', fontWeight: 800, color: m.color }}>
                    {pct}%
                  </div>
                </div>
                <div className="progress-bar" style={{ height: 6 }}>
                  <div className="progress-fill" style={{ width: `${pct}%`, background: m.color }} />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
                  {m.completed} / {m.total} topics
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
