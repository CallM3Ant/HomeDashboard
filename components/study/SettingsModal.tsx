'use client';
import { AppSettings } from '@/hooks/useSettings';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdate: (updates: Partial<AppSettings>) => void;
  isLoggedIn: boolean;
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  description: string;
}) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer group py-1">
      <div className="flex-1">
        <p className="text-sm font-medium text-[var(--text)]">{label}</p>
        <p className="text-xs text-[var(--text-3)] mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className="relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
        style={{ background: checked ? 'var(--accent)' : 'var(--surface-2)', border: `1px solid ${checked ? 'transparent' : 'var(--border-2)'}` }}
      >
        <span
          className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200"
          style={{ left: checked ? 'calc(100% - 18px)' : '1px' }}
        />
      </button>
    </label>
  );
}

export function SettingsModal({ isOpen, onClose, settings, onUpdate, isLoggedIn }: SettingsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" size="sm">
      <div className="flex flex-col gap-5">
        {!isLoggedIn && (
          <p className="text-xs text-[var(--amber)] px-3 py-2.5 rounded-[var(--r-sm)]" style={{ background: 'var(--amber-soft)', border: '1px solid var(--amber-border)' }}>
            Settings saved locally. Sign in to sync across devices.
          </p>
        )}

        <div className="flex flex-col gap-3">
          <p className="label">Quiz options</p>
          <div
            className="flex flex-col gap-3 p-4 rounded-[var(--r)]"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
          >
            <Toggle
              checked={settings.shuffleAnswers}
              onChange={() => onUpdate({ shuffleAnswers: !settings.shuffleAnswers })}
              label="Shuffle answers"
              description="Randomize the order of answer choices each quiz"
            />
            <div className="h-px bg-[var(--border)]" />
            <Toggle
              checked={settings.includeSubcategoriesInMastery}
              onChange={() => onUpdate({ includeSubcategoriesInMastery: !settings.includeSubcategoriesInMastery })}
              label="Mastery includes subcategories"
              description="Pull questions from all nested subcategories"
            />
          </div>
        </div>

        <Button variant="primary" onClick={onClose} className="w-full">Done</Button>
      </div>
    </Modal>
  );
}