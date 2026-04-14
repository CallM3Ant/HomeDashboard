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

export function SettingsModal({ isOpen, onClose, settings, onUpdate, isLoggedIn }: SettingsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" size="sm">
      <div className="flex flex-col gap-6">
        {!isLoggedIn && (
          <p className="text-xs text-amber-400 bg-amber-900/20 border border-amber-500/20 rounded-xl px-4 py-3">
            Settings are saved locally in your browser. Sign in to save across devices.
          </p>
        )}

        <div className="flex flex-col gap-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Quiz Options</p>

          {/* Shuffle Answers */}
          <label className="flex items-center justify-between gap-4 cursor-pointer group">
            <div>
              <p className="text-sm font-semibold text-slate-200">Shuffle Answers</p>
              <p className="text-xs text-slate-500 mt-0.5">Randomize the order of answer choices</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.shuffleAnswers}
              onClick={() => onUpdate({ shuffleAnswers: !settings.shuffleAnswers })}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
                settings.shuffleAnswers ? 'bg-violet-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  settings.shuffleAnswers ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </label>

          {/* Include Subcategories in Mastery Quiz */}
          <label className="flex items-center justify-between gap-4 cursor-pointer group">
            <div>
              <p className="text-sm font-semibold text-slate-200">Mastery Quiz includes subcategories</p>
              <p className="text-xs text-slate-500 mt-0.5">Mastery Quiz pulls questions from all subcategories</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.includeSubcategoriesInMastery}
              onClick={() => onUpdate({ includeSubcategoriesInMastery: !settings.includeSubcategoriesInMastery })}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
                settings.includeSubcategoriesInMastery ? 'bg-violet-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  settings.includeSubcategoriesInMastery ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </label>
        </div>

        <div className="pt-2 border-t border-violet-900/20">
          <Button variant="primary" onClick={onClose} className="w-full">
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}