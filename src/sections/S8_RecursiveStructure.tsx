import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Section } from '../components/Section';
import { Math as InlineMath, MathBlock } from '../components/MathBlock';
import { Slider } from '../components/ui/Slider';
import { Button } from '../components/ui/Button';

const TOTAL_VARS = 25; // m = 25, so domain size = 2^25 (leanMultisig scale)

export function S8_RecursiveStructure() {
  const [k, setK] = useState(1);
  const [rateExp, setRateExp] = useState(1); // ρ = 1/2^rateExp, so 1 → 1/2, 2 → 1/4
  const [queriesPerRound, setQueriesPerRound] = useState(16);

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

  // Simplified security model:
  // Each query gives ~log2(1/ρ) = rateExp bits of security.
  // Union bound over M iterations costs log2(M) bits.
  // security ≈ t × rateExp − log2(⌈m/k⌉)
  const securityLevel = Math.max(0, Math.floor(
    queriesPerRound * rateExp - Math.log2(totalIterations)
  ));

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

  // Rough time: ~15ns per hash (optimized Poseidon over KoalaBear with SIMD)
  // Calibrated to match leanMultisig's reported ~1s proving time
  const NS_PER_HASH = 15;
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

      <p className="mb-4">
        Try moving each slider one at a time to see how a single parameter
        affects security, proof size, and proving/verification time. Then
        hit <strong>leanMultisig preset</strong> to see its configuration.
      </p>
      <div className="bg-bg-card border border-border rounded-lg p-5 space-y-5">
        {/* Sliders + Reset */}
        <div className="flex items-end gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
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
          <Button variant="secondary" onClick={() => { setK(1); setRateExp(1); setQueriesPerRound(16); }}>
            Reset
          </Button>
        </div>

        <div className="flex items-center justify-end">
          <button
            onClick={() => { setK(7); setRateExp(1); setQueriesPerRound(105); }}
            className="cursor-pointer text-[11px] text-text-muted hover:text-sienna transition-colors underline underline-offset-2"
          >
            Apply leanMultisig-like preset (k=7, ρ=1/2, t≈105)
          </button>
        </div>

        {/* Metric bars — normalized horizontal bars for each output */}
        {(() => {
          const proofBytes = proofEstimate * 32;
          const proveMs = proverHashes * 0.0001; // 100ns per hash → ms
          const verifyMs = verifierHashes * 0.0001;
          const metrics = [
            {
              label: 'Security',
              value: `${securityLevel}-bit`,
              sub: securityLevel < 8 ? '"what\'s security?"'
                : securityLevel < 16 ? '"combination lock"'
                : securityLevel < 32 ? '"phone passcode"'
                : securityLevel < 64 ? '"your ex\'s birthday"'
                : securityLevel < 80 ? '"DES, broken by EFF for $250k in 1998"'
                : securityLevel < 100 ? '"NIST deprecated this range in 2010"'
                : securityLevel < 128 ? '"100-bit — WHIR paper\'s benchmark target"'
                : securityLevel < 192 ? '"AES-128 — what banks use"'
                : '"AES-192 — classified military comms"',
              pct: Math.min(securityLevel / 256, 1),
              color: securityLevel >= 128 ? '#2f855a' : securityLevel >= 100 ? '#1a365d' : '#c53030',
            },
            {
              label: 'Proof size',
              value: proofBytes >= 1024 * 1024
                ? `${(proofBytes / (1024 * 1024)).toFixed(1)} MB`
                : proofBytes >= 1024
                ? `${(proofBytes / 1024).toFixed(1)} KB`
                : `${proofBytes} B`,
              sub: `${proofEstimate.toLocaleString()} hashes × 32B`,
              // Log scale: 1KB=0.1, 100KB=0.5, 10MB=1
              pct: Math.min(Math.log10(Math.max(proofBytes, 1)) / 7, 1),
              color: proofBytes < 100 * 1024 ? '#2f855a' : proofBytes < 1024 * 1024 ? '#1a365d' : '#c53030',
            },
            {
              label: 'Proving time',
              value: `~${formatTime(proverHashes)}`,
              sub: `~${(proverHashes / 1e6).toFixed(1)}M hashes`,
              // Log scale calibrated for m=25: ~1s (best) to ~100s (worst with high rate)
              pct: Math.min(Math.max((Math.log10(Math.max(proveMs, 1)) - 2) / 3, 0.05), 1),
              color: proveMs < 2000 ? '#2f855a' : proveMs < 10000 ? '#1a365d' : '#c53030',
            },
            {
              label: 'Verification time',
              value: `~${formatTime(verifierHashes)}`,
              sub: `~${verifierHashes.toLocaleString()} hashes`,
              // Log scale: 1µs=0.05, 1ms=0.3, 100ms=0.7
              pct: Math.min((Math.log10(Math.max(verifyMs, 0.0001)) + 4) / 7, 1),
              color: verifyMs < 1 ? '#2f855a' : verifyMs < 10 ? '#1a365d' : '#c53030',
            },
          ];
          return (
            <div className="space-y-3">
              {metrics.map((m, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-text">{m.label}</span>
                    <span className="text-[12px] font-mono font-bold" style={{ color: m.color }}>{m.value}</span>
                  </div>
                  <div className="h-3 rounded-full bg-border overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: m.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${m.pct * 100}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="text-[9px] text-text-muted mt-0.5">{m.sub}</div>
                </div>
              ))}
            </div>
          );
        })()}


        <div className="text-xs text-text-muted space-y-1 border-t border-border-light pt-3 mt-2">
          <div className="font-semibold text-text text-sm">Assumptions (simplified model)</div>
          <ul className="list-disc ml-4 space-y-0.5">
            <li><strong>Security:</strong> <InlineMath tex="\lambda \approx t \times \log_2(1/\rho) - \log_2(\lceil m/k \rceil)" />. Each query gives ~<InlineMath tex="\log_2(1/\rho)" /> bits of security, minus a union bound over iterations. Real WHIR uses the Johnson Bound for tighter analysis.</li>
            <li><strong>Proof size:</strong> <InlineMath tex="t \times \text{(Merkle depth per iteration)}" /> summed across iterations, at 32 bytes per hash. Excludes sumcheck polynomials and other small prover messages.</li>
            <li><strong>Proving time:</strong> modeled as Merkle tree construction (<InlineMath tex="\sim 2^{m + \log_2(1/\rho)}" /> hashes for the first iteration). Uses ~15ns effective cost per hash operation, calibrated to match leanMultisig's reported ~1s total proving time on modern x86-64 hardware (AVX-512/SIMD, multi-threaded, e.g. AMD EPYC or Intel Xeon). This effective rate absorbs NTT, sumcheck, folding, and field arithmetic into the hash cost.</li>
            <li><strong>Verification time:</strong> <InlineMath tex="t \times \text{(Merkle depth)}" /> hash checks per iteration, same ~15ns effective cost. Verification is single-threaded and memory-light — representative of commodity hardware (laptop or server).</li>
            <li><strong>leanMultisig preset:</strong> Uses k=7 initial / k=5 subsequent (simplified to k=7 here), ρ=1/2 for leaf proofs, 123-bit hash security with 18-bit proof-of-work grinding giving ~105-bit effective query security. Queries are computed dynamically via the Johnson Bound, not hardcoded.</li>
          </ul>
        </div>

      </div>
    </Section>
  );
}
