import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Section } from '../components/Section';
import { Math as InlineMath, MathBlock } from '../components/MathBlock';
import { StepNavigator } from '../components/ui/StepNavigator';
import { mod } from '../utils/field';
import { evaluate } from '../utils/polynomial';
import type { MultilinearPoly } from '../utils/sumcheck';
import { simulateFullSumcheck } from '../utils/sumcheck';

// Fixed example polynomial: f(X1, X2) on {0,1}^2
// Index mapping: 0 = (0,0), 1 = (0,1), 2 = (1,0), 3 = (1,1)
const POLY_VALUES = [3, 1, 5, 4]; // f(0,0)=3, f(0,1)=1, f(1,0)=5, f(1,1)=4 => sum=13
const POLY: MultilinearPoly = { values: POLY_VALUES, numVars: 2 };
const CHALLENGES = [6, 10]; // pre-selected verifier challenges

const stepLabels = [
  'The Claim',
  'Round 1: Collapse X\u2081',
  'Round 2: Collapse X\u2082',
  'Final Check',
];

export function S5_Sumcheck() {
  const [step, setStep] = useState(0);

  const result = useMemo(
    () => simulateFullSumcheck(POLY, CHALLENGES),
    []
  );

  // Hypercube grid coordinates for visualization
  const gridVertices = [
    { label: '(0,0)', x: 60, y: 110, val: POLY_VALUES[0], xi: [0, 0] },
    { label: '(0,1)', x: 180, y: 110, val: POLY_VALUES[1], xi: [0, 1] },
    { label: '(1,0)', x: 60, y: 30, val: POLY_VALUES[2], xi: [1, 0] },
    { label: '(1,1)', x: 180, y: 30, val: POLY_VALUES[3], xi: [1, 1] },
  ];

  // Determine which vertices are "active" per step
  const getVertexOpacity = (_v: typeof gridVertices[0]) => {
    if (step === 0) return 1;
    if (step === 1) return 1; // all visible, dimension X1 being collapsed
    if (step === 2) return 0.3; // most dimmed, only the "line" along X2
    return 0.2;
  };

  // The dimension being collapsed in current step
  const collapsingDim = step === 1 ? 0 : step === 2 ? 1 : -1;

  return (
    <Section
      id="sumcheck"
      number={5}
      title="The Sumcheck Protocol"
      subtitle="Reduce an exponential-size sum to a single evaluation, one variable at a time."
    >
      <p>
        The <strong>sumcheck protocol</strong> is one of the most important building blocks
        in modern proof systems. It solves the following problem: the prover claims that the
        sum of a multilinear polynomial over the boolean hypercube{' '}
        <InlineMath tex="\{0,1\}^m" /> equals some value <InlineMath tex="H" />. The verifier
        wants to check this claim <em>without</em> evaluating all{' '}
        <InlineMath tex="2^m" /> points.
      </p>

      <MathBlock tex="\sum_{b \in \{0,1\}^m} f(b) \stackrel{?}{=} H" />

      <p>
        The protocol works in <InlineMath tex="m" /> rounds. In each round, the prover
        "collapses" one variable by sending a univariate polynomial. The verifier checks
        it and replies with a random challenge. After <InlineMath tex="m" /> rounds,
        the verifier only needs to evaluate <InlineMath tex="f" /> at a single point!
      </p>

      <div className="bg-bg-card border border-border rounded-lg p-5 my-6 space-y-2">
        <h4 className="font-heading font-semibold text-base text-text">How each round works:</h4>
        <div className="text-sm text-text-muted space-y-2">
          <p>
            <strong>Prover sends:</strong> A univariate polynomial{' '}
            <InlineMath tex="p_i(X_i)" /> obtained by summing <InlineMath tex="f" /> over
            all remaining variables except <InlineMath tex="X_i" />.
          </p>
          <p>
            <strong>Verifier checks:</strong>{' '}
            <InlineMath tex="p_i(0) + p_i(1) = \text{current claimed sum}" />. This works
            because substituting 0 and 1 for <InlineMath tex="X_i" /> and adding recovers
            the full sum over that variable.
          </p>
          <p>
            <strong>Verifier sends:</strong> A random challenge{' '}
            <InlineMath tex="\alpha_i" />.
          </p>
          <p>
            <strong>New claim:</strong>{' '}
            <InlineMath tex="p_i(\alpha_i)" /> becomes the claimed sum for the next round.
          </p>
        </div>
      </div>

      <h3 id="sumcheck-step-by-step" className="font-heading text-xl font-semibold text-text mt-10 mb-4">
        Step-by-Step Example
      </h3>
      <p className="mb-4">
        Let's walk through the full sumcheck on a 2-variable polynomial in{' '}
        <InlineMath tex="\mathbb{F}_{17}" />. Use the arrows to step through the protocol.
      </p>

      <div className="bg-bg-card border border-border rounded-lg p-5 space-y-5">
        <StepNavigator
          step={step}
          totalSteps={4}
          onPrev={() => setStep((s) => Math.max(0, s - 1))}
          onNext={() => setStep((s) => Math.min(3, s + 1))}
          labels={stepLabels}
        />

        {/* Hypercube visualization */}
        <div className="flex justify-center">
          <svg viewBox="0 0 240 150" className="w-full max-w-[280px]">
            {/* Edges */}
            {[
              [0, 1], [2, 3], [0, 2], [1, 3],
            ].map(([a, b], i) => {
              const va = gridVertices[a];
              const vb = gridVertices[b];
              // Highlight the dimension being collapsed
              const isCollapsing =
                collapsingDim === 0
                  ? va.xi[1] === vb.xi[1] && va.xi[0] !== vb.xi[0]
                  : collapsingDim === 1
                  ? va.xi[0] === vb.xi[0] && va.xi[1] !== vb.xi[1]
                  : false;

              return (
                <motion.line
                  key={i}
                  x1={va.x}
                  y1={va.y}
                  x2={vb.x}
                  y2={vb.y}
                  stroke={isCollapsing ? '#8b4513' : '#e0dcd4'}
                  strokeWidth={isCollapsing ? 2.5 : 1.5}
                  animate={{
                    strokeOpacity: step >= 3 ? 0.2 : isCollapsing ? 1 : 0.5,
                  }}
                  transition={{ duration: 0.4 }}
                />
              );
            })}

            {/* Vertices */}
            {gridVertices.map((v, i) => (
              <motion.g
                key={i}
                animate={{
                  opacity: getVertexOpacity(v),
                }}
                transition={{ duration: 0.4 }}
              >
                <circle
                  cx={v.x}
                  cy={v.y}
                  r={20}
                  fill="#fefdfb"
                  stroke="#8b4513"
                  strokeWidth={1.5}
                />
                <text
                  x={v.x}
                  y={v.y - 2}
                  textAnchor="middle"
                  className="text-[13px] font-mono font-bold"
                  fill="#8b4513"
                >
                  {v.val}
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
              </motion.g>
            ))}

            {/* Collapsing arrow */}
            {collapsingDim >= 0 && (
              <motion.text
                x={120}
                y={145}
                textAnchor="middle"
                className="text-[10px] font-semibold"
                fill="#8b4513"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                Collapsing X{collapsingDim + 1}
              </motion.text>
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
            {step === 0 && (
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
                  Round 1: Collapse <InlineMath tex="X_1" />
                </h4>
                <p className="text-sm text-text-muted">
                  The prover computes <InlineMath tex="p_1(X_1)" /> by summing over{' '}
                  <InlineMath tex="X_2 \in \{0,1\}" />:
                </p>
                {(() => {
                  const rd = result.rounds[0];
                  const [c0, c1] = rd.univariate;
                  const g0 = evaluate(rd.univariate, 0);
                  const g1 = evaluate(rd.univariate, 1);
                  return (
                    <>
                      <MathBlock tex={`p_1(X_1) = ${c0} + ${c1 >= 0 ? c1 : `(${c1})`}\\cdot X_1 \\pmod{17}`} />
                      <div className="bg-bg-card rounded p-3 space-y-1 text-sm font-mono text-text-muted">
                        <p>p{'\u2081'}(0) = {g0}</p>
                        <p>p{'\u2081'}(1) = {g1}</p>
                        <p>
                          p{'\u2081'}(0) + p{'\u2081'}(1) = {mod(g0 + g1)}{' '}
                          {rd.check ? (
                            <span className="text-green">{'\u2713'} = {rd.claimedSum}</span>
                          ) : (
                            <span className="text-red">{'\u2717'} {'\u2260'} {rd.claimedSum}</span>
                          )}
                        </p>
                      </div>
                      <p className="text-sm text-text-muted">
                        Verifier sends random challenge{' '}
                        <InlineMath tex={`\\alpha_1 = ${rd.challenge}`} />. New claimed sum:{' '}
                        <InlineMath tex={`p_1(${rd.challenge}) = ${evaluate(rd.univariate, rd.challenge)}`} />.
                      </p>
                    </>
                  );
                })()}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <h4 className="font-heading font-semibold text-base text-text">
                  Round 2: Collapse <InlineMath tex="X_2" />
                </h4>
                <p className="text-sm text-text-muted">
                  Now with <InlineMath tex={`X_1`} /> fixed to{' '}
                  <InlineMath tex={`\\alpha_1 = ${CHALLENGES[0]}`} />, the prover
                  computes <InlineMath tex="p_2(X_2)" />:
                </p>
                {(() => {
                  const rd = result.rounds[1];
                  const [c0, c1] = rd.univariate;
                  const g0 = evaluate(rd.univariate, 0);
                  const g1 = evaluate(rd.univariate, 1);
                  return (
                    <>
                      <MathBlock tex={`p_2(X_2) = ${c0} + ${c1 >= 0 ? c1 : `(${c1})`}\\cdot X_2 \\pmod{17}`} />
                      <div className="bg-bg-card rounded p-3 space-y-1 text-sm font-mono text-text-muted">
                        <p>p{'\u2082'}(0) = {g0}</p>
                        <p>p{'\u2082'}(1) = {g1}</p>
                        <p>
                          p{'\u2082'}(0) + p{'\u2082'}(1) = {mod(g0 + g1)}{' '}
                          {rd.check ? (
                            <span className="text-green">{'\u2713'} = {rd.claimedSum}</span>
                          ) : (
                            <span className="text-red">{'\u2717'} {'\u2260'} {rd.claimedSum}</span>
                          )}
                        </p>
                      </div>
                      <p className="text-sm text-text-muted">
                        Verifier sends random challenge{' '}
                        <InlineMath tex={`\\alpha_2 = ${rd.challenge}`} />. New claimed value:{' '}
                        <InlineMath tex={`p_2(${rd.challenge}) = ${evaluate(rd.univariate, rd.challenge)}`} />.
                      </p>
                    </>
                  );
                })()}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <h4 className="font-heading font-semibold text-base text-text">
                  Final Check
                </h4>
                <p className="text-sm text-text-muted">
                  All variables have been fixed. The verifier now evaluates{' '}
                  <InlineMath tex={`f(${CHALLENGES[0]}, ${CHALLENGES[1]})`} /> directly
                  and checks:
                </p>
                {(() => {
                  const lastRound = result.rounds[result.rounds.length - 1];
                  const lastClaim = evaluate(lastRound.univariate, lastRound.challenge);
                  const pass = mod(result.finalValue) === mod(lastClaim);
                  return (
                    <>
                      <MathBlock tex={`f(${CHALLENGES[0]}, ${CHALLENGES[1]}) = ${result.finalValue}`} />
                      <div
                        className={`p-3 rounded-lg border text-sm font-semibold flex items-center gap-2 ${
                          pass
                            ? 'bg-green/5 border-green/30 text-green'
                            : 'bg-red/5 border-red/30 text-red'
                        }`}
                      >
                        <span className="text-lg">{pass ? '\u2713' : '\u2717'}</span>
                        <span>
                          f({CHALLENGES[0]}, {CHALLENGES[1]}) = {result.finalValue}{' '}
                          {pass ? '=' : '\u2260'} p{'\u2082'}({CHALLENGES[1]}) = {lastClaim}
                        </span>
                      </div>
                      <p className="text-sm text-text-muted mt-2">
                        {pass
                          ? 'The protocol succeeds. The verifier is convinced that the original sum was correct, having only evaluated the polynomial at a single random point.'
                          : 'The protocol detected an inconsistency!'}
                      </p>
                    </>
                  );
                })()}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="bg-bg-card border border-border rounded-lg p-5 my-6">
        <h4 className="font-heading font-semibold text-base text-text mb-2">
          Why is this efficient?
        </h4>
        <p className="text-sm text-text-muted">
          Instead of checking <InlineMath tex="2^m" /> evaluations, the verifier only
          exchanges <InlineMath tex="m" /> messages and evaluates{' '}
          <InlineMath tex="f" /> at <strong>one</strong> point. For{' '}
          <InlineMath tex="m = 20" />, that is 1 evaluation instead of over a million.
          The sumcheck protocol is the engine that powers WHIR's constraint reduction.
        </p>
      </div>
    </Section>
  );
}
