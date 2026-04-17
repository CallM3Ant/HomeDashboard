"use client";
import { Category } from "@/types";
import { CategoryCard } from "./CategoryCard";
import { Button } from "@/components/ui/Button";

interface CategoryGridProps {
  categories: Category[];
  onNavigate: (category: Category) => void;
  onMasteryQuiz: (categoryId: string) => void;
  onReview: (categoryId: string) => void;
  onLocalQuiz: (categoryId: string) => void;
  onAddCategory: () => void;
  onRenameCategory: (categoryId: string, currentName: string) => void;
  onDeleteCategory: (categoryId: string, name: string) => void;
  isLoggedIn: boolean;
  loading?: boolean;
}

export function CategoryGrid({
  categories,
  onNavigate,
  onMasteryQuiz,
  onReview,
  onLocalQuiz,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
  isLoggedIn,
  loading,
}: CategoryGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-40 rounded-[var(--r-lg)] animate-pulse"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          />
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-16 text-[var(--text-3)]">
        <p className="text-3xl mb-3">📂</p>
        <p className="text-sm font-medium mb-1 text-[var(--text-2)]">No categories yet</p>
        {isLoggedIn && (
          <Button variant="primary" size="sm" className="mt-4" onClick={onAddCategory}>
            + Add category
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {categories.map((cat) => (
        <CategoryCard
          key={cat.id}
          category={cat}
          onNavigate={onNavigate}
          onMasteryQuiz={onMasteryQuiz}
          onReview={onReview}
          onLocalQuiz={onLocalQuiz}
          onRename={onRenameCategory}
          onDelete={onDeleteCategory}
          isLoggedIn={isLoggedIn}
        />
      ))}
      {isLoggedIn && (
        <button
          onClick={onAddCategory}
          className="h-full min-h-[120px] rounded-[var(--r-lg)] border-2 border-dashed text-[var(--text-3)] hover:text-[var(--text-2)] hover:border-[var(--border-2)] transition-colors flex flex-col items-center justify-center gap-1"
          style={{ borderColor: 'var(--border)' }}
        >
          <span className="text-xl">+</span>
          <span className="text-xs font-medium">Add category</span>
        </button>
      )}
    </div>
  );
}