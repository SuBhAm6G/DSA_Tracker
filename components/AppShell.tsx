'use client';

import { useState, useEffect } from 'react';
import { Menu, Search } from 'lucide-react';
import Sidebar from './Sidebar';
import SearchModal from './SearchModal';

interface Props {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export default function AppShell({ title, children, actions }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div className="app-shell">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="flex items-center gap-3">
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={16} />
            </button>
            <h1 className="topbar-title">{title}</h1>
          </div>

          <div className="topbar-actions">
            {actions}
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setSearchOpen(true)}
              aria-label="Search (Ctrl+K)"
              id="search-btn"
            >
              <Search size={12} />
              <span>Search</span>
              <kbd>⌘K</kbd>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main>
          {children}
        </main>
      </div>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
