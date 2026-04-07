import { useState, useMemo, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Section } from '../components/Section';
import { Math as InlineMath, MathBlock } from '../components/MathBlock';
import { StepNavigator } from '../components/ui/StepNavigator';
import { Slider } from '../components/ui/Slider';
import { mod } from '../utils/field';
import { evaluate } from '../utils/polynomial';
import type { MultilinearPoly } from '../utils/sumcheck';
import { simulateFullSumcheck } from '../utils/sumcheck';

// Fixed example polynomial: f(X1, X2) on {0,1}^2
// Index convention: LSB = X₁, so code's variable 0 = X₁.
// Round 1 collapses X₁ (even/odd grouping), Round 2 collapses X₂.
// Index 0 (00): X₁=0, X₂=0 → f(0,0) = 3
// Index 1 (01): X₁=1, X₂=0 → f(1,0) = 1
// Index 2 (10): X₁=0, X₂=1 → f(0,1) = 5
// Index 3 (11): X₁=1, X₂=1 → f(1,1) = 4
// Round 1: X₁=0 (even): {3,5}→8, X₁=1 (odd): {1,4}→5
const POLY_VALUES = [3, 1, 5, 4]; // f(0,0)=3, f(1,0)=1, f(0,1)=5, f(1,1)=4 => sum=13
const POLY: MultilinearPoly = { values: POLY_VALUES, numVars: 2 };
const CHALLENGES = [6, 10]; // pre-selected verifier challenges

const stepLabels = [
  'The Claim',
  'Round 1: Grouping by X\u2081',
  'Round 1 result: New Claimed Sum',
  'Round 2: Grouping by X\u2082',
  'Round 2 result: New Claimed Sum',
  'The Full Sumcheck Transcript',
];

