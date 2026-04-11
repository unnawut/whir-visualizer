import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Section } from '../components/Section';
import { Math as InlineMath } from '../components/MathBlock';
import { Button } from '../components/ui/Button';

export function S6_WhirProtocol() {
  return (
    <Section
      id="one-iteration"
      number={6}
      title="The WHIR Protocol"
      subtitle="How sumcheck, folding, and proximity testing combine into one recursive loop."
    >
      <h3 id="putting-pieces-together" className="font-heading text-xl font-semibold text-text mb-3">
        Putting the Pieces Together
      </h3>
      <p>
        Here's what we've built up so far. The prover has a big table of numbers
        (the execution trace and related tables) and wants to convince the verifier of two things at once:
      </p>
      <ol className="list-decimal ml-6 my-4 space-y-1">
        <li><strong>Of low-degree polynomial</strong> — the trace hasn't been tampered.</li>
        <li><strong>Satisfies constraints</strong> — that polynomial satisfies the required equations, meaning the computation was executed correctly.</li>
      </ol>
      <p className="my-4">
        The previous sections gave us one piece each:
      </p>
      <ul className="list-disc ml-6 my-4 space-y-2">
        <li>
          <strong>Section 3 (CRS)</strong> — encoded the execution trace as a
          polynomial, defined the constraint each
          row must satisfy (e.g. <em>output − input₁ − input₂ = 0</em>), and
          checked it row by row. A Constrained Reed-Solomon code combines both: a
          low-degree polynomial that also satisfies the constraint.
        </li>
        <li>
          <strong>Section 4 (Sumcheck)</strong> — collapses the constraint check
          across all rows into a single evaluation.
        </li>
        <li>
          <strong>Section 5 (Folding)</strong> — shrinks the polynomial onto a
          half-sized domain, so the problem gets smaller each round.
        </li>
      </ul>
      <p className="my-4">
        Together, Sections 3–5 let us <em>transform</em> the claim (sumcheck
        collapses the constraint, folding shrinks the data) — but they don't tell
        us how the verifier knows the prover actually did the work honestly. A
        cheating prover could send fake folded values that happen to look correct
        on the domain. What's still missing are the <strong>soundness
        checks</strong> that catch a dishonest prover.
      </p>
      <p className="my-4">
        Two new ideas fill that gap:
      </p>
      <ul className="list-disc ml-6 my-4 space-y-2">
        <li>
          <strong>Out-of-domain probe</strong>: a cheating prover could fake values that look correct at every
          domain point but diverge elsewhere. The verifier catches this by
          testing at a random surprise point outside the domain — this works
          because two different low-degree polynomials disagree at almost every
          random point (<a href="https://en.wikipedia.org/wiki/Schwartz%E2%80%93Zippel_lemma" target="_blank" rel="noopener noreferrer" className="underline hover:text-sienna">Schwartz–Zippel lemma</a>).
        </li>
        <li>
          <strong>Shift queries</strong>: the verifier spot-checks a few
          positions from the original committed polynomial to verify the folding
          was done correctly. Called "shift" because the verifier checks
          consistency between the original domain <InlineMath tex="L" /> and
          the smaller domain <InlineMath tex="L^k" /> that the fold maps onto.
          This is the same random-sampling idea from Section 2 (Reed-Solomon) —
          but instead of checking "is this point on the polynomial?", it checks
          "does this point fold correctly?"
        </li>
      </ul>
      <p className="my-4">
        The order of these two checks matters: the OOD challenge is derived by
        hashing the transcript after the prover sends the folded commitment, and
        the query positions are derived after the OOD answer is added. This way
        the prover can't tailor either response to a challenge that hasn't been
        computed yet.
      </p>
      <p className="my-4">
        With all the pieces in place — CRS as the claim structure, sumcheck and
        folding to transform it, OOD probes and shift queries to keep the
        prover honest — here's how they fit together in one iteration.
      </p>
      <h3 id="protocol-at-a-glance" className="font-heading text-xl font-semibold text-text mt-10 mb-4">
        The Protocol at a Glance
      </h3>
      <p className="my-4">
        Each iteration follows the same five moves, alternating between prover and
        verifier:
      </p>
      <ol className="list-decimal ml-6 my-4 space-y-2">
        <li>
          <strong>Sumcheck rounds</strong> — the prover runs <InlineMath tex="k" /> rounds of sumcheck, collapsing the algebraic constraint one variable at a time.
        </li>
        <li>
          <strong>Send folded function</strong> — using the sumcheck challenges as folding randomness, the prover halves the polynomial's domain and sends the new evaluations.
        </li>
        <li>
          <strong>Out-of-domain probe</strong> — the prover evaluates the folded polynomial at a challenge point <em>outside</em> the domain.
        </li>
        <li>
          <strong>Shift queries</strong> — the verifier opens a few Merkle positions from the committed polynomial and checks the fold was computed correctly.
        </li>
        <li>
          <strong>Rinse and repeat</strong> — the output becomes the input to the next iteration, now on a half-sized domain.
        </li>
      </ol>
      <p className="my-4">
        Note that <strong>CRS isn't one of the steps</strong> — it's the shape of
        the claim that flows in and out. Steps 1–2 transform the claim, steps 3–4
        check that the transformation was honest, and step 5 restates the result
        as a new (smaller) CRS claim for the next iteration.
      </p>
      {/* Shrinking CRS illustration with pipeline boxes */}
      {(() => {
        const circles = [
          { label: 'Start', points: 8, r: 48 },
          { label: 'After iteration 1', points: 4, r: 36 },
          { label: 'After iteration 2', points: 2, r: 24 },
        ];
        const ga = Math.PI * (3 - Math.sqrt(5));

        const renderCircle = (step: typeof circles[0]) => {
          const size = step.r * 2 + 20;
          const cx = size / 2;
          const cy = size / 2;
          return (
            <div className="relative shrink-0">
              <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={cx} cy={cy} r={step.r} fill="#fefdfb" stroke="#1a365d" strokeWidth={2} />
                {Array.from({ length: step.points }).map((_, i) => {
                  const r = Math.sqrt((i + 0.5) / step.points) * (step.r - 6);
                  const angle = i * ga;
                  return (
                    <circle key={i} cx={cx + r * Math.cos(angle)} cy={cy + r * Math.sin(angle)} r={3.5} fill="#1a365d" fillOpacity={0.5} />
                  );
                })}
              </svg>
              <div className="absolute left-1/2 -translate-x-1/2 text-center whitespace-nowrap" style={{ top: size }}>
                <div className="text-[10px] text-text-muted font-mono">{step.label}</div>
                <div className="text-[10px] text-text-muted">{step.points} pts</div>
              </div>
            </div>
          );
        };

        const renderArrow = () => (
          <svg width="22" height="12" viewBox="0 0 22 12" className="shrink-0">
            <line x1="1" y1="6" x2="15" y2="6" stroke="#6b6375" strokeWidth="1.5" />
            <polygon points="15,2 21,6 15,10" fill="#6b6375" />
          </svg>
        );

        const renderSteps = (si: number) => {
          const prev = circles[si - 1];
          const next = circles[si];
          return (
            <div className="flex flex-col items-center gap-0.5 shrink-0">
              {/* Sumcheck */}
              <svg width="50" height="36" viewBox="0 0 50 36">
                {[8, 16, 24, 32, 42].map((x, i) => (
                  <line key={i} x1={x} y1={4} x2={25} y2={28} stroke="#8b4513" strokeWidth={0.8} strokeOpacity={0.4} />
                ))}
                {[8, 16, 24, 32, 42].map((x, i) => (
                  <circle key={`d${i}`} cx={x} cy={4} r={2.5} fill="#8b4513" fillOpacity={0.4} />
                ))}
                <circle cx={25} cy={28} r={3.5} fill="#8b4513" />
              </svg>
              <span className="text-[7px] text-sienna font-mono">sumcheck</span>

              <svg width="12" height="6" viewBox="0 0 12 6">
                <polygon points="6,6 2,0 10,0" fill="#6b6375" />
              </svg>

              {/* Fold */}
              <svg width="50" height="32" viewBox="0 0 50 32">
                {Array.from({ length: prev.points }).map((_, i) => {
                  const x = 6 + (i * 38) / (prev.points - 1);
                  const tx = 6 + (Math.floor(i / 2) * 38) / Math.max(next.points - 1, 1);
                  return (
                    <g key={i}>
                      <circle cx={x} cy={4} r={2.5} fill="#1a365d" fillOpacity={0.4} />
                      <line x1={x} y1={7} x2={tx} y2={25} stroke="#1a365d" strokeWidth={0.8} strokeOpacity={0.3} />
                    </g>
                  );
                })}
                {Array.from({ length: next.points }).map((_, i) => {
                  const tx = 6 + (i * 38) / Math.max(next.points - 1, 1);
                  return <circle key={`f${i}`} cx={tx} cy={28} r={3} fill="#1a365d" fillOpacity={0.7} />;
                })}
              </svg>
              <span className="text-[7px] text-navy font-mono">fold {prev.points}→{next.points}</span>

              <svg width="12" height="6" viewBox="0 0 12 6">
                <polygon points="6,6 2,0 10,0" fill="#6b6375" />
              </svg>

              {/* OOD */}
              <svg width="50" height="32" viewBox="0 0 50 32">
                <circle cx={20} cy={16} r={12} fill="#fefdfb" stroke="#1a365d" strokeWidth={1.5} />
                {Array.from({ length: 3 }).map((_, i) => {
                  const a = (i * 2.4) + 0.5;
                  return <circle key={i} cx={20 + 6 * Math.cos(a)} cy={16 + 6 * Math.sin(a)} r={2} fill="#1a365d" fillOpacity={0.4} />;
                })}
                <circle cx={40} cy={10} r={3.5} fill="#2f855a" strokeWidth={1} />
                <text x={40} y={23} textAnchor="middle" fontSize="7" fill="#2f855a" fontFamily="monospace">?</text>
              </svg>
              <span className="text-[7px] text-green font-mono">OOD probe</span>

              <svg width="12" height="6" viewBox="0 0 12 6">
                <polygon points="6,6 2,0 10,0" fill="#6b6375" />
              </svg>

              {/* Queries */}
              <svg width="50" height="32" viewBox="0 0 50 32">
                <circle cx={25} cy={16} r={12} fill="#fefdfb" stroke="#1a365d" strokeWidth={1.5} />
                {Array.from({ length: 4 }).map((_, i) => {
                  const a = (i * 1.7) + 0.3;
                  const dx = 25 + 7 * Math.cos(a);
                  const dy = 16 + 7 * Math.sin(a);
                  const sampled = i < 2;
                  return (
                    <g key={i}>
                      <circle cx={dx} cy={dy} r={2} fill="#1a365d" fillOpacity={0.4} />
                      {sampled && <circle cx={dx} cy={dy} r={5} fill="none" stroke="#2f855a" strokeWidth={1.5} />}
                    </g>
                  );
                })}
              </svg>
              <span className="text-[7px] text-green font-mono">shift queries</span>
            </div>
          );
        };

        return (
          <div className="my-6">
            <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
              {renderCircle(circles[0])}
              {renderArrow()}
              {renderSteps(1)}
              {renderArrow()}
              {renderCircle(circles[1])}
              {renderArrow()}
              {renderSteps(2)}
              {renderArrow()}
              {renderCircle(circles[2])}
            </div>
            <div className="flex items-center justify-center gap-5 mt-2 text-[10px] text-text-muted">
              <span className="flex items-center gap-1.5">
                <svg width="16" height="16" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="8" fill="#fefdfb" stroke="#1a365d" strokeWidth="2" />
                </svg>
                domain (evaluation points)
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="8" height="8" viewBox="0 0 8 8">
                  <circle cx="4" cy="4" r="3.5" fill="#1a365d" fillOpacity="0.5" />
                </svg>
                committed polynomial values
              </span>
            </div>
          </div>
        );
      })()}

      <p className="my-4">
        A single <em>WHIR iteration</em> runs these back-to-back: sumcheck
        collapses the constraint to a single evaluation, then folding cuts the
        table in half. The
        output is the same kind of problem — still "is this a CRS codeword?" — just
        on a smaller table. Repeat a few times and the table becomes small enough
        for the verifier to check directly.
      </p>

      <h3 id="step-by-step-walkthrough" className="font-heading text-xl font-semibold text-text mt-10 mb-4">
        Step-by-Step Walkthrough
      </h3>
      <p className="mb-4">
        Click through each step to see the protocol in action — the same five
        moves repeated across two iterations, shrinking the domain from 8 points
        down to 2.
      </p>
      <IterationWalkthrough />
      <p className="my-4">
        This walkthrough used just 8 evaluation points for clarity. In
        leanMultisig (<InlineMath tex="m = 25" />), the same process
        shrinks <InlineMath tex="2^{25} \approx 33" /> million evaluations down to
        just <InlineMath tex="2^3 = 8" /> evaluations in 4 iterations — producing a proof that
        the verifier can check in under a millisecond.
      </p>
    </Section>
  );
}

