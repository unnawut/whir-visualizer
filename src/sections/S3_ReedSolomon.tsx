import { useState } from 'react';
import { motion } from 'framer-motion';
import { Section } from '../components/Section';
import { Math as InlineMath, MathBlock } from '../components/MathBlock';
import { Slider } from '../components/ui/Slider';
import { generateSubgroup } from '../utils/field';
import { evaluate } from '../utils/polynomial';

/**
 * Circle-with-dots visualization using REAL F_17 polynomial math.
 * RS[16, 8]: degree < 8 polynomial evaluated at 16 domain points. Min distance = 9.
 */
const N_DOTS = 16;
const DOMAIN_16 = generateSubgroup(16);

// Base polynomial: f(x) = 3 + 5x + 2x^2 + 7x^3 + 1x^4 + 4x^5 + 6x^6 + 3x^7
const BASE_POLY = [3, 5, 2, 7, 1, 4, 6, 3];
const BASE_EVALS = DOMAIN_16.map(x => evaluate(BASE_POLY, x));

// Pre-computed dot positions (scattered inside the circle, deterministic)
const DOT_POSITIONS: { x: number; y: number }[] = (() => {
  const ga = Math.PI * (3 - Math.sqrt(5)); // golden angle
  return DOMAIN_16.map((_, i) => {
    const r = Math.sqrt((i + 0.5) / N_DOTS) * 0.40;
    const t = i * ga;
    return { x: 0.5 + r * Math.cos(t), y: 0.5 + r * Math.sin(t) };
  });
})();

// Pre-computed tampered polynomials with REAL corruption counts.
// Each is constructed so the difference from BASE_POLY has a specific number of roots
// on the domain, giving corruption counts from 16 down to 9 (the RS minimum distance).
// The difference polynomials are: constant, (x-1), (x-1)(x-2), ..., (x-1)(x-2)...(x-7).
const TAMPERED_POLYS: number[][] = [
  BASE_POLY,                           // level 0: no tampering
  [12, 0, 11, 10, 13, 3, 12, 4],      // diff has 7 roots → 9 corrupted (minimum!)
  [9, 9, 11, 3, 6, 0, 7, 3],          // diff has 6 roots → 10 corrupted
  [2, 7, 15, 7, 3, 5, 6, 3],          // diff has 5 roots → 11 corrupted
  [10, 6, 3, 14, 2, 4, 6, 3],         // diff has 4 roots → 12 corrupted
  [14, 16, 13, 8, 1, 4, 6, 3],        // diff has 3 roots → 13 corrupted
  [5, 2, 3, 7, 1, 4, 6, 3],           // diff has 2 roots → 14 corrupted
  [2, 6, 2, 7, 1, 4, 6, 3],           // diff has 1 root → 15 corrupted
  [4, 5, 2, 7, 1, 4, 6, 3],           // diff has 0 roots → 16 corrupted
];

const TAMPERED_EVALS: { evals: number[], corrupted: boolean[], numCorrupted: number }[] =
  TAMPERED_POLYS.map(poly => {
    const evals = DOMAIN_16.map(x => evaluate(poly, x));
    const corrupted = evals.map((v, i) => v !== BASE_EVALS[i]);
    return { evals, corrupted, numCorrupted: corrupted.filter(Boolean).length };
  });

// Pre-computed sample orders per seed (Fisher-Yates with Park-Miller LCG)
const SAMPLE_ORDERS: number[][] = (() => {
  const sets: number[][] = [];
  for (let seed = 0; seed < 50; seed++) {
    const order: number[] = [];
    for (let i = 0; i < N_DOTS; i++) order.push(i);
    let s = seed * 97 + 31;
    for (let i = N_DOTS - 1; i > 0; i--) {
      s = (s * 48271) % 2147483647;
      const j = s % (i + 1);
      [order[i], order[j]] = [order[j], order[i]];
    }
    sets.push(order);
  }
  return sets;
})();

