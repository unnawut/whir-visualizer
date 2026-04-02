import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Section } from '../components/Section';
import { Math as InlineMath } from '../components/MathBlock';
import { Button } from '../components/ui/Button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  benchmarks100bit,
  benchmarks128bit,
  queryComplexityFormulas,
} from '../data/benchmarks';

type Metric = 'proofSize' | 'verifierTime' | 'proverTime';

const PROTOCOL_COLORS: Record<string, string> = {
  WHIR: '#8b4513',
  FRI: '#1a365d',
  STIR: '#2f855a',
  BaseFold: '#6b6375',
};

const metricConfig: Record<
  Metric,
  { label: string; unit: string; key: keyof typeof benchmarks100bit[0]; formatter: (v: number) => string }
> = {
  proofSize: {
    label: 'Proof Size',
    unit: 'KiB',
    key: 'proofSizeKB',
    formatter: (v: number) => `${v} KiB`,
  },
  verifierTime: {
    label: 'Verifier Time',
    unit: '\u00b5s',
    key: 'verifierTimeUs',
    formatter: (v: number) => `${v} \u00b5s`,
  },
  proverTime: {
    label: 'Prover Time',
    unit: 's',
    key: 'proverTimeS',
    formatter: (v: number) => `${v} s`,
  },
};

