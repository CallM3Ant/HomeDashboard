'use client';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface ReviewEmptyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReviewEmptyModal({ isOpen, onClose }: ReviewEmptyModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Review pool is empty" size="sm">
      <div className="flex flex-col gap-4">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-[var(--r-lg)] flex items-center justify-center text-2xl mx-auto"
          style={{ background: 'var(--green-soft)', border: '1px solid var(--green-border)' }}
        >
          🎉
        </div>

        <p className="text-sm text-[var(--text-2)] text-center leading-relaxed">
          You have nothing in your review pool right now — that's great work!
        </p>

        {/* How it works */}
        <div
          className="rounded-[var(--r)] p-4 flex flex-col gap-3"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
        >
          <p className="label">How the review pool works</p>
          <div className="flex flex-col gap-2.5">
            {[
              {
                icon: '✗',
                color: 'var(--red)',
                bg: 'var(--red-soft)',
                border: 'var(--red-border)',
                text: 'Answer a question wrong → it enters the review pool',
              },
              {
                icon: '✓',
                color: 'var(--green)',
                bg: 'var(--green-soft)',
                border: 'var(--green-border)',
                text: 'Answer it correctly twice in review → it exits the pool',
              },
              {
                icon: '⭐',
                color: 'var(--amber)',
                bg: 'var(--amber-soft)',
                border: 'var(--amber-border)',
                text: 'Answer any question correctly 3 times → it gets mastered',
              },
            ].map(({ icon, color, bg, border, text }) => (
              <div key={text} className="flex items-start gap-2.5">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5"
                  style={{ background: bg, border: `1px solid ${border}`, color }}
                >
                  {icon}
                </span>
                <p className="text-xs text-[var(--text-2)] leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-[var(--text-3)] text-center">
          Keep practising to build up your mastery progress!
        </p>

        <Button variant="primary" onClick={onClose} className="w-full">
          Got it
        </Button>
      </div>
    </Modal>
  );
}