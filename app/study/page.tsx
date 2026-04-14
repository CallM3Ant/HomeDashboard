'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStudy } from '@/hooks/useStudy';
import { useQuiz } from '@/hooks/useQuiz';
import { useToastContext } from '@/components/ui/Toast';

import { Header }           from '@/components/study/Header';
import { Breadcrumb }       from '@/components/study/Breadcrumb';
import { CategoryGrid }     from '@/components/study/CategoryGrid';
import { QuestionList }     from '@/components/study/QuestionList';
import { StatsPanel }       from '@/components/study/StatsPanel';
import { AddQuestionModal } from '@/components/study/AddQuestionModal';
import { QuizModal }        from '@/components/study/QuizModal';
import { Modal }            from '@/components/ui/Modal';
import { Button }           from '@/components/ui/Button';

import { Category, QuizMode } from '@/types';

export default function StudyPage() {
  const { user, loading: authLoading } = useAuth();
  const { addToast } = useToastContext();
  const {
    categories, currentCategory, currentSubcategories,
    questions, stats, breadcrumb,
    loadingCats, loadingQuestions,
    search, setSearch,
    navigateTo, goHome,
    addQuestion, deleteQuestion, addCategory,
    recordAnswer, loadCategories, loadStats,
  } = useStudy();

  const {
    session, isOpen: quizOpen, currentQuestion,
    isFinished, progress,
    startQuiz, submitAnswer, nextQuestion, closeQuiz,
  } = useQuiz();

  // ─── Modal state ──────────────────────────────────────────────────────────
  const [addQuestionOpen, setAddQuestionOpen]   = useState(false);
  const [addCategoryOpen, setAddCategoryOpen]   = useState(false);
  const [newCategoryName, setNewCategoryName]   = useState('');
  const [catLoading, setCatLoading]             = useState(false);
  const [catError, setCatError]                 = useState('');

  // ─── Navigation ──────────────────────────────────────────────────────────
  const handleNavigate = useCallback((category: Category) => {
    navigateTo(category, [...breadcrumb, category]);
  }, [navigateTo, breadcrumb]);

  // ─── Quiz ─────────────────────────────────────────────────────────────────
  const handleQuiz = useCallback((categoryId: string, mode: QuizMode) => {
    // Find the questions for this category
    const pool = questions.filter((q) => q.category_id === categoryId || q.category_id.startsWith(categoryId));
    const result = startQuiz(
      // If we have questions loaded for this category use them; else use all loaded
      pool.length > 0 ? pool : questions,
      mode
    );
    if (result?.error) addToast(result.error, 'warning');
  }, [questions, startQuiz, addToast]);

  const handleCurrentCategoryQuiz = useCallback((mode: QuizMode) => {
    const result = startQuiz(questions, mode);
    if (result?.error) addToast(result.error, 'warning');
  }, [questions, startQuiz, addToast]);

  const handleSingleQuiz = useCallback((questionId: string) => {
    const q = questions.find((x) => x.id === questionId);
    if (!q) return;
    const result = startQuiz([q], 'all');
    if (result?.error) addToast(result.error, 'warning');
  }, [questions, startQuiz, addToast]);

  // ─── Delete question ──────────────────────────────────────────────────────
  const handleDeleteQuestion = useCallback(async (id: string) => {
    if (!confirm('Delete this question? This cannot be undone.')) return;
    const { ok, error } = await deleteQuestion(id);
    if (ok) addToast('Question deleted', 'success');
    else    addToast(error ?? 'Failed to delete', 'error');
  }, [deleteQuestion, addToast]);

  // ─── Add question ─────────────────────────────────────────────────────────
  const handleAddQuestion = useCallback(async (data: Parameters<typeof addQuestion>[0]) => {
    const result = await addQuestion(data);
    if (result.ok) addToast('Question added!', 'success');
    return result;
  }, [addQuestion, addToast]);

  // ─── Add category ─────────────────────────────────────────────────────────
  const handleAddCategory = useCallback(async () => {
    setCatError('');
    if (!newCategoryName.trim()) { setCatError('Name is required'); return; }
    setCatLoading(true);
    const { ok, error } = await addCategory(
      newCategoryName.trim(),
      currentCategory?.id ?? null
    );
    setCatLoading(false);
    if (ok) {
      addToast('Category created!', 'success');
      setNewCategoryName('');
      setCatError('');
      setAddCategoryOpen(false);
    } else {
      setCatError(error ?? 'Failed to create category');
    }
  }, [newCategoryName, addCategory, currentCategory, addToast]);

  // ─── Seed DB ──────────────────────────────────────────────────────────────
  const handleSeedDb = useCallback(async () => {
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const json = await res.json();
      if (json.data?.seeded) {
        addToast(json.data.message, 'success');
        await loadCategories();
        await loadStats();
      } else {
        addToast('Database already seeded', 'info');
      }
    } catch {
      addToast('Seed failed', 'error');
    }
  }, [loadCategories, loadStats, addToast]);

  // ─── Loading state ────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  const isLoggedIn = !!user;

  return (
    <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">

      {/* Header */}
      <Header user={user} onSeedDb={handleSeedDb} />

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-8">

        {/* ── Left: main content ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-6">

          {/* Search + actions bar */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={currentCategory ? 'Search questions…' : 'Search categories…'}
                className="w-full bg-[#1e2749]/80 border border-violet-900/20 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
              />
            </div>

            {isLoggedIn && (
              <Button variant="secondary" size="sm" onClick={() => setAddCategoryOpen(true)}>
                + Category
              </Button>
            )}
          </div>

          {/* Breadcrumb */}
          <Breadcrumb breadcrumb={breadcrumb} onNavigate={(cat, crumb) => {
            if (!cat) goHome();
            else navigateTo(cat, crumb);
          }} />

          {/* Category grid (shown when not inside a leaf or always showing subcats) */}
          {currentSubcategories.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-slate-200 mb-4">
                {currentCategory ? `${currentCategory.name} — Subcategories` : 'All Categories'}
              </h2>
              <CategoryGrid
                categories={currentSubcategories}
                onNavigate={handleNavigate}
                onQuiz={handleQuiz}
                onAddCategory={() => setAddCategoryOpen(true)}
                isLoggedIn={isLoggedIn}
                loading={loadingCats}
              />
            </section>
          )}

          {/* Question list (shown when inside a category) */}
          {currentCategory && (
            <div className="bg-gradient-to-br from-[#1e2749] to-[#16213e] border border-violet-900/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-violet-700 opacity-60" />
              <QuestionList
                questions={questions}
                onDelete={handleDeleteQuestion}
                onSingleQuiz={handleSingleQuiz}
                onAddQuestion={() => setAddQuestionOpen(true)}
                onQuiz={handleCurrentCategoryQuiz}
                isLoggedIn={isLoggedIn}
                loading={loadingQuestions}
                categoryName={currentCategory.name}
              />
            </div>
          )}

          {/* Empty home state */}
          {!currentCategory && currentSubcategories.length === 0 && !loadingCats && (
            <div className="text-center py-20 text-slate-500">
              <p className="text-5xl mb-4">🌱</p>
              <p className="text-xl font-bold mb-2 text-slate-300">No content yet</p>
              <p className="text-sm mb-6">Click <strong>🌱 Seed DB</strong> in the header to load starter content.</p>
            </div>
          )}
        </div>

        {/* ── Right: sidebar ─────────────────────────────────────────────── */}
        <aside className="flex flex-col gap-6">
          <StatsPanel stats={stats} isLoggedIn={isLoggedIn} />

          {/* Quick tip panel */}
          <div className="bg-gradient-to-br from-[#1e2749] to-[#16213e] border border-violet-900/20 rounded-2xl p-5 text-sm text-slate-500 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-violet-700 opacity-40" />
            <p className="font-semibold text-slate-400 mb-2">💡 Tips</p>
            <ul className="space-y-1.5">
              <li>⚡ <strong className="text-slate-400">Smart Quiz</strong> — only shows cards due for review</li>
              <li>📌 <strong className="text-slate-400">Review Pool</strong> — questions you got wrong 3+ times</li>
              <li>🔥 Keep your streak going by studying daily</li>
            </ul>
          </div>
        </aside>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────── */}

      {/* Add Question */}
      <AddQuestionModal
        isOpen={addQuestionOpen}
        onClose={() => setAddQuestionOpen(false)}
        onSubmit={handleAddQuestion}
        categories={categories}
        defaultCategoryId={currentCategory?.id}
      />

      {/* Add Category */}
      <Modal
        isOpen={addCategoryOpen}
        onClose={() => { setAddCategoryOpen(false); setNewCategoryName(''); setCatError(''); }}
        title="Add Category"
        size="sm"
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Category Name
            </label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddCategory(); }}
              placeholder="e.g. Organic Chemistry"
              autoFocus
              className="bg-[#0f0f23] border border-violet-900/30 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
            />
            {currentCategory && (
              <p className="text-xs text-slate-600">
                Will be created inside: <strong className="text-slate-500">{currentCategory.name}</strong>
              </p>
            )}
          </div>

          {catError && (
            <p className="text-sm text-red-400 bg-red-900/20 border border-red-500/20 rounded-xl px-4 py-3">
              {catError}
            </p>
          )}

          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => { setAddCategoryOpen(false); setNewCategoryName(''); setCatError(''); }}
            >
              Cancel
            </Button>
            <Button variant="primary" loading={catLoading} onClick={handleAddCategory}>
              Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* Quiz */}
      <QuizModal
        isOpen={quizOpen}
        session={session}
        currentQuestion={currentQuestion}
        isFinished={isFinished}
        progress={progress}
        onClose={closeQuiz}
        onSubmitAnswer={submitAnswer}
        onNext={nextQuestion}
        onRecordAnswer={recordAnswer}
      />
    </div>
  );
}