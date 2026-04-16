"use client";
import { useState, useRef, useEffect } from "react";
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
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <header
      className="flex items-center justify-between gap-4 px-5 py-3 mb-6 rounded-[var(--r-xl)]"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-[var(--r-sm)] flex items-center justify-center text-white text-sm font-black select-none"
          style={{ background: 'var(--accent)' }}
        >
          S
        </div>
        <div>
          <p className="text-sm font-bold text-[var(--text)] leading-none">StudyCards</p>
          <p className="text-[10px] text-[var(--text-3)] mt-0.5 leading-none">spaced repetition</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onSettings}
          className="flex items-center gap-1.5 text-xs text-[var(--text-2)] hover:text-[var(--text)] px-3 py-1.5 rounded-[var(--r-sm)] hover:bg-[var(--surface-2)] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
          Settings
        </button>

        {user ? (
          <div className="flex items-center gap-2" ref={menuRef}>
            {/* Admin link — only shown to admins */}
            {user.isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 text-xs text-[var(--text-2)] hover:text-[var(--text)] px-3 py-1.5 rounded-[var(--r-sm)] hover:bg-[var(--surface-2)] transition-colors border border-transparent hover:border-[var(--border)]"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Admin
              </Link>
            )}

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--r-sm)] border transition-colors text-xs font-medium"
                style={{
                  background: menuOpen ? 'var(--surface-2)' : 'transparent',
                  borderColor: menuOpen ? 'var(--border-2)' : 'var(--border)',
                  color: 'var(--text)',
                }}
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold uppercase text-white"
                  style={{ background: 'var(--accent)' }}
                >
                  {user.username[0]}
                </span>
                <span className="hidden sm:block">{user.username}</span>
                <svg
                  width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"
                  className={`text-[var(--text-3)] transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-[60]" onClick={() => setMenuOpen(false)} />
                  <div
                    className="absolute right-0 top-full mt-1.5 w-44 z-[70] rounded-[var(--r-lg)] overflow-hidden animate-slideDown"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
                  >
                    <div className="px-3 py-2 border-b border-[var(--border)]">
                      <p className="text-[11px] text-[var(--text-3)]">Signed in as</p>
                      <p className="text-xs font-semibold text-[var(--text)] truncate">{user.username}</p>
                    </div>
                    <button
                      onClick={() => { setMenuOpen(false); logout(); }}
                      className="w-full text-left px-3 py-2.5 text-xs text-[var(--red)] hover:bg-[var(--red-soft)] transition-colors flex items-center gap-2"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-3)] hidden sm:block">Guest</span>
            <Button size="sm" onClick={() => (window.location.href = "/login")}>
              Sign in
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}