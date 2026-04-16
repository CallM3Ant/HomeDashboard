"use client";
import { useState, useRef, useEffect } from "react";
import { Question } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface QuestionItemProps {
  question: Question;
  onDelete: (id: string) => void;
  onQuiz: (id: string) => void;
  onEdit: (question: Question) => void;
  isLoggedIn: boolean;
}

export function QuestionItem({
  question,
  onDelete,
  onQuiz,
  onEdit,
  isLoggedIn,
}: QuestionItemProps) {
  const stats = question.stats;
  const accuracy =
    stats && stats.total_attempts > 0
      ? Math.round((stats.correct_count / stats.total_attempts) * 100)
      : null;

  const accuracyVariant =
    accuracy === null ? 'default' : accuracy >= 80 ? 'success' : accuracy >= 50 ? 'warning' : 'error';

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <div
      className="group flex items-start gap-3 px-4 py-3.5 rounded-[var(--r)] transition-colors"
      style={{ border: '1px solid transparent' }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
    >
      {/* Type pill */}
      <span
        className="shrink-0 mt-0.5 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded"
        style={{
          background: 'var(--surface-2)',
          color: 'var(--text-3)',
          border: '1px solid var(--border)',
        }}
      >
        {question.type === 'single' ? 'S' : 'M'}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--text)] leading-snug">{question.text}</p>
        <p className="text-xs text-[var(--green)] mt-1 truncate opacity-70">
          ✓ {question.correct.join(' · ')}
        </p>
        {question.incorrect.length > 0 && (
          <p className="text-xs text-[var(--text-3)] truncate">
            ✗ {question.incorrect.join(' · ')}
          </p>
        )}

        {isLoggedIn && stats && (
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <Badge variant={accuracyVariant}>
              {accuracy !== null ? `${accuracy}%` : 'Not attempted'}
            </Badge>
            <Badge variant="default">{stats.total_attempts} attempts</Badge>
            {stats.mastered && <Badge variant="warning">⭐ Mastered</Badge>}
            {stats.in_review_pool && !stats.mastered && <Badge variant="error">📌 Review</Badge>}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onQuiz(question.id)}
          className="text-[11px] py-1 px-2.5"
        >
          Practice
        </Button>

        {isLoggedIn && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="w-7 h-7 flex items-center justify-center rounded-[var(--r-sm)] text-[var(--text-3)] hover:text-[var(--text-2)] hover:bg-[var(--surface-2)] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
              </svg>
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 mt-1 w-32 rounded-[var(--r)] overflow-hidden z-50 animate-slideDown"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', boxShadow: '0 8px 20px rgba(0,0,0,0.4)' }}
              >
                <button
                  onClick={() => { setMenuOpen(false); onEdit(question); }}
                  className="w-full text-left px-3 py-2.5 text-xs text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-3,#2a2a32)] transition-colors flex items-center gap-2"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Edit
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onDelete(question.id); }}
                  className="w-full text-left px-3 py-2.5 text-xs text-[var(--red)] hover:bg-[var(--red-soft)] transition-colors flex items-center gap-2"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}