'use client';
import { Category } from '@/types';

interface BreadcrumbProps {
  breadcrumb: Category[];
  onNavigate: (category: Category | null, crumb: Category[]) => void;
}

export function Breadcrumb({ breadcrumb, onNavigate }: BreadcrumbProps) {
  if (breadcrumb.length === 0) return null;

  return (
    <nav className="flex items-center gap-2 text-sm mb-6 px-4 py-3 bg-[#0f0f23]/60 border border-violet-900/20 rounded-xl flex-wrap">
      <button
        onClick={() => onNavigate(null, [])}
        className="text-slate-400 hover:text-violet-400 transition-colors px-2 py-0.5 rounded-lg hover:bg-violet-900/20"
      >
        🏠 Home
      </button>

      {breadcrumb.map((cat, i) => (
        <span key={cat.id} className="flex items-center gap-2">
          <span className="text-slate-700">▶</span>
          {i < breadcrumb.length - 1 ? (
            <button
              onClick={() => onNavigate(cat, breadcrumb.slice(0, i + 1))}
              className="text-slate-400 hover:text-violet-400 transition-colors px-2 py-0.5 rounded-lg hover:bg-violet-900/20"
            >
              {cat.name}
            </button>
          ) : (
            <span className="text-violet-400 font-semibold px-2 py-0.5">{cat.name}</span>
          )}
        </span>
      ))}
    </nav>
  );
}