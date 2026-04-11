import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Section } from '../components/Section';
import { Math as InlineMath, MathBlock } from '../components/MathBlock';
import { Slider } from '../components/ui/Slider';
import { mod } from '../utils/field';

export function S3_ConstrainedRS() {
  // Inputs for the ADD chain — 3 referees
  const [a, setA] = useState(3);  // Alice
  const [b, setB] = useState(1);  // Bob
  const [c, setC] = useState(4);  // Charlie

  // Correct trace values — starting from 0
  const step0 = mod(0 + a);           // 0 + Alice
  const step1 = mod(step0 + b);       // step0 + Bob
  const step2 = mod(step1 + c);       // step1 + Charlie

  // Row 2 output — editable, defaults to correct value (tamper target: Charlie's row)
  const [overrideStep2, setOverrideStep2] = useState<number | null>(null);

  const traceStep2 = overrideStep2 !== null ? mod(overrideStep2) : step2;

  // CRS constraint: for each ADD row, output - input1 - input2 = 0
  const error0 = mod(step0 - 0 - a);
  const error1 = mod(step1 - step0 - b);
  const error2 = mod(traceStep2 - step1 - c);
  const totalError = mod(error0 + error1 + error2);
  const constraintSatisfied = totalError === 0;

  // Trace as polynomial on {0,1}^2
  // f(0,0) = a, f(0,1) = b, f(1,0) = step1, f(1,1) = c
  // The trace encodes: row 0 inputs at (0,0) and (0,1), output at (1,0); row 1 uses (1,0) and (1,1) → step2

  return (
    <Section
      id="constrained-rs"
      number={3}
      title="Constrained Reed-Solomon Codes"
      subtitle="Low-degree polynomials with an extra constraint: a weighted sum must hit a target."
    >
      <h3 id="what-are-crs-codes" className="font-heading text-xl font-semibold text-text mb-3">
        What Are CRS Codes?
      </h3>
      <p>
        Standard Reed-Solomon codes only check one thing: "is this close to a low-degree
        polynomial?" But leanMultisig also needs to verify that the execution trace satisfies AIR
        transition constraints — for example, when the instruction is ADD, the
        constraint <InlineMath tex="\nu_B - (\nu_A + \nu_C) = 0" /> must hold.
        <strong>Constrained Reed-Solomon (CRS)</strong> codes bundle both into a single
        test — and WHIR is an IOP of proximity for CRS codes, which is why leanMultisig uses
        it: proximity testing and constraint satisfaction are verified together in one protocol.
      </p>

      <div className="bg-bg-card border border-border rounded-lg p-5 my-6">
        <h4 className="font-heading font-semibold text-base text-text mb-3">
          How do FRI/STIR handle AIR constraints without CRS?
        </h4>
        <p className="text-sm text-text-muted mb-3">
          FRI and STIR are proximity tests for <em>standard</em> Reed-Solomon codes — they only
          check "is this close to a low-degree polynomial?" They have no built-in notion of
          constraints. So systems that use FRI (like StarkNet or Plonky3) handle AIR constraints
          as a <strong>separate step</strong>:
        </p>
        <ol className="list-decimal list-inside text-sm text-text-muted space-y-2 mb-3">
          <li>The prover commits to the execution trace polynomials</li>
          <li>The verifier sends random challenges</li>
          <li>The prover constructs a <strong>composition polynomial</strong> that combines all
            AIR constraints — if the constraints are satisfied, this polynomial is also low-degree</li>
          <li>FRI/STIR then tests proximity of this composition polynomial</li>
        </ol>
        <p className="text-sm text-text-muted mb-3">
          This works, but it requires an extra commitment and an extra round of proximity testing
          for the composition polynomial.
        </p>
        <p className="text-sm text-text-muted">
          <strong>WHIR's advantage:</strong> CRS codes encode the constraint directly into the
          code definition. WHIR tests proximity and checks the constraint <em>simultaneously</em> in
          a single protocol — no separate composition polynomial, no extra commitment. This is
          one reason WHIR's verifier is faster.
        </p>
      </div>

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
        In leanMultisig, the execution table has columns that must satisfy transition constraints
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
        Interactive Example: From ADD Chain to CRS
      </h3>
      <p className="mb-4">
        Let's build a CRS constraint from scratch using a concrete computation. We'll start with
        a simple chain of ADD operations, record the execution trace, then see how
        the CRS constraint catches a dishonest prover who tampers with the trace.
        All arithmetic is mod 17.
      </p>

      <div className="bg-bg-card border border-border rounded-lg p-5 space-y-6">

        {/* Goal */}
        <div>
          <h4 className="font-heading font-semibold text-base text-text mb-3">
            Goal
          </h4>
          <p className="text-sm text-text-muted mb-3">
            Three referees — Alice, Bob, and Charlie — each give a score to a
            performance. A program computes the total score by adding them up
            one at a time, starting from 0. We want
            anyone to be able to validate that the total is correct — without having to
            collect all the individual scores and re-add them.
          </p>
          <p className="text-sm text-text-muted mb-3">
            With plain Reed-Solomon
            codes, we can check that the prover's trace is a valid low-degree
            polynomial — but that only tells us the data is <em>structured</em>, not
            that the additions were actually done correctly. The prover could submit a
            perfectly valid polynomial that encodes completely wrong
            answers.
          </p>
          <p className="text-sm text-text-muted mb-3">
            A <strong>CRS constraint</strong> closes this gap: it checks both
            that the trace is a low-degree polynomial <em>and</em> that every addition
            was done honestly — in a single test.
          </p>
        </div>

        {/* Step 1: The computation */}
        <div className="border-t border-border pt-5">
          <h4 className="font-heading font-semibold text-base text-text mb-3">
            Step 1: The computation
          </h4>
          <p className="text-sm text-text-muted mb-3">
            Choose each referee's score (0 to 5). The program performs three ADD operations, starting from 0:
          </p>
          {/* Visual ADD chain with sliders on the left */}
          <div className="mx-auto font-mono text-sm">
            {[
              { op: 'ADD 0', left: 0, leftLabel: 'initial', leftStyle: 'bg-navy/10 text-navy', score: a, name: 'Alice', result: step0, resultStyle: { background: 'rgba(99,102,241,0.1)', color: '#4f46e5' }, slider: <Slider label="Alice" value={a} min={0} max={5} onChange={setA} inline /> },
              { op: 'ADD 1', left: step0, leftLabel: '', leftStyle: '', score: b, name: 'Bob', result: step1, resultStyle: { background: 'rgba(99,102,241,0.1)', color: '#4f46e5' }, slider: <Slider label="Bob" value={b} min={0} max={5} onChange={setB} inline /> },
              { op: 'ADD 2', left: step1, leftLabel: '', leftStyle: '', score: c, name: 'Charlie', result: step2, resultStyle: { background: 'rgba(47,133,90,0.1)', color: '#2f855a' }, slider: <Slider label="Charlie" value={c} min={0} max={5} onChange={setC} inline /> },
            ].map((r, i) => (
              <React.Fragment key={i}>
                {i > 0 && (
                  <div className="grid grid-cols-[160px_160px_50px_40px_16px_40px_16px_40px] items-center justify-center">
                    <div /><div /><div /><div /><div />
                    <div className="text-center text-text-muted text-xs">&darr;</div>
                    <div /><div />
                  </div>
                )}
                {/* Name label row */}
                <div className="grid grid-cols-[160px_160px_50px_40px_16px_40px_16px_40px] justify-center">
                  <div /><div /><div />
                  <div className="text-[9px] text-text-muted/50 text-center">{r.leftLabel}</div>
                  <div />
                  <div className="text-[9px] text-text-muted/50 text-center">{r.name}</div>
                  <div /><div />
                </div>
                {/* Slider + values row */}
                <div className="grid grid-cols-[160px_160px_50px_40px_16px_40px_16px_40px] items-center justify-center">
                  <div>{r.slider}</div>
                  <div />
                  <span className="text-xs text-text-muted">{r.op}:</span>
                  <span className={`rounded px-2 py-1 font-bold text-center ${r.leftStyle}`} style={r.leftStyle ? undefined : { background: 'rgba(99,102,241,0.1)', color: '#4f46e5' }}>{r.left}</span>
                  <span className="text-text-muted text-center">+</span>
                  <span className="bg-navy/10 text-navy rounded px-2 py-1 font-bold text-center">{r.score}</span>
                  <span className="text-text-muted text-center">=</span>
                  <span className="rounded px-2 py-1 font-bold text-center" style={r.resultStyle}>{r.result}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step 2: The execution trace */}
        <div className="border-t border-border pt-5">
          <h4 className="font-heading font-semibold text-base text-text mb-3">
            Step 2: The execution trace
          </h4>
          <p className="text-sm text-text-muted mb-3">
            The prover records each ADD operation in a trace table. Each row has two inputs
            and one output:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-heading font-semibold text-text-muted text-xs">Row</th>
                  <th className="text-left py-2 px-3 font-heading font-semibold text-text-muted text-xs">Opcode</th>
                  <th className="text-left py-2 px-3 font-heading font-semibold text-text-muted text-xs">Input 1</th>
                  <th className="text-left py-2 px-3 font-heading font-semibold text-text-muted text-xs">Input 2</th>
                  <th className="text-left py-2 px-3 font-heading font-semibold text-text-muted text-xs">Output</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                <tr className="border-b border-border-light">
                  <td className="py-2 px-3 text-text-muted">0</td>
                  <td className="py-2 px-3 text-text-muted">ADD 0</td>
                  <td className="py-2 px-3 text-navy font-bold">0</td>
                  <td className="py-2 px-3 text-navy font-bold">{a}</td>
                  <td className="py-2 px-3 font-bold" style={{ color: '#4f46e5' }}>{step0}</td>
                </tr>
                <tr className="border-b border-border-light">
                  <td className="py-2 px-3 text-text-muted">1</td>
                  <td className="py-2 px-3 text-text-muted">ADD 1</td>
                  <td className="py-2 px-3 font-bold" style={{ color: '#4f46e5' }}>{step0}</td>
                  <td className="py-2 px-3 text-navy font-bold">{b}</td>
                  <td className="py-2 px-3 font-bold" style={{ color: '#4f46e5' }}>{step1}</td>
                </tr>
                <tr className="border-b border-border-light">
                  <td className="py-2 px-3 text-text-muted">2</td>
                  <td className="py-2 px-3 text-text-muted">ADD 2</td>
                  <td className="py-2 px-3 font-bold" style={{ color: '#4f46e5' }}>{step1}</td>
                  <td className="py-2 px-3 text-navy font-bold">{c}</td>
                  <td className={`py-2 px-3 font-bold ${error2 !== 0 ? 'text-red' : 'text-green'}`}>{traceStep2}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-xs text-text-muted mt-3 italic">
            Note: this execution trace structure is shared by all STARK-based systems — FRI,
            STIR, and WHIR all work with the same kind of trace.
          </p>
        </div>

        {/* Step 3: The constraint check */}
        <div className="border-t border-border pt-5">
          <h4 className="font-heading font-semibold text-base text-text mb-3">
            Step 3: The constraint check
          </h4>
          <p className="text-sm text-text-muted mb-3">
            How do we verify the trace without re-running the computation? We define a
            constraint for the ADD opcode: if the addition was done correctly, the output
            minus the two inputs must equal zero.
          </p>

          <div className="bg-bg border border-border-light rounded-lg p-4 my-4 text-center">
            <p className="text-xs text-text-muted mb-2 font-semibold uppercase tracking-wide">ADD constraint</p>
            <div className="text-lg mb-2">
              <InlineMath tex="\text{input}_1 + \text{input}_2 = \text{output}" />
            </div>
            <p className="text-xs text-text-muted mb-2">
              Rearranging to check for errors:
            </p>
            <div className="text-lg">
              <InlineMath tex="\text{output} - \text{input}_1 - \text{input}_2 = 0" />
            </div>
            <p className="text-xs text-text-muted mt-2">
              If this equals 0, the ADD was computed correctly. Any non-zero value means the prover cheated.
            </p>
          </div>

          <p className="text-sm text-text-muted mb-3">
            Applying this constraint to each row of the trace:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-heading font-semibold text-text-muted text-xs">Row</th>
                  <th className="text-left py-2 px-3 font-heading font-semibold text-text-muted text-xs">Opcode</th>
                  <th className="text-left py-2 px-3 font-heading font-semibold text-text-muted text-xs">Input 1</th>
                  <th className="text-left py-2 px-3 font-heading font-semibold text-text-muted text-xs">Input 2</th>
                  <th className="text-left py-2 px-3 font-heading font-semibold text-text-muted text-xs">Output</th>
                  <th className="text-left py-2 px-3 font-heading font-semibold text-text-muted text-xs">Constraint check</th>
                  <th className="text-left py-2 px-3 font-heading font-semibold text-text-muted text-xs">Result</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {[
                  { row: 0, op: 'ADD 0', i1: '0', i2: String(a), out: step0, check: `${step0} − 0 − ${a}`, err: error0, i1Style: 'text-navy', i2Style: 'text-navy', outStyle: { color: '#4f46e5' } },
                  { row: 1, op: 'ADD 1', i1: String(step0), i2: String(b), out: step1, check: `${step1} − ${step0} − ${b}`, err: error1, i1Style: '', i2Style: 'text-navy', outStyle: { color: '#4f46e5' } },
                  { row: 2, op: 'ADD 2', i1: String(step1), i2: String(c), out: traceStep2, check: `${traceStep2} − ${step1} − ${c}`, err: error2, i1Style: '', i2Style: 'text-navy', outStyle: { color: error2 !== 0 ? '#c53030' : '#2f855a' } },
                ].map((r, i) => (
                  <tr key={i} className={i < 2 ? 'border-b border-border-light' : ''}>
                    <td className="py-2 px-3 text-text-muted">{r.row}</td>
                    <td className="py-2 px-3 text-text-muted">{r.op}</td>
                    <td className="py-2 px-3 font-bold" style={r.i1Style ? undefined : { color: '#4f46e5' }}>
                      <span className={r.i1Style}>{r.i1}</span>
                    </td>
                    <td className="py-2 px-3 text-navy font-bold">{r.i2}</td>
                    <td className="py-2 px-3 font-bold" style={r.outStyle}>{r.out}</td>
                    <td className="py-2 px-3">{r.check} = {r.err}</td>
                    <td className="py-2 px-3">
                      <span className={r.err === 0 ? 'text-green font-bold' : 'text-red font-bold'}>
                        {r.err === 0 ? '\u2713 valid' : '\u2717 invalid'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-text-muted mt-3 italic">
            The same idea applies to other opcodes: SUB
            checks <InlineMath tex="\text{output} - \text{input}_1 + \text{input}_2 = 0" />,
            MUL checks <InlineMath tex="\text{output} - \text{input}_1 \times \text{input}_2 = 0" />,
            and so on.
          </p>
        </div>

        {/* Step 4: The CRS constraint */}
        <div className="border-t border-border pt-5">
          <h4 className="font-heading font-semibold text-base text-text mb-3">
            Step 4: The CRS constraint
          </h4>
          <p className="text-sm text-text-muted mb-3">
            Instead of checking each row individually, CRS encodes <em>all</em> ADD constraints
            as a single weighted sum. The weight
            function <InlineMath tex="\hat{w}" /> extracts "output - input1 - input2" from each
            row, and the target is <InlineMath tex="\sigma = 0" /> (because a correct ADD
            has zero error). These all have target <InlineMath tex="\sigma = 0" /> because
            they check that each row's error is zero:
          </p>

          <div className="bg-bg border border-border-light rounded-md p-4 font-mono text-sm">
            {/* Per-row constraint errors */}
            <div className="grid grid-cols-[auto_1fr_auto] gap-x-4 gap-y-2 items-center mb-3">
              {[
                { label: 'Row 0', expr: <>{step0} − 0 − {a}</>, err: error0 },
                { label: 'Row 1', expr: <>{step1} − {step0} − {b}</>, err: error1 },
                { label: 'Row 2', expr: <><span className={error2 !== 0 ? 'text-red' : ''}>{traceStep2}</span> − {step1} − {c}</>, err: error2 },
              ].map((r, i) => (
                <React.Fragment key={i}>
                  <span className="text-text-muted text-xs">{r.label}</span>
                  <span>{r.expr}</span>
                  <span className={`font-bold text-right ${r.err === 0 ? '' : 'text-red'}`}>= {r.err}</span>
                </React.Fragment>
              ))}
            </div>

            {/* Summation line */}
            <div className="border-t border-border-light pt-3 flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                <span className="text-text-muted text-xs">Weighted sum</span>
                {[error0, error1, error2].map((e, i) => (
                  <span key={i}>
                    {i > 0 && ' + '}
                    <span className={e === 0 ? '' : 'text-red font-bold'}>{e}</span>
                  </span>
                ))}
                <span className="text-text-muted">= </span>
                <span className={`text-lg font-bold ${constraintSatisfied ? 'text-green' : 'text-red'}`}>{totalError}</span>
              </div>
              <span className="text-text-muted text-xs">
                (target &sigma; = 0)
              </span>
            </div>
          </div>

          <p className="text-xs text-text-muted mt-3 italic">
            These all have target <InlineMath tex="\sigma = 0" /> because
            they check that each row's error is zero.
          </p>
          <p className="text-xs text-text-muted mt-2 italic">
            Note: <InlineMath tex="\sigma" /> isn't always zero. For example, an{' '}
            <strong>evaluation query</strong> — "check
            that <InlineMath tex="f(z) = v" />" — uses the equality polynomial as
            the weight function and sets <InlineMath tex="\sigma = v" />, which can be
            any field value. A <strong>range check</strong> constraint ("the sum of all
            flag columns across every row equals the number of rows that used this opcode")
            also targets a specific non-zero count. CRS is general enough to encode any
            weighted sum target, not just zero.
          </p>
        </div>

        {/* Step 5: Try to cheat */}
        <div className="border-t border-border pt-5">
          <h4 className="font-heading font-semibold text-base text-text mb-3">
            Step 5: Try to cheat!
          </h4>
          <p className="text-sm text-text-muted mb-3">
            A dishonest prover might submit a fake output for row 2 (Charlie's ADD — the final result).
            Try changing the value below — watch how the CRS constraint catches any
            incorrect answer:
          </p>

          <div className="max-w-[400px] mx-auto mb-4">
            <Slider
              label="Row 2 output (Charlie's ADD — final result)"
              value={overrideStep2 !== null ? overrideStep2 : step2}
              min={0}
              max={16}
              onChange={setOverrideStep2}
            />
          </div>
        </div>

        {/* Result */}
        <motion.div
          className={`flex items-center justify-center gap-3 p-4 rounded-lg border ${
            constraintSatisfied
              ? 'bg-green/5 border-green/30'
              : 'bg-red/5 border-red/30'
          }`}
          animate={{ scale: [1, 1.01, 1] }}
          key={`${totalError}-${overrideStep2}`}
        >
          <span className="text-2xl">{constraintSatisfied ? '\u2713' : '\u2717'}</span>
          <div>
            <p
              className={`font-semibold ${
                constraintSatisfied ? 'text-green' : 'text-red'
              }`}
            >
              {constraintSatisfied
                ? 'CRS constraint satisfied — trace is valid!'
                : 'CRS constraint violated — cheating detected!'}
            </p>
            <p className="text-sm text-text-muted">
              Weighted sum = {totalError}, target &sigma; = 0
              {!constraintSatisfied && ` (off by ${totalError})`}
            </p>
          </div>
        </motion.div>
      </div>

      <p className="mt-6 text-sm text-text-muted">
        This is exactly what WHIR does at scale. In leanMultisig, the trace has millions of rows
        and the weight function encodes all AIR constraints (ADD, MUL, memory consistency, etc.)
        simultaneously. WHIR checks that the committed polynomial is both low-degree <em>and</em> satisfies
        the weighted sum constraint — in a single protocol, without a separate composition step.
      </p>
    </Section>
  );
}
