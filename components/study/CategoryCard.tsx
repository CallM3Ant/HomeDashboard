"use client";
import { useState, useRef, useEffect } from "react";
import { Category } from "@/types";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Tooltip } from "@/components/ui/Tooltip";

interface CategoryCardProps {
  category: Category;
  onNavigate: (category: Category) => void;
  onMasteryQuiz: (categoryId: string) => void;
  onReview: (categoryId: string) => void;
  onLocalQuiz: (categoryId: string) => void;
  onRename: (categoryId: string, currentName: string) => void;
  onDelete: (categoryId: string, name: string) => void;
  isLoggedIn: boolean;
}

export function CategoryCard({
  category, onNavigate, onMasteryQuiz, onReview, onLocalQuiz,
  onRename, onDelete, isLoggedIn,
}: CategoryCardProps) {
  const total = category.totalQuestions ?? 0;
  const stats = category.stats;
  const subCount = category.subcategories?.length ?? 0;
  const hasContent = total > 0 || subCount > 0;
  const isFolder = subCount > 0;

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const masteryPct = stats?.masteryPercent ?? 0;
  const accuracyColor = stats && stats.accuracy >= 80 ? 'green' : stats && stats.accuracy >= 50 ? 'amber' : 'red';

  return (
    <div
      className="card card-hover relative flex flex-col gap-3 p-5 cursor-pointer group"
      onClick={() => onNavigate(category)}
    >
      {/* Menu button */}
      {isLoggedIn && (
        <div className="absolute top-3 right-3 z-10" ref={menuRef} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="w-7 h-7 flex items-center justify-center rounded-[var(--r-sm)] text-[var(--text-3)] hover:text-[var(--text-2)] hover:bg-[var(--surface-2)] transition-colors opacity-0 group-hover:opacity-100"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-1 w-36 rounded-[var(--r-lg)] overflow-hidden z-50 animate-slideDown"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', boxShadow: '0 8px 20px rgba(0,0,0,0.4)' }}>
              <button onClick={() => { setMenuOpen(false); onRename(category.id, category.name); }}
                className="w-full text-left px-3 py-2.5 text-xs text-[var(--text-2)] hover:bg-[var(--surface-3,#2a2a32)] hover:text-[var(--text)] transition-colors flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Rename
              </button>
              <button onClick={() => { setMenuOpen(false); onDelete(category.id, category.name); }}
                className="w-full text-left px-3 py-2.5 text-xs text-[var(--red)] hover:bg-[var(--red-soft)] transition-colors flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                </svg>
                Delete
              </button>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 pr-6">
        <div className="w-8 h-8 rounded-[var(--r-sm)] flex items-center justify-center text-sm shrink-0 mt-0.5"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          {isFolder ? '📂' : '📋'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[var(--text)] leading-snug truncate">{category.name}</h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[11px] text-[var(--text-3)]">{total} {total === 1 ? 'question' : 'questions'}</span>
            {subCount > 0 && (
              <>
                <span className="text-[var(--border-2)]">·</span>
                <span className="text-[11px] text-[var(--text-3)]">{subCount} {subCount === 1 ? 'sub' : 'subs'}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats — shown when user has attempted questions */}
      {isLoggedIn && stats && stats.attempted > 0 && (
        <div className="flex flex-col gap-2">
          {/* Accuracy row */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--text-3)]">{stats.attempted}/{total} tried</span>
            <span className="font-bold tabular" style={{
              color: stats.accuracy >= 80 ? 'var(--green)' : stats.accuracy >= 50 ? 'var(--amber)' : 'var(--red)'
            }}>
              {stats.accuracy}% acc
            </span>
          </div>
          <ProgressBar value={stats.accuracy} color={accuracyColor} />

          {/* Mastery row */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--text-3)]">{stats.mastered} mastered</span>
            <span className="font-bold tabular" style={{ color: 'var(--amber)' }}>
              {masteryPct}%
            </span>
          </div>
          <ProgressBar value={masteryPct} color="amber" />
        </div>
      )}

      {/* Empty state progress if logged in with no attempts */}
      {isLoggedIn && (!stats || stats.attempted === 0) && total > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--text-3)]">Not started</span>
            <span className="text-[var(--text-3)] tabular">0%</span>
          </div>
          <ProgressBar value={0} color="accent" />
        </div>
      )}

      {/* Actions */}
      {hasContent && (
        <div className="flex gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
          <Tooltip content="Quiz all questions including subcategories. Tracks your mastery progress.">
            <Button variant="primary" size="sm" onClick={() => onMasteryQuiz(category.id)}>
              Mastery
            </Button>
          </Tooltip>
          <Tooltip content="Quiz only the direct questions in this category, not subcategories.">
            <Button variant="secondary" size="sm" onClick={() => onLocalQuiz(category.id)}>
              Local
            </Button>
          </Tooltip>
          {isLoggedIn && (
            <Tooltip content="Practice only questions you've answered incorrectly. Exit review by getting them right twice.">
              <Button variant="secondary" size="sm" onClick={() => onReview(category.id)}>
                Review
              </Button>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
}