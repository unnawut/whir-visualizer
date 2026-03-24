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
      <p>
        A <strong>Reed-Solomon code</strong> takes a polynomial and evaluates it at many more
        points than its degree requires. If the polynomial has degree{' '}
        <InlineMath tex="d" />, we only need <InlineMath tex="d+1" /> points to determine
        it uniquely. By evaluating at <InlineMath tex="n \gg d" /> points, we create
        <em> redundancy</em>.
      </p>

      <MathBlock tex="\text{RS}[n, d] = \{ (f(\omega^0), f(\omega^1), \ldots, f(\omega^{n-1})) \mid \deg(f) < d \}" />

      <p>
        This redundancy is powerful: if someone gives you a vector of <InlineMath tex="n" />{' '}
        values and claims it is a valid codeword, you can detect if they have tampered with
        any of the values. The minimum number of positions where two distinct codewords differ
        is called the <strong>Hamming distance</strong>.
      </p>

      <div className="bg-bg-card border border-border rounded-lg p-5 my-6">
        <p className="text-sm text-text-muted">
          All arithmetic below is in <InlineMath tex="\mathbb{F}_{17}" /> (the integers
          modulo 17). Our evaluation domain is a multiplicative subgroup of size 8.
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
            label="a\u2080"
            value={a0}
            min={0}
            max={16}
            onChange={setA0}
            displayValue={`${a0}`}
          />
          <Slider
            label="a\u2081"
            value={a1}
            min={0}
            max={16}
            onChange={setA1}
            displayValue={`${a1}`}
          />
          <Slider
            label="a\u2082"
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

      <p className="mt-6 text-sm text-text-muted">
        Reed-Solomon codes are the foundation of proximity testing: instead of checking
        that a function is <em>exactly</em> a low-degree polynomial, protocols like WHIR check
        that it is <em>close</em> to one. This relaxation is what makes sublinear verification
        possible.
      </p>
    </Section>
  );
}