// --- Step-by-step iteration walkthrough ---

const WALK_STEPS = [
  { label: 'Start', desc: 'The prover has committed to a polynomial evaluated at 8 domain points.' },
  { label: 'Iteration 1: Sumcheck', desc: 'Sumcheck collapses the constraint across all 8 points into a single evaluation claim.' },
  { label: 'Iteration 1: Fold', desc: 'Using the sumcheck challenges, the 8 evaluations are folded into 4.' },
  { label: 'Iteration 1: OOD probe', desc: 'The prover evaluates the folded polynomial at a surprise point outside the domain.' },
  { label: 'Iteration 1: Shift queries', desc: 'The verifier spot-checks a few positions to verify the fold was done correctly.' },
  { label: 'Iteration 1: Complete', desc: 'The domain has shrunk from 8 to 4 points. Same CRS claim, smaller table.' },
  { label: 'Iteration 2: Sumcheck', desc: 'Sumcheck collapses the constraint across the 4 remaining points.' },
  { label: 'Iteration 2: Fold', desc: 'The 4 evaluations are folded into 2.' },
  { label: 'Iteration 2: OOD probe', desc: 'Another surprise evaluation outside the new domain.' },
  { label: 'Iteration 2: Shift queries', desc: 'Spot-check fold consistency on the smaller domain.' },
  { label: 'Iteration 2: Complete', desc: 'Only 2 points remain — small enough for the verifier to check directly.' },
  { label: 'Finish!', desc: 'The polynomial is small enough to read directly. The verifier replays all sumcheck transcripts, checks OOD answers, verifies shift queries, and confirms the final evaluation — all without ever reading the full table.' },
];

