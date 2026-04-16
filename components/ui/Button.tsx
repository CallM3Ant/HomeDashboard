import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
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
        // base
        'inline-flex items-center justify-center font-semibold rounded-[var(--r-sm)] transition-all duration-150 cursor-pointer',
        'focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2',
        'disabled:opacity-40 disabled:cursor-not-allowed',

        // variants (FIXED: no arrays)
        variant === 'primary' &&
          'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] active:scale-[0.98]',

        variant === 'secondary' &&
          'bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border-2)] hover:bg-[var(--surface-3,#2a2a33)] hover:border-[var(--border-2)] active:scale-[0.98]',

        variant === 'ghost' &&
          'text-[var(--text-2)] bg-transparent hover:bg-[var(--surface-2)] hover:text-[var(--text)]',

        variant === 'danger' &&
          'bg-[var(--red-soft)] text-[var(--red)] border border-[var(--red-border)] hover:bg-[var(--red)] hover:text-white active:scale-[0.98]',

        // sizes
        size === 'sm' && 'text-xs px-3 py-1.5 gap-1.5',
        size === 'md' && 'text-sm px-4 py-2 gap-2',
        size === 'lg' && 'text-sm px-5 py-2.5 gap-2',
        size === 'icon' && 'text-sm w-8 h-8 p-0',

        className
      )}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}