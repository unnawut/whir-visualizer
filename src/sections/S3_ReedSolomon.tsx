import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Section } from '../components/Section';
import { Math as InlineMath, MathBlock } from '../components/MathBlock';
import { Slider } from '../components/ui/Slider';
import { Tooltip } from '../components/ui/Tooltip';
import { mod } from '../utils/field';
import { evaluateAll } from '../utils/polynomial';
import type { Poly } from '../utils/polynomial';
import { generateDomain } from '../utils/reedsolomon';

/**
 * Interactive illustration: a big circle with dots inside.
 * Green dots = honest, red dots = corrupted by cheating.
 * Verifier picks a few random dots (navy rings). If any land on red → caught.
 */
// Pre-computed dot positions (sunflower spiral, 16 dots)
const DOT_POSITIONS: { x: number; y: number }[] = (() => {
  const positions: { x: number; y: number }[] = [];
  const ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < 16; i++) {
    const r = Math.sqrt((i + 0.5) / 16) * 0.82;
    const t = i * ga;
    positions.push({ x: 0.5 + r * Math.cos(t) * 0.48, y: 0.5 + r * Math.sin(t) * 0.48 });
  }
  return positions;
})();

// Pre-computed corrupted indices per cheating level (avoids any loops at render time)
// RS[16, 8]: min distance = 9, so changing 1 coeff corrupts >= 9 positions
const CORRUPTION_MAP: boolean[][] = (() => {
  // For each level 1..8, a fixed shuffled set of corrupted indices
  const shuffled = [5, 12, 2, 9, 0, 14, 7, 11, 3, 15, 6, 10, 1, 13, 4, 8];
  const map: boolean[][] = [];
  for (let level = 0; level <= 8; level++) {
    const count = level === 0 ? 0 : Math.min(16, 8 + level); // 0, 9, 10, 11, ..., 16
    const arr = new Array(16).fill(false);
    for (let i = 0; i < count; i++) arr[shuffled[i]] = true;
    map.push(arr);
  }
  return map;
})();

// Pre-computed sample sets per seed (10 seeds × 10 max samples)
const SAMPLE_SETS: number[][] = (() => {
  const sets: number[][] = [];
  for (let seed = 0; seed < 50; seed++) {
    const order = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
    // Fisher-Yates with deterministic seed
    let s = seed * 97 + 31;
    for (let i = 15; i > 0; i--) {
      s = (s * 48271) % 2147483647; // Park-Miller LCG, no infinite loop risk
      const j = s % (i + 1);
      [order[i], order[j]] = [order[j], order[i]];
    }
    sets.push(order);
  }
  return sets;
})();

