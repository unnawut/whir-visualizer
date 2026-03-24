import { useState, useEffect, lazy, Suspense } from 'react'
import { Layout, SECTIONS } from './components/Layout'

// Lazy-load each section for code splitting
const S1_WhatProblem = lazy(() => import('./sections/S1_WhatProblem').then(m => ({ default: m.S1_WhatProblem })))
const S2_FromCodeToPolynomials = lazy(() => import('./sections/S2_FromCodeToPolynomials').then(m => ({ default: m.S2_FromCodeToPolynomials })))
const S3_ReedSolomon = lazy(() => import('./sections/S3_ReedSolomon').then(m => ({ default: m.S3_ReedSolomon })))
const S4_ConstrainedRS = lazy(() => import('./sections/S4_ConstrainedRS').then(m => ({ default: m.S4_ConstrainedRS })))
const S5_Sumcheck = lazy(() => import('./sections/S5_Sumcheck').then(m => ({ default: m.S5_Sumcheck })))
const S6_Folding = lazy(() => import('./sections/S6_Folding').then(m => ({ default: m.S6_Folding })))
const S7_WhirIteration = lazy(() => import('./sections/S7_WhirIteration').then(m => ({ default: m.S7_WhirIteration })))
const S8_RecursiveStructure = lazy(() => import('./sections/S8_RecursiveStructure').then(m => ({ default: m.S8_RecursiveStructure })))
const S9_Performance = lazy(() => import('./sections/S9_Performance').then(m => ({ default: m.S9_Performance })))

const SECTION_COMPONENTS = [
  S1_WhatProblem,
  S2_FromCodeToPolynomials,
  S3_ReedSolomon,
  S4_ConstrainedRS,
  S5_Sumcheck,
  S6_Folding,
  S7_WhirIteration,
  S8_RecursiveStructure,
  S9_Performance,
]

function getPageFromHash(): number {
  const hash = window.location.hash.replace('#', '')
  if (!hash) return 0
  const idx = SECTIONS.findIndex(s => s.id === hash)
  return idx >= 0 ? idx : 0
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-2 border-sienna/30 border-t-sienna rounded-full animate-spin" />
    </div>
  )
}

function PageNav({ page, navigateTo, borderSide }: { page: number; navigateTo: (i: number) => void; borderSide: 'top' | 'bottom' }) {
  const borderClass = borderSide === 'top' ? 'border-b border-border pb-6' : 'border-t border-border pt-6'
  return (
    <div className="max-w-[760px] mx-auto px-6">
      <div className={`flex items-center justify-between ${borderClass}`}>
        {page > 0 ? (
          <button
            onClick={() => navigateTo(page - 1)}
            className="cursor-pointer group flex items-center gap-2 text-sm text-text-muted hover:text-sienna transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>
              <span className="text-xs text-text-muted/60 block">Previous</span>
              <span className="font-medium group-hover:text-sienna transition-colors">
                {SECTIONS[page - 1].label}
              </span>
            </span>
          </button>
        ) : <div />}

        <span className="text-xs text-text-muted/50 font-mono">
          {page + 1} / {SECTIONS.length}
        </span>

        {page < SECTIONS.length - 1 ? (
          <button
            onClick={() => navigateTo(page + 1)}
            className="cursor-pointer group flex items-center gap-2 text-sm text-text-muted hover:text-sienna transition-colors text-right"
          >
            <span>
              <span className="text-xs text-text-muted/60 block">Next</span>
              <span className="font-medium group-hover:text-sienna transition-colors">
                {SECTIONS[page + 1].label}
              </span>
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        ) : <div />}
      </div>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState(getPageFromHash)

  useEffect(() => {
    const onHashChange = () => setPage(getPageFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const navigateTo = (index: number) => {
    window.location.hash = SECTIONS[index].id
    window.scrollTo(0, 0)
  }

  const ActiveSection = SECTION_COMPONENTS[page]

  return (
    <Layout activePage={page} onNavigate={navigateTo}>
      {/* Top page navigation */}
      <div className="pt-4 md:pt-6">
        <div className="max-w-[760px] mx-auto px-6 flex items-center justify-between text-xs text-text-muted">
          {page > 0 ? (
            <button
              onClick={() => navigateTo(page - 1)}
              className="cursor-pointer group flex items-center gap-1.5 hover:text-sienna transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span className="hidden sm:inline">
                <span className="text-text-muted/50">Previous: </span>
                <span className="text-text-muted/70 group-hover:text-sienna transition-colors">{SECTIONS[page - 1].label}</span>
              </span>
              <span className="sm:hidden">Previous</span>
            </button>
          ) : <div />}

          <span className="text-text-muted/40 font-mono">
            {page + 1} / {SECTIONS.length}
          </span>

          {page < SECTIONS.length - 1 ? (
            <button
              onClick={() => navigateTo(page + 1)}
              className="cursor-pointer group flex items-center gap-1.5 hover:text-sienna transition-colors"
            >
              <span className="hidden sm:inline">
                <span className="text-text-muted/50">Next: </span>
                <span className="text-text-muted/70 group-hover:text-sienna transition-colors">{SECTIONS[page + 1].label}</span>
              </span>
              <span className="sm:hidden">Next</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ) : <div />}
        </div>
      </div>

      <Suspense fallback={<LoadingSpinner />}>
        <ActiveSection />
      </Suspense>

      {/* Bottom page navigation */}
      <div className="pb-16 pt-8">
        <PageNav page={page} navigateTo={navigateTo} borderSide="top" />
      </div>
    </Layout>
  )
}
