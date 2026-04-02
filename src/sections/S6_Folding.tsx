import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Section } from '../components/Section';
import { Math as InlineMath, MathBlock } from '../components/MathBlock';
import { Slider } from '../components/ui/Slider';
import { Button } from '../components/ui/Button';
import { mod, add, sub, mul, neg, div, generateSubgroup } from '../utils/field';
import { evaluateAll } from '../utils/polynomial';
import type { Poly } from '../utils/polynomial';
import { foldDetailed, type FoldStep } from '../utils/folding';

// A fixed degree-3 polynomial: f(x) = 2 + 5x + 3x^2 + x^3
const INITIAL_POLY: Poly = [2, 5, 3, 1];

// Color palette for pairs
const PAIR_COLORS = ['#8b4513', '#1a365d', '#c53030', '#2f855a'];

export function S6_Folding() {
  const [alpha, setAlpha] = useState(3);
  const [, setFolded] = useState(false);
  const [foldCount, setFoldCount] = useState(0);

  const domain8 = useMemo(() => generateSubgroup(8), []);
  const evals8 = useMemo(() => evaluateAll(INITIAL_POLY, domain8), [domain8]);

  // Current domain and evals based on fold count
  const { currentDomain, currentEvals } = useMemo(() => {
    let d = domain8;
    let e = evals8;
    let steps: FoldStep[] = [];

    for (let i = 0; i < foldCount; i++) {
      const result = foldDetailed(e, d, mod(alpha));
      steps = result.steps;
      d = result.foldedDomain;
      e = result.foldedEvals;
    }

    return { currentDomain: d, currentEvals: e, foldSteps: steps };
  }, [domain8, evals8, alpha, foldCount]);

  // Next fold preview
  const nextFoldResult = useMemo(() => {
    if (currentDomain.length <= 2) return null;
    return foldDetailed(currentEvals, currentDomain, mod(alpha));
  }, [currentDomain, currentEvals, alpha]);

  // Build (x, -x) pairs for visualization
  const pairs = useMemo(() => {
    const visited = new Set<number>();
    const result: { x: number; negX: number; fx: number; fNegX: number; color: string }[] = [];
    let colorIdx = 0;

    for (let i = 0; i < currentDomain.length; i++) {
      const x = currentDomain[i];
      if (visited.has(x)) continue;
      const nx = neg(x);
      visited.add(x);
      visited.add(nx);
      const fx = currentEvals[i];
      const fNegXIdx = currentDomain.indexOf(nx);
      const fNegX = fNegXIdx >= 0 ? currentEvals[fNegXIdx] : 0;
      result.push({ x, negX: nx, fx, fNegX, color: PAIR_COLORS[colorIdx % PAIR_COLORS.length] });
      colorIdx++;
    }
    return result;
  }, [currentDomain, currentEvals]);

  const handleFold = useCallback(() => {
    if (currentDomain.length <= 2) return;
    setFoldCount((c) => c + 1);
    setFolded(true);
  }, [currentDomain]);

  const handleReset = useCallback(() => {
    setFoldCount(0);
    setFolded(false);
  }, []);

  // SVG layout
  const svgW = 600;
  const svgH = 180;
  // Arrange domain points in a line
  const pointSpacing = svgW / (currentDomain.length + 1);

  return (
    <Section
      id="folding"
      number={6}
      title="Folding"
      subtitle="Halving the domain with a random challenge -- the key to WHIR's recursion."
    >
      <h3 id="what-is-folding" className="font-heading text-xl font-semibold text-text mb-3">
        What Is Folding?
      </h3>
      <p>
        <strong>Folding</strong> is the operation that makes WHIR recursive — each fold
        shrinks the domain by a factor of <InlineMath tex="2^k" />, where{' '}
        <InlineMath tex="k" /> is the folding parameter. In leanMultisig, the initial domain
        might span <InlineMath tex="2^{26}" /> points. The leanMultisig paper specifies an
        "initial folding of 7," meaning the first fold step reduces the domain by{' '}
        <InlineMath tex="2^7 = 128\times" />. The small 2-addicity of the KoalaBear field
        (24) is handled through WHIR's interleaved Reed-Solomon approach, which allows
        committing up to <InlineMath tex="2^{30}" /> field elements at rate 1/2.
      </p>

      <h3 className="font-heading text-lg font-semibold text-text mt-6 mb-2">
        The Folding Formula
      </h3>
      <p>
        For each pair <InlineMath tex="(x, -x)" /> in the domain, we combine{' '}
        <InlineMath tex="f(x)" /> and <InlineMath tex="f(-x)" /> into a single value on
        the squared domain point <InlineMath tex="y = x^2" />:
      </p>

      <MathBlock tex="\text{Fold}(f, \alpha)(y) = \frac{f(x) + f(-x)}{2} + \alpha \cdot \frac{f(x) - f(-x)}{2x}" />

      <p>
        The first term is the <em>even part</em> (average), and the second is the{' '}
        <em>odd part</em> (difference scaled by <InlineMath tex="x" />). The challenge{' '}
        <InlineMath tex="\alpha" /> randomly combines them, ensuring that a cheating prover
        cannot make the folded function look correct unless the original was already close to
        a valid codeword.
      </p>

      <div className="bg-bg-card border border-border rounded-lg p-5 my-6">
        <p className="text-sm text-text-muted">
          <strong>Key property:</strong> If <InlineMath tex="f" /> is close to a degree-
          <InlineMath tex="d" /> polynomial, then with high probability,{' '}
          <InlineMath tex="\text{Fold}(f, \alpha)" /> is close to a degree-
          <InlineMath tex="d/2" /> polynomial. Both the degree and domain size halve!
        </p>
      </div>

      <h3 id="interactive-folding" className="font-heading text-xl font-semibold text-text mt-10 mb-4">
        Interactive Folding
      </h3>
      <p className="mb-2">
        In leanMultisig, folding starts from a domain of millions of points and progressively
        shrinks it. Here we demonstrate the same operation on 8 points in{' '}
        <InlineMath tex="\mathbb{F}_{17}" />, starting with{' '}
        <InlineMath tex="f(x) = 2 + 5x + 3x^2 + x^3" />. Adjust{' '}
        <InlineMath tex="\alpha" /> and fold!
      </p>

      <div className="bg-bg-card border border-border rounded-lg p-5 space-y-5">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <Slider
              label={'\u03b1 (folding challenge)'}
              value={alpha}
              min={0}
              max={16}
              onChange={(v) => {
                setAlpha(v);
                setFoldCount(0);
                setFolded(false);
              }}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={handleFold}
              disabled={currentDomain.length <= 2}
            >
              Fold
            </Button>
            <Button variant="ghost" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="px-3 py-1 bg-bg rounded border border-border-light font-mono">
            Domain size: {currentDomain.length}
          </span>
          <span className="px-3 py-1 bg-bg rounded border border-border-light font-mono">
            Folds: {foldCount}
          </span>
          {currentDomain.length <= 2 && (
            <span className="px-3 py-1 bg-green/10 text-green rounded border border-green/20 font-semibold">
              Base case reached
            </span>
          )}
        </div>

        {/* Domain point visualization */}
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="w-full max-w-[600px] mx-auto"
          >
            {/* Pair connecting lines */}
            {pairs.map((pair, i) => {
              const xi = currentDomain.indexOf(pair.x);
              const nxi = currentDomain.indexOf(pair.negX);
              if (xi < 0 || nxi < 0) return null;
              const x1 = pointSpacing * (xi + 1);
              const x2 = pointSpacing * (nxi + 1);
              return (
                <motion.line
                  key={`pair-${i}`}
                  x1={x1}
                  y1={60}
                  x2={x2}
                  y2={60}
                  stroke={pair.color}
                  strokeWidth={2}
                  strokeOpacity={0.3}
                  strokeDasharray="4 2"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                />
              );
            })}

            {/* Domain points */}
            {currentDomain.map((d, i) => {
              const px = pointSpacing * (i + 1);
              // Find which pair this belongs to
              const pairIdx = pairs.findIndex((p) => p.x === d || p.negX === d);
              const color = pairIdx >= 0 ? pairs[pairIdx].color : '#6b6375';
              return (
                <motion.g
                  key={`${d}-${foldCount}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <circle cx={px} cy={60} r={24} fill="#fefdfb" stroke={color} strokeWidth={2} />
                  <text
                    x={px}
                    y={56}
                    textAnchor="middle"
                    className="text-[10px] font-mono"
                    fill="#6b6375"
                  >
                    x={d}
                  </text>
                  <text
                    x={px}
                    y={68}
                    textAnchor="middle"
                    className="text-[12px] font-mono font-bold"
                    fill={color}
                  >
                    {currentEvals[i]}
                  </text>
                </motion.g>
              );
            })}

            {/* Arrow showing fold target */}
            {nextFoldResult && currentDomain.length > 2 && (
              <text
                x={svgW / 2}
                y={svgH - 10}
                textAnchor="middle"
                className="text-[10px]"
                fill="#6b6375"
              >
                Paired points will merge into {currentDomain.length / 2} points after folding
              </text>
            )}
          </svg>
        </div>

        {/* Worked example for first pair */}
        {pairs.length > 0 && (
          <div className="bg-bg border border-border-light rounded-md p-4">
            <h4 className="font-heading font-semibold text-sm text-text mb-2">
              Worked example (first pair):
            </h4>
            {(() => {
              const p = pairs[0];
              const inv2 = div(1, 2);
              const evenPart = mul(add(p.fx, p.fNegX), inv2);
              const oddPart = div(sub(p.fx, p.fNegX), mul(2, p.x));
              const result = add(evenPart, mul(mod(alpha), oddPart));
              const y = mul(p.x, p.x);
              return (
                <div className="font-mono text-sm text-text-muted space-y-1">
                  <p>
                    x = {p.x}, -x = {p.negX}, f({p.x}) = {p.fx}, f({p.negX}) = {p.fNegX}
                  </p>
                  <p>
                    Even part: ({p.fx} + {p.fNegX}) / 2 = {evenPart} (mod 17)
                  </p>
                  <p>
                    Odd part: ({p.fx} - {p.fNegX}) / (2 * {p.x}) = {oddPart} (mod 17)
                  </p>
                  <p className="font-bold text-text">
                    Fold({alpha})(y={y}) = {evenPart} + {mod(alpha)} * {oddPart} = {result} (mod 17)
                  </p>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      <p className="mt-6 text-sm text-text-muted">
        Each fold halves the domain size. Starting from size 8, one fold gives size 4, then
        size 2. At size 2, the polynomial is just a constant — the base case. In leanMultisig,
        the folding parameter <InlineMath tex="k" /> can be larger than 1, reducing the
        domain by <InlineMath tex="2^k" /> per iteration rather than just halving it. With
        an initial folding of 7 and subsequent folds, a domain of{' '}
        <InlineMath tex="2^{26}" /> points shrinks to a trivially small base case in just
        a few iterations. This aggressive folding is what makes WHIR practical for
        leanMultisig's large execution traces.
      </p>
    </Section>
  );
}
