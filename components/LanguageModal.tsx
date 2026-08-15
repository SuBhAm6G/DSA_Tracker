'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

interface LanguageModalProps {
  userId: string;
  onComplete: (lang: string) => void;
}

export default function LanguageModal({ userId, onComplete }: LanguageModalProps) {
  const [selectedLang, setSelectedLang] = useState('Python');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const LANGUAGES = ['Python', 'C++', 'Java', 'JavaScript/TypeScript'];

  async function handleSave() {
    setLoading(true);
    await supabase.from('profiles').update({ programming_language: selectedLang }).eq('id', userId);
    setLoading(false);
    onComplete(selectedLang);
  }

  return (
    <div className="modal-backdrop" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999
    }}>
      <div className="card" style={{ maxWidth: 400, width: '90%', padding: '2rem' }}>
        <h2 style={{ marginBottom: '0.5rem', fontSize: '1.4rem' }}>Welcome to DSA Tracker</h2>
        <p style={{ color: 'var(--text-faint)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          To personalize your curriculum, please select the primary programming language you will use for your interviews.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {LANGUAGES.map(lang => (
            <label
              key={lang}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.875rem', border: '2px solid',
                borderColor: selectedLang === lang ? 'var(--accent)' : 'var(--border)',
                borderRadius: 4, cursor: 'pointer',
                backgroundColor: selectedLang === lang ? 'var(--bg-faint)' : 'transparent',
                fontWeight: selectedLang === lang ? 600 : 400
              }}
            >
              <input
                type="radio"
                name="language"
                value={lang}
                checked={selectedLang === lang}
                onChange={() => setSelectedLang(lang)}
                style={{ accentColor: 'var(--accent)', width: 16, height: 16 }}
              />
              {lang}
            </label>
          ))}
        </div>

        <button
          className="btn btn-primary w-full"
          onClick={handleSave}
          disabled={loading}
          style={{ justifyContent: 'center' }}
        >
          {loading ? <Loader2 size={14} className="spin" /> : 'Continue'}
        </button>
      </div>
      
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
