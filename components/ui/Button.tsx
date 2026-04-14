import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary' &&
          'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/30',
        variant === 'secondary' &&
          'bg-[#1e2749] hover:bg-[#252f58] text-slate-200 border border-violet-900/20 hover:border-violet-500/30',
        variant === 'ghost' &&
          'hover:bg-violet-900/20 text-slate-400 hover:text-slate-200',
        size === 'sm' && 'text-xs px-3 py-2',
        size === 'md' && 'text-sm px-4 py-2.5',
        size === 'lg' && 'text-base px-6 py-3',
        size === 'icon' && 'text-sm w-8 h-8 p-0',
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}