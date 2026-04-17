"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useStudy } from "@/hooks/useStudy";
import { useQuiz } from "@/hooks/useQuiz";
import { useSettings } from "@/hooks/useSettings";
import { useToastContext } from "@/components/ui/Toast";

import { Header } from "@/components/study/Header";
import { Breadcrumb } from "@/components/study/Breadcrumb";
import { CategoryGrid } from "@/components/study/CategoryGrid";
import { QuestionList } from "@/components/study/QuestionList";
import { StatsPanel } from "@/components/study/StatsPanel";
import { HierarchyPanel } from "@/components/study/HierarchyPanel";
import { AddQuestionModal } from "@/components/study/AddQuestionModal";
import { EditQuestionModal } from "@/components/study/Editquestionmodal";
import { SettingsModal } from "@/components/study/SettingsModal";
import { QuizModal } from "@/components/study/QuizModal";
import { ReviewEmptyModal } from "@/components/study/ReviewEmptyModal";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

import { Category, Question } from "@/types";

function inputStyle() {
  return {
    background: 'var(--bg)',
    border: '1px solid var(--border-2)',
    borderRadius: 'var(--r-sm)',
    color: 'var(--text)',
    outline: 'none',
    width: '100%',
    fontSize: '14px',
    padding: '10px 12px',
  } as React.CSSProperties;
}

