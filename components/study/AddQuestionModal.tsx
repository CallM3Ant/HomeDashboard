'use client';
import { useState, FormEvent } from 'react';
import { Category } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    category_id: string;
    text: string;
    type: 'single' | 'multiple';
    correct: string[];
    incorrect: string[];
  }) => Promise<{ ok: boolean; error?: string }>;
  categories: Category[];
  defaultCategoryId?: string;
}

export function AddQuestionModal({
  isOpen, onClose, onSubmit, categories, defaultCategoryId
}: AddQuestionModalProps) {
  const [categoryId, setCategoryId] = useState(defaultCategoryId ?? '');
  const [text, setText] = useState('');
  const [type, setType] = useState<'single' | 'multiple'>('single');
  const [correctInputs, setCorrectInputs] = useState(['']);
  const [incorrectInputs, setIncorrectInputs] = useState(['', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync default category when it changes (e.g. navigating to a new category)
  const handleOpen = () => {
    if (defaultCategoryId && !categoryId) {
      setCategoryId(defaultCategoryId);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const correct   = correctInputs.map((s) => s.trim()).filter(Boolean);
    const incorrect = incorrectInputs.map((s) => s.trim()).filter(Boolean);

    if (!categoryId) { setError('Please select a category'); return; }
    if (!text.trim()) { setError('Question text is required'); return; }
    if (correct.length === 0) { setError('At least one correct answer is required'); return; }
    if (type === 'single' && correct.length > 1) { setError('Single-choice questions can only have one correct answer'); return; }

    setLoading(true);
    const result = await onSubmit({ category_id: categoryId, text: text.trim(), type, correct, incorrect });
    setLoading(false);

    if (result.ok) {
      setText('');
      setType('single');
      setCorrectInputs(['']);
      setIncorrectInputs(['', '', '']);
      setError('');
      onClose();
    } else {
      setError(result.error ?? 'Failed to add question');
    }
  };

  const flatCats = flattenCategories(categories);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Question" size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Category */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Category *</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="bg-[#0f0f23] border border-violet-900/30 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-violet-500 transition-all"
          >
            <option value="">Select a category…</option>
            {flatCats.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Question text */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Question *</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter your question…"
            rows={3}
            className="bg-[#0f0f23] border border-violet-900/30 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-violet-500 transition-all resize-none"
          />
        </div>

        {/* Type */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Answer Type *</label>
          <div className="flex gap-3">
            {(['single', 'multiple'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                  type === t
                    ? 'bg-violet-600/30 border-violet-500 text-violet-300'
                    : 'border-violet-900/20 text-slate-500 hover:border-violet-700/40'
                }`}
              >
                {t === 'single' ? '🔘 Single Choice' : '☑️ Multiple Choice'}
              </button>
            ))}
          </div>
        </div>

        {/* Correct answers */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Correct Answer{type === 'multiple' ? 's' : ''} *
          </label>
          {correctInputs.map((val, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={val}
                onChange={(e) => {
                  const next = [...correctInputs]; next[i] = e.target.value; setCorrectInputs(next);
                }}
                placeholder={`Correct answer ${i + 1}`}
                className="flex-1 bg-[#0f0f23] border border-emerald-900/30 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500 transition-all"
              />
              {type === 'multiple' && correctInputs.length > 1 && (
                <Button type="button" variant="ghost" size="icon"
                  onClick={() => setCorrectInputs(correctInputs.filter((_, j) => j !== i))}
                  className="text-red-400">✕</Button>
              )}
            </div>
          ))}
          {type === 'multiple' && (
            <Button type="button" variant="ghost" size="sm"
              onClick={() => setCorrectInputs([...correctInputs, ''])}
              className="self-start text-emerald-400">+ Add correct answer</Button>
          )}
        </div>

        {/* Incorrect answers */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Incorrect Answers (distractors)
          </label>
          {incorrectInputs.map((val, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={val}
                onChange={(e) => {
                  const next = [...incorrectInputs]; next[i] = e.target.value; setIncorrectInputs(next);
                }}
                placeholder={`Wrong answer ${i + 1}`}
                className="flex-1 bg-[#0f0f23] border border-red-900/30 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-red-700/50 transition-all"
              />
              <Button type="button" variant="ghost" size="icon"
                onClick={() => setIncorrectInputs(incorrectInputs.filter((_, j) => j !== i))}
                className="text-red-400">✕</Button>
            </div>
          ))}
          <Button type="button" variant="ghost" size="sm"
            onClick={() => setIncorrectInputs([...incorrectInputs, ''])}
            className="self-start text-red-400">+ Add wrong answer</Button>
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-900/20 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" loading={loading}>Add Question</Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Flatten tree for <select> ────────────────────────────────────────────────
function flattenCategories(
  cats: Category[],
  depth = 0
): Array<{ id: string; label: string }> {
  const result: Array<{ id: string; label: string }> = [];
  for (const c of cats) {
    const indent = '  '.repeat(depth);
    result.push({ id: c.id, label: `${indent}${depth > 0 ? '└ ' : ''}${c.name}` });
    if (c.subcategories?.length) {
      result.push(...flattenCategories(c.subcategories, depth + 1));
    }
  }
  return result;
}