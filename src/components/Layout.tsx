import { useState, type ReactNode } from 'react';

export const SECTIONS = [
  {
    id: 'introduction',
    label: 'About',
    subs: [
      { label: 'About This Visualizer', id: 'about-this-visualizer' },
      { label: 'How the Demos Work', id: 'how-demos-work' },
    ],
  },
  {
    id: 'problem',
    label: 'What Are SNARGs and WHIR?',
    subs: [
      { label: 'What Are SNARGs?', id: 'what-are-snargs' },
      { label: 'SNARG Pipeline and WHIR', id: 'snarg-pipeline' },
      { label: 'The Road to WHIR', id: 'road-to-whir' },
    ],
  },
{
    id: 'reed-solomon',
    label: 'Reed-Solomon Codes',
    subs: [
      { label: 'What Are Reed-Solomon Codes?', id: 'what-are-rs-codes' },
      { label: 'How Reed-Solomon Codes Work', id: 'polynomials-and-redundancy' },
      { label: 'Error Correction to Proofs', id: 'error-correction-to-proofs' },
      { label: 'Why Redundancy Matters', id: 'why-redundancy-matters' },
    ],
  },
  {
    id: 'constrained-rs',
    label: 'Constrained Reed-Solomon Codes',
    subs: [
      { label: 'What Are CRS Codes?', id: 'what-are-crs-codes' },
      { label: 'Why Add a Constraint?', id: 'why-add-constraint' },
      { label: 'Interactive Example', id: 'crs-interactive-example' },
    ],
  },
  {
    id: 'sumcheck',
    label: 'The Sumcheck Protocol',
    subs: [
      { label: 'Why is the Sum Exponential?', id: 'how-sumcheck-works' },
      { label: 'Step-by-Step Example', id: 'sumcheck-step-by-step' },
      { label: 'Sumcheck Walkthrough', id: 'sumcheck-walkthrough' },
    ],
  },
  {
    id: 'folding',
    label: 'Folding',
    subs: [
      { label: 'What Is Folding?', id: 'what-is-folding' },
      { label: 'Interactive Folding', id: 'interactive-folding' },
    ],
  },
  {
    id: 'one-iteration',
    label: 'One WHIR Iteration',
    subs: [],
  },
  {
    id: 'full-protocol',
    label: 'The Full Protocol',
    subs: [
      { label: 'Overview', id: 'full-protocol-overview' },
      { label: 'Funnel Visualization', id: 'funnel-visualization' },
      { label: 'The k Tradeoff', id: 'k-tradeoff' },
    ],
  },
  {
    id: 'why-fast',
    label: 'Why WHIR is Fast',
    subs: [
      { label: 'Overview', id: 'why-fast-overview' },
      { label: 'Benchmark Comparison', id: 'benchmark-comparison' },
      { label: 'Key Takeaways', id: 'key-takeaways' },
    ],
  },
];

interface LayoutProps {
  activePage: number;
  onNavigate: (index: number) => void;
  children: ReactNode;
}

export function Layout({ activePage, onNavigate, children }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = (
    <nav className="flex flex-col gap-0.5">
      {SECTIONS.map(({ id, label, subs }, i) => {
        const isActive = activePage === i;
        return (
          <div key={id}>
            <button
              onClick={() => {
                onNavigate(i);
                setMenuOpen(false);
              }}
              className={`
                cursor-pointer block w-full text-left px-4 py-2 text-sm leading-snug rounded-r-md transition-colors
                border-l-2
                ${
                  isActive
                    ? 'border-sienna text-sienna font-medium bg-sienna/5'
                    : 'border-transparent text-text-muted hover:text-text hover:border-border'
                }
              `}
            >
              {i > 0 && <span className="text-xs text-text-muted mr-1.5">{i}.</span>}
              {label}
            </button>
            {isActive && subs.length > 0 && (
              <div className="ml-7 border-l border-border-light">
                {subs.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setMenuOpen(false);
                      const el = document.getElementById(sub.id);
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="cursor-pointer block w-full text-left pl-3 py-1 text-[11px] leading-snug text-text-muted/70 hover:text-sienna transition-colors"
                  >
                    {sub.label}
                  </button>
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
          <p className="text-xs text-text-muted mt-1">Protocol Visualizer</p>
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
      <main className="md:ml-60 pt-14 md:pt-0 min-h-screen">{children}</main>
    </div>
  );
}
