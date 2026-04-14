'use client';
import { useState, useCallback, useEffect } from 'react';
import { Category, Question, GlobalStats } from '@/types';

export function useStudy() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [search, setSearch] = useState('');

  // ─── Load category tree ──────────────────────────────────────────────────
  const loadCategories = useCallback(async () => {
    setLoadingCats(true);
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const { data } = await res.json();
        setCategories(data);
      }
    } finally {
      setLoadingCats(false);
    }
  }, []);

  // ─── Load questions for a category ──────────────────────────────────────
  const loadQuestions = useCallback(async (categoryId: string, includeSubs = true) => {
    setLoadingQuestions(true);
    try {
      const res = await fetch(
        `/api/questions?categoryId=${categoryId}&includeSubcategories=${includeSubs}`
      );
      if (res.ok) {
        const { data } = await res.json();
        setQuestions(data);
      }
    } finally {
      setLoadingQuestions(false);
    }
  }, []);

  // ─── Load global stats ───────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const { data } = await res.json();
        setStats(data);
      }
    } catch {
      // Guest - no stats
    }
  }, []);

  // ─── Navigate into a category ────────────────────────────────────────────
  const navigateTo = useCallback((category: Category | null, crumb: Category[]) => {
    setCurrentCategory(category);
    setBreadcrumb(crumb);
    setSearch('');
    if (category) {
      loadQuestions(category.id, true);
    } else {
      setQuestions([]);
    }
  }, [loadQuestions]);

  // ─── Navigate home ───────────────────────────────────────────────────────
  const goHome = useCallback(() => {
    setCurrentCategory(null);
    setBreadcrumb([]);
    setQuestions([]);
    setSearch('');
  }, []);

  // ─── Add a question ──────────────────────────────────────────────────────
  const addQuestion = useCallback(async (data: {
    category_id: string;
    text: string;
    type: 'single' | 'multiple';
    correct: string[];
    incorrect: string[];
    difficulty: number;
    tags: string[];
  }): Promise<{ ok: boolean; error?: string }> => {
    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (res.ok) {
      // Refresh questions if we're viewing this category
      if (currentCategory) await loadQuestions(currentCategory.id, true);
      await loadCategories();
      return { ok: true };
    }
    return { ok: false, error: json.error };
  }, [currentCategory, loadQuestions, loadCategories]);

  // ─── Delete a question ───────────────────────────────────────────────────
  const deleteQuestion = useCallback(async (questionId: string): Promise<{ ok: boolean; error?: string }> => {
    const res = await fetch(`/api/questions/${questionId}`, { method: 'DELETE' });
    if (res.ok) {
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      await loadCategories();
      return { ok: true };
    }
    const json = await res.json();
    return { ok: false, error: json.error };
  }, [loadCategories]);

  // ─── Add a category ──────────────────────────────────────────────────────
  const addCategory = useCallback(async (name: string, parentId: string | null): Promise<{ ok: boolean; error?: string }> => {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parent_id: parentId }),
    });
    const json = await res.json();
    if (res.ok) {
      await loadCategories();
      return { ok: true };
    }
    return { ok: false, error: json.error };
  }, [loadCategories]);

  // ─── Record an answer ────────────────────────────────────────────────────
  const recordAnswer = useCallback(async (questionId: string, correct: boolean) => {
    try {
      await fetch(`/api/stats/${questionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correct }),
      });
      // Refresh stats quietly in the background
      loadStats();
    } catch {
      // Guest or network error - silently ignore
    }
  }, [loadStats]);

  // ─── Filtered questions for current view ─────────────────────────────────
  const filteredQuestions = search
    ? questions.filter((q) =>
        q.text.toLowerCase().includes(search.toLowerCase()) ||
        q.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      )
    : questions;

  // ─── Subcategories of current level ──────────────────────────────────────
  const currentSubcategories = currentCategory
    ? findSubcategories(categories, currentCategory.id)
    : categories;

  useEffect(() => {
    loadCategories();
    loadStats();
  }, [loadCategories, loadStats]);

  return {
    categories,
    currentCategory,
    currentSubcategories,
    questions: filteredQuestions,
    allQuestions: questions,
    stats,
    breadcrumb,
    loadingCats,
    loadingQuestions,
    search,
    setSearch,
    navigateTo,
    goHome,
    addQuestion,
    deleteQuestion,
    addCategory,
    recordAnswer,
    loadStats,
    loadCategories,
    loadQuestions,
  };
}

// ─── Helper: find subcategories of a given parent ────────────────────────────
function findSubcategories(tree: Category[], parentId: string): Category[] {
  for (const cat of tree) {
    if (cat.id === parentId) return cat.subcategories ?? [];
    if (cat.subcategories?.length) {
      const found = findSubcategories(cat.subcategories, parentId);
      if (found.length > 0) return found;
    }
  }
  return [];
}