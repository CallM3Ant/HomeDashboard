'use client';
import { useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={cn(
          'relative w-full animate-slideUp overflow-hidden',
          'rounded-[var(--r-xl)]',
          'border border-[var(--border-2)]',
          'shadow-2xl',
          size === 'sm' && 'max-w-sm',
          size === 'md' && 'max-w-lg',
          size === 'lg' && 'max-w-2xl',
        )}
        style={{ background: 'var(--surface)' }}
      >
        {/* Top border accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-[var(--accent-border)]" />

        <div className="p-6 max-h-[88vh] overflow-y-auto">
          {title && (
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-[var(--text)]">{title}</h2>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-[var(--r-sm)] text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}