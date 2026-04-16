export interface User {
  id: number;
  username: string;
  created_at?: string;
}

export interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  path: string;
  sort_order: number;
  created_at: string;
  subcategories?: Category[];
  totalQuestions?: number;
  directQuestions?: number;
  stats?: {
    accuracy: number;
    attempted: number;
    dueForReview: number;
    mastered: number;
  };
}

export interface Question {
  id: string;
  category_id: string;
  text: string;
  type: 'single' | 'multiple';
  correct: string[];
  incorrect: string[];
  difficulty: number;
  tags: string[];
  created_by: number;
  created_at: string;
  stats?: {
    correct_count: number;
    incorrect_count: number;
    total_attempts: number;
    ease_factor: number;
    interval_days: number;
    next_review: string;
    in_review_pool: boolean;
    mastered: boolean;
    correct_streak: number;
    review_correct_count: number;
    last_answered: string;
  } | null;
}

export interface GlobalStats {
  totalQuestions: number;
  attempted: number;
  accuracy: number;
  mastered: number;
  reviewPool: number;
  dueToday: number;
}

export type QuizMode = 'smart' | 'review' | 'all';

export interface QuizQuestion extends Question {
  allAnswers: string[];
}

export interface QuizSession {
  questions: QuizQuestion[];
  currentIndex: number;
  score: number;
  answers: Record<string, { selected: string[]; correct: boolean }>;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}