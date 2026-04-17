'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

function Field({
  label, type, value, onChange, placeholder, autoComplete,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
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
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--border-2)',
          outline: 'none',
        }}
        onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; }}
        onBlur={(e) => { e.target.style.borderColor = 'var(--border-2)'; }}
      />
    </div>
  );
}

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const err = await login(username, password);
    if (err) { setError(err); setLoading(false); return; }
    router.push('/study');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Username" type="text" value={username} onChange={setUsername}
        placeholder="your_username" autoComplete="username" />
      <Field label="Password" type="password" value={password} onChange={setPassword}
        placeholder="••••••••" autoComplete="current-password" />

      {error && (
        <p className="text-xs px-3 py-2.5 rounded-[var(--r-sm)]"
          style={{ background: 'var(--red-soft)', border: '1px solid var(--red-border)', color: 'var(--red)' }}>
          {error}
        </p>
      )}

      <Button type="submit" loading={loading} size="lg" className="w-full mt-1">
        Sign in
      </Button>

      <p className="text-center text-xs text-[var(--text-3)]">
        No account?{' '}
        <Link href="/register" className="text-[var(--accent)] hover:underline font-medium">
          Create one
        </Link>
      </p>
    </form>
  );
}