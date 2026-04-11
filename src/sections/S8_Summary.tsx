import { Section } from '../components/Section';
import { Math as InlineMath } from '../components/MathBlock';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { queryComplexityFormulas } from '../data/benchmarks';

const PROTOCOL_COLORS: Record<string, string> = {
  WHIR: '#8b4513',
  FRI: '#1a365d',
  STIR: '#2f855a',
  BaseFold: '#6b6375',
};

export function S8_Summary() {
  return (
    <Section
      id="why-fast"
      number={8}
      title="Summary"
      subtitle="What makes WHIR different, and where to go from here."
    >
      <h3 id="why-fast-overview" className="font-heading text-xl font-semibold text-text mb-3">
        What We Covered
      </h3>
      <p>
        This visualizer walked through the building blocks of WHIR — from
        Reed-Solomon codes and constrained polynomials, through sumcheck and
        folding, to the full protocol loop. Here's what each piece contributes:
      </p>
      <ul className="list-disc ml-6 my-4 space-y-2">
        <li>
          <strong>Reed-Solomon codes</strong> (Section 2) — encode the trace as a
          polynomial with redundancy, making tampering detectable via random
          sampling.
        </li>
        <li>
          <strong>Constrained Reed-Solomon codes</strong> (Section 3) — add a
          constraint on top: the polynomial must satisfy an equation at every row,
          not just be low-degree.
        </li>
        <li>
          <strong>Sumcheck</strong> (Section 4) — collapses the constraint check
          across all rows into a single evaluation, without reading each row.
        </li>
        <li>
          <strong>Folding</strong> (Section 5) — shrinks the committed polynomial
          onto a half-sized domain using randomness from sumcheck.
        </li>
        <li>
          <strong>The WHIR protocol</strong> (Section 6) — glues sumcheck, folding,
          OOD probes, and shift queries into one recursive iteration that halves the
          problem each time.
        </li>
        <li>
          <strong>Tuning the protocol</strong> (Section 7) — the folding
          parameter <InlineMath tex="k" />, code rate <InlineMath tex="\rho" />, and
          query count <InlineMath tex="t" /> jointly determine security, proof size,
          and performance.
        </li>
      </ul>

      <h3 id="why-whir" className="font-heading text-xl font-semibold text-text mt-10 mb-3">
        Why WHIR
      </h3>
      <p>
        WHIR's core advantage is its <strong>low verification complexity</strong>: the
        total verifier work is <InlineMath tex="O(\lambda / \log(1/\rho))" />,
        which is <strong>independent of the codeword
        length <InlineMath tex="n" /></strong>. This is what "super-fast
        verification" means — as the polynomial grows, the verifier doesn't slow
        down.
      </p>

      <div className="bg-bg-card border border-border rounded-lg p-5 my-6">
        <h4 className="font-heading font-semibold text-base text-text mb-3">
          Query complexity comparison
        </h4>
        <p className="text-sm text-text-muted mb-3">
          Number of queries (Merkle openings) the verifier makes. Here{' '}
          <InlineMath tex="\lambda" /> is the security parameter,{' '}
          <InlineMath tex="\rho" /> is the code rate, and{' '}
          <InlineMath tex="n" /> is the codeword length.
          Fewer queries = smaller proof, faster verification. See
          the{' '}
          <a href="https://eprint.iacr.org/2024/1586" target="_blank" rel="noopener noreferrer" className="underline hover:text-sienna">
            WHIR paper
          </a> (Table 1) for the precise total verifier complexity.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {queryComplexityFormulas.map(([protocol, formula]) => (
            <div
              key={protocol}
              className="bg-bg rounded-md border border-border-light p-3 text-center"
            >
              <div
                className="text-sm font-semibold mb-1"
                style={{ color: PROTOCOL_COLORS[protocol] }}
              >
                {protocol}
              </div>
              <div className="text-[11px] font-mono text-text-muted">{formula}</div>
            </div>
          ))}
        </div>

        {/* Verification complexity chart */}
        <div className="mt-4">
          <p className="text-xs text-text-muted mb-2 text-center">
            Verification cost vs codeword length (<InlineMath tex="\lambda = 100" />,{' '}
            <InlineMath tex="\rho = 1/2" />). BaseFold excluded (linear in{' '}
            <InlineMath tex="n" />, off the chart).
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={(() => {
                const pts: Record<string, number>[] = [];
                for (let logN = 10; logN <= 28; logN += 1) {
                  const lambda = 100;
                  const logInvRho = 1;
                  pts.push({
                    logN,
                    WHIR: lambda / logInvRho,
                    FRI: lambda * logN * logN / logInvRho,
                    STIR: lambda * logN,
                  });
                }
                return pts;
              })()}
              margin={{ top: 8, right: 16, bottom: 8, left: 16 }}
            >
              <CartesianGrid stroke="#e7e3d9" strokeDasharray="3 3" />
              <XAxis
                dataKey="logN"
                type="number"
                domain={[10, 28]}
                ticks={[10, 14, 18, 22, 26]}
                tickFormatter={(v: number) => `2${String.fromCodePoint(...[...`${v}`].map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹'.charCodeAt(Number(c))))}`}
                stroke="#6b6375"
                fontSize={11}
                label={{ value: 'codeword length (n)', position: 'insideBottomRight', offset: -5, fontSize: 10, fill: '#6b6375' }}
              />
              <YAxis
                type="number"
                stroke="#6b6375"
                fontSize={11}
                label={{ value: 'hash ops', angle: -90, position: 'insideLeft', offset: 0, fontSize: 10, fill: '#6b6375' }}
              />
              <Tooltip
                contentStyle={{ fontSize: 11, fontFamily: 'monospace' }}
                formatter={(value) => [Number(value).toLocaleString()]}
                labelFormatter={(logN) => `n = 2^${logN}`}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="WHIR" stroke="#8b4513" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="FRI" stroke="#1a365d" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="STIR" stroke="#c53030" strokeWidth={2} dot={false} strokeDasharray="6 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <p>
        This matters for leanMultisig because the WHIR verifier runs{' '}
        <em>inside</em> the next recursive proof — every microsecond of
        verification time multiplies across the aggregation tree. A faster
        verifier means a smaller recursive circuit, which means cheaper proofs
        at every level.
      </p>

      <h3 id="key-takeaways" className="font-heading text-xl font-semibold text-text mt-10 mb-4">
        Key Properties
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-bg-card border border-border rounded-lg p-4">
          <div className="text-sienna font-heading font-semibold text-sm mb-2">
            ⚡ Super-fast verification
          </div>
          <p className="text-sm text-text-muted">
            Verification time is independent of the polynomial size — it depends
            only on the security parameter and code rate. For leanMultisig, this
            means sub-millisecond verification regardless of trace length.
          </p>
        </div>
        <div className="bg-bg-card border border-border rounded-lg p-4">
          <div className="text-navy font-heading font-semibold text-sm mb-2">
            🔓 No trusted setup
          </div>
          <p className="text-sm text-text-muted">
            WHIR is hash-based — no trusted setup ceremony, no pairing-friendly
            curves. Security depends only on the collision resistance of the hash
            function.
          </p>
        </div>
        <div className="bg-bg-card border border-border rounded-lg p-4">
          <div className="text-navy font-heading font-semibold text-sm mb-2">
            🛡️ Post-quantum secure
          </div>
          <p className="text-sm text-text-muted">
            Because WHIR relies only on hash functions (no elliptic curves or
            pairings), it inherits post-quantum security — the same trust model
            as leanSig's hash-based signatures. The entire leanMultisig stack, from
            signatures to proof aggregation, is quantum-resistant.
          </p>
        </div>
        <div className="bg-bg-card border border-border rounded-lg p-4">
          <div className="text-green font-heading font-semibold text-sm mb-2">
            📐 Native multilinear support
          </div>
          <p className="text-sm text-text-muted">
            WHIR works directly with multilinear polynomials, allowing
            leanMultisig to stack multiple table columns (execution, Poseidon,
            extension ops) into one committed polynomial with no overhead from
            univariate conversions.
          </p>
        </div>
        <div className="bg-bg-card border border-border rounded-lg p-4">
          <div className="text-text font-heading font-semibold text-sm mb-2">
            🎛️ Tunable parameters
          </div>
          <p className="text-sm text-text-muted">
            The folding parameter <InlineMath tex="k" />, code
            rate <InlineMath tex="\rho" />, and query count <InlineMath tex="t" /> can
            be jointly optimized for the deployment target — whether that's
            minimizing on-chain gas or maximizing prover throughput.
          </p>
        </div>
      </div>

      <h3 className="font-heading text-xl font-semibold text-text mt-10 mb-3">
        Further Reading
      </h3>
      <ul className="list-disc ml-6 space-y-2">
        <li>
          <a href="https://eprint.iacr.org/2024/1586" target="_blank" rel="noopener noreferrer" className="underline hover:text-sienna">
            WHIR paper
          </a> — Gal Arnon, Alessandro Chiesa, Giacomo Fenzi, Eylon Yogev.
          Section 8 contains detailed benchmarks comparing WHIR, FRI, STIR,
          and BaseFold under various configurations.
        </li>
        <li>
          <a href="https://eprint.iacr.org/2024/390" target="_blank" rel="noopener noreferrer" className="underline hover:text-sienna">
            STIR paper
          </a> — the predecessor that introduced rate-shifting across rounds,
          achieving near-optimal query complexity for RS proximity testing.
        </li>
        <li>
          <a href="https://github.com/leanEthereum/leanMultisig" target="_blank" rel="noopener noreferrer" className="underline hover:text-sienna">
            leanMultisig
          </a> — source code and spec for the minimal zkVM that uses WHIR for
          post-quantum signature aggregation on Ethereum.
        </li>
        <li>
          <a href="https://gfenzi.io/papers/whir/" target="_blank" rel="noopener noreferrer" className="underline hover:text-sienna">
            Giacomo Fenzi's WHIR blog post
          </a> — an accessible deep-dive by one of the WHIR authors.
        </li>
      </ul>
    </Section>
  );
}
