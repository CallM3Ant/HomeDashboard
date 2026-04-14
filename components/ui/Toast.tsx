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
  const icons: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border',
        'shadow-2xl shadow-black/40 text-sm font-semibold animate-slideInRight',
        'min-w-[240px] max-w-sm',
        toast.type === 'success' && 'bg-emerald-900/90 border-emerald-500/40 text-emerald-200',
        toast.type === 'error' && 'bg-red-900/90 border-red-500/40 text-red-200',
        toast.type === 'warning' && 'bg-amber-900/90 border-amber-500/40 text-amber-200',
        toast.type === 'info' && 'bg-violet-900/90 border-violet-500/40 text-violet-200'
      )}
    >
      <span>{icons[toast.type]}</span>
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="opacity-60 hover:opacity-100 transition-opacity ml-1"
      >
        ✕
      </button>
    </div>
  );
}