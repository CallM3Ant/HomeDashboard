'use client';
import { Category, QuizMode } from '@/types';
import { CategoryCard } from './CategoryCard';
import { Button } from '@/components/ui/Button';

interface CategoryGridProps {
  categories: Category[];
  onNavigate: (category: Category) => void;
  onQuiz: (categoryId: string, mode: QuizMode) => void;
  onAddCategory: () => void;
  isLoggedIn: boolean;
  loading?: boolean;
}

export function CategoryGrid({
  categories, onNavigate, onQuiz, onAddCategory, isLoggedIn, loading
}: CategoryGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-48 bg-gradient-to-br from-[#1e2749]/60 to-[#16213e]/60 rounded-2xl animate-pulse border border-violet-900/10"
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      {categories.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <p className="text-4xl mb-4">📂</p>
          <p className="text-lg font-semibold mb-2">No categories yet</p>
          <p className="text-sm mb-6">Click &quot;Seed DB&quot; in the header to load starter content, or create a category.</p>
          {isLoggedIn && (
            <Button variant="primary" onClick={onAddCategory}>
              + Add Category
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                onNavigate={onNavigate}
                onQuiz={onQuiz}
                isLoggedIn={isLoggedIn}
              />
            ))}
            {isLoggedIn && (
              <button
                onClick={onAddCategory}
                className="h-full min-h-[180px] rounded-2xl border-2 border-dashed border-violet-900/30 hover:border-violet-500/50 text-slate-600 hover:text-violet-400 transition-all flex flex-col items-center justify-center gap-2 hover:bg-violet-900/5"
              >
                <span className="text-3xl">+</span>
                <span className="text-sm font-semibold">Add Category</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}