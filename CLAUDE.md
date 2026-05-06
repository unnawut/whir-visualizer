# CLAUDE.md — WHIR Intro

Instructions and context for Claude Code sessions working on this project.

## What this project is

An interactive educational website explaining the WHIR protocol (Reed-Solomon proximity testing with super-fast verification). Built for learners with a software engineering background but no prior cryptography knowledge. The running example throughout is a "referee scoring" trace (Alice, Bob, Charlie giving scores with ADD operations).

## Tech stack

- React 19 + TypeScript + Vite 8 + Tailwind CSS 4
- Framer Motion for animations
- Recharts for charts
- KaTeX via custom `<InlineMath>` and `<MathBlock>` components
- All demo math runs in F₁₇ (finite field mod 17)

## Architecture

### Sections

Each section is a standalone component in `src/sections/S{N}_{Name}.tsx`. The section number in the filename matches the display order. Navigation is defined in `src/sections.ts` (NOT in Layout.tsx — this was split out to fix HMR issues).

### Math utilities

All in `src/utils/`:
- `field.ts` — mod-17 arithmetic, subgroup generation
- `polynomial.ts` — coefficient-form polynomials, interpolation, degree
- `sumcheck.ts` — multilinear sumcheck simulation (LSB variable ordering)
- `folding.ts` — Reed-Solomon fold operations

**Important**: The sumcheck implementation uses **LSB convention** (bit 0 = variable 0). Both the partial evaluation loop and the current-round loop must use the same convention. An earlier bug had the partial eval using MSB (top-bit peeling) while the round loop used LSB — this was fixed by changing partial eval to peel from bit 0 via `table[2*j]` / `table[2*j+1]`.

### Shared components

- `Layout.tsx` — sidebar + mobile nav. Imports SECTIONS from `src/sections.ts`.
- `Section.tsx` — wrapper with id, number, title, subtitle
- `MathBlock.tsx` — `<Math>` (inline) and `<MathBlock>` (display) KaTeX components
- `ui/` — Slider (supports `ReactNode` displayValue), Button, StepNavigator, Tooltip

## Conventions

### Content style

- **Pedagogical, not academic.** Write for a software engineer learning crypto for the first time.
- **Concrete before abstract.** Show the referee example first, then generalize.
- **No unnecessary jargon.** When introducing a term, explain it immediately.
- **Short paragraphs.** Each paragraph should make one point.
- **Bold key terms** on first introduction in each section.
- **Cross-reference sections** by number (e.g., "Section 3") when building on prior concepts.

### Visual style

- Serif font: Lora (body + headings), 18px base
- Color palette: navy (#1a365d), sienna (#8b4513), green (#2f855a), red (#c53030)
- Body text: #2c2c2c on #faf9f6 background
- Cards: #fefdfb background with 1px border
- Interactive elements should have `cursor-pointer`
- Use the crossed-out pattern (original value struck through + red replacement) for showing tampered values
- Circle-with-dots visualization for RS codewords (golden angle spiral for dot placement)
- Dashed circle borders for Reed-Solomon redundancy points

### Code style

- Prefer editing existing files over creating new ones
- Keep section files self-contained (each section's state lives in its component)
- Module-level constants are fine; avoid exporting non-components from section files (breaks React Fast Refresh)
- Use `useMemo` for computed values, `useCallback` for handlers passed to effects
- Framer Motion: use `key` prop on SVGs that need re-triggering; for persistent elements across steps, avoid key changes
- No emojis in content unless explicitly requested (exception: Section 8 key properties have emojis)

## Common gotchas

### HMR / Hot reload

- **Never export non-components from component files.** This was the root cause of HMR failures — `SECTIONS` was moved from `Layout.tsx` to `src/sections.ts` to fix it.
- The `base` path in vite.config.ts is only applied for production builds (`command === 'build'`), not dev, to avoid HMR WebSocket issues.

### Polynomial conventions

- **LSB ordering** throughout: bit 0 of the table index = variable 0 = X₁
- The sumcheck step-by-step example uses POLY_VALUES = [3, 1, 5, 4] with CHALLENGES = [6, 10]
- The folding example uses the referee trace polynomial interpolated from [3, 4, 8, 0]

### leanMultisig parameters

From the actual source code (`leanEthereum/leanMultisig`):
- Folding: k=7 initial, k=5 subsequent (FoldingFactor::new(7, 5))
- Rate: configurable, typically ρ=1/2 for leaf proofs, ρ=1/16 for wrap layers
- Security: 123-bit hash security (KoalaBear), 18-bit grinding, ~105-bit effective query security
- Queries: computed dynamically via Johnson Bound, not hardcoded
- Field: KoalaBear prime p = 2³¹ − 2²⁴ + 1, degree-5 extension for 128-bit security
- Soundness assumption: Johnson Bound (default)

### Simplified models in Section 7 (Tuning)

The parameter explorer uses approximate formulas:
- Security: λ ≈ t × log₂(1/ρ) − log₂(⌈m/k⌉)
- Proof size: t × Merkle-depth per iteration, summed, × 32 bytes
- Proving time: ~12ns effective cost per hash (calibrated to match ~0.8s reported proving time)
- These are pedagogical approximations, not the real WHIR soundness analysis

## User preferences

- Prefers concise, direct prose — no filler, no restating what was just said
- Wants interactive visualizations over static explanations
- Prefers animations that build up step by step (e.g., fold animation: navy dots → colorize pairs → merge)
- Cross-out pattern for showing tampered vs honest values
- Dislikes red backgrounds for non-error states
- Slider thumb color should match body text
- Wants explanations to always relate back to the referee example when possible
- Prefers "leanMultisig" as one word (not "lean VM" or other variants)
- When something is inaccurate, prefers honest acknowledgment over hand-waving
- Security level fun labels are welcome (e.g., "your ex's birthday" for 32-bit)

## Deployment

GitHub Pages via `npm run build`. The `base` path `/whir-intro/` is applied only in production builds.