export function S9_Performance() {
  const [securityBits, setSecurityBits] = useState<100 | 128>(100);
  const [activeMetric, setActiveMetric] = useState<Metric>('verifierTime');

  const benchmarks = securityBits === 100 ? benchmarks100bit : benchmarks128bit;

  const chartData = useMemo(() => {
    const cfg = metricConfig[activeMetric];
    return benchmarks.map((b) => ({
      name: b.protocol,
      value: b[cfg.key] as number,
      fill: PROTOCOL_COLORS[b.protocol] || '#6b6375',
    }));
  }, [benchmarks, activeMetric]);

  const cfg = metricConfig[activeMetric];

  return (
    <Section
      id="why-fast"
      number={9}
      title="Why WHIR is Fast"
      subtitle="Concrete performance numbers and comparison with FRI, STIR, and BaseFold."
    >
      <h3 id="why-fast-overview" className="font-heading text-xl font-semibold text-text mb-3">
        Overview
      </h3>
      <p>
        LeanMultisig chose WHIR specifically because of its verification speed. For recursive
        aggregation, the WHIR verifier runs <em>inside</em> the next proof — so every
        microsecond of verification time multiplies across recursion levels. WHIR
        achieves the <strong>fastest verification time</strong> among comparable proximity
        testing protocols: ~400{'\u00b5'}s at 100-bit security vs FRI's ~1.5ms, meaning the
        recursive circuit is roughly 4x smaller. Its key advantage is that the verifier's
        work is dominated by reading the proof and hashing — there is very little algebraic
        computation. On-chain, WHIR's low query complexity means fewer Merkle path
        openings and lower gas costs for Ethereum validators.
      </p>

      <div className="bg-bg-card border border-border rounded-lg p-5 my-6">
        <h4 className="font-heading font-semibold text-base text-text mb-3">
          Query complexity comparison
        </h4>
        <p className="text-sm text-text-muted mb-3">
          The number of queries the verifier makes determines both proof size and verification
          time. Here <InlineMath tex="\lambda" /> is the security parameter and{' '}
          <InlineMath tex="n" /> is the codeword length:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(queryComplexityFormulas).map(([protocol, formula]) => (
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
      </div>

      <h3 id="benchmark-comparison" className="font-heading text-xl font-semibold text-text mt-10 mb-4">
        Benchmark Comparison
      </h3>
      <p className="mb-4">
        These benchmarks show why LeanMultisig uses WHIR rather than FRI or BaseFold.
        Measured for degree <InlineMath tex="2^{22}" /> polynomials at rate{' '}
        <InlineMath tex="\rho = 1/2" />. Data from the WHIR paper (Section 8).
      </p>

      <div className="bg-bg-card border border-border rounded-lg p-5 space-y-4">
        {/* Security toggle */}
        <div className="flex items-center gap-2 justify-center">
          <span className="text-sm text-text-muted">Security level:</span>
          <Button
            variant={securityBits === 100 ? 'primary' : 'ghost'}
            onClick={() => setSecurityBits(100)}
          >
            100-bit
          </Button>
          <Button
            variant={securityBits === 128 ? 'primary' : 'ghost'}
            onClick={() => setSecurityBits(128)}
          >
            128-bit
          </Button>
        </div>

        {/* Metric tabs */}
        <div className="flex items-center gap-2 justify-center flex-wrap">
          {(Object.keys(metricConfig) as Metric[]).map((m) => (
            <Button
              key={m}
              variant={activeMetric === m ? 'secondary' : 'ghost'}
              onClick={() => setActiveMetric(m)}
            >
              {metricConfig[m].label}
            </Button>
          ))}
        </div>

        {/* Chart */}
        <motion.div
          key={`${securityBits}-${activeMetric}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0dcd4" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#2c2c2c' }}
                axisLine={{ stroke: '#e0dcd4' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6b6375' }}
                axisLine={{ stroke: '#e0dcd4' }}
                label={{
                  value: cfg.unit,
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 11, fill: '#6b6375' },
                }}
              />
              <Tooltip
                formatter={(value) => {
                  if (typeof value !== 'number') return [String(value), ''];
                  return [cfg.formatter(value), cfg.label];
                }}
                contentStyle={{
                  backgroundColor: '#fefdfb',
                  border: '1px solid #e0dcd4',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar
                dataKey="value"
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
              >
                {chartData.map((entry, index) => (
                  <motion.rect
                    key={index}
                    fill={entry.fill}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Data table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-center border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 px-3 text-text-muted font-medium text-left">Protocol</th>
                <th className="py-2 px-3 text-text-muted font-medium">Proof Size (KiB)</th>
                <th className="py-2 px-3 text-text-muted font-medium">Verifier ({'\u00b5'}s)</th>
                <th className="py-2 px-3 text-text-muted font-medium">Prover (s)</th>
              </tr>
            </thead>
            <tbody>
              {benchmarks.map((b) => (
                <tr
                  key={b.protocol}
                  className={`border-b border-border-light ${
                    b.protocol === 'WHIR' ? 'bg-sienna/5' : ''
                  }`}
                >
                  <td
                    className="py-2 px-3 font-semibold text-left"
                    style={{ color: PROTOCOL_COLORS[b.protocol] }}
                  >
                    {b.protocol}
                  </td>
                  <td className="py-2 px-3 font-mono">{b.proofSizeKB}</td>
                  <td className="py-2 px-3 font-mono">{b.verifierTimeUs}</td>
                  <td className="py-2 px-3 font-mono">{b.proverTimeS}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Key takeaways */}
      <h3 id="key-takeaways" className="font-heading text-xl font-semibold text-text mt-10 mb-4">
        Key Takeaways
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-bg-card border border-border rounded-lg p-4">
          <div className="text-sienna font-heading font-semibold text-sm mb-2">
            Fastest Verification
          </div>
          <p className="text-sm text-text-muted">
            WHIR verification takes approximately <strong>400{'\u00b5'}s</strong> at 100-bit
            security — roughly 4x faster than FRI and 2x faster than STIR. This enables
            efficient recursive aggregation in LeanMultisig: each level of the aggregation tree
            runs the verifier inside the next proof, so faster verification directly shrinks
            the recursive circuit.
          </p>
        </div>
        <div className="bg-bg-card border border-border rounded-lg p-4">
          <div className="text-navy font-heading font-semibold text-sm mb-2">
            Compact Proofs
          </div>
          <p className="text-sm text-text-muted">
            Proof sizes are comparable to STIR (76 KiB at 100-bit security) and
            significantly smaller than FRI (149 KiB) and BaseFold (564 KiB). For LeanMultisig,
            smaller proofs mean less on-chain data for Ethereum validators to process,
            reducing calldata costs in the aggregation contract.
          </p>
        </div>
        <div className="bg-bg-card border border-border rounded-lg p-4">
          <div className="text-green font-heading font-semibold text-sm mb-2">
            No Trusted Setup
          </div>
          <p className="text-sm text-text-muted">
            WHIR is hash-based — it requires no trusted setup ceremony and no
            pairing-friendly curves. This gives LeanMultisig the same trust model as its
            leanSig post-quantum signatures: security depends only on the collision
            resistance of the hash function, making the entire system post-quantum secure.
          </p>
        </div>
        <div className="bg-bg-card border border-border rounded-lg p-4">
          <div className="text-text font-heading font-semibold text-sm mb-2">
            Native Multilinear Support
          </div>
          <p className="text-sm text-text-muted">
            WHIR works natively with multilinear polynomials, which allows LeanMultisig's simple
            stacking approach: multiple table polynomials (execution, Poseidon, extension ops)
            are concatenated into one and committed via a single WHIR instance — no overhead
            from univariate FFT commitment schemes.
          </p>
        </div>
      </div>

      <p className="mt-8 text-sm text-text-muted text-center italic">
        WHIR combines the sumcheck protocol with RS code folding to achieve the best known
        verification complexity for IOPs of proximity:{' '}
        <InlineMath tex="O(\lambda + \log n)" /> queries per iteration.
      </p>
    </Section>
  );
}
