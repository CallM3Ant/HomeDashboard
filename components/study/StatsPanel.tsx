'use client';
import { GlobalStats } from '@/types';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface StatsPanelProps {
  stats: GlobalStats | null;
  isLoggedIn: boolean;
}

export function StatsPanel({ stats, isLoggedIn }: StatsPanelProps) {
  if (!isLoggedIn) {
    return (
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-[var(--text)] mb-3">Your Stats</h2>
        <p className="text-xs text-[var(--text-3)] leading-relaxed">
          <a href="/login" className="text-[var(--accent)] hover:underline font-medium">Sign in</a>{' '}
          to track your progress and accuracy over time.
        </p>
      </div>
    );
  }

  const masteredPct = stats && stats.totalQuestions > 0
    ? Math.round((stats.mastered / stats.totalQuestions) * 100)
    : 0;

  const statRows = [
    { label: 'Total',       value: stats?.totalQuestions ?? 0, color: 'var(--text)' },
    { label: 'Attempted',   value: stats?.attempted ?? 0,      color: 'var(--text)' },
    { label: 'Accuracy',    value: stats ? `${stats.accuracy}%` : '—', color: getAccuracyColor(stats?.accuracy) },
    { label: 'Mastered',    value: stats?.mastered ?? 0,       color: 'var(--amber)' },
    { label: 'Review pool', value: stats?.reviewPool ?? 0,     color: stats?.reviewPool ? 'var(--red)' : 'var(--text-3)' },
    { label: 'Due today',   value: stats?.dueToday ?? 0,       color: stats?.dueToday ? 'var(--amber)' : 'var(--text-3)' },
  ];

  return (
    <div className="card p-5">
      <h2 className="text-sm font-semibold text-[var(--text)] mb-4">Your Stats</h2>

      <div className="flex flex-col gap-2.5">
        {statRows.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-2)]">{label}</span>
            <span
              className="text-xs font-bold tabular"
              style={{ color: getRowColor(label, stats) }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      {stats && stats.totalQuestions > 0 && (
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <div className="flex justify-between text-[11px] mb-2">
            <span className="text-[var(--text-3)]">Mastery</span>
            <span className="font-semibold tabular" style={{ color: 'var(--amber)' }}>{masteredPct}%</span>
          </div>
          <ProgressBar value={masteredPct} color="amber" />
          <p className="text-[10px] text-[var(--text-3)] mt-2 leading-relaxed">
            3 correct → mastered · wrong → review pool · 2 correct → exit review
          </p>
        </div>
      )}
    </div>
  );
}

function getAccuracyColor(accuracy?: number): string {
  if (accuracy == null) return 'var(--text-3)';
  if (accuracy >= 80) return 'var(--green)';
  if (accuracy >= 50) return 'var(--amber)';
  return 'var(--red)';
}

function getRowColor(label: string, stats: GlobalStats | null): string {
  if (!stats) return 'var(--text-3)';
  switch (label) {
    case 'Accuracy':
      return getAccuracyColor(stats.accuracy);
    case 'Mastered':
      return stats.mastered > 0 ? 'var(--amber)' : 'var(--text-3)';
    case 'Review pool':
      return stats.reviewPool > 0 ? 'var(--red)' : 'var(--text-3)';
    case 'Due today':
      return stats.dueToday > 0 ? 'var(--amber)' : 'var(--text-3)';
    default:
      return 'var(--text)';
  }
}