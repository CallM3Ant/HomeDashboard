"use client";
import { useState, useRef, useEffect } from "react";
import { Category } from "@/types";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";

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
  category,
  onNavigate,
  onMasteryQuiz,
  onReview,
  onLocalQuiz,
  onRename,
  onDelete,
  isLoggedIn,
}: CategoryCardProps) {
  const total = category.totalQuestions ?? 0;
  const stats = category.stats;
  const accuracy = stats?.accuracy ?? 0;
  const attempted = stats?.attempted ?? 0;
  const dueForReview = stats?.dueForReview ?? 0;
  const subCount = category.subcategories?.length ?? 0;
  const hasContent = total > 0 || subCount > 0;

  const accuracyColor =
    accuracy >= 80 ? "emerald" : accuracy >= 50 ? "amber" : "red";

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <div
      className="group relative bg-gradient-to-br from-[#1e2749] to-[#16213e] border border-violet-900/20 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-2xl hover:shadow-violet-900/30 hover:border-violet-500/40 overflow-hidden"
      onClick={() => onNavigate(category)}
    >
      {/* Hover accent */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-violet-700 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl" />

      {/* Settings button — top right */}
      {isLoggedIn && (
        <div
          className="absolute top-3 right-3 z-10"
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-300 hover:bg-violet-900/30 transition-colors opacity-0 group-hover:opacity-100"
            title="Category settings"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="2" r="1.5" />
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="8" cy="14" r="1.5" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-36 bg-[#1e2749] border border-violet-900/30 rounded-xl shadow-xl z-50 overflow-hidden">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onRename(category.id, category.name);
                }}
                className="w-full text-left px-3 py-2.5 text-xs text-slate-300 hover:bg-violet-900/20 transition-colors flex items-center gap-2"
              >
                ✏️ Rename
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(category.id, category.name);
                }}
                className="w-full text-left px-3 py-2.5 text-xs text-red-400 hover:bg-red-900/20 transition-colors flex items-center gap-2"
              >
                🗑️ Delete
              </button>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-2 pr-6">
        <h3 className="text-lg font-bold text-slate-100 leading-snug flex-1">
          {category.name}
        </h3>
        <span className="text-xl shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
          {subCount > 0 ? "📂" : "📋"}
        </span>
      </div>

      {/* Stats */}
      <div className="flex flex-col gap-2 mb-5 text-sm text-slate-400">
        <div className="flex justify-between">
          <span>Questions</span>
          <span className="text-violet-400 font-semibold">{total}</span>
        </div>
        {subCount > 0 && (
          <div className="flex justify-between">
            <span>Subcategories</span>
            <span className="text-violet-400 font-semibold">{subCount}</span>
          </div>
        )}
        {isLoggedIn && attempted > 0 && (
          <>
            <div className="flex justify-between">
              <span>Attempted</span>
              <span className="text-slate-300 font-semibold">{attempted}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Accuracy</span>
              <span
                className={`font-bold ${
                  accuracy >= 80
                    ? "text-emerald-400"
                    : accuracy >= 50
                    ? "text-amber-400"
                    : "text-red-400"
                }`}
              >
                {accuracy}%
              </span>
            </div>
            <ProgressBar value={accuracy} color={accuracyColor} className="mt-1" />
          </>
        )}
        {isLoggedIn && dueForReview > 0 && (
          <div className="flex justify-between">
            <span>In review pool</span>
            <span className="text-amber-400 font-semibold">{dueForReview}</span>
          </div>
        )}
      </div>

      {/* Quiz actions — show if category has any content (direct or subcategory) */}
      {hasContent && (
        <div className="flex gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onMasteryQuiz(category.id)}
          >
            📚 Mastery
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onLocalQuiz(category.id)}
          >
            📝 Local
          </Button>
          {isLoggedIn && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onReview(category.id)}
            >
              📌 Review
            </Button>
          )}
        </div>
      )}
    </div>
  );
}