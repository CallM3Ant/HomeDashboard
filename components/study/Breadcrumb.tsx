'use client';
import { Category } from '@/types';

interface BreadcrumbProps {
  breadcrumb: Category[];
  onNavigate: (category: Category | null, crumb: Category[]) => void;
}

export function Breadcrumb({ breadcrumb, onNavigate }: BreadcrumbProps) {
  if (breadcrumb.length === 0) return null;

  return (
    <nav className="flex items-center gap-1.5 text-xs flex-wrap mb-4">
      <button
        onClick={() => onNavigate(null, [])}
        className="text-[var(--text-3)] hover:text-[var(--text)] transition-colors px-2 py-1 rounded-[var(--r-sm)] hover:bg-[var(--surface-2)]"
      >
        Home
      </button>

      {breadcrumb.map((cat, i) => (
        <span key={cat.id} className="flex items-center gap-1.5">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--border-2)]">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          {i < breadcrumb.length - 1 ? (
            <button
              onClick={() => onNavigate(cat, breadcrumb.slice(0, i + 1))}
              className="text-[var(--text-3)] hover:text-[var(--text)] transition-colors px-2 py-1 rounded-[var(--r-sm)] hover:bg-[var(--surface-2)]"
            >
              {cat.name}
            </button>
          ) : (
            <span className="text-[var(--text)] font-semibold px-2 py-1">{cat.name}</span>
          )}
        </span>
      ))}
    </nav>
  );
}