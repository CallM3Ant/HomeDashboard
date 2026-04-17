'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { ThemeName, applyTheme } from '@/hooks/useSettings';

function Field({
  label, type, value, onChange, placeholder, autoComplete, hint,
}: {
  label: string; type: string; value: string; onChange: (v: string) => void;
  placeholder?: string; autoComplete?: string; hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="label">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} autoComplete={autoComplete} required
        className="w-full text-sm px-3 py-2.5 rounded-[var(--r-sm)] text-[var(--text)] placeholder-[var(--text-3)] transition-colors"
        style={{ background: 'var(--bg)', border: '1px solid var(--border-2)', outline: 'none' }}
        onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; }}
        onBlur={(e) => { e.target.style.borderColor = 'var(--border-2)'; }}
      />
      {hint && <p className="text-[11px] text-[var(--text-3)]">{hint}</p>}
    </div>
  );
}

const THEMES: { id: ThemeName; label: string; dark: boolean; colors: [string, string, string] }[] = [
  { id: 'dark',     label: 'Dark',     dark: true,  colors: ['#0e0e12', '#18181f', '#6366f1'] },
  { id: 'midnight', label: 'Midnight', dark: true,  colors: ['#080c1a', '#111927', '#3b82f6'] },
  { id: 'light',    label: 'Light',    dark: false, colors: ['#f4f5f7', '#ffffff', '#6366f1'] },
  { id: 'warm',     label: 'Warm',     dark: false, colors: ['#faf7f2', '#ffffff', '#c2410c'] },
];

export function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<'credentials' | 'theme'>('credentials');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [newUserId, setNewUserId] = useState<number | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>('dark');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError("Passwords don't match"); return; }
    setLoading(true);
    const err = await register(username, password);
    setLoading(false);
    if (err) { setError(err); return; }
    // Move to theme selection step
    setStep('theme');
  };

  const handleThemePreview = (theme: ThemeName) => {
    setSelectedTheme(theme);
    applyTheme(theme);
  };

  const handleThemeConfirm = () => {
    try {
      localStorage.setItem('study_theme', selectedTheme);
    } catch {}
    router.push('/study');
  };

  if (step === 'theme') {
    return (
      <div className="flex flex-col gap-5">
        <div className="text-center">
          <p className="text-sm font-semibold text-[var(--text)] mb-1">Pick your theme</p>
          <p className="text-xs text-[var(--text-3)]">You can change this anytime in settings</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {THEMES.map(theme => {
            const [bg, surface, accent] = theme.colors;
            const isSelected = selectedTheme === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleThemePreview(theme.id)}
                className="flex flex-col gap-2 items-center"
              >
                <div
                  className="w-full rounded-[var(--r)] overflow-hidden transition-all duration-150"
                  style={{
                    background: bg,
                    border: isSelected ? `2px solid var(--accent)` : '1px solid var(--border-2)',
                    boxShadow: isSelected ? `0 0 0 3px var(--accent-soft)` : 'none',
                    padding: '10px',
                    minHeight: '72px',
                  }}
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex gap-1 items-center">
                      <div className="w-3 h-3 rounded" style={{ background: accent }} />
                      <div className="flex-1 h-1.5 rounded" style={{ background: theme.dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.10)' }} />
                    </div>
                    <div className="w-full h-2 rounded" style={{ background: surface, border: `1px solid ${theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }} />
                    <div className="w-3/4 h-2 rounded" style={{ background: surface, border: `1px solid ${theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }} />
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {isSelected && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <circle cx="5" cy="5" r="5" fill="var(--accent)" />
                      <path d="M3 5l1.5 1.5L7 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  <span className="text-xs font-medium" style={{ color: isSelected ? 'var(--accent)' : 'var(--text-2)' }}>
                    {theme.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <Button variant="primary" size="lg" className="w-full mt-1" onClick={handleThemeConfirm}>
          Get started →
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Username" type="text" value={username} onChange={setUsername}
        placeholder="choose_a_username" autoComplete="username"
        hint="Letters, numbers, _ and - only. 3–24 chars." />
      <Field label="Password" type="password" value={password} onChange={setPassword}
        placeholder="••••••••" autoComplete="new-password" />
      <Field label="Confirm password" type="password" value={confirm} onChange={setConfirm}
        placeholder="••••••••" autoComplete="new-password" />

      {error && (
        <p className="text-xs px-3 py-2.5 rounded-[var(--r-sm)]"
          style={{ background: 'var(--red-soft)', border: '1px solid var(--red-border)', color: 'var(--red)' }}>
          {error}
        </p>
      )}

      <Button type="submit" loading={loading} size="lg" className="w-full mt-1">
        Create account
      </Button>

      <p className="text-center text-xs text-[var(--text-3)]">
        Already have an account?{' '}
        <Link href="/login" className="text-[var(--accent)] hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </form>
  );
}