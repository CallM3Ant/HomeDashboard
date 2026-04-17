'use client';
import { createContext, useContext, ReactNode } from 'react';
import { useToast } from '@/hooks/useToast';
import { Toast, ToastType } from '@/types';
import { cn } from '@/lib/utils';

interface ToastContextValue {
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToastContext(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToastContext must be used within <ToastProvider>');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const { toasts, addToast, removeToast } = useToast();

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const styles: Record<ToastType, { bg: string; border: string; color: string; icon: string }> = {
    success: { bg: 'var(--surface-2)', border: 'var(--green-border)', color: 'var(--green)', icon: '✓' },
    error:   { bg: 'var(--surface-2)', border: 'var(--red-border)',   color: 'var(--red)',   icon: '✕' },
    warning: { bg: 'var(--surface-2)', border: 'var(--amber-border)', color: 'var(--amber)', icon: '!' },
    info:    { bg: 'var(--surface-2)', border: 'var(--accent-border)',color: 'var(--accent)',icon: 'i' },
  };

  const s = styles[toast.type];

  return (
    <div
      className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-[var(--r-lg)] text-sm animate-slideInRight min-w-[220px] max-w-xs"
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      }}
    >
      <span
        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 text-white"
        style={{ background: s.color }}
      >
        {s.icon}
      </span>
      <span className="flex-1 text-[var(--text)] text-xs font-medium">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-[var(--text-3)] hover:text-[var(--text)] transition-colors text-base leading-none ml-1 shrink-0"
      >
        ×
      </button>
    </div>
  );
}