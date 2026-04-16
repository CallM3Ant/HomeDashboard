import { LoginForm } from '@/components/auth/LoginForm';

export const metadata = { title: 'Sign In — StudyCards' };

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div
            className="w-10 h-10 rounded-[var(--r)] flex items-center justify-center text-white text-lg font-black mx-auto mb-4"
            style={{ background: 'var(--accent)' }}
          >
            S
          </div>
          <h1 className="text-xl font-bold text-[var(--text)]">StudyCards</h1>
          <p className="text-sm text-[var(--text-3)] mt-1">Welcome back</p>
        </div>

        {/* Card */}
        <div
          className="p-6 rounded-[var(--r-xl)]"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <LoginForm />
        </div>
      </div>
    </div>
  );
}