function IterationWalkthrough() {
  const [step, setStep] = useState(0);
  const ga = Math.PI * (3 - Math.sqrt(5));

  const prev = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);
  const next = useCallback(() => setStep((s) => Math.min(WALK_STEPS.length - 1, s + 1)), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prev, next]);

  // Helper to generate dot positions inside a circle
  const dots = (n: number, r: number, cx: number, cy: number) =>
    Array.from({ length: n }).map((_, i) => {
      const dist = Math.sqrt((i + 0.5) / n) * (r - 8);
      const angle = i * ga;
      return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
    });

  const W = 400;
  const H = 280;
  const CX = W / 2;
  const CY = 130;

  // Current domain size based on step
  const domainBefore = step < 5 ? 8 : step < 10 ? 4 : 2;
  const domainAfter = step < 5 ? 4 : step < 10 ? 2 : 2;
  const circleR = step < 5 ? 80 : step < 10 ? 60 : 40;
  const circleRAfter = step < 5 ? 60 : step < 10 ? 40 : 40;

  const renderCanvas = () => {
    // Finish step: show original and final circles side by side
    if (step === 11) {
      const bigR = 60;
      const smallR = 24;
      const circleY = 80;
      const bigCX = CX - 60;
      const smallCX = CX + 60;
      const bigPts = dots(8, bigR, bigCX, circleY);
      const smallPts = dots(2, smallR, smallCX, circleY);
      return (
        <svg width={W} height={180} viewBox={`0 0 ${W} 180`} className="mx-auto block">
          {/* Original 8-point circle (faded) */}
          <circle cx={bigCX} cy={circleY} r={bigR} fill="#fefdfb" stroke="#1a365d" strokeWidth={1.5} strokeOpacity={0.3} />
          {bigPts.map((p, i) => (
            <circle key={`big-${i}`} cx={p.x} cy={p.y} r={3} fill="#1a365d" fillOpacity={0.15} />
          ))}
          <text x={bigCX} y={circleY + bigR + 14} textAnchor="middle" fontSize="9" fill="#6b6375" fontFamily="monospace" fillOpacity={0.5}>
            8 points
          </text>

          {/* Arrow */}
          <line x1={bigCX + bigR + 6} y1={circleY} x2={smallCX - smallR - 10} y2={circleY} stroke="#6b6375" strokeWidth={1.5} />
          <polygon points={`${smallCX - smallR - 10},${circleY - 4} ${smallCX - smallR - 2},${circleY} ${smallCX - smallR - 10},${circleY + 4}`} fill="#6b6375" />

          {/* Final 2-point circle */}
          <circle cx={smallCX} cy={circleY} r={smallR} fill="#fefdfb" stroke="#2f855a" strokeWidth={2} />
          {smallPts.map((p, i) => (
            <circle key={`small-${i}`} cx={p.x} cy={p.y} r={4} fill="#2f855a" fillOpacity={0.5} />
          ))}
          <text x={smallCX} y={circleY + smallR + 14} textAnchor="middle" fontSize="9" fill="#2f855a" fontFamily="monospace">
            2 points (base case)
          </text>
        </svg>
      );
    }

    const phase = step < 5 ? step : step < 10 ? step - 5 : step - 10;

    // Which circle/dots to show as the base layer
    // Phases 0-1: before-fold circle. Phase 2: animates. Phases 3-4: after-fold circle.
    const showBefore = phase <= 1;
    const showFold = phase === 2;
    const baseN = showBefore ? domainBefore : domainAfter;
    const baseR = showBefore ? circleR : circleRAfter;
    const basePts = dots(baseN, baseR, CX, CY);

    // Fold-specific data
    const PAIR_COLORS = ['#8b4513', '#c53030', '#2f855a', '#4f46e5'];
    const ptsBefore = dots(domainBefore, circleR, CX, CY);
    const ptsAfter = dots(domainAfter, circleRAfter, CX, CY);
    const numPairs = domainAfter;
    const pairStagger = 0.4;
    const colorStart = 0.4;
    const foldDelayT = colorStart + numPairs * pairStagger + 0.3;
    const foldDur = 0.8;
    const totalFoldDur = foldDelayT + foldDur;

    // Sumcheck timing
    const lineDelay = 0.3;
    const lineStagger = 0.06;
    const sigmaDelay = lineDelay + domainBefore * lineStagger + 0.2;
    const claimY = CY + circleR + 30;

    // OOD
    const oodX = CX + circleRAfter + 40;
    const oodY = CY - 20;

    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="mx-auto block">
        {/* === Base layer: circle + dots (always present, no animation between phases) === */}
        {showFold ? (
          <>
            <motion.circle
              key={`fold-circle-${step}`}
              cx={CX} cy={CY}
              fill="#fefdfb" stroke="#1a365d" strokeWidth={2}
              initial={{ r: circleR }}
              animate={{ r: circleRAfter }}
              transition={{ duration: foldDur, ease: 'easeInOut', delay: foldDelayT }}
            />
          </>
        ) : (
          <circle cx={CX} cy={CY} r={baseR} fill="#fefdfb" stroke="#1a365d" strokeWidth={2} />
        )}

        {/* Dots: static for all phases except fold (which animates them) */}
        {showFold ? (
          <>
            {Array.from({ length: numPairs }).map((_, pairIdx) => {
              const a = ptsBefore[pairIdx * 2];
              const b = ptsBefore[pairIdx * 2 + 1];
              if (!a || !b) return null;
              const color = PAIR_COLORS[pairIdx % PAIR_COLORS.length];
              const target = ptsAfter[pairIdx];
              const myColorTime = (colorStart + pairIdx * pairStagger) / totalFoldDur;
              const foldStartT = foldDelayT / totalFoldDur;
              return (
                <motion.line
                  key={`fline-${step}-${pairIdx}`}
                  stroke={color} strokeWidth={1.5}
                  initial={{ x1: a.x, y1: a.y, x2: b.x, y2: b.y, strokeOpacity: 0 }}
                  animate={{
                    x1: [a.x, a.x, a.x, target.x],
                    y1: [a.y, a.y, a.y, target.y],
                    x2: [b.x, b.x, b.x, target.x],
                    y2: [b.y, b.y, b.y, target.y],
                    strokeOpacity: [0, 0.35, 0.35, 0],
                  }}
                  transition={{
                    duration: totalFoldDur,
                    times: [Math.max(0, myColorTime - 0.01), myColorTime, foldStartT, 1],
                    ease: 'easeInOut',
                  }}
                />
              );
            })}
            {ptsBefore.map((p, i) => {
              const pairIdx = Math.floor(i / 2);
              const color = PAIR_COLORS[pairIdx % PAIR_COLORS.length];
              const target = ptsAfter[pairIdx];
              const myColorTime = (colorStart + pairIdx * pairStagger) / totalFoldDur;
              const foldStartFrac = foldDelayT / totalFoldDur;
              return (
                <motion.circle
                  key={`fdot-${step}-${i}`}
                  r={5}
                  initial={{ cx: p.x, cy: p.y, fill: '#1a365d', fillOpacity: 0.5 }}
                  animate={{
                    cx: [p.x, p.x, p.x, p.x, target.x],
                    cy: [p.y, p.y, p.y, p.y, target.y],
                    fill: ['#1a365d', '#1a365d', color, color, color],
                    fillOpacity: [0.5, 0.5, 0.8, 0.8, 0.8],
                  }}
                  transition={{
                    duration: totalFoldDur,
                    times: [0, Math.max(0, myColorTime - 0.01), myColorTime, foldStartFrac, 1],
                    ease: 'easeInOut',
                  }}
                />
              );
            })}
            <text
              x={CX} y={CY + circleR + 20}
              textAnchor="middle" fontSize="11" fill="#1a365d" fontFamily="monospace"
            >
              {domainBefore} → {domainAfter} points
            </text>
          </>
        ) : (
          <>
            {basePts.map((p, i) => (
              <circle key={`dot-${i}`} cx={p.x} cy={p.y} r={5} fill="#1a365d" fillOpacity={0.5} />
            ))}
            <text x={CX} y={baseR + CY + 20} textAnchor="middle" fontSize="12" fill="#6b6375" fontFamily="monospace">
              {baseN} points
            </text>
          </>
        )}

        {/* === Iteration summary: replay all verifications visually === */}
        {phase === 0 && step > 0 && (() => {
          // Ghost of the before-fold circle
          const prevR = step < 6 ? 80 : 60;
          const prevN = step < 6 ? 8 : 4;
          const prevPts = dots(prevN, prevR, CX, CY);
          const curPts = basePts;
          const sumcheckClaimY = CY + prevR + 25;

          return (
            <>
              {/* 1. Ghost before-fold circle */}
              <motion.circle
                cx={CX} cy={CY} r={prevR}
                fill="none" stroke="#1a365d" strokeWidth={1} strokeDasharray="4 3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.2 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              />
              {/* Ghost dots */}
              {prevPts.map((p, i) => (
                <motion.circle
                  key={`ghost-${i}`}
                  cx={p.x} cy={p.y} r={3}
                  fill="#1a365d"
                  initial={{ fillOpacity: 0 }}
                  animate={{ fillOpacity: 0.15 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                />
              ))}

              {/* 2. Sumcheck funnel from ghost dots to σ */}
              {prevPts.map((p, i) => (
                <motion.line
                  key={`sfunnel-${i}`}
                  x1={p.x} y1={p.y} x2={CX} y2={sumcheckClaimY}
                  stroke="#8b4513" strokeWidth={0.8}
                  initial={{ strokeOpacity: 0 }}
                  animate={{ strokeOpacity: 0.15 }}
                  transition={{ delay: 0.5 + i * 0.04, duration: 0.3 }}
                />
              ))}
              <motion.circle
                cx={CX} cy={sumcheckClaimY} r={5}
                fill="#8b4513"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                transition={{ delay: 0.9, duration: 0.3 }}
              />
              <motion.text
                x={CX + 10} y={sumcheckClaimY + 3}
                fontSize="8" fill="#8b4513" fontFamily="monospace"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 1 }}
              >σ ✓ sumcheck</motion.text>

              {/* 3. Fold: arrow from ghost circle to current circle */}
              <motion.text
                x={CX + baseR + 8} y={CY - baseR + 5}
                fontSize="8" fill="#1a365d" fontFamily="monospace"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 1.3 }}
              >{prevN}→{baseN} ✓ fold</motion.text>

              {/* 4. OOD probe: green dot outside */}
              <motion.circle
                cx={CX + baseR + 25} cy={CY}
                r={5} fill="#2f855a"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                transition={{ delay: 1.6, duration: 0.3 }}
              />
              <motion.line
                x1={CX + baseR + 20} y1={CY}
                x2={CX + baseR + 3} y2={CY}
                stroke="#2f855a" strokeWidth={1} strokeDasharray="3 2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ delay: 1.7, duration: 0.3 }}
              />
              <motion.text
                x={CX + baseR + 33} y={CY + 3}
                fontSize="8" fill="#2f855a" fontFamily="monospace"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 1.8 }}
              >✓ OOD</motion.text>

              {/* 5. Queries: rings on 2 dots */}
              {curPts.slice(0, 2).map((p, i) => (
                <motion.circle
                  key={`qr-${i}`}
                  cx={p.x} cy={p.y} r={10}
                  fill="none" stroke="#2f855a" strokeWidth={1.5}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  transition={{ delay: 2.1 + i * 0.15, duration: 0.3 }}
                />
              ))}
              <motion.text
                x={CX + baseR + 8} y={CY + baseR / 2}
                fontSize="8" fill="#2f855a" fontFamily="monospace"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 2.3 }}
              >✓ shift queries</motion.text>
            </>
          );
        })()}

        {/* === Overlays per phase === */}

        {/* Sumcheck funnel */}
        {phase === 1 && basePts.map((p, i) => (
          <motion.line
            key={`sline-${step}-${i}`}
            x1={p.x} y1={p.y} x2={CX} y2={claimY}
            stroke="#8b4513" strokeWidth={1}
            initial={{ strokeOpacity: 0, pathLength: 0 }}
            animate={{ strokeOpacity: 0.25, pathLength: 1 }}
            transition={{ delay: lineDelay + i * lineStagger, duration: 0.4 }}
          />
        ))}
        {phase === 1 && (
          <>
            <motion.circle
              cx={CX} cy={claimY} r={8} fill="#8b4513"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: sigmaDelay, duration: 0.3, type: 'spring', stiffness: 300 }}
            />
            <motion.text
              x={CX} y={claimY + 4}
              textAnchor="middle" fontSize="9" fill="white" fontFamily="monospace" fontWeight="bold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: sigmaDelay + 0.1 }}
            >σ</motion.text>
            <motion.text
              x={CX} y={claimY + 18}
              textAnchor="middle" fontSize="10" fill="#8b4513" fontFamily="monospace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: sigmaDelay + 0.2 }}
            >single claim</motion.text>
          </>
        )}

        {/* OOD probe */}
        {phase === 3 && (
          <>
            <motion.circle
              cx={oodX} cy={oodY} r={8} fill="#2f855a"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3, type: 'spring', stiffness: 300 }}
            />
            <motion.text
              x={oodX} y={oodY + 3}
              textAnchor="middle" fontSize="10" fill="white" fontFamily="monospace" fontWeight="bold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >?</motion.text>
            <motion.line
              x1={oodX - 8} y1={oodY + 4}
              x2={CX + circleRAfter + 4} y2={CY - 4}
              stroke="#2f855a" strokeWidth={1.5} strokeDasharray="4 3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            />
            <motion.text
              x={oodX + 16} y={oodY - 4}
              textAnchor="start" fontSize="9" fill="#2f855a" fontFamily="monospace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >surprise point</motion.text>
            <motion.text
              x={oodX + 16} y={oodY + 6}
              textAnchor="start" fontSize="9" fill="#2f855a" fontFamily="monospace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >outside domain</motion.text>
          </>
        )}

        {/* Queries */}
        {phase === 4 && basePts.map((p, i) => {
          const sampled = i < 2;
          return sampled ? (
            <motion.circle
              key={`qring-${i}`}
              cx={p.x} cy={p.y} r={12}
              fill="none" stroke="#2f855a" strokeWidth={2}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.2, type: 'spring', stiffness: 200 }}
            />
          ) : null;
        })}
        {phase === 4 && (
          <>
            <motion.text
              x={CX + circleRAfter + 20} y={CY - 4}
              textAnchor="start" fontSize="10" fill="#2f855a" fontFamily="monospace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >shift</motion.text>
            <motion.text
              x={CX + circleRAfter + 20} y={CY + 8}
              textAnchor="start" fontSize="10" fill="#2f855a" fontFamily="monospace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >queries</motion.text>
          </>
        )}
      </svg>
    );

    return null;
  };

  return (
    <div className="bg-bg-card border border-border rounded-lg p-5 my-6 space-y-4">
      {/* Progress bar: 3 segments for Start, Iter 1, Iter 2 */}
      <div className="flex gap-1">
        {[
          { label: 'Start', range: [0, 0] },
          { label: 'Iteration 1', range: [1, 5] },
          { label: 'Iteration 2', range: [6, 10] },
          { label: 'Finish!', range: [11, 11] },
        ].map((seg, si) => {
          const [lo, hi] = seg.range;
          const totalInSeg = hi - lo + 1;
          const doneInSeg = Math.max(0, Math.min(step - lo + 1, totalInSeg));
          const pct = (doneInSeg / totalInSeg) * 100;
          const isActive = step >= lo && step <= hi;
          const isDone = step > hi;
          return (
            <div key={si} className={si === 0 || si === 3 ? 'w-14 shrink-0' : 'flex-1'}>
              <div className="text-[9px] font-mono text-text-muted mb-0.5 text-center">
                <span className={isActive ? 'text-text font-semibold' : isDone ? 'text-green' : ''}>
                  {seg.label}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-border overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${isDone ? 'bg-green' : 'bg-navy'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-text">{WALK_STEPS[step].label}</div>
        <span className="text-xs text-text-muted font-mono">{step + 1} / {WALK_STEPS.length}</span>
      </div>

      <div className="min-h-[280px] flex items-center justify-center">
        {renderCanvas()}
      </div>

      <p className="text-sm text-text-muted text-center">{WALK_STEPS[step].desc}</p>

      <div className="flex items-center justify-center gap-3">
        <Button variant="ghost" onClick={() => setStep(0)} disabled={step === 0}>
          Reset
        </Button>
        <Button variant="ghost" onClick={prev} disabled={step === 0}>
          Prev
        </Button>
        <Button variant="primary" onClick={next} disabled={step === WALK_STEPS.length - 1}>
          Next
        </Button>
      </div>
    </div>
  );
}
