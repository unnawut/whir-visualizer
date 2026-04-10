import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Section } from '../components/Section';
import { Math as InlineMath, MathBlock } from '../components/MathBlock';
import { Slider } from '../components/ui/Slider';

const TOTAL_VARS = 25; // m = 25, so domain size = 2^25 (leanMultisig scale)

export function S8_RecursiveStructure() {
  const [k, setK] = useState(7);
  const [rateExp, setRateExp] = useState(1); // ρ = 1/2^rateExp, so 1 → 1/2, 2 → 1/4
  const [queriesPerRound, setQueriesPerRound] = useState(128);

  const iterations = useMemo(() => {
    const result: { iteration: number; domainSize: number; numVars: number }[] = [];
    let vars = TOTAL_VARS;
    let iter = 0;
    while (vars > 0) {
      const reduction = Math.min(k, vars);
      const domainSize = Math.pow(2, vars);
      result.push({ iteration: iter, domainSize, numVars: vars });
      vars -= reduction;
      iter++;
    }
    // Base case
    result.push({ iteration: iter, domainSize: Math.pow(2, Math.max(vars, 0)), numVars: Math.max(vars, 0) });
    return result;
  }, [k]);

  const totalIterations = iterations.length - 1; // exclude base case row

  // Simplified: bits of security per query ≈ -log2(ρ) = rateExp
  const bitsPerQuery = Math.max(rateExp, 0.5);
  const securityLevel = Math.floor(queriesPerRound * bitsPerQuery);

  // Proof size estimate: each query opens a Merkle path of depth log2(domainSize/rate).
  // Per iteration: t × merkleDepth hashes. Total across all iterations.
  const proofEstimate = useMemo(() => {
    let total = 0;
    let vars = TOTAL_VARS;
    for (let i = 0; i < totalIterations; i++) {
      const domainVars = vars + rateExp; // domain = degree / rate
      total += queriesPerRound * domainVars;
      vars -= Math.min(k, vars);
    }
    return total;
  }, [k, rateExp, totalIterations, queriesPerRound]);

  // Prover time estimate: dominated by Merkle tree construction per iteration.
  // Each iteration hashes ~2^(vars + rateExp) nodes to build the tree.
  const proverHashes = useMemo(() => {
    let total = 0;
    let vars = TOTAL_VARS;
    for (let i = 0; i < totalIterations; i++) {
      total += Math.pow(2, vars + rateExp);
      vars -= Math.min(k, vars);
    }
    return total;
  }, [k, rateExp, totalIterations]);

  // Verifier time estimate: check t Merkle paths per iteration.
  // Same as proofEstimate (t × merkle_depth per iteration, summed).
  const verifierHashes = proofEstimate;

  // Rough time: ~100ns per hash (Poseidon-like)
  const NS_PER_HASH = 100;
  const formatTime = (hashes: number) => {
    const ns = hashes * NS_PER_HASH;
    if (ns < 1_000) return `${ns} ns`;
    if (ns < 1_000_000) return `${(ns / 1_000).toFixed(1)} µs`;
    if (ns < 1_000_000_000) return `${(ns / 1_000_000).toFixed(1)} ms`;
    return `${(ns / 1_000_000_000).toFixed(2)} s`;
  };

  const maxBarWidth = 500;

  return (
    <Section
      id="full-protocol"
      number={7}
      title="Tuning the Protocol"
      subtitle="How the folding parameter k shapes the number of iterations and the proof tradeoffs."
    >
      <h3 id="full-protocol-overview" className="font-heading text-xl font-semibold text-text mb-3">
        Overview
      </h3>
      <p>
        The full WHIR protocol runs <InlineMath tex="M = \lceil m/k \rceil" /> iterations
        of the process described in Section 6. Each iteration reduces the number of variables
        by <InlineMath tex="k" /> and halves the domain <InlineMath tex="k" /> times.
        After all iterations, the polynomial is so small it can be checked directly.
      </p>
      <p className="mt-3">
        In leanMultisig, the committed polynomial has <InlineMath tex="m \approx 25" /> variables
        (up to 2<sup>25</sup> rows {'\u00d7'} 20 columns stacked together) and the folding
        parameter can vary per iteration. This recursive structure is also critical for
        leanMultisig's aggregation tree: each node produces a proof, and the parent node must
        verify it inside its own circuit. The faster WHIR's verifier, the cheaper each
        level of recursion.
      </p>

      <MathBlock tex="\text{Domain size: } 2^m \xrightarrow{\text{iter 1}} 2^{m-k} \xrightarrow{\text{iter 2}} 2^{m-2k} \xrightarrow{\cdots} 2^0 = 1" />

      {/* Tradeoff explanation */}
      <h3 id="k-tradeoff" className="font-heading text-xl font-semibold text-text mt-10 mb-3">
        The k Tradeoff
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
        <div className="bg-bg-card border border-border rounded-lg p-4">
          <div className="font-heading font-semibold text-sm text-text mb-2">
            Larger k (fewer iterations)
          </div>
          <ul className="text-sm text-text-muted space-y-1 list-disc list-inside">
            <li>Fewer total iterations to reach the base case</li>
            <li>More sumcheck rounds per iteration (higher cost each time)</li>
            <li>Fewer Merkle tree openings = smaller proofs</li>
            <li>LeanMultisig uses initial folding of 7 to quickly reduce the large 2<sup>26</sup> domain</li>
            <li>Better when hash operations are expensive (e.g., on-chain Ethereum verification)</li>
          </ul>
        </div>
        <div className="bg-bg-card border border-border rounded-lg p-4">
          <div className="font-heading font-semibold text-sm text-text mb-2">
            Smaller k (more iterations)
          </div>
          <ul className="text-sm text-text-muted space-y-1 list-disc list-inside">
            <li>More iterations but each is simpler</li>
            <li>Fewer sumcheck rounds per iteration</li>
            <li>More Merkle tree openings needed</li>
            <li>Better when sumcheck is the bottleneck</li>
          </ul>
        </div>
      </div>

      <p className="text-sm text-text-muted">
        In practice, <InlineMath tex="k" /> is chosen to balance these costs for the target
        deployment environment. LeanMultisig uses a large initial folding parameter (k=7) for the
        first iteration to quickly cut the domain from 2<sup>26</sup> down to 2<sup>19</sup>,
        then may use smaller k values for subsequent iterations.
      </p>

      <h3 id="queries-per-round" className="font-heading text-xl font-semibold text-text mt-10 mb-3">
        Queries per Round
      </h3>
      <p>
        At each iteration, the verifier opens <InlineMath tex="t" /> random Merkle
        positions to spot-check the fold. Each query is a Merkle proof — so more
        queries means a bigger proof, but higher confidence that the prover was
        honest.
      </p>
      <p className="my-4">
        The required number of queries depends on the target security
        level <InlineMath tex="\lambda" /> (e.g. 128-bit security). Each query catches
        a cheating prover with some probability — to reach <InlineMath tex="2^{-\lambda}" /> overall
        failure probability, you
        need <InlineMath tex="t = \lambda / \log_2(1/\varepsilon)" /> queries,
        where <InlineMath tex="\varepsilon" /> is the per-query soundness error.
      </p>
      <p className="my-4">
        This connects back to <InlineMath tex="k" />: larger <InlineMath tex="k" /> gives
        the cheating prover more room to hide (worse <InlineMath tex="\varepsilon" />),
        so more queries are needed to compensate. The total proof size is roughly
        <InlineMath tex="t \times" /> (Merkle path length) per iteration —
        a direct tradeoff between security and proof size.
      </p>

      <h3 id="code-rate" className="font-heading text-xl font-semibold text-text mt-10 mb-3">
        Code Rate
      </h3>
      <p>
        The <strong>rate</strong> <InlineMath tex="\rho" /> of the Reed-Solomon code
        is the ratio of the polynomial degree to the domain size.
        A rate of <InlineMath tex="1/2" /> means the domain is twice the polynomial
        degree — half the evaluations are "data" and half are redundancy.
      </p>
      <p className="my-4">
        Lower rate (more redundancy) means each query is more effective at
        catching a cheater — the per-query soundness
        error <InlineMath tex="\varepsilon" /> is smaller, so fewer queries are
        needed. But lower rate also means the prover commits to a larger domain
        (more Merkle leaves, more prover work).
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
        <div className="bg-bg-card border border-border rounded-lg p-4">
          <div className="font-heading font-semibold text-sm text-text mb-2">
            Lower rate (e.g. 1/4)
          </div>
          <ul className="text-sm text-text-muted space-y-1 list-disc list-inside">
            <li>More redundancy — each query is more powerful</li>
            <li>Fewer queries needed for the same security</li>
            <li>Larger domain — heavier prover, bigger Merkle tree</li>
          </ul>
        </div>
        <div className="bg-bg-card border border-border rounded-lg p-4">
          <div className="font-heading font-semibold text-sm text-text mb-2">
            Higher rate (e.g. 1/2)
          </div>
          <ul className="text-sm text-text-muted space-y-1 list-disc list-inside">
            <li>Less redundancy — each query catches less</li>
            <li>More queries needed for the same security</li>
            <li>Smaller domain — lighter prover, faster commitment</li>
          </ul>
        </div>
      </div>
      <p className="text-sm text-text-muted">
        LeanMultisig uses rate <InlineMath tex="\rho = 1/2" />, which is the most
        common choice — it balances prover cost against query efficiency. All three
        parameters (<InlineMath tex="k" />, <InlineMath tex="t" />,{' '}
        <InlineMath tex="\rho" />) are jointly optimized for the target security
        level and deployment environment (e.g. on-chain verification where gas
        cost favors smaller proofs).
      </p>

      <h3 id="funnel-visualization" className="font-heading text-xl font-semibold text-text mt-10 mb-4">
        Interactive Funnel
      </h3>
      <p className="mb-4">
        Adjust the three parameters to see how they interact, using{' '}
        <InlineMath tex="m = 25" /> variables (domain
        size <InlineMath tex="2^{25}" />) — leanMultisig scale.
      </p>

      <div className="bg-bg-card border border-border rounded-lg p-5 space-y-5">
        {/* Funnel SVG */}
        <div className="overflow-x-auto flex justify-center">
          <div className="space-y-1" style={{ maxWidth: maxBarWidth + 100 }}>
            {iterations.map((it, i) => {
              const isBase = i === iterations.length - 1;
              const fraction = it.domainSize / Math.pow(2, TOTAL_VARS);
              const barWidth = Math.max(fraction * maxBarWidth, 40);
              return (
                <motion.div
                  key={`${k}-${i}`}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                >
                  <div className="w-16 text-right text-[11px] font-mono text-text-muted shrink-0">
                    {isBase ? 'Base' : `Iter ${it.iteration}`}
                  </div>
                  <motion.div
                    className={`h-5 rounded-md flex items-center justify-center text-[10px] font-semibold ${
                      isBase
                        ? 'bg-green/15 border border-green/30 text-green'
                        : 'bg-sienna/10 border border-sienna/20 text-sienna'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: barWidth }}
                    transition={{ duration: 0.4, delay: i * 0.06, ease: 'easeOut' }}
                    style={{ minWidth: 40 }}
                  >
                    {!isBase && (
                      <span className="truncate px-2">
                        2{'\u207b'}{'\u00b9'} {'\u00d7'} ... {it.domainSize > 8 ? `2^${it.numVars}` : it.domainSize}
                      </span>
                    )}
                    {isBase && '\u2713'}
                  </motion.div>
                  <div className="text-[10px] text-text-muted shrink-0 w-36">
                    {isBase ? (
                      <span className="text-green font-semibold">Direct check</span>
                    ) : (
                      <>
                        domain = 2<sup>{it.numVars}</sup> = {it.domainSize},
                        {' '}{it.numVars} vars
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Slider
            label="k (folding parameter)"
            value={k}
            min={1}
            max={8}
            onChange={setK}
            displayValue={`k = ${k}`}
          />
          <Slider
            label="ρ (code rate)"
            value={rateExp}
            min={1}
            max={4}
            onChange={setRateExp}
            displayValue={`1/${Math.pow(2, rateExp)}`}
          />
          <Slider
            label="t (queries per round)"
            value={queriesPerRound}
            min={16}
            max={256}
            step={8}
            onChange={setQueriesPerRound}
            displayValue={`${queriesPerRound}`}
          />
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-bg rounded-md border border-border-light p-3">
            <div className="text-[10px] text-text-muted uppercase tracking-wide">Iterations</div>
            <motion.div key={totalIterations} className="text-xl font-bold text-sienna font-mono" initial={{ scale: 1.2 }} animate={{ scale: 1 }} transition={{ duration: 0.2 }}>
              {totalIterations}
            </motion.div>
          </div>
          <div className="bg-bg rounded-md border border-border-light p-3">
            <div className="text-[10px] text-text-muted uppercase tracking-wide">Sumcheck rounds</div>
            <div className="text-xl font-bold text-navy font-mono">{totalIterations * k}</div>
          </div>
          <div className="bg-bg rounded-md border border-border-light p-3">
            <div className="text-[10px] text-text-muted uppercase tracking-wide">Domain shrinkage</div>
            <div className="text-xl font-bold text-green font-mono">2<sup>{k}</sup>{'\u00d7'}</div>
            <div className="text-[10px] text-text-muted">per iteration</div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-bg rounded-md border border-border-light p-3">
            <div className="text-[10px] text-text-muted uppercase tracking-wide">Security level</div>
            <motion.div key={securityLevel} className="text-xl font-bold text-navy font-mono" initial={{ scale: 1.2 }} animate={{ scale: 1 }} transition={{ duration: 0.2 }}>
              {securityLevel}-bit
            </motion.div>
            <div className="text-[10px] text-text-muted">
              {securityLevel < 32 ? '"phone passcode"'
                : securityLevel < 64 ? '"your ex\'s birthday"'
                : securityLevel < 80 ? '"DES, broken by EFF for $250k in 1998"'
                : securityLevel < 100 ? '"NIST deprecated this range in 2010"'
                : securityLevel < 128 ? '"100-bit — WHIR paper\'s benchmark target"'
                : securityLevel < 192 ? '"AES-128 — what banks use"'
                : '"AES-192 — classified military comms"'}
            </div>
          </div>
          <div className="bg-bg rounded-md border border-border-light p-3">
            <div className="text-[10px] text-text-muted uppercase tracking-wide">Proof size</div>
            <motion.div key={proofEstimate} className="text-xl font-bold text-sienna font-mono" initial={{ scale: 1.2 }} animate={{ scale: 1 }} transition={{ duration: 0.2 }}>
              ~{proofEstimate * 32 >= 1024 ? `${(proofEstimate * 32 / 1024).toFixed(1)} KB` : `${proofEstimate * 32} B`}
            </motion.div>
            <div className="text-[10px] text-text-muted">{proofEstimate} hashes × 32B</div>
          </div>
          <div className="bg-bg rounded-md border border-border-light p-3">
            <div className="text-[10px] text-text-muted uppercase tracking-wide">Est. proving</div>
            <motion.div key={proverHashes} className="text-lg font-bold text-sienna font-mono" initial={{ scale: 1.2 }} animate={{ scale: 1 }} transition={{ duration: 0.2 }}>
              ~{formatTime(proverHashes)}
            </motion.div>
          </div>
          <div className="bg-bg rounded-md border border-border-light p-3">
            <div className="text-[10px] text-text-muted uppercase tracking-wide">Est. verifying</div>
            <motion.div key={verifierHashes} className="text-lg font-bold text-green font-mono" initial={{ scale: 1.2 }} animate={{ scale: 1 }} transition={{ duration: 0.2 }}>
              ~{formatTime(verifierHashes)}
            </motion.div>
          </div>
        </div>
        <div className="text-[9px] text-text-muted text-center">
          Time estimates assume ~100ns/hash (Poseidon-like). Actual times vary with hardware and hash function.
        </div>

      </div>
    </Section>
  );
}
