import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Section } from '../components/Section';
import { Math as InlineMath, MathBlock } from '../components/MathBlock';
import { StepNavigator } from '../components/ui/StepNavigator';

// A tiny "program" for the trace example
const PROGRAM_CODE = `function checkHash(input, expected):
  h = hash(input)        // step 1
  return h == expected    // step 2`;

// Execution trace rows
const TRACE_ROWS = [
  { step: 0, pc: 0, reg_a: 42, reg_b: 0, reg_c: 0, op: 'LOAD input', note: 'Load input value 42 into register A' },
  { step: 1, pc: 1, reg_a: 42, reg_b: 7, reg_c: 0, op: 'HASH A → B', note: 'Compute hash of A, store in B. hash(42) = 7' },
  { step: 2, pc: 2, reg_a: 42, reg_b: 7, reg_c: 7, op: 'LOAD expected', note: 'Load expected value 7 into register C' },
  { step: 3, pc: 3, reg_a: 42, reg_b: 7, reg_c: 1, op: 'EQ B, C → C', note: 'Compare B and C, store result (1 = equal) in C' },
  { step: 4, pc: 4, reg_a: 42, reg_b: 7, reg_c: 1, op: 'HALT', note: 'Program halts. Output = C = 1 (valid)' },
];

const CONSTRAINT_STEPS = [
  {
    title: 'The Execution Trace',
    description:
      'Every program, no matter how complex, can be run step by step. At each step, the machine has a state: program counter, registers, memory. We record every state in a table -- the execution trace.',
  },
  {
    title: 'Transition Constraints',
    description:
      'For a trace to be valid, each row must follow from the previous row according to the rules of the machine. For example: if the instruction is "ADD A, B → C", then the constraint is C_next = A + B. These constraints are polynomial equations over adjacent rows.',
  },
  {
    title: 'Encoding as Polynomials',
    description:
      'We take each column of the trace and find the unique polynomial of degree < T (where T is the number of steps) that passes through all the column values. Now the trace IS a set of polynomials, and the transition constraints become polynomial identities that must hold at every step.',
  },
  {
    title: 'From Polynomials to Proximity Testing',
    description:
      'The prover sends these polynomials (as evaluations over a large domain) to the verifier. The verifier needs to check: are these evaluations actually close to low-degree polynomials? This is exactly the proximity testing problem that FRI, STIR, and WHIR solve.',
  },
];

