'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

function Field({
  label, type, value, onChange, placeholder, autoComplete, hint,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="label">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        className="w-full text-sm px-3 py-2.5 rounded-[var(--r-sm)] text-[var(--text)] placeholder-[var(--text-3)] transition-colors"
        style={{ background: 'var(--bg)', border: '1px solid var(--border-2)', outline: 'none' }}
        onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; }}
        onBlur={(e) => { e.target.style.borderColor = 'var(--border-2)'; }}
      />
      {hint && <p className="text-[11px] text-[var(--text-3)]">{hint}</p>}
    </div>
  );
}

export function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError("Passwords don't match"); return; }
    setLoading(true);
    const err = await register(username, password);
    if (err) { setError(err); setLoading(false); return; }
    router.push('/study');
  };

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