export function S5_Sumcheck() {
  const [step, setStep] = useState(0);
  // Charlie's score slider — defaults to honest value (4)
  const [charlieOverride, setCharlieOverride] = useState<number | null>(null);
  const charlieScore = charlieOverride !== null ? charlieOverride : 4;

  // 3 referees: Alice=3, Bob=1, Charlie=4
  // Row 00: ADD: 0 + Alice(3) = 3
  // Row 01: ADD: 3 + Bob(1) = 4
  // Row 10: ADD: 4 + Charlie(4) = 8  (tamper target)
  // Row 11: padding (0)
  // Committed outputs: 3, 4, 8, 0
  const row10Error = ((8 - (4 + charlieScore) % 17) % 17 + 17) % 17;
  const totalWeightedSum = row10Error;

  const result = useMemo(
    () => simulateFullSumcheck(POLY, CHALLENGES),
    []
  );

  // Positions per step:
  // 0: flat line (4 values)
  // 1: 2D grid, highlight X₁ groups
  // 2: collapse X₁ → 2 points
  // 3: 2 points, highlight X₂ groups
  // 4: collapse X₂ → 1 point
  // 5: final single point
  // Grid layout — MSB convention (X₁=rows, X₂=columns):
  //   Index 0: X₁=0, X₂=0 → top-left     f(0,0)=3
  //   Index 1: X₁=1, X₂=0 → bottom-left  f(1,0)=1
  //   Index 2: X₁=0, X₂=1 → top-right    f(0,1)=5
  //   Index 3: X₁=1, X₂=1 → bottom-right f(1,1)=4
  // Round 1 collapses X₁ (code's var 0): even={idx0,idx2}={3,5}→8, odd={idx1,idx3}={1,4}→5
  // Highlighted edges: horizontal (same X₁ row)
  const gridPos = [
    { x: 60, y: 45 },   // idx 0: top-left (X₁=0, X₂=0)
    { x: 60, y: 125 },  // idx 1: bottom-left (X₁=1, X₂=0)
    { x: 180, y: 45 },  // idx 2: top-right (X₁=0, X₂=1)
    { x: 180, y: 125 }, // idx 3: bottom-right (X₁=1, X₂=1)
  ];
  // After collapsing X₁: merge top/bottom into middle, keep left/right separate
  // Visible: idx 0 (left, f(α₁,0)) and idx 2 (right, f(α₁,1))
  const collapsedR1 = [
    { x: 90, y: 85 },   // idx 0 → center-left
    { x: 90, y: 85 },   // idx 1 → merges to center-left
    { x: 150, y: 85 },  // idx 2 → center-right
    { x: 150, y: 85 },  // idx 3 → merges to center-right
  ];
  const finalPos = { x: 120, y: 85 };
  const positions: Record<number, { x: number; y: number }[]> = {
    0: [{ x: 30, y: 85 }, { x: 90, y: 85 }, { x: 150, y: 85 }, { x: 210, y: 85 }],
    1: gridPos,
    2: gridPos,
    3: gridPos,
    4: collapsedR1,
    5: [finalPos, finalPos, finalPos, finalPos],
  };
  const pos = positions[step] ?? positions[0];

  // Compute actual multilinear evaluations after each collapse
  // Round 1 collapses X₁: interpolate within each X₂ column at α₁
  // Even indices share the same X₂ value with their +half partner
  // X₂=0 column: idx 0 (X₁=0) and idx 1 (X₁=1) → interpolate at α₁
  // X₂=1 column: idx 2 (X₁=0) and idx 3 (X₁=1) → interpolate at α₁
  const a1 = CHALLENGES[0];
  const a2 = CHALLENGES[1];
  const afterR1_0 = mod(mod(POLY_VALUES[0] * mod(1 - a1)) + mod(POLY_VALUES[1] * a1)); // f(α₁, 0)
  const afterR1_1 = mod(mod(POLY_VALUES[2] * mod(1 - a1)) + mod(POLY_VALUES[3] * a1)); // f(α₁, 1)
  // Round 2 interpolates between afterR1_0 and afterR1_1 at α₂
  const finalVal = mod(mod(afterR1_0 * mod(1 - a2)) + mod(afterR1_1 * a2));            // f(α₁, α₂)

  // Vertex data: 4 circles, with step-dependent values and labels
  // After collapse R1: idx 0 (visible) shows f(α₁,0), idx 2 (visible) shows f(α₁,1)
  // After collapse R2: idx 0 (visible) shows f(α₁,α₂)
  const vertexData = [
    { label: '(0,0)', xi: [0, 0],
      stepVal:   [POLY_VALUES[0], POLY_VALUES[0], POLY_VALUES[0], POLY_VALUES[0], afterR1_0, finalVal],
      stepLabel: ['f(0,0)', 'f(0,0)', 'f(0,0)', 'f(0,0)', 'f(α₁,0)', 'f(α₁,α₂)'] },
    { label: '(1,0)', xi: [1, 0],
      stepVal:   [POLY_VALUES[1], POLY_VALUES[1], POLY_VALUES[1], POLY_VALUES[1], 0, 0],
      stepLabel: ['f(1,0)', 'f(1,0)', 'f(1,0)', 'f(1,0)', '', ''] },
    { label: '(0,1)', xi: [0, 1],
      stepVal:   [POLY_VALUES[2], POLY_VALUES[2], POLY_VALUES[2], POLY_VALUES[2], afterR1_1, 0],
      stepLabel: ['f(0,1)', 'f(0,1)', 'f(0,1)', 'f(0,1)', 'f(α₁,1)', ''] },
    { label: '(1,1)', xi: [1, 1],
      stepVal:   [POLY_VALUES[3], POLY_VALUES[3], POLY_VALUES[3], POLY_VALUES[3], 0, 0],
      stepLabel: ['f(1,1)', 'f(1,1)', 'f(1,1)', 'f(1,1)', '', ''] },
  ];

  const gridVertices = vertexData.map((v, i) => ({
    ...v,
    val: v.stepVal[step],
    x: pos[i].x,
    y: pos[i].y,
  }));

  // Visible vertices per step
  // Step 0-1: all 4
  // Step 2-3: idx 0 (f(α₁,0)) and idx 2 (f(α₁,1)) — one from each column
  // Step 4-5: idx 0 only (f(α₁,α₂))
  const visibleIndices: Record<number, number[]> = {
    0: [0, 1, 2, 3],
    1: [0, 1, 2, 3],
    2: [0, 1, 2, 3],
    3: [0, 1, 2, 3],
    4: [0, 2],
    5: [0],
  };
  const getVertexOpacity = (_v: typeof gridVertices[0], i: number) => {
    return (visibleIndices[step] ?? []).includes(i) ? 1 : 0;
  };

  // The dimension being highlighted for collapse
  const collapsingDim = (step === 1 || step === 2) ? 0 : step === 3 ? 1 : -1;

  return (
    <Section
      id="sumcheck"
      number={4}
      title="The Sumcheck Protocol"
      subtitle="Reduce an exponential-size sum to a single evaluation, one variable at a time."
    >
      <h3 id="how-sumcheck-works" className="font-heading text-xl font-semibold text-text mb-3">
        Why is the Sum Exponential?
      </h3>
      <p>
        Recall that a CRS constraint requires checking a weighted sum over <em>all</em>{' '}
        <InlineMath tex="2^m" /> points of the boolean hypercube.
        The boolean hypercube <InlineMath tex="\{0,1\}^m" /> contains every binary
        string of length <InlineMath tex="m" />. Each additional variable doubles the
        number of points — the sum grows exponentially:
      </p>

      <MathBlock tex="\sum_{b \in \{0,1\}^m} f(b) \stackrel{?}{=} H" />

      <div className="bg-bg-card border border-border rounded-lg p-5 my-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-heading font-semibold text-text-muted text-xs">Variables (<InlineMath tex="m" />)</th>
                <th className="text-left py-2 px-3 font-heading font-semibold text-text-muted text-xs">Points (<InlineMath tex="2^m" />)</th>
                <th className="text-left py-2 px-3 font-heading font-semibold text-text-muted text-xs">Example program</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-border-light">
                <td className="py-2 px-3 font-mono">4</td>
                <td className="py-2 px-3 font-mono">16</td>
                <td className="py-2 px-3 text-text-muted">
                  Hash preimage — just a few rounds of a hash function, ~16 steps
                </td>
              </tr>
              <tr className="border-b border-border-light">
                <td className="py-2 px-3 font-mono">8</td>
                <td className="py-2 px-3 font-mono">256</td>
                <td className="py-2 px-3 text-text-muted">
                  Sudoku validity — 81 cells with row/column/box constraints, a few hundred checks
                </td>
              </tr>
              <tr className="border-b border-border-light">
                <td className="py-2 px-3 font-mono">12</td>
                <td className="py-2 px-3 font-mono">4,096</td>
                <td className="py-2 px-3 text-text-muted">
                  Merkle inclusion — ~32 hash computations for a tree of depth 32, each hash expands to ~100 trace rows
                </td>
              </tr>
              <tr className="border-b border-border-light">
                <td className="py-2 px-3 font-mono">16</td>
                <td className="py-2 px-3 font-mono">65,536</td>
                <td className="py-2 px-3 text-text-muted">
                  Token transfer — balance lookups, signature check, state update; each operation generates many trace rows
                </td>
              </tr>
              <tr className="border-b border-border-light">
                <td className="py-2 px-3 font-mono">20</td>
                <td className="py-2 px-3 font-mono">1,048,576</td>
                <td className="py-2 px-3 text-text-muted">
                  DEX swap — price oracle reads, AMM curve math, multiple token transfers, slippage checks
                </td>
              </tr>
              <tr className="border-b border-border-light">
                <td className="py-2 px-3 font-mono">22</td>
                <td className="py-2 px-3 font-mono">4,194,304</td>
                <td className="py-2 px-3 text-text-muted">
                  Rollup block — hundreds of transactions, each with its own signature verification and state transitions
                </td>
              </tr>
              <tr className="bg-navy/5 font-semibold">
                <td className="py-2 px-3 font-mono">25</td>
                <td className="py-2 px-3 font-mono">33,554,432</td>
                <td className="py-2 px-3">
                  leanMultisig — ~2,500 post-quantum signatures, each requiring thousands of hash evaluations
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p>
        The <strong>sumcheck protocol</strong> solves this. It reduces the exponential-size
        sum to a <em>single</em> random evaluation. WHIR uses sumcheck in each iteration
        to reduce the CRS constraint to a simpler one on a smaller domain.
      </p>

      <h3 id="sumcheck-step-by-step" className="font-heading text-xl font-semibold text-text mt-10 mb-4">
        Step-by-Step Example
      </h3>
      <p className="mb-4">
        Consider a polynomial <InlineMath tex="f" /> with 4 values on <InlineMath tex="\{0,1\}^2" /> in <InlineMath tex="\mathbb{F}_{17}" />:
      </p>

      <div className="flex items-center justify-center gap-2 mb-4 font-mono text-sm">
        {[
          { pt: '(0,0)', v: 3 },
          { pt: '(1,0)', v: 1 },
          { pt: '(0,1)', v: 5 },
          { pt: '(1,1)', v: 4 },
        ].map(({ pt, v }) => (
          <div key={pt} className="flex flex-col items-center gap-0.5">
            <div className="w-12 h-8 rounded bg-navy/10 text-navy text-[10px] flex items-center justify-center">{pt}</div>
            <div className="text-[11px] font-bold" style={{ color: '#4f46e5' }}>{v}</div>
          </div>
        ))}
        <div className="text-text-muted ml-2">
          → sum = 3 + 1 + 5 + 4 = <strong>13</strong>
        </div>
      </div>

      <p className="mb-4">
        We want to verify this sum equals 13 without checking all 4 values.
        Use the arrows to step through.
      </p>

      <div className="bg-bg-card border border-border rounded-lg p-5 space-y-5">
        <StepNavigator
          step={step}
          totalSteps={6}
          onPrev={() => setStep((s) => Math.max(0, s - 1))}
          onNext={() => setStep((s) => Math.min(5, s + 1))}
          labels={stepLabels}
        />

        {/* Hypercube visualization */}
        <div className="flex justify-center">
          <svg viewBox="0 0 300 170" className="w-full max-w-[340px]">
            {/* Edges */}
            {[
              [0, 1], [2, 3], [0, 2], [1, 3],
            ].map(([a, b], i) => {
              const va = gridVertices[a];
              const vb = gridVertices[b];
              // Highlight the dimension being collapsed
              // collapsingDim 0 = X₁: highlight edges where X₁ matches (same row, horizontal)
              const isCollapsing =
                collapsingDim === 0
                  ? va.xi[0] === vb.xi[0] && va.xi[1] !== vb.xi[1]
                  : collapsingDim === 1
                  ? va.xi[1] === vb.xi[1] && va.xi[0] !== vb.xi[0]
                  : false;

              return (
                <motion.line
                  key={i}
                  animate={{
                    x1: va.x,
                    y1: va.y,
                    x2: vb.x,
                    y2: vb.y,
                    strokeOpacity: (step === 1 || step === 2 || step === 3) ? (isCollapsing ? 1 : 0.5) : 0,
                  }}
                  stroke={isCollapsing ? '#8b4513' : '#e0dcd4'}
                  strokeWidth={isCollapsing ? 2.5 : 1.5}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                />
              );
            })}

            {/* Vertices */}
            {gridVertices.map((v, i) => (
              <motion.g
                key={i}
                animate={{
                  opacity: getVertexOpacity(v, i),
                }}
                transition={{ duration: 0.5 }}
              >
                <motion.circle
                  animate={{ cx: v.x, cy: v.y }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                  r={20}
                  fill="#fefdfb"
                  stroke="#8b4513"
                  strokeWidth={1.5}
                />
                <motion.text
                  animate={{ x: v.x, y: v.y - 2 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                  textAnchor="middle"
                  className="text-[13px] font-mono font-bold"
                  fill="#8b4513"
                >
                  {v.val}
                </motion.text>
                <motion.text
                  animate={{ x: v.x, y: v.y + 12 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                  textAnchor="middle"
                  className="text-[8px]"
                  fill="#6b6375"
                >
                  {v.stepLabel[step] || v.label}
                </motion.text>
              </motion.g>
            ))}

            {/* Column labels for p₁(0) and p₁(1) during step 1 — grouping by X₂ */}
            {(step === 1 || step === 2 || step === 3) && (
              <>
                <motion.text
                  x={210}
                  y={48}
                  textAnchor="start"
                  className="text-[9px] font-bold"
                  fill="#4f46e5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  transition={{ duration: 0.4 }}
                >
                  p₁(0) = 3+5 = 8
                </motion.text>
                <motion.text
                  x={210}
                  y={128}
                  textAnchor="start"
                  className="text-[9px] font-bold"
                  fill="#4f46e5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  transition={{ duration: 0.4 }}
                >
                  p₁(1) = 1+4 = 5
                </motion.text>
              </>
            )}

            {/* Row and column headers */}
            {(step === 1 || step === 2 || step === 3) && (
              <>
                {/* Column headers */}
                <motion.text
                  x={60}
                  y={15}
                  textAnchor="middle"
                  className="text-[9px]"
                  fill="#6b6375"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  transition={{ duration: 0.4 }}
                >
                  X₂=0
                </motion.text>
                <motion.text
                  x={180}
                  y={15}
                  textAnchor="middle"
                  className="text-[9px]"
                  fill="#6b6375"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  transition={{ duration: 0.4 }}
                >
                  X₂=1
                </motion.text>
                {/* Row headers */}
                <motion.text
                  x={22}
                  y={48}
                  textAnchor="middle"
                  className="text-[9px] font-semibold"
                  fill="#8b4513"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  X₁=0
                </motion.text>
                <motion.text
                  x={22}
                  y={128}
                  textAnchor="middle"
                  className="text-[9px] font-semibold"
                  fill="#8b4513"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  X₁=1
                </motion.text>
              </>
            )}

            {/* Round 2 labels: X₁ pinned to α₁, X₂ varies */}
            {step === 4 && (
              <>
                <motion.text
                  x={90}
                  y={55}
                  textAnchor="middle"
                  className="text-[9px] font-semibold"
                  fill="#8b4513"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  X₂=0
                </motion.text>
                <motion.text
                  x={150}
                  y={55}
                  textAnchor="middle"
                  className="text-[9px] font-semibold"
                  fill="#8b4513"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  X₂=1
                </motion.text>
                <motion.text
                  x={30}
                  y={88}
                  textAnchor="middle"
                  className="text-[9px]"
                  fill="#6b6375"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  transition={{ duration: 0.4 }}
                >
                  X₁=α₁
                </motion.text>
              </>
            )}
          </svg>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="bg-bg border border-border-light rounded-md p-4"
          >
            {(step === 0) && (
              <div className="space-y-3">
                <h4 className="font-heading font-semibold text-base text-text">
                  The Claim
                </h4>
                <p className="text-sm text-text-muted">
                  The prover claims:
                </p>
                <MathBlock tex={`\\sum_{b \\in \\{0,1\\}^2} f(b) = ${POLY_VALUES[0]} + ${POLY_VALUES[1]} + ${POLY_VALUES[2]} + ${POLY_VALUES[3]} = ${result.targetSum} \\pmod{17}`} />
                <p className="text-sm text-text-muted">
                  The verifier wants to check this without looking at all 4 values. In 2
                  rounds, the verifier will reduce this to checking a single evaluation.
                </p>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-3">
                <h4 className="font-heading font-semibold text-base text-text">
                  Round 1: Grouping by <InlineMath tex="X_1" />
                </h4>
                <p className="text-sm text-text-muted">
                  With 4 values, each point can be indexed by 2
                  bits: <InlineMath tex="(X_1, X_2)" /> — giving us (0,0), (0,1), (1,0), (1,1).
                  The prover groups points by <InlineMath tex="X_1" /> — all
                  points where <InlineMath tex="X_1 = 0" /> in one row, <InlineMath tex="X_1 = 1" /> in
                  the other — then sums each row:
                </p>
                {(() => {
                  const rd = result.rounds[0];
                  const [c0, c1] = rd.univariate;
                  const g0 = evaluate(rd.univariate, 0);
                  const g1 = evaluate(rd.univariate, 1);
                  return (
                    <>
                      <div className="bg-bg-card rounded p-3 space-y-1 text-sm font-mono text-text-muted">
                        <p>p{'\u2081'}(0) = {g0} <span className="text-text-muted/50">← sum of X₁=0 row: 3 + 5</span></p>
                        <p>p{'\u2081'}(1) = {g1} <span className="text-text-muted/50">← sum of X₁=1 row: 1 + 4</span></p>
                      </div>
                      <p className="text-sm text-text-muted mt-3">
                        These two values define a polynomial:
                      </p>
                      <MathBlock tex={`p_1(X_1) = ${c0} + ${c1 >= 0 ? c1 : `(${c1})`}\\cdot X_1 \\pmod{17}`} />
                      <div className="bg-bg-card rounded p-3 text-sm font-mono text-text-muted">
                        <p>
                          Check: p{'\u2081'}(0) + p{'\u2081'}(1) = {g0} + {g1} = {mod(g0 + g1)}{' '}
                          {rd.check ? (
                            <span className="text-green">{'\u2713'} = {rd.claimedSum}</span>
                          ) : (
                            <span className="text-red">{'\u2717'} {'\u2260'} {rd.claimedSum}</span>
                          )}
                        </p>
                      </div>
                      <p className="text-sm text-text-muted mt-3 italic">
                        Notice that we checked only 2 values (the group sums) instead of all 4 — yet
                        we confirmed the total is {mod(g0 + g1)}.
                      </p>
                    </>
                  );
                })()}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <h4 className="font-heading font-semibold text-base text-text">
                  Round 1 result: New Claimed Sum
                </h4>
                {(() => {
                  const rd0 = result.rounds[0];
                  const [c0, c1] = rd0.univariate;
                  const p1_alpha = evaluate(rd0.univariate, rd0.challenge);
                  return (
                    <>
                      <p className="text-sm text-text-muted">
                        Recall from Round 1 the polynomial:
                      </p>
                      <MathBlock tex={`p_1(X_1) = ${c0} + ${c1 >= 0 ? c1 : `(${c1})`}\\cdot X_1 \\pmod{17}`} />
                      <p className="text-sm text-text-muted">
                        The 4 points collapse to 2. A random challenge is derived
                        by hashing the committed polynomial (Fiat-Shamir):
                      </p>
                      <div className="bg-bg-card rounded p-3 text-sm font-mono text-text-muted">
                        <InlineMath tex={`\\alpha_1 = \\text{FiatShamir}({\\color{#4f46e5} p_1(X_1) = ${c0} + ${c1 >= 0 ? c1 : `(${c1})`} \\cdot X_1 \\pmod{17}}) = {\\color{#0d9488} ${rd0.challenge}}`} />
                      </div>
                      <p className="text-sm text-text-muted">
                        Evaluate <InlineMath tex="p_1" /> at this challenge to get the new claimed sum
                        that Round 2 must verify:
                      </p>
                      <div className="bg-bg-card rounded p-3 text-sm font-mono text-text-muted">
                        <InlineMath tex={`p_1({\\color{#0d9488} ${rd0.challenge}}) = ${c0} + ${c1 >= 0 ? c1 : `(${c1})`} \\cdot {\\color{#0d9488} ${rd0.challenge}} = ${c0 + c1 * rd0.challenge} \\pmod{17} = ${p1_alpha}`} />
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <h4 className="font-heading font-semibold text-base text-text">
                  Round 2: Grouping by <InlineMath tex="X_2" />
                </h4>
                {(() => {
                  const rd0 = result.rounds[0];
                  const p1_alpha = evaluate(rd0.univariate, rd0.challenge);
                  const p2_c1 = mod(afterR1_1 - afterR1_0);
                  const p2_sum = mod(afterR1_0 + afterR1_1);
                  const p2_check = p2_sum === p1_alpha;
                  return (
                    <>
                      <p className="text-sm text-text-muted">
                        Now with <InlineMath tex="X_1" /> fixed to <InlineMath tex={`\\alpha_1 = ${rd0.challenge}`} />,
                        we interpolate within each <InlineMath tex="X_2" /> column. For any line
                        through two points <InlineMath tex="(0, y_0)" /> and <InlineMath tex="(1, y_1)" />,
                        the value at <InlineMath tex="X = \alpha" /> is{' '}
                        <InlineMath tex="y_0 \cdot (1 - \alpha) + y_1 \cdot \alpha" />:
                      </p>
                      <div className="flex justify-center gap-4 my-3 flex-wrap">
                        {[
                          { col: 'X₂ = 0', y0: POLY_VALUES[0], y1: POLY_VALUES[1], result: afterR1_0 },
                          { col: 'X₂ = 1', y0: POLY_VALUES[2], y1: POLY_VALUES[3], result: afterR1_1 },
                        ].map(({ col, y0, y1, result }) => {
                          const alpha = rd0.challenge;
                          // Line: y = y0 + (y1-y0)*x
                          const rawAtAlpha = y0 + (y1 - y0) * alpha;
                          // X-axis range: 0 to alpha+1
                          const xMax = alpha + 1;
                          // Y-axis range: include y0, y1, and rawAtAlpha
                          const yVals = [y0, y1, rawAtAlpha, 0];
                          const yMin = Math.min(...yVals) - 1;
                          const yMax = Math.max(...yVals) + 1;
                          // SVG dims
                          const svgW = 280, svgH = 150;
                          const padL = 30, padR = 80, padT = 15, padB = 30;
                          const plotW = svgW - padL - padR;
                          const plotH = svgH - padT - padB;
                          const xScale = (x: number) => padL + (x / xMax) * plotW;
                          const yScale = (y: number) => padT + plotH - ((y - yMin) / (yMax - yMin)) * plotH;
                          // Zero line (x-axis visually)
                          const yZero = yScale(0);
                          const x0px = xScale(0), x1px = xScale(1), xAlphaPx = xScale(alpha);
                          const y0Px = yScale(y0), y1Px = yScale(y1), yAlphaPx = yScale(rawAtAlpha);
                          return (
                            <svg key={col} viewBox={`0 0 ${svgW} ${svgH}`} className="w-[280px] h-[150px]">
                              {/* Column title */}
                              <text x={svgW / 2} y={10} textAnchor="middle" className="text-[9px] font-semibold" fill="#6b6375">{col}</text>
                              {/* X-axis (at y=0) */}
                              <line x1={padL} y1={yZero} x2={svgW - padR} y2={yZero} stroke="#e0dcd4" strokeWidth="1" />
                              {/* Y-axis */}
                              <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="#e0dcd4" strokeWidth="1" />
                              <text x={svgW - padR + 5} y={yZero + 3} className="text-[8px]" fill="#6b6375">X</text>
                              {/* Ticks */}
                              <line x1={x0px} y1={yZero - 3} x2={x0px} y2={yZero + 3} stroke="#6b6375" />
                              <text x={x0px} y={yZero + 13} textAnchor="middle" className="text-[8px]" fill="#6b6375">0</text>
                              <line x1={x1px} y1={yZero - 3} x2={x1px} y2={yZero + 3} stroke="#6b6375" />
                              <text x={x1px} y={yZero + 13} textAnchor="middle" className="text-[8px]" fill="#6b6375">1</text>
                              <line x1={xAlphaPx} y1={yZero - 3} x2={xAlphaPx} y2={yZero + 3} stroke="#0d9488" strokeWidth="1.5" />
                              <text x={xAlphaPx} y={yZero + 13} textAnchor="middle" className="text-[8px] font-bold" fill="#0d9488">α₁={alpha}</text>
                              {/* Line extended */}
                              <line x1={xScale(0)} y1={yScale(y0 + (y1 - y0) * 0)} x2={xScale(xMax)} y2={yScale(y0 + (y1 - y0) * xMax)} stroke="#4f46e5" strokeWidth="1.5" opacity="0.5" strokeDasharray="3,2" />
                              {/* Solid segment from 0 to 1 */}
                              <line x1={x0px} y1={y0Px} x2={x1px} y2={y1Px} stroke="#4f46e5" strokeWidth="2" />
                              {/* Dashed vertical at α */}
                              <line x1={xAlphaPx} y1={yZero} x2={xAlphaPx} y2={yAlphaPx} stroke="#0d9488" strokeWidth="1" strokeDasharray="2,2" opacity="0.6" />
                              {/* Endpoints */}
                              <circle cx={x0px} cy={y0Px} r="3.5" fill="#1a365d" />
                              <text x={x0px - 5} y={y0Px - 5} textAnchor="end" className="text-[9px] font-bold" fill="#1a365d">{y0}</text>
                              <circle cx={x1px} cy={y1Px} r="3.5" fill="#1a365d" />
                              <text x={x1px + 5} y={y1Px - 5} textAnchor="start" className="text-[9px] font-bold" fill="#1a365d">{y1}</text>
                              {/* Evaluation at α₁ */}
                              <circle cx={xAlphaPx} cy={yAlphaPx} r="4" fill="#0d9488" />
                              <text x={xAlphaPx + 6} y={yAlphaPx + 3} textAnchor="start" className="text-[9px] font-bold" fill="#0d9488">{rawAtAlpha} ≡ {result} (mod 17)</text>
                            </svg>
                          );
                        })}
                      </div>
                      <div className="bg-bg-card rounded p-3 space-y-1 text-sm font-mono text-text-muted">
                        <p>
                          p{'\u2082'}(0) = f(α₁, 0) = {POLY_VALUES[0]}·(1-{rd0.challenge}) + {POLY_VALUES[1]}·{rd0.challenge} = <strong style={{ color: '#0d9488' }}>{afterR1_0}</strong> (mod 17)
                          <span className="text-text-muted/50"> (X₂=0 column)</span>
                        </p>
                        <p>
                          p{'\u2082'}(1) = f(α₁, 1) = {POLY_VALUES[2]}·(1-{rd0.challenge}) + {POLY_VALUES[3]}·{rd0.challenge} = <strong style={{ color: '#0d9488' }}>{afterR1_1}</strong> (mod 17)
                          <span className="text-text-muted/50"> (X₂=1 column)</span>
                        </p>
                      </div>

                      <p className="text-sm text-text-muted">
                        These two values define a polynomial:
                      </p>
                      <MathBlock tex={`p_2(X_2) = ${afterR1_0} + ${p2_c1 >= 0 ? p2_c1 : `(${p2_c1})`}\\cdot X_2 \\pmod{17}`} />
                      <div className="bg-bg-card rounded p-3 text-sm font-mono text-text-muted">
                        <p>
                          Check: p{'\u2082'}(0) + p{'\u2082'}(1) = {afterR1_0} + {afterR1_1} = {p2_sum} (mod 17){' '}
                          {p2_check ? (
                            <span className="text-green">{'\u2713'} = {p1_alpha}</span>
                          ) : (
                            <span className="text-red">{'\u2717'} {'\u2260'} {p1_alpha}</span>
                          )}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-3">
                <h4 className="font-heading font-semibold text-base text-text">
                  Round 2 result: New Claimed Sum
                </h4>
                {(() => {
                  const rd1 = result.rounds[1];
                  const p2_c0 = afterR1_0;
                  const p2_c1 = mod(afterR1_1 - afterR1_0);
                  const p2_alpha = mod(p2_c0 + p2_c1 * rd1.challenge);
                  return (
                    <>
                      <p className="text-sm text-text-muted">
                        Recall from Round 2 the polynomial:
                      </p>
                      <MathBlock tex={`p_2(X_2) = ${p2_c0} + ${p2_c1 >= 0 ? p2_c1 : `(${p2_c1})`}\\cdot X_2 \\pmod{17}`} />
                      <p className="text-sm text-text-muted">
                        The 2 points collapse to 1. A random challenge is derived
                        by hashing the committed polynomial (Fiat-Shamir):
                      </p>
                      <div className="bg-bg-card rounded p-3 text-sm font-mono text-text-muted">
                        <InlineMath tex={`\\alpha_2 = \\text{FiatShamir}({\\color{#4f46e5} p_2(X_2) = ${p2_c0} + ${p2_c1 >= 0 ? p2_c1 : `(${p2_c1})`} \\cdot X_2 \\pmod{17}}) = {\\color{#0d9488} ${rd1.challenge}}`} />
                      </div>
                      <p className="text-sm text-text-muted">
                        Evaluate <InlineMath tex="p_2" /> at this challenge to get the new claimed sum:
                      </p>
                      <div className="bg-bg-card rounded p-3 text-sm font-mono text-text-muted">
                        <InlineMath tex={`p_2({\\color{#0d9488} ${rd1.challenge}}) = ${p2_c0} + ${p2_c1 >= 0 ? p2_c1 : `(${p2_c1})`} \\cdot {\\color{#0d9488} ${rd1.challenge}} = ${p2_c0 + p2_c1 * rd1.challenge} \\pmod{17} = ${p2_alpha}`} />
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {(step === 5) && (
              <div className="space-y-3">
                <h4 className="font-heading font-semibold text-base text-text">
                  The Full Sumcheck Transcript
                </h4>
                <p className="text-sm text-text-muted">
                  The prover sends the following sumcheck transcript for the verifier to check:
                </p>
                {(() => {
                  const [c0_1, c1_1] = result.rounds[0].univariate;
                  const p2_c0 = afterR1_0;
                  const p2_c1 = mod(afterR1_1 - afterR1_0);
                  return (
                    <ul className="text-sm text-text-muted space-y-2 ml-6 pl-2 list-disc">
                      <li>
                        Claimed sum: <InlineMath tex={`\\sigma = ${result.targetSum}`} />
                      </li>
                      <li>
                        Round 1 polynomial: <InlineMath tex={`p_1(X_1) = ${c0_1} + ${c1_1 >= 0 ? c1_1 : `(${c1_1})`} \\cdot X_1`} />
                      </li>
                      <li>
                        Round 1 challenge (Fiat-Shamir): <InlineMath tex={`\\alpha_1 = ${CHALLENGES[0]}`} />
                      </li>
                      <li>
                        Round 2 polynomial: <InlineMath tex={`p_2(X_2) = ${p2_c0} + ${p2_c1 >= 0 ? p2_c1 : `(${p2_c1})`} \\cdot X_2`} />
                      </li>
                      <li>
                        Round 2 challenge (Fiat-Shamir): <InlineMath tex={`\\alpha_2 = ${CHALLENGES[1]}`} />
                      </li>
                      <li>
                        Final claimed value: <InlineMath tex={`p_2(\\alpha_2) = ${finalVal}`} />
                      </li>
                    </ul>
                  );
                })()}
                <p className="text-sm text-text-muted">
                  The verifier then runs through the transcript step by step:
                </p>
                {(() => {
                  const [c0_1, c1_1] = result.rounds[0].univariate;
                  const p1_0 = c0_1;
                  const p1_1 = mod(c0_1 + c1_1);
                  const p1_sum = mod(p1_0 + p1_1);
                  const p1_alpha = mod(c0_1 + c1_1 * CHALLENGES[0]);
                  const p2_c0 = afterR1_0;
                  const p2_c1 = mod(afterR1_1 - afterR1_0);
                  const p2_0 = p2_c0;
                  const p2_1 = mod(p2_c0 + p2_c1);
                  const p2_sum = mod(p2_0 + p2_1);
                  const p2_alpha = mod(p2_c0 + p2_c1 * CHALLENGES[1]);
                  return (
                    <ol className="text-sm text-text-muted space-y-3 ml-6 pl-2 list-decimal">
                      <li>
                        Check Round 1's polynomial matches σ:{' '}
                        <InlineMath tex={`p_1(0) + p_1(1) = ${p1_0} + ${p1_1} = ${p1_sum}`} />{' '}
                        {p1_sum === result.targetSum ? <span className="text-green">✓</span> : <span className="text-red">✗</span>}{' '}
                        <InlineMath tex={`\\sigma = ${result.targetSum}`} />
                      </li>
                      <li>
                        Re-derive <InlineMath tex="\alpha_1" /> by hashing the transcript so far:{' '}
                        <InlineMath tex={`\\text{FiatShamir}(p_1) = ${CHALLENGES[0]}`} /> — matches
                      </li>
                      <li>
                        Evaluate <InlineMath tex={`p_1(\\alpha_1) = p_1(${CHALLENGES[0]}) = ${p1_alpha}`} /> —
                        this is the new claimed sum for Round 2
                      </li>
                      <li>
                        Check Round 2's polynomial matches:{' '}
                        <InlineMath tex={`p_2(0) + p_2(1) = ${p2_0} + ${p2_1} = ${p2_sum}`} />{' '}
                        {p2_sum === p1_alpha ? <span className="text-green">✓</span> : <span className="text-red">✗</span>}{' '}
                        <InlineMath tex={`p_1(\\alpha_1) = ${p1_alpha}`} />
                      </li>
                      <li>
                        Re-derive <InlineMath tex="\alpha_2" /> by hashing:{' '}
                        <InlineMath tex={`\\text{FiatShamir}(p_2) = ${CHALLENGES[1]}`} /> — matches
                      </li>
                      <li>
                        Evaluate <InlineMath tex={`p_2(\\alpha_2) = p_2(${CHALLENGES[1]}) = ${p2_alpha}`} /> —
                        this becomes the final claimed value for <InlineMath tex="f" /> at <InlineMath tex={`(\\alpha_1, \\alpha_2)`} />
                      </li>
                    </ol>
                  );
                })()}
                <p className="text-sm text-text-muted">
                  If all checks pass, the verifier is convinced the sumcheck was run
                  honestly — assuming <InlineMath tex={`f(\\alpha_1, \\alpha_2) = ${finalVal}`} /> is
                  actually true. That final fact is what the polynomial commitment scheme
                  verifies next.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="my-4">
        In practice, WHIR runs this same protocol on polynomials with 25+ variables,
        reducing <InlineMath tex="2^{25}" /> constraint checks to a single evaluation.
      </p>


      <h3 id="sumcheck-walkthrough" className="font-heading text-xl font-semibold text-text mt-10 mb-4">
        Sumcheck Walkthrough
      </h3>
      <p>
        The protocol works in <InlineMath tex="m" /> rounds, collapsing one variable
        at a time. Using the same referee example from Section 3 — Alice, Bob,
        and Charlie with 3 ADD operations starting from 0. This requires 2 sumcheck rounds:
      </p>

      {/* Collapse visualization */}
      <div className="bg-bg-card border border-border rounded-lg p-5 my-6 space-y-4">
        {/* Start: trace table */}
        <div>
          <div className="text-xs font-semibold text-text-muted mb-2">
            Start: sum over all <InlineMath tex="2^2 = 4" /> points
          </div>

          <div className="overflow-x-auto mb-3">
            <table className="text-[10px] border-collapse font-mono mx-auto">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-1 px-2 text-left text-text-muted font-semibold">Row</th>
                  <th className="py-1 px-2 text-left text-text-muted font-semibold">Op</th>
                  <th className="py-1 px-2 text-left text-text-muted font-semibold">Input 1</th>
                  <th className="py-1 px-2 text-left text-text-muted font-semibold">Input 2</th>
                  <th className="py-1 px-2 text-left text-text-muted font-semibold">Output</th>
                  <th className="py-1 px-2 text-left text-text-muted font-semibold">Constraint check</th>
                  <th className="py-1 px-2 text-left text-text-muted font-semibold">Error</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { row: 0, bin: '00', in1: '0', in2: '3 (Alice)', out: 3, check: `3 − 0 − 3`, error: 0, pad: false },
                  { row: 1, bin: '01', in1: '3', in2: '1 (Bob)', out: 4, check: `4 − 3 − 1`, error: 0, pad: false },
                  { row: 2, bin: '10', in1: '4', in2: `${charlieScore} (Charlie)`, out: 8, check: `8 − 4 − ${charlieScore}`, error: row10Error, pad: false },
                  { row: 3, bin: '11', in1: '—', in2: '—', out: 0, check: '—', error: 0, pad: true },
                ].map((r, i) => (
                  <tr key={i} className={`${i < 3 ? 'border-b border-border-light' : ''} ${r.bin === '10' && row10Error !== 0 ? 'bg-red/5' : ''}`}>
                    <td className="py-1 px-2 text-text-muted">{r.row} <span className="text-text-muted/50">({r.bin})</span></td>
                    <td className={`py-1 px-2 text-text-muted ${r.pad ? 'text-text-muted/40' : ''}`}>{r.pad ? 'pad' : 'ADD'}</td>
                    <td className={`py-1 px-2 ${r.pad ? 'text-text-muted/40' : ''}`}>{r.in1}</td>
                    <td className={`py-1 px-2 ${r.pad ? 'text-text-muted/40' : ''} ${r.bin === '10' && row10Error !== 0 ? 'text-red font-bold' : ''}`}>{r.in2}</td>
                    <td className="py-1 px-2 font-bold" style={{ color: r.pad ? '#6b6375' : '#4f46e5' }}>{r.out}</td>
                    <td className="py-1 px-2 text-text-muted">{r.check}</td>
                    <td className="py-1 px-2 font-bold">
                      <span className={r.error !== 0 ? 'text-text-muted/50 line-through mr-1' : 'text-green'}>0</span>
                      {r.error !== 0 && <span className="text-red">{r.error}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
            {[{pt:'00',v:0},{pt:'01',v:0},{pt:'10',v:row10Error},{pt:'11',v:0}].map(({pt,v}, i) => {
              const tampered = v !== 0;
              return (
                <Fragment key={pt}>
                  {i > 0 && <span className="text-text-muted text-sm font-mono">+</span>}
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-10 h-7 rounded bg-navy/10 text-navy text-[10px] font-mono flex items-center justify-center">{pt}</div>
                    <div className="text-[10px] font-mono font-bold flex items-center gap-1">
                      <span className={tampered ? 'text-text-muted/50 line-through' : 'text-green'}>0</span>
                      {tampered && <span className="text-red">{v}</span>}
                    </div>
                  </div>
                </Fragment>
              );
            })}
            <span className="text-text-muted text-sm font-mono">=</span>
            <div className="flex flex-col items-center gap-0.5">
              <div className={`px-2 h-7 rounded text-[10px] font-mono font-semibold flex items-center justify-center ${row10Error === 0 ? 'bg-green/15 text-green' : 'bg-red/15 text-red'}`}>
                σ
              </div>
              <div className="text-[10px] font-mono font-bold flex items-center gap-1">
                <span className={row10Error !== 0 ? 'text-text-muted/50 line-through' : 'text-green'}>0</span>
                {row10Error !== 0 && <span className="text-red">{row10Error}</span>}
              </div>
            </div>
          </div>
          <div className="text-[11px] text-text-muted text-center mb-3">
            The <strong>claimed weighted sum</strong> <InlineMath tex="\sigma" /> is
            the sum of all 4 constraint errors. For an honest
            trace <InlineMath tex="\sigma = 0" />. Sumcheck convinces the verifier of
            this without revealing the 4 values.
          </div>

          <div className="text-xs text-text-muted mb-3">
            Each row is indexed by a 2-bit
            string <InlineMath tex="X_1 X_2" />, and the value at each point is
            that row's <em>constraint error</em>{' '}
            (<InlineMath tex="\text{output} - \text{input}_1 - \text{input}_2" />).
            Since <InlineMath tex="\{0,1\}^2" /> has 4 points but we only have 3
            operations, the last row (11) is unused and filled with zero.
          </div>

          <div className="text-xs text-text-muted mb-3">
            Try changing Charlie's score — the prover already committed to the
            outputs, so tampering creates a non-zero error:
          </div>

          <div className="max-w-[300px] mx-auto mb-3">
            <Slider
              label={`Charlie's score (honest = 4)`}
              value={charlieOverride !== null ? charlieOverride : 4}
              min={0}
              max={5}
              onChange={setCharlieOverride}
            />
          </div>

        </div>

        {/* Round 1 */}
        <div className="border-t border-border-light pt-4">
          <div className="text-xs font-semibold text-sienna mb-1">
            Round 1: collapse <InlineMath tex="X_1" />
          </div>
          <div className="text-xs text-text-muted mb-2">
            Group by the first bit (<InlineMath tex="X_1" />): sum the 2
            points starting
            with <span className="font-mono font-bold">0</span> and the 2
            starting with <span className="font-mono font-bold">1</span>.
            This produces a univariate
            polynomial <InlineMath tex="p_1(X_1)" />.
          </div>
          <div className="flex items-center justify-center gap-3">
            <div className="flex gap-1">
              {[{pt:'00',v:0},{pt:'01',v:0}].map(({pt,v}) => {
                const tampered = v !== 0;
                return (
                  <div key={pt} className="flex flex-col items-center gap-0.5">
                    <div className="w-10 h-7 rounded bg-navy/10 text-navy text-[10px] font-mono flex items-center justify-center">{pt}</div>
                    <div className="text-[9px] font-mono font-bold flex items-center gap-1">
                      <span className={tampered ? 'text-text-muted/50 line-through' : 'text-green'}>0</span>
                      {tampered && <span className="text-red">{v}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-text-muted">
              → 0+0 = <strong className="text-green">0</strong> = <InlineMath tex="p_1(0)" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 mt-2">
            <div className="flex gap-1">
              {[{pt:'10',v:row10Error},{pt:'11',v:0}].map(({pt,v}) => {
                const tampered = v !== 0;
                return (
                  <div key={pt} className="flex flex-col items-center gap-0.5">
                    <div className="w-10 h-7 rounded bg-sienna/10 text-sienna text-[10px] font-mono flex items-center justify-center">{pt}</div>
                    <div className="text-[9px] font-mono font-bold flex items-center gap-1">
                      <span className={tampered ? 'text-text-muted/50 line-through' : 'text-green'}>0</span>
                      {tampered && <span className="text-red">{v}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-text-muted">
              → {row10Error}+0 = <strong className={row10Error === 0 ? 'text-green' : 'text-red'}>{row10Error}</strong> = <InlineMath tex="p_1(1)" />
            </div>
          </div>

          <div className="text-xs text-text-muted mt-3">
            <strong>What's checked:</strong> <InlineMath tex={`p_1(0) + p_1(1) = 0 + ${row10Error} = ${row10Error}`} /> — this
            must match the claimed weighted sum <InlineMath tex="\sigma = 0" />.
          </div>
          <div className="text-xs text-text-muted mt-1">
            <strong>What's NOT checked:</strong> The individual values within each group
            (e.g. whether row 00 = 0 and row 01 = 0 separately).
          </div>
          {/* Fiat-Shamir: compute α₁, evaluate, continue */}
          <div className="flex items-center justify-center gap-2 mt-3 text-[10px] font-mono flex-wrap">
            <span className="text-text-muted">Hash</span>
            <span className="text-text-muted">→</span>
            <span className="rounded px-2 py-1 font-bold" style={{ background: 'rgba(99,102,241,0.1)', color: '#4f46e5' }}>
              <InlineMath tex="\alpha_1" />
            </span>
            <span className="text-text-muted">→ evaluate</span>
            <span className="rounded px-2 py-1 font-bold" style={{ background: 'rgba(99,102,241,0.1)', color: '#4f46e5' }}>
              <InlineMath tex="p_1(\alpha_1)" />
            </span>
            <span className="text-text-muted">→ new claimed sum for round 2</span>
          </div>
          <div className="text-[9px] text-text-muted/50 text-center mt-1">
            Fiat-Shamir: <InlineMath tex="\alpha_1" /> is derived by hashing the transcript — no interaction needed.
            {row10Error !== 0
              ? <span className="italic"> The error is hiding in the <InlineMath tex="X_1 = 1" /> group.</span>
              : <span className="italic"> All errors are 0 — trace is honest.</span>}
          </div>
        </div>

        {/* Round 2 */}
        <div className="border-t border-border-light pt-4">
          <div className="text-xs font-semibold text-sienna mb-1">
            Round 2: collapse <InlineMath tex="X_2" />
          </div>
          <div className="text-xs text-text-muted mb-2">
            With <InlineMath tex="X_1" /> fixed to <InlineMath tex="\alpha_1" />, only
            2 points remain — one for each value of <InlineMath tex="X_2" />. These
            two values define a new univariate
            polynomial <InlineMath tex="p_2(X_2)" />, where <InlineMath tex="p_2(0)" /> is
            the value at <InlineMath tex="(\alpha_1, 0)" /> and <InlineMath tex="p_2(1)" /> is
            the value at <InlineMath tex="(\alpha_1, 1)" />:
          </div>
          <div className="flex items-center justify-center gap-3 flex-wrap text-base">
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-10 h-7 rounded bg-navy/10 text-navy text-[10px] font-mono flex items-center justify-center">α0</div>
                <div className="text-[10px] font-mono font-bold flex items-center gap-1">
                  <span className={row10Error !== 0 ? 'text-text-muted/50 line-through' : 'text-green'}>0</span>
                  {row10Error !== 0 && <span className="text-red">{row10Error}</span>}
                </div>
              </div>
              <div className="text-xs text-text-muted">= <InlineMath tex="p_2(0)" /></div>
            </div>
            <span className="text-text-muted font-mono">+</span>
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-10 h-7 rounded bg-sienna/10 text-sienna text-[10px] font-mono flex items-center justify-center">α1</div>
                <div className="text-[10px] font-mono font-bold text-green">0</div>
              </div>
              <div className="text-xs text-text-muted">= <InlineMath tex="p_2(1)" /></div>
            </div>
            <span className="text-text-muted font-mono">=</span>
            <div className="flex flex-col items-center gap-0.5">
              <div className={`px-2 h-7 rounded text-[10px] font-mono font-semibold flex items-center justify-center ${row10Error === 0 ? 'bg-green/15 text-green' : 'bg-red/15 text-red'}`}>
                <InlineMath tex="p_1(\alpha_1)" />
              </div>
              <div className="text-[10px] font-mono font-bold flex items-center gap-1">
                <span className={row10Error !== 0 ? 'text-text-muted/50 line-through' : 'text-green'}>0</span>
                {row10Error !== 0 && <span className="text-red">{row10Error}</span>}
              </div>
            </div>
          </div>
          <div className="text-xs text-text-muted mt-2">
            Fiat-Shamir determines <InlineMath tex="\alpha_2" /> to
            lock in <InlineMath tex="X_2" />.
            {row10Error !== 0
              ? <span className="italic"> The error at row <span className="font-mono">10</span> (Charlie's tampered score) is caught!</span>
              : <span className="italic"> All values are 0 — the trace is valid.</span>}
          </div>
        </div>

        {/* Final */}
        <div className="border-t border-border-light pt-4 text-center">
          {(() => {
            const ok = row10Error === 0;
            const tone = ok
              ? { bg: 'bg-green/5', border: 'border-green/20', chipBg: 'bg-green/15', chipText: 'text-green' }
              : { bg: 'bg-red/5', border: 'border-red/20', chipBg: 'bg-red/15', chipText: 'text-red' };
            return (
              <div className={`inline-flex items-center gap-3 ${tone.bg} border ${tone.border} rounded-lg px-4 py-2`}>
                <div className={`h-8 px-2 rounded ${tone.chipBg} ${tone.chipText} text-[10px] font-mono font-bold flex items-center justify-center`}>
                  <InlineMath tex="(\alpha_1, \alpha_2)" />
                </div>
                <div className="text-sm text-text">
                  {ok ? (
                    <><strong>Done!</strong> The sum over 4 points has collapsed to a single claim about <InlineMath tex="f(\alpha_1, \alpha_2)" />.</>
                  ) : (
                    <><strong>Rejected.</strong> The final check on <InlineMath tex="f(\alpha_1, \alpha_2)" /> fails — tampering caught.</>
                  )}
                </div>
              </div>
            );
          })()}
          <p className="text-xs text-text-muted mt-2">
            4 points → 2 → 1. Each round halved the problem.
          </p>
        </div>

      </div>

    </Section>
  );
}
