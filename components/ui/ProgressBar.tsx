import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0–100
  color?: 'violet' | 'emerald' | 'amber' | 'red';
  className?: string;
}

export function ProgressBar({ value, color = 'violet', className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={cn('w-full h-1.5 bg-slate-800 rounded-full overflow-hidden', className)}>
      <div
        className={cn(
          'h-full rounded-full transition-all duration-500',
          color === 'violet' && 'bg-gradient-to-r from-violet-500 to-violet-400',
          color === 'emerald' && 'bg-gradient-to-r from-emerald-500 to-emerald-400',
          color === 'amber' && 'bg-gradient-to-r from-amber-500 to-amber-400',
          color === 'red' && 'bg-gradient-to-r from-red-500 to-red-400'
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}