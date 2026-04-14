'use client';
import { GlobalStats } from '@/types';

interface StatsPanelProps {
  stats: GlobalStats | null;
  isLoggedIn: boolean;
}

export function StatsPanel({ stats, isLoggedIn }: StatsPanelProps) {
  if (!isLoggedIn) {
    return (
      <div className="bg-gradient-to-br from-[#1e2749] to-[#16213e] border border-violet-900/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-violet-700" />
        <h2 className="text-base font-bold text-slate-200 mb-4 flex items-center gap-2">📊 Your Stats</h2>
        <p className="text-sm text-slate-500 text-center py-6">
          <a href="/login" className="text-violet-400 hover:text-violet-300 font-semibold">Sign in</a> to track your accuracy and progress.
        </p>
      </div>
    );
  }

  const cards = [
    { label: 'Total Questions', value: stats?.totalQuestions ?? '—', icon: '📚' },
    { label: 'Attempted',       value: stats?.attempted ?? '—',       icon: '✏️' },
    { label: 'Accuracy',        value: stats ? `${stats.accuracy}%` : '—', icon: '🎯' },
    { label: 'Streak',          value: stats ? `${stats.streak}d` : '—',   icon: '🔥' },
    { label: 'Review Pool',     value: stats?.reviewPool ?? '—',       icon: '📌' },
    { label: 'Due Today',       value: stats?.dueToday ?? '—',         icon: '⏰' },
  ];

  return (
    <div className="bg-gradient-to-br from-[#1e2749] to-[#16213e] border border-violet-900/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-violet-700" />
      <h2 className="text-base font-bold text-slate-200 mb-5 flex items-center gap-2">📊 Your Stats</h2>

      <div className="grid grid-cols-2 gap-3">
        {cards.map(({ label, value, icon }) => (
          <div
            key={label}
            className="bg-[#0f0f23]/60 border border-violet-900/20 rounded-xl p-4 text-center transition-all hover:-translate-y-0.5 hover:bg-[#0f0f23] group relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-violet-500 to-violet-700 scale-x-0 group-hover:scale-x-100 transition-transform" />
            <div className="text-2xl font-black bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent mb-1">
              {value}
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">{label}</div>
          </div>
        ))}
      </div>

      {stats?.lastStudied && (
        <p className="text-xs text-slate-600 text-center mt-4">
          Last studied: {new Date(stats.lastStudied).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}