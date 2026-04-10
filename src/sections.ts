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
      { label: 'Folding Example', id: 'interactive-folding' },
    ],
  },
  {
    id: 'one-iteration',
    label: 'The WHIR Protocol',
    subs: [
      { label: 'Putting the Pieces Together', id: 'putting-pieces-together' },
      { label: 'The Protocol at a Glance', id: 'protocol-at-a-glance' },
      { label: 'Step-by-Step Walkthrough', id: 'step-by-step-walkthrough' },
    ],
  },
  {
    id: 'full-protocol',
    label: 'Tuning the Protocol',
    subs: [
      { label: 'Overview', id: 'full-protocol-overview' },
      { label: 'The k Tradeoff', id: 'k-tradeoff' },
      { label: 'Queries per Round', id: 'queries-per-round' },
      { label: 'Code Rate', id: 'code-rate' },
      { label: 'Interactive Funnel', id: 'funnel-visualization' },
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
