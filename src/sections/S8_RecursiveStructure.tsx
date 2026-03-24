import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Section } from '../components/Section';
import { Math as InlineMath, MathBlock } from '../components/MathBlock';
import { Slider } from '../components/ui/Slider';

const TOTAL_VARS = 8; // m = 8, so domain size = 2^8 = 256

export function S8_RecursiveStructure() {
  const [k, setK] = useState(2);

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
  const maxBarWidth = 500;

  return (
    <Section
      id="full-protocol"
      number={8}
      title="The Full Protocol: Recursive Structure"
      subtitle="Repeated iterations shrink the problem exponentially until it is trivially small."
    >
      <p>
        The full WHIR protocol runs <InlineMath tex="M = \lceil m/k \rceil" /> iterations
        of the process described in Section 6. Each iteration reduces the number of variables
        by <InlineMath tex="k" /> and halves the domain <InlineMath tex="k" /> times.
        After all iterations, the polynomial is so small it can be checked directly.
      </p>

      <MathBlock tex="\text{Domain size: } 2^m \xrightarrow{\text{iter 1}} 2^{m-k} \xrightarrow{\text{iter 2}} 2^{m-2k} \xrightarrow{\cdots} 2^0 = 1" />

      <h3 id="funnel-visualization" className="font-heading text-xl font-semibold text-text mt-8 mb-4">
        Funnel Visualization
      </h3>
      <p className="mb-4">
        Adjust the folding parameter <InlineMath tex="k" /> to see how it affects the
        number of iterations. Starting with <InlineMath tex="m = {8}" /> variables
        (domain size <InlineMath tex="2^8 = 256" />).
      </p>

      <div className="bg-bg-card border border-border rounded-lg p-5 space-y-5">
        <Slider
          label="k (variables reduced per iteration)"
          value={k}
          min={1}
          max={4}
          onChange={setK}
          displayValue={`k = ${k} (${totalIterations} iterations)`}
        />

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
                  {/* Label */}
                  <div className="w-16 text-right text-[11px] font-mono text-text-muted shrink-0">
                    {isBase ? 'Base' : `Iter ${it.iteration}`}
                  </div>

                  {/* Bar */}
                  <motion.div
                    className={`h-9 rounded-md flex items-center justify-center text-[11px] font-semibold ${
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

                  {/* Info */}
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
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-bg rounded-md border border-border-light p-3">
            <div className="text-[10px] text-text-muted uppercase tracking-wide">
              Iterations
            </div>
            <motion.div
              key={totalIterations}
              className="text-xl font-bold text-sienna font-mono"
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {totalIterations}
            </motion.div>
          </div>
          <div className="bg-bg rounded-md border border-border-light p-3">
            <div className="text-[10px] text-text-muted uppercase tracking-wide">
              Sumcheck rounds
            </div>
            <div className="text-xl font-bold text-navy font-mono">
              {totalIterations * k}
            </div>
          </div>
          <div className="bg-bg rounded-md border border-border-light p-3">
            <div className="text-[10px] text-text-muted uppercase tracking-wide">
              Domain shrinkage
            </div>
            <div className="text-xl font-bold text-green font-mono">
              2<sup>{k}</sup>{'\u00d7'}
            </div>
            <div className="text-[10px] text-text-muted">per iteration</div>
          </div>
        </div>
      </div>

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
            <li>Fewer Merkle tree operations overall</li>
            <li>Better when hash operations are expensive (e.g., on-chain)</li>
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
        deployment environment. The WHIR paper reports optimal performance with{' '}
        <InlineMath tex="k" /> between 1 and 4, depending on the security level and whether
        the protocol is used standalone or inside a recursive proof.
      </p>
    </Section>
  );
}
