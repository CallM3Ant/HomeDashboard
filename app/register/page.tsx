import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata = { title: 'Create Account — StudyCards' };

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-lg shadow-violet-900/50 text-3xl mx-auto mb-4">
            🧠
          </div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">
            StudyCards
          </h1>
          <p className="text-slate-500 text-sm mt-1">Create your account</p>
        </div>

        {/* Card */}
        <div className="bg-gradient-to-br from-[#1e2749] to-[#16213e] border border-violet-900/20 rounded-2xl p-8 shadow-2xl shadow-black/40 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-violet-700" />
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}