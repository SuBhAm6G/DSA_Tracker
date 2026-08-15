'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, BookOpen, BarChart2, Activity,
  User, Settings, ChevronRight, X, Code2
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

const LIST_NAV = [
  { href: '/curriculum/list-1', label: 'List 1 — Data Roles' },
  { href: '/curriculum/list-2', label: 'List 2 — Placement OAs' },
  { href: '/curriculum/list-3', label: 'List 3 — MAANG / Product' },
  { href: '/curriculum/list-4', label: 'List 4 — Very High Tier' },
];

interface Props {
  open?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ open, onClose }: Props) {
  const pathname = usePathname();
  const { resolvedTheme, theme, setTheme } = useTheme();

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  function toggleTheme() {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 99,
          }}
          onClick={onClose}
        />
      )}

      <nav className={`sidebar${open ? ' open' : ''}`} aria-label="Main navigation">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon" aria-hidden="true">
            <Code2 size={14} />
          </div>
          <span className="sidebar-logo-text">DSA Tracker</span>
          {onClose && (
            <button
              className="btn-icon sidebar-close-btn"
              onClick={onClose}
              aria-label="Close sidebar"
              style={{ marginLeft: 'auto' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Main nav */}
        <div className="sidebar-nav">
          <NavItem href="/" icon={<LayoutDashboard size={14} />} label="Dashboard" active={isActive('/')} />

          <div className="sidebar-section-label">Curriculum</div>
          <NavItem
            href="/curriculum"
            icon={<BookOpen size={14} />}
            label="All Lists"
            active={pathname === '/curriculum'}
          />
          {LIST_NAV.map(item => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={<ChevronRight size={12} />}
              label={item.label}
              active={isActive(item.href)}
              sub
            />
          ))}

          <div className="sidebar-section-label" style={{ marginTop: '0.25rem' }}>Analytics</div>
          <NavItem href="/statistics" icon={<BarChart2 size={14} />} label="Statistics" active={isActive('/statistics')} />
          <NavItem href="/activity"   icon={<Activity size={14} />}   label="Activity"   active={isActive('/activity')} />
        </div>

        {/* Bottom nav */}
        <div className="sidebar-bottom">
          <NavItem href="/profile"  icon={<User size={14} />}     label="Profile"  active={isActive('/profile')} />
          <NavItem href="/settings" icon={<Settings size={14} />} label="Settings" active={isActive('/settings')} />

          {/* Theme toggle */}
          <button
            className="nav-item"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <span style={{ fontSize: 14 }}>{resolvedTheme === 'dark' ? '☀' : '◑'}</span>
            <span>{resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <div style={{ marginTop: '1.5rem', marginLeft: '0.625rem', fontSize: '0.65rem', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
            created by <a href="https://github.com/SuBhAm6G" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', color: 'inherit', fontWeight: 600 }}>SuBhAm Dhar</a>
          </div>
        </div>
      </nav>
    </>
  );
}

function NavItem({
  href, icon, label, active, sub
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  sub?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`nav-item${sub ? ' nav-item-sub' : ''}${active ? ' active' : ''}`}
      aria-current={active ? 'page' : undefined}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