function CheatingDemo() {
  const [cheatingCoeffs, setCheatingCoeffs] = useState(0);
  const [sampleCount, setSampleCount] = useState(3);
  const [sampleSeed, setSampleSeed] = useState(0);

  const n = 16;
  const corrupted = CORRUPTION_MAP[cheatingCoeffs];
  const numCorrupted = corrupted.filter(Boolean).length;
  const samples = SAMPLE_SETS[sampleSeed % SAMPLE_SETS.length].slice(0, sampleCount);
  const caughtCheating = samples.some(i => corrupted[i]);

  const svgSize = 260;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const circleR = svgSize / 2 - 14;

  return (
    <div className="bg-bg-card border border-border rounded-lg p-5 my-6 space-y-5">
      <div className="font-heading font-semibold text-base text-text">
        Why Cheating is Hard with RS Encoding
      </div>
      <p className="text-sm text-text-muted">
        The circle below represents all {n} evaluation points. When the prover cheats by
        modifying even one polynomial coefficient, RS guarantees that{' '}
        <strong>most</strong> points become corrupted (red). The verifier samples a few
        random points (navy rings) — if any land on red, the cheater is caught.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Slider
          label="Coefficients tampered"
          value={cheatingCoeffs}
          min={0}
          max={8}
          onChange={setCheatingCoeffs}
          displayValue={`${cheatingCoeffs}`}
        />
        <Slider
          label="Verifier's random samples"
          value={sampleCount}
          min={1}
          max={8}
          onChange={setSampleCount}
          displayValue={`${sampleCount}`}
        />
      </div>

      {/* SVG: big circle with dots inside */}
      <div className="flex justify-center">
        <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
          <circle cx={cx} cy={cy} r={circleR} fill="#fefdfb" stroke="#e0dcd4" strokeWidth={2} />

          {DOT_POSITIONS.map((pos, i) => {
            const x = 14 + pos.x * (svgSize - 28);
            const y = 14 + pos.y * (svgSize - 28);
            const isCorrupt = corrupted[i];
            const isSampled = samples.includes(i);
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r={isSampled ? 8 : 6}
                  fill={isCorrupt ? '#c53030' : '#2f855a'}
                  fillOpacity={isCorrupt ? 0.75 : 0.5}
                />
                {isSampled && (
                  <circle
                    cx={x}
                    cy={y}
                    r={12}
                    fill="none"
                    stroke="#1a365d"
                    strokeWidth={2.5}
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
          <svg width="12" height="12"><circle cx="6" cy="6" r="5" fill="#2f855a" fillOpacity="0.5" /></svg>
          Honest
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="12" height="12"><circle cx="6" cy="6" r="5" fill="#c53030" fillOpacity="0.75" /></svg>
          Corrupted
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="20" height="20"><circle cx="10" cy="10" r="8" fill="none" stroke="#1a365d" strokeWidth="2" /></svg>
          Sampled
        </span>
      </div>

      {/* Result */}
      <div className="flex items-center justify-center gap-4">
        <div className="text-center">
          <div className="text-xs text-text-muted">Corrupted</div>
          <div className="font-mono font-semibold text-red">
            {numCorrupted}/{n}{' '}
            <span className="text-text-muted font-normal">({Math.round(numCorrupted / n * 100)}%)</span>
          </div>
        </div>

        <div
          className={`px-5 py-2 rounded-full font-semibold text-sm ${
            numCorrupted === 0
              ? 'bg-green/10 text-green border border-green/20'
              : caughtCheating
                ? 'bg-green/10 text-green border border-green/20'
                : 'bg-red/10 text-red border border-red/20'
          }`}
        >
          {numCorrupted === 0 ? 'Honest prover' : caughtCheating ? 'Cheater caught!' : 'Slipped through'}
        </div>

        <button
          onClick={() => setSampleSeed(s => s + 1)}
          className="cursor-pointer text-xs text-navy hover:text-sienna transition-colors px-3 py-1.5 rounded border border-border hover:border-sienna/30"
        >
          Re-roll
        </button>
      </div>

      {cheatingCoeffs === 0 ? (
        <p className="text-xs text-text-muted text-center">
          No tampering — all points are honest. Drag the slider to see what happens
          when the prover changes even a single coefficient.
        </p>
      ) : (
        <>
          <p className="text-xs text-text-muted text-center">
            {sampleCount} random sample{sampleCount > 1 ? 's' : ''} across {n} points
            where {numCorrupted} ({Math.round(numCorrupted / n * 100)}%) are corrupted
            — {caughtCheating ? 'cheater caught!' : 'got lucky — try re-rolling!'}{' '}
            In leanVM, WHIR checks ~100+ positions across 2<sup>26</sup> points, making
            evasion virtually impossible.
          </p>
          <div className="bg-sienna/5 border border-sienna/20 rounded-lg px-4 py-3 text-xs text-text-muted">
            <strong className="text-sienna">Why {cheatingCoeffs === 1 ? 'does' : 'do'} {cheatingCoeffs} tampered coefficient{cheatingCoeffs > 1 ? 's' : ''} corrupt {numCorrupted} points?</strong>
            <p className="mt-1">
              Our RS code evaluates a degree-7 polynomial at {n} points (rate{' '}
              <InlineMath tex="\rho = 1/2" />). Any two <em>different</em> polynomials of
              degree {'<'} 8 can agree on at most 7 points (a degree-7 polynomial has at most 7
              roots). So they must <em>disagree</em> on at least{' '}
              <InlineMath tex="n - d + 1 = 16 - 8 + 1 = 9" /> positions.
            </p>
            <p className="mt-1">
              This is the <strong>minimum distance</strong> of the RS code. It means there is
              no way to tamper with a polynomial — even by changing just one coefficient — without
              corrupting at least 9 of the 16 evaluation points. More coefficients changed means
              even more corruption. This is the fundamental reason RS-based proof systems work:
              cheating is <em>amplified</em> into widespread, easily detectable corruption.
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

  const formatNum = (n: number) => {
    if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return n.toString();
  };

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
          the entire leanVM computation.
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
          In leanVM, this means the on-chain verifier can confirm that a batch of leanSig
          signature verifications was performed correctly by reading ~{whirQueries} field
          elements instead of re-running all 2<sup>{traceRows}</sup> execution steps.
        </p>
      </div>
    </div>
  );
}

export function S3_ReedSolomon() {
  // Polynomial coefficients
  const [a0, setA0] = useState(3);
  const [a1, setA1] = useState(5);
  const [a2, setA2] = useState(2);

  // Corruption count
  const [numCorruptions, setNumCorruptions] = useState(0);

  const domain = useMemo(() => generateDomain(8), []);
  const poly: Poly = useMemo(() => [mod(a0), mod(a1), mod(a2)], [a0, a1, a2]);
  const evals = useMemo(() => evaluateAll(poly, domain), [poly, domain]);

  // Corrupted evaluations: deterministic corruption at positions 0, 1, 2, ...
  const corrupted = useMemo(() => {
    return evals.map((v, i) => {
      if (i < numCorruptions) {
        return mod(v + 1); // shift by 1
      }
      return v;
    });
  }, [evals, numCorruptions]);

  const hammingDist = useMemo(() => {
    let d = 0;
    for (let i = 0; i < evals.length; i++) {
      if (evals[i] !== corrupted[i]) d++;
    }
    return d;
  }, [evals, corrupted]);

  // SVG plot dimensions
  const plotW = 600;
  const plotH = 200;
  const padL = 50;
  const padR = 20;
  const padT = 20;
  const padB = 30;
  const chartW = plotW - padL - padR;
  const chartH = plotH - padT - padB;

  // Map domain/eval to SVG coords
  const xScale = (i: number) => padL + (i / (domain.length - 1)) * chartW;
  const yScale = (v: number) => padT + chartH - (v / 16) * chartH;

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
        the receiver recovers the original data. leanVM and WHIR only need the weaker property
        of <em>detection</em>: the verifier doesn't fix anything, it just checks whether the
        prover's data is close to a valid polynomial and rejects if it isn't. Detection is cheaper
        than correction, which is part of why WHIR can get away with reading so few points.
      </p>
      <p className="mt-3">
        In <strong>leanVM</strong>, the prover evaluates each column polynomial over a domain much
        larger than the execution trace. With a rate of{' '}
        <InlineMath tex="\rho = 1/2" />, a trace of <InlineMath tex="2^{25}" /> rows means
        evaluating over <InlineMath tex="2^{26}" /> domain points. If the prover tries to cheat
        by sending values that don't correspond to a valid low-degree polynomial, the RS encoding
        guarantees that the corruption is spread across many positions — making it easy for WHIR
        to catch by checking just a tiny random sample.
      </p>

      <CheatingDemo />

      <div className="bg-bg-card border border-border rounded-lg p-5 my-6">
        <p className="text-sm text-text-muted">
          All arithmetic below is in <InlineMath tex="\mathbb{F}_{17}" /> (the integers
          modulo 17). Our evaluation domain is a multiplicative subgroup of size 8.
          In leanVM, polynomials have coefficients in the KoalaBear field{' '}
          <InlineMath tex="(p = 2^{31} - 2^{24} + 1)" /> and are evaluated over domains
          of size <InlineMath tex="2^{26}" /> or larger. We use{' '}
          <InlineMath tex="\mathbb{F}_{17}" /> here so you can see the numbers.
        </p>
      </div>

      {/* Interactive A: Polynomial Explorer */}
      <h3 id="polynomial-explorer" className="font-heading text-xl font-semibold text-text mt-10 mb-4">
        Polynomial Explorer
      </h3>
      <p className="mb-4">
        Adjust the coefficients below to define a degree-2 polynomial{' '}
        <InlineMath tex="f(x) = a_0 + a_1 x + a_2 x^2" /> and see its evaluations over
        the domain.
      </p>

      <div className="bg-bg-card border border-border rounded-lg p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Slider
            label="a&#x2080;"
            value={a0}
            min={0}
            max={16}
            onChange={setA0}
            displayValue={`${a0}`}
          />
          <Slider
            label="a&#x2081;"
            value={a1}
            min={0}
            max={16}
            onChange={setA1}
            displayValue={`${a1}`}
          />
          <Slider
            label="a&#x2082;"
            value={a2}
            min={0}
            max={16}
            onChange={setA2}
            displayValue={`${a2}`}
          />
        </div>

        <div className="text-center text-sm text-text-muted">
          <InlineMath tex={`f(x) = ${a0} + ${a1}x + ${a2}x^2 \\pmod{17}`} />
        </div>

        {/* SVG Plot */}
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${plotW} ${plotH}`}
            className="w-full max-w-[600px] mx-auto"
          >
            {/* Axes */}
            <line
              x1={padL}
              y1={padT + chartH}
              x2={padL + chartW}
              y2={padT + chartH}
              stroke="#e0dcd4"
              strokeWidth={1}
            />
            <line
              x1={padL}
              y1={padT}
              x2={padL}
              y2={padT + chartH}
              stroke="#e0dcd4"
              strokeWidth={1}
            />

            {/* Y-axis labels */}
            {[0, 4, 8, 12, 16].map((v) => (
              <text
                key={v}
                x={padL - 8}
                y={yScale(v) + 4}
                textAnchor="end"
                className="text-[10px]"
                fill="#6b6375"
              >
                {v}
              </text>
            ))}

            {/* Connecting lines */}
            {domain.map((_, i) => {
              if (i === domain.length - 1) return null;
              return (
                <line
                  key={`line-${i}`}
                  x1={xScale(i)}
                  y1={yScale(evals[i])}
                  x2={xScale(i + 1)}
                  y2={yScale(evals[i + 1])}
                  stroke="#8b4513"
                  strokeWidth={1.5}
                  strokeOpacity={0.4}
                />
              );
            })}

            {/* Dots */}
            {domain.map((d, i) => (
              <g key={`dot-${i}`}>
                <motion.circle
                  cx={xScale(i)}
                  cy={yScale(evals[i])}
                  r={5}
                  fill="#8b4513"
                  initial={false}
                  animate={{ cy: yScale(evals[i]) }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
                <text
                  x={xScale(i)}
                  y={padT + chartH + 16}
                  textAnchor="middle"
                  className="text-[10px]"
                  fill="#6b6375"
                >
                  {d}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Evaluation table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-center border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 px-3 text-text-muted font-medium">
                  Domain point <InlineMath tex="x" />
                </th>
                {domain.map((d, i) => (
                  <th key={i} className="py-2 px-2 font-mono text-text">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 px-3 text-text-muted font-medium">
                  <InlineMath tex="f(x)" />
                </td>
                {evals.map((v, i) => (
                  <td key={i} className="py-2 px-2 font-mono text-sienna font-semibold">
                    <motion.span
                      key={v}
                      initial={{ scale: 1.2, color: '#c53030' }}
                      animate={{ scale: 1, color: '#8b4513' }}
                      transition={{ duration: 0.3 }}
                    >
                      {v}
                    </motion.span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive B: Hamming Distance */}
      <h3 id="hamming-distance" className="font-heading text-xl font-semibold text-text mt-10 mb-4">
        Hamming Distance
      </h3>
      <p className="mb-4">
        Now let's see what happens when some evaluations are <em>corrupted</em>. The{' '}
        <Tooltip content="Number of positions where two vectors differ">
          <span className="underline decoration-dotted cursor-help">Hamming distance</span>
        </Tooltip>{' '}
        measures how many positions differ from the original codeword. For a Reed-Solomon
        code <InlineMath tex="\text{RS}[n, d]" />, any two codewords differ in at least{' '}
        <InlineMath tex="n - d + 1" /> positions.
      </p>

      <p className="mb-4">
        When a dishonest prover sends a corrupted trace column in leanVM, the evaluations will be
        "far" from any valid low-degree polynomial. WHIR's job inside leanVM is to catch exactly
        this -- it tests proximity by reading only a tiny fraction of the{' '}
        <InlineMath tex="2^{26}" /> evaluations.
      </p>

      <div className="bg-bg-card border border-border rounded-lg p-5 space-y-4">
        <Slider
          label="Number of corruptions"
          value={numCorruptions}
          min={0}
          max={8}
          onChange={setNumCorruptions}
          displayValue={`${numCorruptions} of 8`}
        />

        {/* Visual comparison */}
        <div className="flex flex-wrap justify-center gap-3 my-4">
          {domain.map((d, i) => {
            const isCorrupted = evals[i] !== corrupted[i];
            return (
              <motion.div
                key={i}
                layout
                className={`flex flex-col items-center p-3 rounded-lg border ${
                  isCorrupted
                    ? 'bg-red/5 border-red/30'
                    : 'bg-green/5 border-green/30'
                }`}
                animate={{
                  scale: isCorrupted ? [1, 1.05, 1] : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                <span className="text-[10px] text-text-muted mb-1">x={d}</span>
                <span
                  className={`font-mono text-sm font-semibold ${
                    isCorrupted ? 'text-red' : 'text-green'
                  }`}
                >
                  {corrupted[i]}
                </span>
                {isCorrupted && (
                  <span className="text-[9px] text-red mt-0.5 line-through">
                    was {evals[i]}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Hamming badge */}
        <div className="flex justify-center">
          <motion.div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
              hammingDist === 0
                ? 'bg-green/10 text-green border border-green/20'
                : 'bg-red/10 text-red border border-red/20'
            }`}
            animate={{ scale: [1, 1.02, 1] }}
            key={hammingDist}
          >
            Hamming distance: {hammingDist}/{evals.length}
            {hammingDist === 0 && ' (valid codeword)'}
          </motion.div>
        </div>

        <p className="text-sm text-text-muted text-center">
          Our polynomial has degree 2, so with 8 evaluation points, any valid codeword differs
          from any other in at least <InlineMath tex="8 - 2 = 6" /> positions. If fewer
          than 3 positions are corrupted, we can still uniquely recover the original polynomial.
        </p>
      </div>

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
        possible — and it is exactly what allows leanVM's verifier to confirm the correctness
        of signature aggregation without re-executing the entire computation.
      </p>
    </Section>
  );
}
