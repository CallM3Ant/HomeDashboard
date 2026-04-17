'use client';
import { useState, useRef, useCallback } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom';
}

export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    timerRef.current = setTimeout(() => setVisible(true), 400);
  }, []);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <div
          className="absolute left-1/2 z-50 animate-fadeIn pointer-events-none"
          style={{
            transform: 'translateX(-50%)',
            ...(side === 'top' ? { bottom: 'calc(100% + 6px)' } : { top: 'calc(100% + 6px)' }),
          }}
        >
          <div
            className="whitespace-nowrap rounded-[var(--r-sm)] px-2.5 py-1.5 text-xs leading-snug max-w-[200px] whitespace-normal text-center"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border-2)',
              color: 'var(--text-2)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
          >
            {content}
          </div>
          {/* Arrow */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              ...(side === 'top'
                ? {
                    top: '100%',
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderTop: '5px solid var(--border-2)',
                  }
                : {
                    bottom: '100%',
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderBottom: '5px solid var(--border-2)',
                  }),
            }}
          />
        </div>
      )}
    </div>
  );
}