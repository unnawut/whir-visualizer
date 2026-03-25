import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Section } from '../components/Section';
import { Math as InlineMath, MathBlock } from '../components/MathBlock';
import { Slider } from '../components/ui/Slider';
import { mod } from '../utils/field';

export function S4_ConstrainedRS() {
  // 4 values for f on {0,1}^2: f(0,0), f(0,1), f(1,0), f(1,1)
  const [f00, setF00] = useState(3);
  const [f01, setF01] = useState(5);
  const [f10, setF10] = useState(2);
  const [f11, setF11] = useState(7);
  const [sigma, setSigma] = useState(0);

  const computedSum = useMemo(() => {
    return mod(f00 + f01 + f10 + f11);
  }, [f00, f01, f10, f11]);

  const isSatisfied = computedSum === mod(sigma);

  const vertices: { label: string; x: number; y: number; value: number }[] = [
    { label: '(0,0)', x: 60, y: 120, value: f00 },
    { label: '(0,1)', x: 200, y: 120, value: f01 },
    { label: '(1,0)', x: 60, y: 30, value: f10 },
    { label: '(1,1)', x: 200, y: 30, value: f11 },
  ];

  return (
    <Section
      id="constrained-rs"
      number={4}
      title="Constrained Reed-Solomon Codes"
      subtitle="Low-degree polynomials with an extra constraint: a weighted sum must hit a target."
    >
      <h3 id="what-are-crs-codes" className="font-heading text-xl font-semibold text-text mb-3">
        What Are CRS Codes?
      </h3>
      <p>
        Standard Reed-Solomon codes only check one thing: "is this close to a low-degree
        polynomial?" But leanVM also needs to verify that the execution trace satisfies AIR
        transition constraints — for example, when the instruction is ADD, the
        constraint <InlineMath tex="\nu_B - (\nu_A + \nu_C) = 0" /> must hold.
        FRI-based systems handle these as <em>separate steps</em>: FRI does proximity testing,
        and a different mechanism checks the constraints. <strong>Constrained Reed-Solomon
        (CRS)</strong> codes bundle both into a single test — and WHIR is an IOP of proximity
        for CRS codes, which is why leanVM uses it: proximity testing and constraint
        satisfaction are verified together in one protocol.
      </p>

      <MathBlock tex="\text{CRS}[L, d, \hat{w}, \sigma] = \left\{ \hat{f} \in \text{RS}[L, d] \ \middle|\ \sum_{b \in \{0,1\}^m} \hat{w}(\hat{f}(b), b) = \sigma \right\}" />

      <p>
        Don't let the notation intimidate you! Here's what this means in plain English:
      </p>

      <div className="bg-bg-card border border-border rounded-lg p-5 my-6 space-y-3">
        <div className="flex items-start gap-3">
          <span className="text-sienna font-mono text-sm font-bold mt-0.5">1.</span>
          <p className="text-sm text-text-muted">
            <strong>Start with a low-degree polynomial</strong>{' '}
            <InlineMath tex="\hat{f}" /> -- just like in a regular Reed-Solomon code.
          </p>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-sienna font-mono text-sm font-bold mt-0.5">2.</span>
          <p className="text-sm text-text-muted">
            <strong>Evaluate it on the boolean hypercube</strong>{' '}
            <InlineMath tex="\{0,1\}^m" /> -- the set of all binary strings of length{' '}
            <InlineMath tex="m" />.
          </p>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-sienna font-mono text-sm font-bold mt-0.5">3.</span>
          <p className="text-sm text-text-muted">
            <strong>Apply a weight function</strong> <InlineMath tex="\hat{w}" /> to each
            evaluation and <strong>sum them up</strong>.
          </p>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-sienna font-mono text-sm font-bold mt-0.5">4.</span>
          <p className="text-sm text-text-muted">
            <strong>The sum must equal a target value</strong> <InlineMath tex="\sigma" />.
          </p>
        </div>
      </div>

      <h3 id="why-add-constraint" className="font-heading text-xl font-semibold text-text mt-8 mb-3">
        Why Add a Constraint?
      </h3>
      <p>
        In leanVM, the execution table has columns that must satisfy transition constraints
        between consecutive rows. For example, if the current instruction is ADD, then the
        output value must equal the sum of the two input values. In CRS terms, these AIR
        constraints are encoded as a weighted sum: <InlineMath tex="\sum \hat{w}(\hat{f}(b), b) = \sigma" />{' '}
        can express "the sum of this AIR constraint polynomial over all rows equals zero,"
        meaning every row satisfies the constraint.
      </p>
      <p className="mt-3">
        More generally, <em>evaluation queries</em> can also be expressed as CRS constraints.
        When the verifier wants to check that <InlineMath tex="\hat{f}(z) = v" />, this
        is encoded using the <strong>equality polynomial</strong>:
      </p>

      <MathBlock tex="\text{eq}(X, z) = \prod_{i=1}^{m} \big((1 - z_i)(1 - X_i) + z_i X_i\big)" />

      <p>
        This polynomial equals 1 when <InlineMath tex="X = z" /> and 0 at all other points
        of the hypercube. So the constraint{' '}
        <InlineMath tex="\sum_{b \in \{0,1\}^m} \text{eq}(b, z) \cdot \hat{f}(b) = v" />{' '}
        exactly checks that <InlineMath tex="\hat{f}(z) = v" />.
      </p>

      <h3 id="crs-interactive-example" className="font-heading text-xl font-semibold text-text mt-10 mb-4">
        Interactive Example
      </h3>
      <p className="mb-4">
        In leanVM, the CRS constraint encodes things like "every ADD instruction correctly
        computes its result" or "every memory access is consistent." The interactive demo
        below shows the same idea at a smaller scale: a 2-variable multilinear polynomial
        on <InlineMath tex="\{0,1\}^2" /> with the identity weight function{' '}
        <InlineMath tex="\hat{w} = 1" />. The constraint becomes: the sum of all four
        evaluations must equal <InlineMath tex="\sigma" />.
      </p>

      <div className="bg-bg-card border border-border rounded-lg p-5 space-y-5">
        {/* Sliders */}
        <div className="grid grid-cols-2 gap-4">
          <Slider
            label="f(0,0)"
            value={f00}
            min={0}
            max={16}
            onChange={setF00}
          />
          <Slider
            label="f(0,1)"
            value={f01}
            min={0}
            max={16}
            onChange={setF01}
          />
          <Slider
            label="f(1,0)"
            value={f10}
            min={0}
            max={16}
            onChange={setF10}
          />
          <Slider
            label="f(1,1)"
            value={f11}
            min={0}
            max={16}
            onChange={setF11}
          />
        </div>

        <div className="border-t border-border pt-4">
          <Slider
            label={'\u03c3 (target sum)'}
            value={sigma}
            min={0}
            max={16}
            onChange={setSigma}
          />
        </div>

        {/* Hypercube visualization */}
        <div className="flex justify-center">
          <svg viewBox="0 0 260 160" className="w-full max-w-[300px]">
            {/* Edges of the hypercube */}
            <line x1={60} y1={120} x2={200} y2={120} stroke="#e0dcd4" strokeWidth={1.5} />
            <line x1={60} y1={30} x2={200} y2={30} stroke="#e0dcd4" strokeWidth={1.5} />
            <line x1={60} y1={120} x2={60} y2={30} stroke="#e0dcd4" strokeWidth={1.5} />
            <line x1={200} y1={120} x2={200} y2={30} stroke="#e0dcd4" strokeWidth={1.5} />

            {/* Vertices */}
            {vertices.map((v, i) => (
              <g key={i}>
                <motion.circle
                  cx={v.x}
                  cy={v.y}
                  r={22}
                  fill="#fefdfb"
                  stroke="#8b4513"
                  strokeWidth={2}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                />
                <text
                  x={v.x}
                  y={v.y - 3}
                  textAnchor="middle"
                  className="text-[12px] font-mono font-bold"
                  fill="#8b4513"
                >
                  {v.value}
                </text>
                <text
                  x={v.x}
                  y={v.y + 12}
                  textAnchor="middle"
                  className="text-[8px]"
                  fill="#6b6375"
                >
                  {v.label}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Step-by-step computation */}
        <div className="bg-bg border border-border-light rounded-md p-4 space-y-2">
          <p className="text-sm font-medium text-text">Step-by-step computation:</p>
          <div className="font-mono text-sm text-text-muted space-y-1">
            <p>
              f(0,0) + f(0,1) + f(1,0) + f(1,1) mod 17
            </p>
            <p>
              = {f00} + {f01} + {f10} + {f11} mod 17
            </p>
            <p>
              = {f00 + f01 + f10 + f11} mod 17
            </p>
            <p className="font-bold text-text">
              = {computedSum}
            </p>
          </div>
        </div>

        {/* Result */}
        <motion.div
          className={`flex items-center justify-center gap-3 p-4 rounded-lg border ${
            isSatisfied
              ? 'bg-green/5 border-green/30'
              : 'bg-red/5 border-red/30'
          }`}
          animate={{ scale: [1, 1.01, 1] }}
          key={`${computedSum}-${sigma}`}
        >
          <span className="text-2xl">{isSatisfied ? '\u2713' : '\u2717'}</span>
          <div>
            <p
              className={`font-semibold ${
                isSatisfied ? 'text-green' : 'text-red'
              }`}
            >
              {isSatisfied
                ? 'Constraint satisfied!'
                : 'Constraint not satisfied'}
            </p>
            <p className="text-sm text-text-muted">
              Sum = {computedSum}, target {'\u03c3'} = {mod(sigma)}
              {!isSatisfied && ` (need ${mod(sigma)}, got ${computedSum})`}
            </p>
          </div>
        </motion.div>
      </div>

      <p className="mt-6 text-sm text-text-muted">
        In the full WHIR protocol, the weight function <InlineMath tex="\hat{w}" /> is
        typically the equality polynomial <InlineMath tex="\text{eq}(X, z)" />, and the
        target <InlineMath tex="\sigma" /> is the value the verifier wants to check. Each
        WHIR iteration takes a CRS proximity claim and reduces it to a smaller one using
        sumcheck and folding.
      </p>
    </Section>
  );
}
