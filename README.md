# WHIR Intro

An interactive, educational guide to the [WHIR protocol](https://eprint.iacr.org/2024/1586) — the polynomial commitment scheme used inside [leanMultisig](https://github.com/leanEthereum/leanMultisig) for post-quantum signature aggregation on Ethereum.

> **A note on origin.** This was made for [Ream's study group](https://github.com/ReamLabs/ream-study-group) session on WHIR. It is **not an authoritative resource**, has not been reviewed by the WHIR researchers, and may contain inaccuracies — for the precise protocol, refer to the WHIR paper and the leanMultisig source code. If you spot something wrong, please open an issue.

## What is this?

This is a step-by-step visual explainer that builds up the ideas behind WHIR from scratch. No prior knowledge of cryptography or zero-knowledge proofs is assumed — just a software engineering background.

The site progresses from basic building blocks (Reed-Solomon codes, constraints, sumcheck, folding) through the full WHIR protocol loop and parameter tuning, using a running "referee scoring" example throughout. Each section includes interactive demos where you can tamper with values, fold polynomials, step through protocol iterations, and explore parameter tradeoffs.

## Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:5173/`.

### Build

```bash
npm run build
```

Output goes to `dist/`. The production build uses `base: '/whir-intro/'` for GitHub Pages deployment.

### Type check

```bash
npx tsc --noEmit
```

### Lint

```bash
npx eslint src/
```

## Tech stack

- **React 19** + **TypeScript**
- **Vite 8** (dev server + build)
- **Tailwind CSS 4** (styling)
- **Framer Motion** (animations)
- **Recharts** (charts)
- **KaTeX** (math rendering)
- All polynomial math runs in **F₁₇** (the finite field mod 17)

## Project structure

```
src/
├── sections/       # One file per section, named S{N}_{Name}.tsx
├── components/     # Shared UI (Layout, Section, MathBlock, ui/)
├── utils/          # Math over F₁₇ (field, polynomial, sumcheck, folding)
├── data/           # Static data (verification complexity formulas)
├── sections.ts     # Navigation structure (section IDs, labels, subs)
├── App.tsx         # Page routing + section rendering
└── index.css       # Tailwind + custom theme
```

## References

- **WHIR paper**: Gal Arnon, Alessandro Chiesa, Giacomo Fenzi, Eylon Yogev — [ePrint 2024/1586](https://eprint.iacr.org/2024/1586)
- **STIR paper**: [ePrint 2024/390](https://eprint.iacr.org/2024/390)
- **leanMultisig**: [github.com/leanEthereum/leanMultisig](https://github.com/leanEthereum/leanMultisig)
- **Giacomo Fenzi's WHIR blog**: [gfenzi.io/papers/whir](https://gfenzi.io/papers/whir/)

## License

MIT
