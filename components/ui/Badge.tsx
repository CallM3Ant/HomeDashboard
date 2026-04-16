import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'accent';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--r-sm)] text-xs font-medium',
        variant === 'default' && 'bg-[var(--surface-2)] text-[var(--text-2)] border border-[var(--border)]',
        variant === 'success' && 'bg-[var(--green-soft)] text-[var(--green)] border border-[var(--green-border)]',
        variant === 'warning' && 'bg-[var(--amber-soft)] text-[var(--amber)] border border-[var(--amber-border)]',
        variant === 'error'   && 'bg-[var(--red-soft)] text-[var(--red)] border border-[var(--red-border)]',
        variant === 'accent'  && 'bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-border)]',
        className
      )}
    >
      {children}
    </span>
  );
}