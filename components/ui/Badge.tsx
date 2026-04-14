import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold',
        variant === 'default' && 'bg-slate-800 text-slate-400 border border-slate-700/50',
        variant === 'success' && 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30',
        variant === 'warning' && 'bg-amber-900/30 text-amber-400 border border-amber-500/30',
        variant === 'error' && 'bg-red-900/30 text-red-400 border border-red-500/30',
        className
      )}
    >
      {children}
    </span>
  );
}