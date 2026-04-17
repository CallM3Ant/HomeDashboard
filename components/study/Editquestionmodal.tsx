"use client";
import { useState, useEffect, FormEvent } from "react";
import { Question } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface EditQuestionModalProps {
  isOpen: boolean;
  question: Question | null;
  onClose: () => void;
  onSave: (
    id: string,
    data: { text: string; type: "single" | "multiple"; correct: string[]; incorrect: string[] }
  ) => Promise<{ ok: boolean; error?: string }>;
}

function inputCls() {
  return "w-full text-sm px-3 py-2 rounded-[var(--r-sm)] text-[var(--text)] transition-colors";
}

export function EditQuestionModal({ isOpen, question, onClose, onSave }: EditQuestionModalProps) {
  const [text, setText] = useState("");
  const [type, setType] = useState<"single" | "multiple">("single");
  const [correctInputs, setCorrectInputs] = useState([""]);
  const [incorrectInputs, setIncorrectInputs] = useState([""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (question) {
      setText(question.text);
      setType(question.type);
      setCorrectInputs(question.correct.length > 0 ? question.correct : [""]);
      setIncorrectInputs(question.incorrect.length > 0 ? question.incorrect : [""]);
      setError("");
    }
  }, [question]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!question) return;
    setError("");
    const correct = correctInputs.map((s) => s.trim()).filter(Boolean);
    const incorrect = incorrectInputs.map((s) => s.trim()).filter(Boolean);
    if (!text.trim()) { setError("Question text is required"); return; }
    if (correct.length === 0) { setError("At least one correct answer is required"); return; }
    if (type === "single" && correct.length > 1) { setError("Single-choice needs exactly one correct answer"); return; }
    setLoading(true);
    const result = await onSave(question.id, { text: text.trim(), type, correct, incorrect });
    setLoading(false);
    if (result.ok) { onClose(); } else { setError(result.error ?? "Failed to save"); }
  };

  const baseInput = { background: 'var(--bg)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-sm)', color: 'var(--text)', outline: 'none' };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit question" size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="label">Question *</label>
          <textarea
            value={text} onChange={(e) => setText(e.target.value)} rows={3}
            className={`${inputCls()} resize-none`} style={baseInput}
            onFocus={(e) => Object.assign(e.target.style, { borderColor: 'var(--accent)' })}
            onBlur={(e) => Object.assign(e.target.style, { borderColor: 'var(--border-2)' })}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="label">Answer type *</label>
          <div className="flex gap-2">
            {(["single", "multiple"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setType(t)}
                className="flex-1 py-2 rounded-[var(--r-sm)] text-sm font-medium transition-all"
                style={{
                  background: type === t ? 'var(--accent-soft)' : 'var(--surface-2)',
                  border: `1px solid ${type === t ? 'var(--accent-border)' : 'var(--border)'}`,
                  color: type === t ? 'var(--accent)' : 'var(--text-2)',
                }}>
                {t === "single" ? "Single choice" : "Multiple choice"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="label" style={{ color: 'var(--green)' }}>Correct answer{type === "multiple" ? "s" : ""} *</label>
          <div className="flex flex-col gap-1.5">
            {correctInputs.map((val, i) => (
              <div key={i} className="flex gap-2">
                <input type="text" value={val}
                  onChange={(e) => { const n = [...correctInputs]; n[i] = e.target.value; setCorrectInputs(n); }}
                  placeholder={`Correct ${i + 1}`} className={`${inputCls()} flex-1`}
                  style={{ ...baseInput, borderColor: 'var(--green-border)' }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--green)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--green-border)')}
                />
                {type === "multiple" && correctInputs.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => setCorrectInputs(correctInputs.filter((_, j) => j !== i))} className="text-[var(--red)]">×</Button>
                )}
              </div>
            ))}
          </div>
          {type === "multiple" && (
            <button type="button" onClick={() => setCorrectInputs([...correctInputs, ''])} className="text-xs text-[var(--green)] hover:underline self-start mt-0.5">+ Add correct</button>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="label" style={{ color: 'var(--red)' }}>Wrong answers</label>
          <div className="flex flex-col gap-1.5">
            {incorrectInputs.map((val, i) => (
              <div key={i} className="flex gap-2">
                <input type="text" value={val}
                  onChange={(e) => { const n = [...incorrectInputs]; n[i] = e.target.value; setIncorrectInputs(n); }}
                  placeholder={`Wrong ${i + 1}`} className={`${inputCls()} flex-1`}
                  style={{ ...baseInput, borderColor: 'var(--red-border)' }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--red)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--red-border)')}
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => setIncorrectInputs(incorrectInputs.filter((_, j) => j !== i))} className="text-[var(--red)]">×</Button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setIncorrectInputs([...incorrectInputs, ''])} className="text-xs text-[var(--red)] hover:underline self-start mt-0.5">+ Add wrong</button>
        </div>

        {error && (
          <p className="text-xs px-3 py-2.5 rounded-[var(--r-sm)]"
            style={{ background: 'var(--red-soft)', border: '1px solid var(--red-border)', color: 'var(--red)' }}>
            {error}
          </p>
        )}

        <div className="flex gap-2 justify-end pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" loading={loading}>Save changes</Button>
        </div>
      </form>
    </Modal>
  );
}