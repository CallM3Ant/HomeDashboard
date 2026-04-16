"use client";
import { useState } from "react";
import { User } from "@/types";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

interface HeaderProps {
  user: User | null;
  onSettings: () => void;
}

export function Header({ user, onSettings }: HeaderProps) {
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    // NOTE: removed overflow-hidden so the user dropdown isn't clipped.
    // The accent line is now rendered as a positioned child instead.
    <header className="relative z-10 bg-gradient-to-br from-[#1e2749] to-[#16213e] border border-violet-900/20 rounded-2xl px-8 py-6 mb-8 shadow-2xl shadow-black/40">
      {/* Accent line — inset via border-radius-safe absolute positioning */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-violet-700 rounded-t-2xl pointer-events-none" />

      <div className="flex items-center justify-between gap-6 flex-wrap">
        {/* Brand */}
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-lg shadow-violet-900/50 text-2xl shrink-0">
            🧠
          </div>
          <div>
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent leading-tight">
              StudyCards
            </h1>
            <p className="text-slate-400 text-sm">
              Master your knowledge with spaced repetition
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="secondary" size="sm" onClick={onSettings}>
            ⚙️ Settings
          </Button>

          {user ? (
             <div className="relative flex items-center gap-2">
    
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 bg-[#0f0f23]/60 border border-violet-900/30 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-400 hover:text-violet-400 hover:border-violet-500/40 transition-all"
                  >
                    🛠 Admin
                  </Link>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2.5 bg-[#0f0f23]/60 border border-violet-900/30 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-violet-500/40 hover:bg-[#0f0f23] transition-all"
              >
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-xs font-bold uppercase text-white shrink-0">
                  {user.username[0]}
                </span>
                {user.username}
                <svg
                  className={`w-4 h-4 text-slate-400 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {menuOpen && (
                <>
                  {/* backdrop */}
                  <div
                    className="fixed inset-0 z-[60]"
                    onClick={() => setMenuOpen(false)}
                  />
                  {/* dropdown — fixed to viewport so it's never clipped */}
                  <div className="absolute right-0 mt-2 w-44 bg-[#1e2749] border border-violet-900/20 rounded-xl shadow-xl z-[70] overflow-hidden">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-900/20 transition-colors flex items-center gap-2"
                    >
                      <span>→</span> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 border border-slate-700 rounded-lg px-3 py-1.5">
                Guest mode
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => (window.location.href = "/login")}
              >
                Sign In
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}