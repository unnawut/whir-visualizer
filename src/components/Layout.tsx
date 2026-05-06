import { useState, type MouseEvent, type ReactNode } from 'react';
import { SECTIONS } from '../sections';

interface LayoutProps {
  activePage: number;
  onNavigate: (index: number) => void;
  children: ReactNode;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

function sectionHref(i: number): string {
  return i === 0 ? `${BASE}/` : `${BASE}/${SECTIONS[i].id}`;
}

function isModifiedClick(e: MouseEvent): boolean {
  return e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
}

export function Layout({ activePage, onNavigate, children }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = (
    <nav className="flex flex-col gap-0.5">
      {SECTIONS.map(({ id, label, subs }, i) => {
        const isActive = activePage === i;
        const href = sectionHref(i);
        return (
          <div key={id}>
            <a
              href={href}
              onClick={(e) => {
                if (isModifiedClick(e)) return;
                e.preventDefault();
                onNavigate(i);
                setMenuOpen(false);
              }}
              className={`
                cursor-pointer block w-full text-left px-4 py-2 text-sm leading-snug rounded-r-md transition-colors
                border-l-2 no-underline
                ${
                  isActive
                    ? 'border-sienna text-sienna font-medium bg-sienna/5'
                    : 'border-transparent text-text-muted hover:text-text hover:border-border'
                }
              `}
            >
              <span className="text-xs text-text-muted mr-1.5">{i}.</span>
              {label}
            </a>
            {isActive && subs.length > 0 && (
              <div className="ml-7 border-l border-border-light">
                {subs.map((sub) => (
                  <a
                    key={sub.id}
                    href={`${href}#${sub.id}`}
                    onClick={(e) => {
                      if (isModifiedClick(e)) return;
                      e.preventDefault();
                      setMenuOpen(false);
                      const el = document.getElementById(sub.id);
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="cursor-pointer block w-full text-left pl-3 py-1 text-[11px] leading-snug text-text-muted/70 hover:text-sienna transition-colors no-underline"
                  >
                    {sub.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-bg">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed top-0 left-0 w-60 h-screen flex-col border-r border-border-light bg-bg-card z-30">
        <button
          onClick={() => { onNavigate(0); setMenuOpen(false); }}
          className="cursor-pointer px-6 pt-8 pb-6 text-left w-full"
        >
          <h1 className="font-heading text-3xl font-bold text-navy tracking-tight">
            WHIR
          </h1>
          <p className="text-xs text-text-muted mt-1">A Gentle Introduction</p>
        </button>
        <div className="flex-1 overflow-y-auto pb-8">{navLinks}</div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-bg-card border-b border-border-light z-30 flex items-center px-4">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="cursor-pointer p-2 -ml-2 text-text hover:text-sienna transition-colors"
          aria-label="Toggle menu"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            {menuOpen ? (
              <>
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="6" y1="18" x2="18" y2="6" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
        <button onClick={() => onNavigate(0)} className="cursor-pointer ml-3">
          <h1 className="font-heading text-xl font-bold text-navy">WHIR</h1>
        </button>
        <span className="ml-auto text-xs text-text-muted font-mono">
          {activePage} / {SECTIONS.length - 1}
        </span>
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/20"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="w-64 h-full bg-bg-card border-r border-border-light pt-16 pb-8 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {navLinks}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="md:ml-60 pt-14 md:pt-0 min-h-screen">
        {children}
        <footer className="border-t border-border-light py-6 text-center text-xs text-text-muted">
          Made with <span aria-label="love">❤️</span> for{' '}
          <a
            href="https://x.com/ReamLabs"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-sienna"
          >
            ReamLabs
          </a>{' '}
          <a
            href="https://www.youtube.com/watch?v=tqs5xCQdVxk"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-sienna"
          >
            study group session on WHIR
          </a>
        </footer>
      </main>
    </div>
  );
}
