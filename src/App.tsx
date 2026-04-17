import { useState, useEffect } from 'react'
import { Layout } from './components/Layout'
import { SECTIONS } from './sections'
import { S0_About } from './sections/S0_About'
import { S1_SnargsAndWhir } from './sections/S1_SnargsAndWhir'
import { S2_ReedSolomon } from './sections/S2_ReedSolomon'
import { S3_ConstrainedRS } from './sections/S3_ConstrainedRS'
import { S4_Sumcheck } from './sections/S4_Sumcheck'
import { S5_Folding } from './sections/S5_Folding'
import { S6_WhirProtocol } from './sections/S6_WhirProtocol'
import { S7_TuningProtocol } from './sections/S7_TuningProtocol'
import { S8_WhirInLeanMultisig } from './sections/S8_WhirInLeanMultisig'
import { S9_Summary } from './sections/S9_Summary'

const SECTION_COMPONENTS = [
  S0_About,
  S1_SnargsAndWhir,
  S2_ReedSolomon,
  S3_ConstrainedRS,
  S4_Sumcheck,
  S5_Folding,
  S6_WhirProtocol,
  S7_TuningProtocol,
  S8_WhirInLeanMultisig,
  S9_Summary,
]

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '') // e.g. "/whir-visualizer"

function getPageFromPath(): number {
  const path = window.location.pathname.replace(BASE, '').replace(/^\//, '').replace(/\/$/, '')
  if (!path) return 0
  const idx = SECTIONS.findIndex(s => s.id === path)
  return idx >= 0 ? idx : 0
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
          {page} / {SECTIONS.length - 1}
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
  const [page, setPage] = useState(getPageFromPath)

  useEffect(() => {
    const onPopState = () => setPage(getPageFromPath())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigateTo = (index: number) => {
    const path = index === 0 ? `${BASE}/` : `${BASE}/${SECTIONS[index].id}`
    window.history.pushState(null, '', path)
    setPage(index)
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
            {page} / {SECTIONS.length - 1}
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

      <ActiveSection />

      {/* Bottom page navigation */}
      <div className="pb-16 pt-8">
        <PageNav page={page} navigateTo={navigateTo} borderSide="top" />
      </div>
    </Layout>
  )
}
