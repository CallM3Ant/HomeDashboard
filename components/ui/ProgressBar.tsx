import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  color?: 'accent' | 'green' | 'amber' | 'red';
  className?: string;
}

export function ProgressBar({ value, color = 'accent', className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  const barColor = {
    accent: 'var(--accent)',
    green:  'var(--green)',
    amber:  'var(--amber)',
    red:    'var(--red)',
  }[color];

  return (
    <div
      className={cn('w-full h-1 rounded-full overflow-hidden', className)}
      style={{ background: 'var(--surface-2)' }}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${clamped}%`, background: barColor }}
      />
    </div>
  );
}