export default function StudyPage() {
  const { user, loading: authLoading } = useAuth();
  const { addToast } = useToastContext();
  const { settings, updateSettings } = useSettings(authLoading ? undefined : user?.id ?? null);

  const {
    categories, currentCategory, currentSubcategories, questions, stats, breadcrumb,
    loadingCats, loadingQuestions, search, setSearch, navigateTo, goHome,
    addQuestion, deleteQuestion, addCategory, recordAnswer, loadCategories, loadStats,
  } = useStudy();

  const {
    session, isOpen: quizOpen, currentQuestion, isFinished, progress,
    startQuiz, submitAnswer, nextQuestion, closeQuiz,
  } = useQuiz();

  // Modal state
  const [addQuestionOpen, setAddQuestionOpen] = useState(false);
  const [editQuestion, setEditQuestion] = useState<Question | null>(null);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState("");
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);
  const [renameName, setRenameName] = useState("");
  const [renameLoading, setRenameLoading] = useState(false);
  const [renameError, setRenameError] = useState("");

  // Review empty modal
  const [reviewEmptyOpen, setReviewEmptyOpen] = useState(false);

  // Navigation
  const handleNavigate = useCallback(
    (category: Category) => navigateTo(category, [...breadcrumb, category]),
    [navigateTo, breadcrumb]
  );

  // Quiz helpers
  const startQuizForCategory = useCallback(
    async (categoryId: string, mode: "all" | "review" | "smart", includeSubs: boolean) => {
      try {
        const res = await fetch(`/api/questions?categoryId=${categoryId}&includeSubcategories=${includeSubs}`);
        if (!res.ok) throw new Error("Failed to load questions");
        const { data } = await res.json();

        // Handle empty review pool with informational modal instead of toast
        if (mode === "review") {
          const reviewPool = (data ?? []).filter((q: Question) => q.stats?.in_review_pool);
          if (reviewPool.length === 0) {
            setReviewEmptyOpen(true);
            return;
          }
        }

        const result = startQuiz(data ?? [], mode, settings.shuffleAnswers);
        if (result?.error) addToast(result.error, "warning");
      } catch {
        addToast("Failed to load questions", "error");
      }
    },
    [startQuiz, addToast, settings.shuffleAnswers]
  );

  const handleMasteryQuiz = useCallback(
    (categoryId: string) => startQuizForCategory(categoryId, "all", settings.includeSubcategoriesInMastery),
    [startQuizForCategory, settings.includeSubcategoriesInMastery]
  );
  const handleLocalQuiz = useCallback(
    (categoryId: string) => startQuizForCategory(categoryId, "all", false),
    [startQuizForCategory]
  );
  const handleReviewQuiz = useCallback(
    (categoryId: string) => startQuizForCategory(categoryId, "review", true),
    [startQuizForCategory]
  );

  const handleCurrentMasteryQuiz = useCallback(() => {
    if (!currentCategory) return;
    handleMasteryQuiz(currentCategory.id);
  }, [currentCategory, handleMasteryQuiz]);

  const handleCurrentLocalQuiz = useCallback(() => {
    const localQuestions = questions.filter((q) => q.category_id === currentCategory?.id);
    if (localQuestions.length === 0) { addToast("No questions directly in this category", "warning"); return; }
    const result = startQuiz(localQuestions, "all", settings.shuffleAnswers);
    if (result?.error) addToast(result.error, "warning");
  }, [questions, currentCategory, startQuiz, addToast, settings.shuffleAnswers]);

  const handleCurrentReview = useCallback(() => {
    const pool = questions.filter((q) => q.stats?.in_review_pool);
    if (pool.length === 0) { setReviewEmptyOpen(true); return; }
    const result = startQuiz(pool, "all", settings.shuffleAnswers);
    if (result?.error) addToast(result.error, "warning");
  }, [questions, startQuiz, addToast, settings.shuffleAnswers]);

  const handleSingleQuiz = useCallback(
    (questionId: string) => {
      const q = questions.find((x) => x.id === questionId);
      if (!q) return;
      const result = startQuiz([q], "all", settings.shuffleAnswers);
      if (result?.error) addToast(result.error, "warning");
    },
    [questions, startQuiz, addToast, settings.shuffleAnswers]
  );

  // CRUD
  const handleDeleteQuestion = useCallback(
    async (id: string) => {
      if (!confirm("Delete this question? This cannot be undone.")) return;
      const { ok, error } = await deleteQuestion(id);
      if (ok) addToast("Question deleted", "success");
      else addToast(error ?? "Failed to delete", "error");
    },
    [deleteQuestion, addToast]
  );

  const handleEditQuestion = useCallback(
    async (id: string, data: { text: string; type: "single" | "multiple"; correct: string[]; incorrect: string[] }) => {
      try {
        const res = await fetch(`/api/questions/${id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
        });
        if (res.ok) { addToast("Question updated", "success"); await loadCategories(); return { ok: true }; }
        const json = await res.json();
        return { ok: false, error: json.error };
      } catch {
        return { ok: false, error: "Network error" };
      }
    },
    [loadCategories, addToast]
  );

  const handleAddQuestion = useCallback(
    async (data: { category_id: string; text: string; type: "single" | "multiple"; correct: string[]; incorrect: string[] }) => {
      const result = await addQuestion({ ...data, difficulty: 1, tags: [] });
      if (result.ok) addToast("Question added!", "success");
      return result;
    },
    [addQuestion, addToast]
  );

  const handleAddCategory = useCallback(async () => {
    setCatError("");
    if (!newCategoryName.trim()) { setCatError("Name is required"); return; }
    setCatLoading(true);
    const { ok, error } = await addCategory(newCategoryName.trim(), currentCategory?.id ?? null);
    setCatLoading(false);
    if (ok) { addToast("Category created!", "success"); setNewCategoryName(""); setCatError(""); setAddCategoryOpen(false); }
    else { setCatError(error ?? "Failed to create category"); }
  }, [newCategoryName, addCategory, currentCategory, addToast]);

  const openRename = useCallback((categoryId: string, currentName: string) => {
    setRenameTarget({ id: categoryId, name: currentName });
    setRenameName(currentName); setRenameError(""); setRenameOpen(true);
  }, []);

  const handleRenameCategory = useCallback(async () => {
    if (!renameTarget) return;
    setRenameError("");
    if (!renameName.trim()) { setRenameError("Name is required"); return; }
    setRenameLoading(true);
    try {
      const res = await fetch(`/api/categories/${renameTarget.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameName.trim() }),
      });
      setRenameLoading(false);
      if (res.ok) { addToast("Category renamed", "success"); setRenameOpen(false); await loadCategories(); }
      else { const json = await res.json(); setRenameError(json.error ?? "Failed to rename"); }
    } catch { setRenameLoading(false); setRenameError("Network error"); }
  }, [renameTarget, renameName, loadCategories, addToast]);

  const handleDeleteCategory = useCallback(
    async (categoryId: string, name: string) => {
      if (!confirm(`Delete "${name}" and ALL its subcategories and questions? This cannot be undone.`)) return;
      try {
        const res = await fetch(`/api/categories/${categoryId}`, { method: "DELETE" });
        if (res.ok) {
          addToast("Category deleted", "success");
          if (currentCategory?.id === categoryId) goHome();
          await loadCategories();
        } else {
          const json = await res.json();
          addToast(json.error ?? "Failed to delete", "error");
        }
      } catch { addToast("Failed to delete category", "error"); }
    },
    [currentCategory, goHome, loadCategories, addToast]
  );

  const handleMoveCategory = useCallback(
    async (categoryId: string, newParentId: string | null) => {
      try {
        const res = await fetch(`/api/categories/${categoryId}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parent_id: newParentId }),
        });
        if (res.ok) { addToast("Category moved", "success"); await loadCategories(); }
        else { const json = await res.json(); addToast(json.error ?? "Failed to move", "error"); }
      } catch { addToast("Failed to move category", "error"); }
    },
    [loadCategories, addToast]
  );

  // Loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-6 h-6 border-2 border-[var(--border-2)] border-t-[var(--accent)] rounded-full animate-spin" />
      </div>
    );
  }

  const isLoggedIn = !!user;

  return (
    <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Header user={user} onSettings={() => setSettingsOpen(true)} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">
        {/* Left */}
        <div className="flex flex-col gap-5">
          {/* Search + add */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder={currentCategory ? "Search questions…" : "Search categories…"}
                className="w-full text-sm pl-9 pr-4 py-2.5 rounded-[var(--r-sm)] text-[var(--text)] placeholder-[var(--text-3)] transition-colors"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', outline: 'none' }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>
            {isLoggedIn && (
              <Button variant="secondary" size="sm" onClick={() => setAddCategoryOpen(true)}>
                + Category
              </Button>
            )}
          </div>

          <Breadcrumb
            breadcrumb={breadcrumb}
            onNavigate={(cat, crumb) => { if (!cat) goHome(); else navigateTo(cat, crumb); }}
          />

          {currentSubcategories.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-wider mb-3">
                {currentCategory ? `${currentCategory.name} · Subcategories` : 'All Categories'}
              </h2>
              <CategoryGrid
                categories={currentSubcategories}
                onNavigate={handleNavigate}
                onMasteryQuiz={handleMasteryQuiz}
                onReview={handleReviewQuiz}
                onLocalQuiz={handleLocalQuiz}
                onAddCategory={() => setAddCategoryOpen(true)}
                onRenameCategory={openRename}
                onDeleteCategory={handleDeleteCategory}
                isLoggedIn={isLoggedIn}
                loading={loadingCats}
              />
            </section>
          )}

          {currentCategory && (
            <div className="card p-5">
              <QuestionList
                questions={questions}
                allQuestionsInCategory={questions}
                currentCategoryId={currentCategory.id}
                onDelete={handleDeleteQuestion}
                onEdit={(q) => setEditQuestion(q)}
                onSingleQuiz={handleSingleQuiz}
                onAddQuestion={() => setAddQuestionOpen(true)}
                onMasteryQuiz={handleCurrentMasteryQuiz}
                onLocalQuiz={handleCurrentLocalQuiz}
                onReview={handleCurrentReview}
                isLoggedIn={isLoggedIn}
                loading={loadingQuestions}
                categoryName={currentCategory.name}
              />
            </div>
          )}

          {!currentCategory && currentSubcategories.length === 0 && !loadingCats && (
            <div className="text-center py-20 text-[var(--text-3)]">
              <p className="text-4xl mb-3">📚</p>
              <p className="text-base font-semibold mb-1 text-[var(--text-2)]">No content yet</p>
              <p className="text-sm mb-5">
                {isLoggedIn ? "Click + Category to get started." : "Sign in to create categories and questions."}
              </p>
              {isLoggedIn && (
                <Button variant="primary" size="sm" onClick={() => setAddCategoryOpen(true)}>
                  + Create category
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4">
          <StatsPanel stats={stats} isLoggedIn={isLoggedIn} />

          {settings.showHierarchy && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-[var(--text)]">Structure</h2>
                {isLoggedIn && (
                  <span className="text-[10px] text-[var(--text-3)]">drag to reorder</span>
                )}
              </div>
              <HierarchyPanel
                categories={categories}
                currentCategoryId={currentCategory?.id ?? null}
                onNavigate={(cat) => navigateTo(cat, [cat])}
                onGoHome={goHome}
                onMoveCategory={isLoggedIn ? handleMoveCategory : undefined}
                isLoggedIn={isLoggedIn}
              />
            </div>
          )}
        </aside>
      </div>

      {/* Modals */}
      <AddQuestionModal
        isOpen={addQuestionOpen}
        onClose={() => setAddQuestionOpen(false)}
        onSubmit={handleAddQuestion}
        categories={categories}
        defaultCategoryId={currentCategory?.id}
      />

      <EditQuestionModal
        isOpen={!!editQuestion}
        question={editQuestion}
        onClose={() => setEditQuestion(null)}
        onSave={handleEditQuestion}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onUpdate={updateSettings}
        isLoggedIn={isLoggedIn}
      />

      <ReviewEmptyModal
        isOpen={reviewEmptyOpen}
        onClose={() => setReviewEmptyOpen(false)}
      />

      {/* Add Category */}
      <Modal isOpen={addCategoryOpen} onClose={() => { setAddCategoryOpen(false); setNewCategoryName(""); setCatError(""); }} title="Add category" size="sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="label">Name *</label>
            <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddCategory(); }}
              placeholder="e.g. Organic Chemistry" autoFocus style={inputStyle()}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-2)')}
            />
            {currentCategory && (
              <p className="text-xs text-[var(--text-3)]">Inside: <strong className="text-[var(--text-2)]">{currentCategory.name}</strong></p>
            )}
          </div>
          {catError && (
            <p className="text-xs px-3 py-2 rounded-[var(--r-sm)]"
              style={{ background: 'var(--red-soft)', border: '1px solid var(--red-border)', color: 'var(--red)' }}>
              {catError}
            </p>
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => { setAddCategoryOpen(false); setNewCategoryName(""); setCatError(""); }}>Cancel</Button>
            <Button variant="primary" loading={catLoading} onClick={handleAddCategory}>Create</Button>
          </div>
        </div>
      </Modal>

      {/* Rename Category */}
      <Modal isOpen={renameOpen} onClose={() => setRenameOpen(false)} title={`Rename "${renameTarget?.name}"`} size="sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="label">New name *</label>
            <input type="text" value={renameName} onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleRenameCategory(); }}
              autoFocus style={inputStyle()}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-2)')}
            />
          </div>
          {renameError && (
            <p className="text-xs px-3 py-2 rounded-[var(--r-sm)]"
              style={{ background: 'var(--red-soft)', border: '1px solid var(--red-border)', color: 'var(--red)' }}>
              {renameError}
            </p>
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setRenameOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={renameLoading} onClick={handleRenameCategory}>Rename</Button>
          </div>
        </div>
      </Modal>

      {/* Quiz */}
      <QuizModal
        isOpen={quizOpen} session={session} currentQuestion={currentQuestion}
        isFinished={isFinished} progress={progress} onClose={closeQuiz}
        onSubmitAnswer={submitAnswer} onNext={nextQuestion} onRecordAnswer={recordAnswer}
      />
    </div>
  );
}