function CheatingDemo() {
  const [cheatingCoeffs, setCheatingCoeffs] = useState(1);
  const [sampleCount, setSampleCount] = useState(3);
  const [sampleSeed, setSampleSeed] = useState(0);

  const { corrupted, numCorrupted } = TAMPERED_EVALS[cheatingCoeffs];
  const sampledArr = SAMPLE_ORDERS[sampleSeed % SAMPLE_ORDERS.length].slice(0, sampleCount);
  const sampledSet = new Set(sampledArr);
  const caughtCheating = cheatingCoeffs > 0 && sampledArr.some(i => corrupted[i]);

  const svgSize = 300;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const circleR = svgSize / 2 - 16;

  return (
    <div className="bg-bg-card border border-border rounded-lg p-5 my-6 space-y-5">
      <div className="font-heading font-semibold text-base text-text">
        Why Cheating is Hard with RS Encoding
      </div>
      <p className="text-sm text-text-muted">
        This uses a real RS[16, 8] code in <InlineMath tex="\mathbb{F}_{17}" />: a
        degree {'<'} 8 polynomial evaluated at all 16 points of the multiplicative subgroup.
        Slide right to increase tampering — even at the minimum (level 1), at least{' '}
        <strong>9 of 16</strong> points are tampered. Higher levels tamper even more.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Slider
          label="Tampering level"
          value={cheatingCoeffs}
          min={0}
          max={8}
          onChange={setCheatingCoeffs}
          displayValue={cheatingCoeffs === 0 ? 'honest' : `${TAMPERED_EVALS[cheatingCoeffs].numCorrupted} of 16 tampered`}
        />
        <Slider
          label="Verifier's random samples"
          value={sampleCount}
          min={1}
          max={8}
          onChange={setSampleCount}
          displayValue={`${sampleCount} of ${N_DOTS}`}
        />
      </div>

      {/* SVG circle with dots */}
      <div className="flex justify-center">
        <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
          <circle cx={cx} cy={cy} r={circleR} fill="#fefdfb" stroke="#e0dcd4" strokeWidth={2} />
          {DOT_POSITIONS.map((pos, i) => {
            const x = 16 + pos.x * (svgSize - 32);
            const y = 16 + pos.y * (svgSize - 32);
            const isCorrupt = corrupted[i];
            const isSampled = sampledSet.has(i);
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r={isSampled ? 8 : 6}
                  fill={isCorrupt ? '#c53030' : '#2f855a'}
                  fillOpacity={isCorrupt ? 0.8 : 0.45}
                />
                {isSampled && (
                  <circle
                    cx={x}
                    cy={y}
                    r={12}
                    fill="none"
                    stroke="#1a365d"
                    strokeWidth={2}
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 text-xs text-text-muted">
        <span className="flex items-center gap-1.5">
          <svg width="12" height="12"><circle cx="6" cy="6" r="5" fill="#2f855a" fillOpacity="0.45" /></svg>
          Matches original
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="12" height="12"><circle cx="6" cy="6" r="5" fill="#c53030" fillOpacity="0.8" /></svg>
          Tampered
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="20" height="20"><circle cx="10" cy="10" r="8" fill="none" stroke="#1a365d" strokeWidth="2" /></svg>
          Sampled by verifier
        </span>
      </div>

      {/* Result */}
      <div className="flex items-center justify-center gap-4">
        <div
          className={`px-5 py-2 rounded-full font-semibold text-sm ${
            cheatingCoeffs === 0
              ? 'bg-green/10 text-green border border-green/20'
              : caughtCheating
                ? 'bg-green/10 text-green border border-green/20'
                : 'bg-red/10 text-red border border-red/20'
          }`}
        >
          {cheatingCoeffs === 0
            ? 'Honest prover — nothing to catch'
            : caughtCheating
              ? `Cheater caught with just ${sampleCount} samples!`
              : 'Slipped through — try re-rolling'}
        </div>

        <button
          onClick={() => setSampleSeed(s => s + 1)}
          className="cursor-pointer text-xs text-navy hover:text-sienna transition-colors px-3 py-1.5 rounded border border-border hover:border-sienna/30"
        >
          Re-roll samples
        </button>
      </div>

      {cheatingCoeffs === 0 ? (
        <p className="text-xs text-text-muted text-center">
          No tampering — all 16 evaluations match the original polynomial. Drag the slider
          to see what happens when the prover changes even a single coefficient.
        </p>
      ) : (
        <>
          <p className="text-xs text-text-muted text-center">
            {numCorrupted} of {N_DOTS} evaluations tampered ({Math.round(numCorrupted / N_DOTS * 100)}%)
            differ from the original — {sampleCount} random sample{sampleCount > 1 ? 's' : ''}{' '}
            {caughtCheating ? 'easily caught the cheater.' : 'got lucky — try re-rolling!'}{' '}
            In LeanMultisig with 2<sup>26</sup> points and ~100 samples, evasion is virtually impossible.
          </p>
          <div className="bg-sienna/5 border border-sienna/20 rounded-lg px-4 py-3 text-xs text-text-muted">
            <strong className="text-sienna">Why is 9 the minimum?</strong>
            <p className="mt-1">
              This is RS[16, 8] in <InlineMath tex="\mathbb{F}_{17}" />: a degree {'<'} 8
              polynomial evaluated at 16 domain points. The difference between any two distinct
              degree {'<'} 8 polynomials is itself a polynomial of degree {'<'} 8, which has
              at most 7 roots. So they can agree on at most 7 of 16 points and must disagree
              on at least <InlineMath tex="16 - 7 = 9" />. Level 1 shows this worst case
              for the verifier (the "best" a cheater can do). Higher levels show more
              corruption — but even the minimum of 9/16 is already over 50%.
              All values here are computed from real <InlineMath tex="\mathbb{F}_{17}" /> arithmetic.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function CostComparison({ traceRows }: { traceRows: number }) {
  const [securityBits, setSecurityBits] = useState(100);

  // Without RS: verifier must check ALL points (re-execute the whole trace)
  const naiveChecks = Math.pow(2, traceRows);

  // With RS + WHIR: verifier queries O(λ + (λ/k) · log(m/k)) points
  // Using k ≈ log(m), queries ≈ O(λ) which is roughly λ
  const whirQueries = Math.ceil(securityBits + (securityBits / Math.log2(traceRows)) * Math.log2(traceRows / Math.log2(traceRows)));

  // Ratio
  const ratio = naiveChecks / whirQueries;

  const formatNum = (n: number) => n.toLocaleString();

  // Bar widths (log scale for visibility)
  const naiveLog = Math.log2(naiveChecks);
  const whirLog = Math.log2(whirQueries);
  const maxLog = naiveLog;

  return (
    <div className="bg-bg-card border border-border rounded-lg p-5 my-4 space-y-5">
      <Slider
        label="Security parameter λ"
        value={securityBits}
        min={80}
        max={128}
        step={4}
        onChange={setSecurityBits}
        displayValue={`${securityBits} bits`}
      />

      <div className="space-y-4">
        {/* Naive approach */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="font-medium text-red">Without RS: check every point</span>
            <span className="font-mono text-xs text-text-muted">
              2<sup>{traceRows}</sup> = {formatNum(naiveChecks)} checks
            </span>
          </div>
          <div className="h-7 bg-border-light rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-red/70 rounded-full flex items-center justify-end pr-2"
              initial={false}
              animate={{ width: `${(naiveLog / maxLog) * 100}%` }}
              transition={{ duration: 0.4 }}
            >
              <span className="text-[10px] text-white font-mono whitespace-nowrap">
                {formatNum(naiveChecks)}
              </span>
            </motion.div>
          </div>
        </div>

        {/* WHIR approach */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="font-medium text-green">With RS + WHIR: proximity test</span>
            <span className="font-mono text-xs text-text-muted">
              ~{whirQueries} queries
            </span>
          </div>
          <div className="h-7 bg-border-light rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-green/70 rounded-full flex items-center justify-end pr-2"
              initial={false}
              animate={{ width: `${Math.max((whirLog / maxLog) * 100, 4)}%` }}
              transition={{ duration: 0.4 }}
            >
              <span className="text-[10px] text-white font-mono whitespace-nowrap">
                {whirQueries}
              </span>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Ratio callout */}
      <div className="text-center">
        <motion.div
          key={ratio.toFixed(0)}
          initial={{ scale: 0.95, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sienna/10 border border-sienna/20"
        >
          <span className="text-sm font-semibold text-sienna">
            {formatNum(Math.round(ratio))}× fewer checks
          </span>
        </motion.div>
      </div>

      <div className="text-xs text-text-muted space-y-2">
        <p>
          <strong className="text-red">Without RS:</strong> the verifier has no redundancy to exploit.
          To confirm the prover's trace is correct, it must re-compute or check every single
          evaluation — all 2<sup>{traceRows}</sup> of them. This is essentially re-executing
          the entire LeanMultisig computation.
        </p>
        <p>
          <strong className="text-green">With RS + WHIR:</strong> the RS encoding adds
          redundancy (rate <InlineMath tex="\rho = 1/2" /> means double the domain).
          WHIR exploits this redundancy to test proximity with only{' '}
          <InlineMath tex={`O(\\lambda + \\frac{\\lambda}{k} \\cdot \\log \\frac{m}{k})`} /> queries — roughly{' '}
          {whirQueries} random checks at {securityBits}-bit security.
          The verifier reads a tiny fraction of the data and is still overwhelmingly confident.
        </p>
        <p>
          In LeanMultisig, this means the on-chain verifier can confirm that a batch of leanSig
          signature verifications was performed correctly by reading ~{whirQueries} field
          elements instead of re-running all 2<sup>{traceRows}</sup> execution steps.
        </p>
      </div>
    </div>
  );
}

export function S3_ReedSolomon() {
  return (
    <Section
      id="reed-solomon"
      number={3}
      title="Reed-Solomon Codes"
      subtitle="Low-degree polynomials give us redundancy, and redundancy lets us detect errors."
    >
      <h3 id="what-are-rs-codes" className="font-heading text-xl font-semibold text-text mb-3">
        What Are Reed-Solomon Codes?
      </h3>
      <p>
        <strong>Reed-Solomon codes</strong> are one of the most widely used error-correcting codes
        in the real world. Invented in 1960, they protect data by adding structured redundancy —
        extra information that lets you detect and even correct errors.
      </p>
      <p className="mt-3">
        You encounter Reed-Solomon codes every day without knowing it:
      </p>
      <ul className="list-disc list-inside text-text-muted mt-2 space-y-1 text-sm">
        <li><strong>QR codes</strong> — still scannable even when partially covered or damaged</li>
        <li><strong>CDs and DVDs</strong> — play correctly despite scratches on the disc surface</li>
        <li><strong>Satellite and deep-space communication</strong> — NASA uses RS codes to recover data transmitted across billions of miles</li>
        <li><strong>Digital television (DVB)</strong> — maintains picture quality despite noisy broadcast signals</li>
      </ul>
      <p className="mt-3">
        The core idea is simple: instead of sending just the data, you send <em>more</em> data
        than strictly necessary. This redundancy means that even if some values are corrupted
        in transit, the receiver can detect — and often fix — the errors.
      </p>

      <h3 id="polynomials-and-redundancy" className="font-heading text-xl font-semibold text-text mt-10 mb-3">
        How Reed-Solomon Codes Work
      </h3>
      <p>
        A Reed-Solomon code works by treating data as the coefficients of a polynomial, then
        evaluating that polynomial at many more points than its degree requires. If the polynomial
        has degree <InlineMath tex="d" />, we only need <InlineMath tex="d+1" /> points to
        determine it uniquely. By evaluating at <InlineMath tex="n \gg d" /> points, we
        create <em>redundancy</em>.
      </p>

      <MathBlock tex="\text{RS}[n, d] = \{ (f(\omega^0), f(\omega^1), \ldots, f(\omega^{n-1})) \mid \deg(f) < d \}" />

      <p>
        Because any polynomial of degree <InlineMath tex="{'<'} d" /> is fully determined
        by <InlineMath tex="d" /> points, two different valid codewords must differ in
        at least <InlineMath tex="n - d + 1" /> positions. This gap is what makes error
        detection possible — if only a few values are wrong, the corrupted vector cannot
        be close to <em>any</em> valid codeword.
      </p>

      <h3 id="error-correction-to-proofs" className="font-heading text-xl font-semibold text-text mt-10 mb-3">
        From Error Correction to Proof Systems
      </h3>
      <p>
        In traditional applications (QR codes, DVDs), Reed-Solomon codes <em>correct</em> errors —
        the receiver recovers the original data. LeanMultisig and WHIR only need the weaker property
        of <em>detection</em>: the verifier doesn't fix anything, it just checks whether the
        prover's data is close to a valid polynomial and rejects if it isn't. Detection is cheaper
        than correction, which is part of why WHIR can get away with reading so few points.
      </p>
      <p className="mt-3">
        In <strong>LeanMultisig</strong>, the prover evaluates each column polynomial over a domain much
        larger than the execution trace. With a rate of{' '}
        <InlineMath tex="\rho = 1/2" />, a trace of <InlineMath tex="2^{25}" /> rows means
        evaluating over <InlineMath tex="2^{26}" /> domain points. If the prover tries to cheat
        by sending values that don't correspond to a valid low-degree polynomial, the RS encoding
        guarantees that the corruption is spread across many positions — making it easy for WHIR
        to catch by checking just a tiny random sample.
      </p>

      <CheatingDemo />

      {/* Interactive C: Cost comparison */}
      <h3 id="why-redundancy-matters" className="font-heading text-xl font-semibold text-text mt-10 mb-4">
        Why Redundancy Matters
      </h3>
      <p className="mb-4">
        What if we skipped the Reed-Solomon encoding and just sent the raw polynomial
        coefficients? The verifier would have to re-evaluate the polynomial at every point
        to check correctness — no shortcuts. RS encoding creates redundancy that lets the
        verifier check far fewer points while still catching cheaters.
      </p>

      <CostComparison traceRows={25} />

      <p className="mt-6 text-sm text-text-muted">
        Reed-Solomon codes are the foundation of proximity testing: instead of checking
        that a function is <em>exactly</em> a low-degree polynomial, protocols like WHIR check
        that it is <em>close</em> to one. This relaxation is what makes sublinear verification
        possible — and it is exactly what allows LeanMultisig's verifier to confirm the correctness
        of signature aggregation without re-executing the entire computation.
      </p>
    </Section>
  );
}
