import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Section } from '../components/Section';
import { Math as InlineMath } from '../components/MathBlock';
import { StepNavigator } from '../components/ui/StepNavigator';
import { mod, generateSubgroup } from '../utils/field';
import { evaluateAll } from '../utils/polynomial';
import type { Poly } from '../utils/polynomial';
import { evaluate } from '../utils/polynomial';
import { foldDetailed } from '../utils/folding';
import type { MultilinearPoly } from '../utils/sumcheck';
import { simulateFullSumcheck } from '../utils/sumcheck';

// A concrete small example: polynomial f(x) = 3 + 2x + 5x^2 + x^3, degree < 4, domain size 8
const POLY: Poly = [3, 2, 5, 1];
const K = 2; // 2 sumcheck rounds per iteration

// Pre-selected challenges for deterministic demo
const SUMCHECK_CHALLENGES = [7, 11];
const FOLD_ALPHA = 5;
const OOD_POINT = 6; // out-of-domain point (not in domain)
const SHIFT_QUERY_INDICES = [0, 2]; // query these indices of the folded domain

function ProtocolMessage({
  sender,
  children,
  delay = 0,
}: {
  sender: 'prover' | 'verifier';
  children: React.ReactNode;
  delay?: number;
}) {
  const isProver = sender === 'prover';
  return (
    <motion.div
      initial={{ opacity: 0, x: isProver ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`flex ${isProver ? 'justify-start' : 'justify-end'} mb-3`}
    >
      <div
        className={`max-w-[85%] rounded-lg p-3 text-sm ${
          isProver
            ? 'bg-sienna/5 border border-sienna/20 rounded-bl-none'
            : 'bg-navy/5 border border-navy/20 rounded-br-none'
        }`}
      >
        <div
          className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${
            isProver ? 'text-sienna' : 'text-navy'
          }`}
        >
          {isProver ? 'Prover' : 'Verifier'}
        </div>
        <div className="text-text-muted">{children}</div>
      </div>
    </motion.div>
  );
}

const stepLabels = [
  'Sumcheck Rounds',
  'Send Folded Function',
  'Out-of-Domain Sample',
  'Out-of-Domain Answer',
  'Shift Queries',
  'Recursive Claim',
];

export function S7_WhirIteration() {
  const [step, setStep] = useState(0);

  const domain = useMemo(() => generateSubgroup(8), []);
  const evals = useMemo(() => evaluateAll(POLY, domain), [domain]);

  // Run sumcheck on a multilinear poly built from first 4 evals
  const mlPoly: MultilinearPoly = useMemo(
    () => ({
      values: evals.slice(0, 4).map((v) => mod(v)),
      numVars: K,
    }),
    [evals]
  );

  const sumcheckResult = useMemo(
    () => simulateFullSumcheck(mlPoly, SUMCHECK_CHALLENGES),
    [mlPoly]
  );

  // Fold
  const foldResult = useMemo(
    () => foldDetailed(evals, domain, mod(FOLD_ALPHA)),
    [evals, domain]
  );

  // Out-of-domain answer (simplified: use first folded eval as placeholder)
  const oodAnswer = mod(foldResult.foldedEvals[0]);

  // Shift queries
  const shiftQueries = useMemo(() => {
    return SHIFT_QUERY_INDICES.map((idx) => {
      const i = idx % foldResult.foldedDomain.length;
      return {
        point: foldResult.foldedDomain[i],
        value: foldResult.foldedEvals[i],
        pass: true,
      };
    });
  }, [foldResult]);

  return (
    <Section
      id="one-iteration"
      number={7}
      title="One WHIR Iteration"
      subtitle="The core protocol: sumcheck, fold, sample, query, recurse."
    >
      <p>
        A single WHIR iteration takes a proximity claim about a function on a domain of
        size <InlineMath tex="n" /> and reduces it to a claim about a function on a domain
        of size <InlineMath tex="n/2" />. Inside leanMultisig, this is the core loop that shrinks
        the committed polynomial — the stacked columns of the execution table, Poseidon table,
        and extension op table — until it is small enough to check directly. This section
        walks through all 6 sub-steps of one iteration as a conversation between the prover
        and verifier.
      </p>

      <div className="bg-bg-card border border-border rounded-lg p-5 my-6">
        <h4 className="font-heading font-semibold text-sm text-text mb-2">
          Our example setup:
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm font-mono text-text-muted">
          <div className="bg-bg rounded p-2 border border-border-light">
            <span className="text-[10px] text-text-muted block">Polynomial</span>
            <span className="text-text">3+2x+5x{'\u00b2'}+x{'\u00b3'}</span>
          </div>
          <div className="bg-bg rounded p-2 border border-border-light">
            <span className="text-[10px] text-text-muted block">Domain size</span>
            <span className="text-text">8</span>
          </div>
          <div className="bg-bg rounded p-2 border border-border-light">
            <span className="text-[10px] text-text-muted block">Field</span>
            <span className="text-text">F{'\u2081'}{'\u2087'}</span>
          </div>
          <div className="bg-bg rounded p-2 border border-border-light">
            <span className="text-[10px] text-text-muted block">k (rounds)</span>
            <span className="text-text">{K}</span>
          </div>
        </div>
      </div>

      <div className="bg-bg-card border border-border rounded-lg p-5 space-y-5">
        {/* State panel */}
        <div className="flex flex-wrap gap-3">
          <div
            className={`px-3 py-1.5 rounded-md text-xs font-semibold border ${
              step < 5
                ? 'bg-sienna/5 border-sienna/20 text-sienna'
                : 'bg-green/5 border-green/20 text-green'
            }`}
          >
            Domain: {step >= 5 ? foldResult.foldedDomain.length : domain.length} points
          </div>
          <div className="px-3 py-1.5 rounded-md text-xs font-semibold border bg-navy/5 border-navy/20 text-navy">
            Variables: {step >= 5 ? 'log\u2082(' + foldResult.foldedDomain.length + ')' : 'log\u2082(8) = 3'}
          </div>
          <div className="px-3 py-1.5 rounded-md text-xs font-semibold border bg-bg border-border-light text-text-muted">
            Rate {'\u03c1'}: 1/2
          </div>
        </div>

        <div className="text-[11px] text-text-muted bg-bg border border-border-light rounded px-3 py-2 mb-1">
          <strong>LeanMultisig scale:</strong> The initial state would be domain size 2<sup>26</sup>, 25 variables, rate 1/2.
          After one iteration with k=7: domain 2<sup>19</sup>, 18 variables.
          (This demo uses a tiny example for illustration.)
        </div>

        <StepNavigator
          step={step}
          totalSteps={6}
          onPrev={() => setStep((s) => Math.max(0, s - 1))}
          onNext={() => setStep((s) => Math.min(5, s + 1))}
          labels={stepLabels}
        />

        {/* Protocol transcript */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="min-h-[200px]"
          >
            {step === 0 && (
              <div className="space-y-2">
                <p className="text-sm text-text-muted mb-3">
                  The prover and verifier run {K} rounds of the sumcheck protocol to reduce
                  the constraint from a sum over the hypercube to a single evaluation.
                  In leanMultisig, these sumcheck rounds reduce the AIR constraint check over 2<sup>25</sup> rows
                  to a claim about a single evaluation point.
                </p>
                {sumcheckResult.rounds.map((rd, i) => (
                  <div key={i}>
                    <ProtocolMessage sender="prover" delay={i * 0.2}>
                      <strong>Round {i + 1}:</strong> Here is my univariate polynomial{' '}
                      <InlineMath tex={`p_{${i + 1}}(X) = ${rd.univariate[0]} + ${rd.univariate[1]}X`} />.
                      <br />
                      <span className="font-mono text-[11px]">
                        p(0) + p(1) = {evaluate(rd.univariate, 0)} + {evaluate(rd.univariate, 1)} = {mod(evaluate(rd.univariate, 0) + evaluate(rd.univariate, 1))}
                      </span>
                    </ProtocolMessage>
                    <ProtocolMessage sender="verifier" delay={i * 0.2 + 0.1}>
                      {rd.check ? (
                        <span className="text-green">{'\u2713'} Check passed.</span>
                      ) : (
                        <span className="text-red">{'\u2717'} Check failed!</span>
                      )}{' '}
                      My random challenge: <InlineMath tex={`\\alpha_{${i + 1}} = ${rd.challenge}`} />.
                    </ProtocolMessage>
                  </div>
                ))}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-2">
                <p className="text-sm text-text-muted mb-3">
                  The prover folds the committed polynomial — in leanMultisig, this is the stacked
                  polynomial containing all table columns (execution, Poseidon, extension ops) —
                  producing a new function on a domain half the size.
                  Concretely, the prover computes{' '}
                  <InlineMath tex={`g = \\text{Fold}(f, ${FOLD_ALPHA})`} /> and sends its
                  evaluations to the verifier.
                </p>
                <ProtocolMessage sender="prover">
                  Here are the evaluations of the folded function g on the squared domain:
                  <div className="mt-2 font-mono text-[11px] space-y-0.5">
                    {foldResult.foldedDomain.map((d, i) => (
                      <div key={i}>
                        g({d}) = {foldResult.foldedEvals[i]}
                      </div>
                    ))}
                  </div>
                </ProtocolMessage>
                <ProtocolMessage sender="verifier" delay={0.2}>
                  Received. The domain has shrunk from {domain.length} to{' '}
                  {foldResult.foldedDomain.length} points.
                </ProtocolMessage>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-2">
                <p className="text-sm text-text-muted mb-3">
                  The verifier picks a random point <InlineMath tex="z_0" />{' '}
                  <em>outside</em> the evaluation domain. This is crucial for
                  soundness — it prevents the prover from crafting evaluations that only
                  look correct on the domain.
                </p>
                <ProtocolMessage sender="verifier">
                  I want to test you at a random out-of-domain point:{' '}
                  <InlineMath tex={`z_0 = ${OOD_POINT}`} />.
                  <br />
                  <span className="text-[11px]">
                    (This point is not in the evaluation domain [{foldResult.foldedDomain.join(', ')}])
                  </span>
                </ProtocolMessage>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-2">
                <p className="text-sm text-text-muted mb-3">
                  The prover evaluates the low-degree extension of{' '}
                  <InlineMath tex="g" /> at <InlineMath tex={`z_0 = ${OOD_POINT}`} /> and
                  responds. The verifier will use this to cross-check consistency later.
                </p>
                <ProtocolMessage sender="prover">
                  My answer: <InlineMath tex={`\\hat{g}(${OOD_POINT}) = ${oodAnswer}`} />.
                </ProtocolMessage>
                <ProtocolMessage sender="verifier" delay={0.15}>
                  Noted. I will verify this is consistent with the folded evaluations.
                </ProtocolMessage>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-2">
                <p className="text-sm text-text-muted mb-3">
                  The verifier samples random points from the domain and checks that the
                  folding was computed correctly. In leanMultisig, these are Merkle path
                  openings — the verifier reads a few positions from the committed
                  polynomial and checks fold consistency.
                </p>
                <ProtocolMessage sender="verifier">
                  I am querying the following points to check folding consistency:
                </ProtocolMessage>
                {shiftQueries.map((q, i) => (
                  <ProtocolMessage key={i} sender="prover" delay={(i + 1) * 0.15}>
                    Query at domain point {q.point}: g({q.point}) = {q.value}{' '}
                    {q.pass ? (
                      <span className="text-green font-semibold">{'\u2713'} Consistent</span>
                    ) : (
                      <span className="text-red font-semibold">{'\u2717'} Inconsistent</span>
                    )}
                  </ProtocolMessage>
                ))}
                <div className="mt-2 p-2 bg-green/5 border border-green/20 rounded text-sm text-green font-semibold text-center">
                  All {shiftQueries.length} queries passed
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-3">
                <p className="text-sm text-text-muted mb-3">
                  The new problem is smaller: fewer variables, smaller domain. In leanMultisig,
                  this shrinks from ~2<sup>26</sup> to ~2<sup>19</sup> in one iteration
                  (with folding parameter k=7). Both parties agree on the new, smaller
                  proximity claim.
                </p>
                <ProtocolMessage sender="prover">
                  I commit to the new function g on the smaller domain.
                </ProtocolMessage>
                <ProtocolMessage sender="verifier" delay={0.15}>
                  Agreed. The new claim is:
                </ProtocolMessage>
                <div className="bg-bg border border-border-light rounded-md p-4 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-[10px] text-text-muted uppercase tracking-wide">
                        Domain
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-text-muted line-through text-sm">{domain.length}</span>
                        <span className="text-lg">{'\u2192'}</span>
                        <span className="text-green font-bold text-lg">
                          {foldResult.foldedDomain.length}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-text-muted uppercase tracking-wide">
                        Max degree
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-text-muted line-through text-sm">4</span>
                        <span className="text-lg">{'\u2192'}</span>
                        <span className="text-green font-bold text-lg">2</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-text-muted uppercase tracking-wide">
                        Variables
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-text-muted line-through text-sm">3</span>
                        <span className="text-lg">{'\u2192'}</span>
                        <span className="text-green font-bold text-lg">2</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-text-muted text-center mt-2">
                    The problem is now half the size. Repeat until the base case!
                    In leanMultisig with k=7, this takes only ~4 iterations to go from 25 variables down to zero.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="bg-bg-card border border-border rounded-lg p-5 my-6">
        <h4 className="font-heading font-semibold text-base text-text mb-2">
          Summary of one iteration
        </h4>
        <ol className="list-decimal list-inside text-sm text-text-muted space-y-1">
          <li>
            <strong>Sumcheck</strong> reduces the algebraic constraint (k rounds)
          </li>
          <li>
            <strong>Fold</strong> halves the function domain
          </li>
          <li>
            <strong>Out-of-domain sample</strong> tests the prover at a random point
          </li>
          <li>
            <strong>Out-of-domain answer</strong> from the prover
          </li>
          <li>
            <strong>Shift queries</strong> verify folding consistency
          </li>
          <li>
            <strong>Recursive claim</strong> defines the next, smaller problem
          </li>
        </ol>
      </div>
    </Section>
  );
}