export function S2_FromCodeToPolynomials() {
  const [step, setStep] = useState(0);
  const [highlightedRow, setHighlightedRow] = useState<number | null>(null);

  return (
    <Section
      id="code-to-polynomials"
      number={2}
      title="From Code to Polynomials"
      subtitle="How a program's execution becomes polynomial equations that we can prove."
    >
      <p>
        Before we can use polynomial proximity testing (the thing WHIR does), we need to understand
        how a <em>computation</em> becomes <em>polynomials</em> in the first place. This is the
        "arithmetization" step -- it's how the real world connects to the abstract math.
      </p>

      <h3 id="run-the-program" className="font-heading text-xl font-semibold text-text mt-10 mb-3">
        Step 1: Run the Program, Record Everything
      </h3>
      <p>
        Consider a simple program that checks whether a hash matches an expected value.
        When we run it, we record the machine's state at every step in an{' '}
        <strong>execution trace</strong>:
      </p>

      {/* Code block */}
      <div className="bg-bg-card border border-border rounded-lg my-6 overflow-hidden">
        <div className="text-xs text-text-muted px-4 py-2 border-b border-border-light bg-border-light/30 font-mono">
          pseudocode
        </div>
        <pre className="px-4 py-3 text-sm font-mono text-text overflow-x-auto leading-relaxed">
          {PROGRAM_CODE}
        </pre>
      </div>

      {/* Execution trace table */}
      <div className="my-6 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-border">
              <th className="text-left py-2 px-3 font-heading font-semibold text-text-muted text-xs">Step</th>
              <th className="text-left py-2 px-3 font-heading font-semibold text-text-muted text-xs">PC</th>
              <th className="text-left py-2 px-3 font-heading font-semibold text-text-muted text-xs">Reg A</th>
              <th className="text-left py-2 px-3 font-heading font-semibold text-text-muted text-xs">Reg B</th>
              <th className="text-left py-2 px-3 font-heading font-semibold text-text-muted text-xs">Reg C</th>
              <th className="text-left py-2 px-3 font-heading font-semibold text-text-muted text-xs">Operation</th>
            </tr>
          </thead>
          <tbody>
            {TRACE_ROWS.map((row) => (
              <tr
                key={row.step}
                className={`border-b border-border-light cursor-pointer transition-colors ${
                  highlightedRow === row.step ? 'bg-sienna/10' : 'hover:bg-bg-card'
                }`}
                onMouseEnter={() => setHighlightedRow(row.step)}
                onMouseLeave={() => setHighlightedRow(null)}
              >
                <td className="py-2 px-3 font-mono text-text-muted">{row.step}</td>
                <td className="py-2 px-3 font-mono">{row.pc}</td>
                <td className="py-2 px-3 font-mono">{row.reg_a}</td>
                <td className="py-2 px-3 font-mono">{row.reg_b}</td>
                <td className="py-2 px-3 font-mono">{row.reg_c}</td>
                <td className="py-2 px-3 font-mono text-xs">{row.op}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hover note */}
      <AnimatePresence mode="wait">
        {highlightedRow !== null && (
          <motion.div
            key={highlightedRow}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="bg-bg-card border border-border rounded-lg px-4 py-3 mb-4 text-sm text-text-muted"
          >
            <span className="font-semibold text-sienna mr-2">Step {highlightedRow}:</span>
            {TRACE_ROWS[highlightedRow].note}
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-sm text-text-muted italic">
        Hover over any row to see what happens at that step.
      </p>

      {/* Step 2: Columns become polynomials */}
      <h3 id="columns-become-polynomials" className="font-heading text-xl font-semibold text-text mt-10 mb-3">
        Step 2: Columns Become Polynomials
      </h3>
      <p>
        Each column of the trace is a sequence of values. We can find the unique polynomial
        that passes through all the points{' '}
        <InlineMath tex="(0, v_0), (1, v_1), \ldots, (T{-}1, v_{T-1})" />.
        For example, the "Reg B" column has values <InlineMath tex="[0, 7, 7, 7, 7]" />,
        and there's a polynomial <InlineMath tex="p_B(x)" /> of degree {`< ${TRACE_ROWS.length}`} that
        exactly encodes these values.
      </p>

      <div className="my-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { name: 'Reg A', values: TRACE_ROWS.map(r => r.reg_a), color: '#1a365d', tex: 'p_A(x)' },
          { name: 'Reg B', values: TRACE_ROWS.map(r => r.reg_b), color: '#8b4513', tex: 'p_B(x)' },
          { name: 'Reg C', values: TRACE_ROWS.map(r => r.reg_c), color: '#2f855a', tex: 'p_C(x)' },
        ].map((col) => (
          <div key={col.name} className="bg-bg-card border border-border rounded-lg p-4">
            <div className="font-heading font-semibold text-sm mb-2" style={{ color: col.color }}>
              {col.name} → <InlineMath tex={col.tex} />
            </div>
            {/* Mini SVG chart */}
            <svg viewBox="0 0 160 80" className="w-full h-20">
              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line
                  key={i}
                  x1={20 + i * 32}
                  y1={8}
                  x2={20 + i * 32}
                  y2={72}
                  stroke="#e0dcd4"
                  strokeWidth={0.5}
                />
              ))}
              {/* Points and connecting line */}
              {col.values.map((v, i) => {
                const maxVal = Math.max(...col.values, 1);
                const x = 20 + i * 32;
                const y = 68 - (v / Math.max(maxVal, 1)) * 56;
                return (
                  <g key={i}>
                    {i > 0 && (
                      <line
                        x1={20 + (i - 1) * 32}
                        y1={68 - (col.values[i - 1] / Math.max(maxVal, 1)) * 56}
                        x2={x}
                        y2={y}
                        stroke={col.color}
                        strokeWidth={1.5}
                        opacity={0.4}
                      />
                    )}
                    <circle cx={x} cy={y} r={3.5} fill={col.color} />
                    <text x={x} y={y - 8} textAnchor="middle" className="text-[9px]" fill="#6b6375">
                      {v}
                    </text>
                  </g>
                );
              })}
              {/* X-axis labels */}
              {col.values.map((_, i) => (
                <text key={i} x={20 + i * 32} y={79} textAnchor="middle" className="text-[8px]" fill="#6b6375">
                  {i}
                </text>
              ))}
            </svg>
            <p className="text-xs text-text-muted text-center mt-1">
              Values: [{col.values.join(', ')}]
            </p>
          </div>
        ))}
      </div>

      <MathBlock tex="p_A(x), \; p_B(x), \; p_C(x) \quad \text{are polynomials of degree} < T = 5" />

      {/* Step 3: Constraints become polynomial identities */}
      <h3 id="constraints-become-identities" className="font-heading text-xl font-semibold text-text mt-10 mb-3">
        Step 3: Constraints Become Polynomial Identities
      </h3>
      <p className="mb-4">
        A valid execution trace isn't just any table of numbers -- each row must correctly follow from
        the previous row according to the instruction being executed. These rules become{' '}
        <strong>polynomial constraints</strong>:
      </p>

      <div className="bg-bg-card border border-border rounded-lg p-5 my-4">
        <p className="text-sm text-text-muted mb-3">
          For example, at the "EQ" instruction (step 3), the constraint is:
        </p>
        <MathBlock tex="p_C(3) = \begin{cases} 1 & \text{if } p_B(2) = p_C(2) \\ 0 & \text{otherwise} \end{cases}" />
        <p className="text-sm text-text-muted mt-3">
          More generally, for every pair of consecutive steps, there's a polynomial equation that
          must hold. If we collect all these transition constraints, we get a system of polynomial
          identities that <em>completely characterizes</em> a valid execution.
        </p>
      </div>

      <p>
        The key insight is this: checking "did this program execute correctly?" reduces to checking
        "do these polynomials satisfy certain algebraic relationships?"
      </p>

      {/* Step 4: Interactive walkthrough */}
      <h3 id="big-picture" className="font-heading text-xl font-semibold text-text mt-10 mb-3">
        The Big Picture
      </h3>

      <div className="my-6">
        <StepNavigator
          step={step}
          totalSteps={CONSTRAINT_STEPS.length}
          onPrev={() => setStep(s => s - 1)}
          onNext={() => setStep(s => s + 1)}
          labels={CONSTRAINT_STEPS.map(s => s.title)}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Visual for each step */}
          <div className="bg-bg-card border border-border rounded-lg p-6 my-4">
            <div className="font-heading font-semibold text-base text-text mb-3">
              {CONSTRAINT_STEPS[step].title}
            </div>
            <p className="text-sm text-text-muted mb-4">
              {CONSTRAINT_STEPS[step].description}
            </p>

            {/* Step-specific visuals */}
            {step === 0 && (
              <div className="flex items-center justify-center gap-3">
                <div className="bg-bg border border-border-light rounded p-3 text-center">
                  <div className="text-xs text-text-muted mb-1">Program</div>
                  <div className="font-mono text-sm">checkHash()</div>
                </div>
                <div className="text-text-muted">→</div>
                <div className="bg-bg border border-border-light rounded p-3 text-center">
                  <div className="text-xs text-text-muted mb-1">Run step by step</div>
                  <div className="font-mono text-sm">T = {TRACE_ROWS.length} steps</div>
                </div>
                <div className="text-text-muted">→</div>
                <div className="bg-sienna/10 border border-sienna/30 rounded p-3 text-center">
                  <div className="text-xs text-sienna mb-1">Execution Trace</div>
                  <div className="font-mono text-sm">{TRACE_ROWS.length} × 5 table</div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-mono bg-bg border border-border-light rounded px-2 py-1 text-xs">Row i</span>
                  <span className="text-text-muted">+ instruction →</span>
                  <span className="font-mono bg-bg border border-border-light rounded px-2 py-1 text-xs">Row i+1</span>
                </div>
                <div className="text-xs text-text-muted mt-2 space-y-1">
                  <div>If <span className="font-mono">op = LOAD</span>: <InlineMath tex="A_{i+1} = \text{input}" /></div>
                  <div>If <span className="font-mono">op = HASH</span>: <InlineMath tex="B_{i+1} = H(A_i)" /></div>
                  <div>If <span className="font-mono">op = EQ</span>: <InlineMath tex="C_{i+1} = (B_i = C_i \;?\; 1 : 0)" /></div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {['p_A(x)', 'p_B(x)', 'p_C(x)'].map((p, i) => (
                  <div key={p} className="bg-bg border border-border-light rounded p-3 text-center">
                    <div className="text-xs text-text-muted mb-1">Column {['A', 'B', 'C'][i]}</div>
                    <InlineMath tex={p} />
                    <div className="text-xs text-text-muted mt-1">degree {'<'} {TRACE_ROWS.length}</div>
                  </div>
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="flex items-center justify-center gap-3">
                <div className="bg-bg border border-border-light rounded p-3 text-center">
                  <div className="text-xs text-text-muted mb-1">Polynomials</div>
                  <InlineMath tex="p_A, p_B, p_C" />
                </div>
                <div className="text-text-muted">→</div>
                <div className="bg-bg border border-border-light rounded p-3 text-center">
                  <div className="text-xs text-text-muted mb-1">Evaluate on large domain</div>
                  <InlineMath tex="\mathcal{L}" />
                </div>
                <div className="text-text-muted">→</div>
                <div className="bg-sienna/10 border border-sienna/30 rounded p-3 text-center">
                  <div className="text-xs text-sienna mb-1">Proximity test</div>
                  <div className="text-xs">Are these close to<br/>low-degree polynomials?</div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Summary */}
      <div className="bg-bg-card border border-border rounded-lg p-5 mt-8">
        <h4 className="font-heading font-semibold text-base text-text mb-2">
          Why This Matters for WHIR
        </h4>
        <p className="text-sm text-text-muted mb-3">
          This pipeline -- code → execution trace → polynomials → proximity testing -- is how
          every STARK-based proof system works. The arithmetization step produces polynomials
          that the prover evaluates over a domain and sends to the verifier. The verifier's job
          is then to check:
        </p>
        <ol className="list-decimal list-inside text-sm text-text-muted space-y-1 mb-3">
          <li>Are the evaluations close to a valid low-degree polynomial? <strong>(proximity testing)</strong></li>
          <li>Do the polynomials satisfy the transition constraints? <strong>(constraint checking)</strong></li>
        </ol>
        <p className="text-sm text-text-muted">
          WHIR is special because it handles <em>both</em> of these in one shot through{' '}
          <strong>constrained Reed-Solomon codes</strong>, which we'll explore after understanding
          the basics of Reed-Solomon codes in the next section.
        </p>
      </div>
    </Section>
  );
}
