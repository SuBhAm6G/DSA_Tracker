'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Code2, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  async function handleGitHub() {
    setGoogleLoading(true);
    setError('');
    setSuccessMessage('');
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (err) {
      setError(err.message);
      setGoogleLoading(false);
    }
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    
    setEmailLoading(true);
    setError('');
    setSuccessMessage('');

    // First try to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      if (signInError.message === 'Invalid login credentials') {
        // Might be a new user, let's try to sign up
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          if (signUpError.message === 'User already registered') {
            // Account exists, but sign in failed. Meaning wrong password.
            setError('Incorrect password.');
          } else {
            setError(signUpError.message);
          }
          setEmailLoading(false);
        } else {
          // Sign up succeeded! But Supabase forces email confirmation on free tier.
          setSuccessMessage('Account created! Please check your email for a confirmation link.');
          setEmailLoading(false);
        }
      } else {
        // Some other sign in error
        setError(signInError.message);
        setEmailLoading(false);
      }
    } else {
      // Sign in succeeded
      router.push('/');
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="sidebar-logo-icon">
            <Code2 size={14} />
          </div>
          <span className="sidebar-logo-text">DSA Tracker</span>
        </div>

        <h2 style={{ marginBottom: '0.25rem' }}>Welcome back</h2>
        <p style={{ fontSize: '0.8rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
          Track your DSA progress across 308 topics.
        </p>

        <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="you@example.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="••••••••" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary w-full" 
            disabled={emailLoading || googleLoading}
            style={{ justifyContent: 'center', marginTop: '0.5rem' }}
          >
            {emailLoading ? <Loader2 size={14} className="spin" /> : null}
            Continue with Email
          </button>
        </form>

        <div className="auth-divider">or</div>

        {/* GitHub OAuth */}
        <button
          className="btn w-full"
          onClick={handleGitHub}
          disabled={googleLoading || emailLoading}
          id="github-login-btn"
          style={{ justifyContent: 'center', gap: '0.5rem' }}
        >
          {googleLoading ? <Loader2 size={14} className="spin" /> : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          )}
          Continue with GitHub
        </button>
          {error && (
            <p style={{ fontSize: '0.775rem', color: 'var(--danger)', marginTop: '1rem', textAlign: 'center' }}>
              {error}
            </p>
          )}
          {successMessage && (
            <p style={{ fontSize: '0.775rem', color: 'var(--success)', marginTop: '1rem', textAlign: 'center' }}>
              {successMessage}
            </p>
          )}
      </div>

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
