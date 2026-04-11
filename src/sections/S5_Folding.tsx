import { useState, useMemo, useCallback } from 'react';
import {
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { Section } from '../components/Section';
import { Math as InlineMath, MathBlock } from '../components/MathBlock';
import { Button } from '../components/ui/Button';
import { generateSubgroup } from '../utils/field';
import { evaluateAll, interpolate, degree } from '../utils/polynomial';
import type { Poly } from '../utils/polynomial';
import { fold } from '../utils/folding';

// Same example as Section 4: 3 referees giving an additive scoring trace.
// Output column = [3, 4, 8, 0] (Alice, Bob, Charlie, pad). The unique
// degree-3 polynomial that interpolates these 4 values on the size-4
// subgroup of F_17 is what the prover commits to.
const TRACE_OUTPUTS: number[] = [3, 4, 8, 0];
const INITIAL_POLY: Poly = (() => {
  const sub4 = generateSubgroup(4); // [1, 4, 13, 16]
  return interpolate(sub4.map((x, i) => [x, TRACE_OUTPUTS[i]]));
})();
// Fixed folding challenge (in WHIR this would come from Fiat-Shamir / sumcheck).
const ALPHA = 3;

export function S5_Folding() {
  const [tamperIdx, setTamperIdx] = useState<number | null>(null);
  const [foldCount, setFoldCount] = useState(0);

  const domain8 = useMemo(() => generateSubgroup(8), []);
  // The size-4 subgroup is the set of "actual data" points (where the 4 trace
  // values are encoded). The remaining 4 points in the size-8 domain are the
  // Reed-Solomon rate-1/2 redundancy.
  const dataDomain = useMemo(() => new Set(generateSubgroup(4)), []);
  const honestEvals8 = useMemo(() => evaluateAll(INITIAL_POLY, domain8), [domain8]);

  // Initial evals with optional tamper applied
  const initialEvals = useMemo(() => {
    if (tamperIdx === null) return honestEvals8;
    const out = honestEvals8.slice();
    // Flip the value by a fixed offset so tampering is always non-trivial.
    out[tamperIdx] = (honestEvals8[tamperIdx] + 7) % 17;
    return out;
  }, [honestEvals8, tamperIdx]);

  // Build the full chain of fold layers — both the honest chain and the
  // (possibly tampered) one — so we can display the original alongside the
  // crossed-out tampered value at every layer.
  const layers = useMemo(() => {
    const all: {
      domain: number[];
      evals: number[];
      honestEvals: number[];
      expectedDeg: number;
      actualDeg: number;
    }[] = [];
    let d = domain8;
    let e = initialEvals;
    let h = honestEvals8;
    let expectedDeg = 3;
    for (let i = 0; i <= 3; i++) {
      const points: [number, number][] = d.map((x, idx) => [x, e[idx]]);
      const poly = interpolate(points);
      const actualDeg = Math.max(0, degree(poly));
      all.push({ domain: d, evals: e, honestEvals: h, expectedDeg, actualDeg });
      if (d.length <= 1) break;
      const next = fold(e, d, ALPHA);
      const nextHonest = fold(h, d, ALPHA);
      d = next.foldedDomain;
      e = next.foldedEvals;
      h = nextHonest.foldedEvals;
      expectedDeg = Math.max(0, Math.floor(expectedDeg / 2));
    }
    return all;
  }, [domain8, initialEvals, honestEvals8]);

  // For each layer, track which indices are "downstream" of the tampered point.
  // A tamper at x in the initial domain propagates to x² in the next layer, then
  // x⁴, etc. (every fold step squares the surviving coordinate.)
  const tamperedIndicesPerLayer = useMemo(() => {
    if (tamperIdx === null) return layers.map(() => new Set<number>());
    const out: Set<number>[] = [];
    let val = domain8[tamperIdx];
    for (const layer of layers) {
      const set = new Set<number>();
      const idx = layer.domain.indexOf(val);
      if (idx >= 0) set.add(idx);
      out.push(set);
      val = (val * val) % 17;
    }
    return out;
  }, [layers, tamperIdx, domain8]);

  const visibleLayers = layers.slice(0, foldCount + 1);
  const canFold = foldCount < layers.length - 1;

  const handleFold = useCallback(() => {
    if (canFold) setFoldCount((c) => c + 1);
  }, [canFold]);

  const handleReset = useCallback(() => {
    setFoldCount(0);
  }, []);


  return (
    <Section
      id="folding"
      number={5}
      title="Folding"
      subtitle="Halving the domain with a random challenge -- the key to WHIR's recursion."
    >
      <h3 id="what-is-folding" className="font-heading text-xl font-semibold text-text mb-3">
        What Is Folding?
      </h3>
      <p>
        <strong>Folding</strong> is the operation that makes WHIR recursive — each fold
        shrinks the domain by a factor of <InlineMath tex="2^k" />, where{' '}
        <InlineMath tex="k" /> is the folding parameter.
      </p>
      <h3 className="font-heading text-lg font-semibold text-text mt-6 mb-2">
        The Folding Parameter
      </h3>
      <p>
        Intuitively, <InlineMath tex="k" /> is <strong>how many halving steps you
        collapse into one fold</strong> — i.e. how aggressively you compress the
        domain per round:
      </p>
      <ul className="my-3 ml-6 list-disc space-y-1 text-sm text-text-muted">
        <li><InlineMath tex="k = 1" />: each fold cuts the domain in half (the FRI default).</li>
        <li><InlineMath tex="k = 2" />: each fold cuts it by <InlineMath tex="4\times" /> (two halvings at once).</li>
        <li><InlineMath tex="k = 7" />: each fold cuts it by <InlineMath tex="128\times" /> (leanMultisig's initial fold).</li>
      </ul>
      <p className="my-4">
        The tradeoff: bigger <InlineMath tex="k" /> means fewer rounds overall
        (faster verifier, smaller total proof) but each round is heavier — the
        prover collapses <InlineMath tex="2^k" /> cosets at once instead of 2,
        which means more work per round. Each individual query also catches less
        (a cheating prover has more room to hide errors when <InlineMath tex="2^k" /> cosets
        collapse at once), so more queries are needed per round to hit the same security level.
      </p>
      <p className="my-4">
        So picking <InlineMath tex="k" /> is a balancing act. Fewer
        rounds shrink the proof, but extra queries per round grow it back. The sweet
        spot is usually <InlineMath tex="k \approx 4{-}8" /> (leanMultisig uses <InlineMath tex="k = 7" />).
      </p>
      <p className="my-4">
        In leanMultisig, the initial domain might span <InlineMath tex="2^{26}" /> points
        (a trace with ~<InlineMath tex="2^{25}" /> rows committed at rate 1/2 doubles
        the domain to <InlineMath tex="2^{26}" /> evaluations).
        The leanMultisig paper specifies an "initial folding of 7," meaning the first
        fold step reduces the domain by <InlineMath tex="2^7 = 128\times" />. The small
        2-adicity of the KoalaBear field (24) is handled through WHIR's interleaved
        Reed-Solomon approach, which allows committing up to <InlineMath tex="2^{30}" /> field
        elements at rate 1/2.
      </p>
      <div className="bg-bg-card border border-border rounded-lg p-4 my-4 text-sm text-text-muted">
        <div className="font-semibold text-text mb-1">What's 2-adicity?</div>
        A field's <strong>2-adicity</strong> is the largest <InlineMath tex="n" /> such
        that <InlineMath tex="2^n" /> divides <InlineMath tex="p - 1" /> (where{' '}
        <InlineMath tex="p" /> is the field's prime). It caps the size of the
        power-of-two evaluation domains Reed-Solomon can use natively. KoalaBear's
        2-adicity is 24, meaning a single RS codeword tops out at{' '}
        <InlineMath tex="2^{24}" /> points — too small for leanMultisig traces.
        WHIR's <em>interleaved</em> Reed-Solomon side-steps this by packing multiple
        codewords into one block, pushing the effective commitment size up to{' '}
        <InlineMath tex="2^{30}" /> elements.
      </div>
      <h3 className="font-heading text-lg font-semibold text-text mt-6 mb-2">
        The Folding Formula
      </h3>
      <p>
        For each pair <InlineMath tex="(x, -x)" /> in the domain, we combine{' '}
        <InlineMath tex="f(x)" /> and <InlineMath tex="f(-x)" /> into a single value on
        the squared domain point <InlineMath tex="y = x^2" />:
      </p>

      <MathBlock tex="\text{Fold}(f, \alpha)(y) = \frac{f(x) + f(-x)}{2} + \alpha \cdot \frac{f(x) - f(-x)}{2x}" />

      <p>
        The first term is the <em>even part</em> (average), and the second is the{' '}
        <em>odd part</em> (difference scaled by <InlineMath tex="x" />). The challenge{' '}
        <InlineMath tex="\alpha" /> randomly combines them, ensuring that a cheating prover
        cannot make the folded function look correct unless the original was already close to
        a valid codeword.
      </p>
      <p className="my-4">
        In WHIR, <InlineMath tex="\alpha" /> isn't a fresh random value — it's the
        same challenge produced by the sumcheck round that runs just before the fold (see previous chapter on sumcheck).
        Each WHIR iteration runs <InlineMath tex="k" /> rounds of sumcheck (yielding{' '}
        <InlineMath tex="\alpha_1, \ldots, \alpha_k" />), and those same challenges
        are reused as the folding randomness to compress the RS domain by{' '}
        <InlineMath tex="2^k" />.      </p>

      <div className="bg-bg-card border border-border rounded-lg p-5 my-6">
        <p className="text-sm text-text-muted">
          <strong>Key property:</strong> If <InlineMath tex="f" /> is close to a degree-
          <InlineMath tex="d" /> polynomial, then with high probability,{' '}
          <InlineMath tex="\text{Fold}(f, \alpha)" /> is close to a degree-
          <InlineMath tex="d/2" /> polynomial. Both the degree and domain size halve!
        </p>
      </div>

      <h3 className="font-heading text-xl font-semibold text-text mt-10 mb-4">
        Why Tampering Increases Degree
      </h3>
      <p className="mb-2">
        Before folding, here's the underlying fact that makes the whole soundness
        argument work: a small set of evaluations uniquely determines a polynomial,
        and changing even one value forces that polynomial to a higher degree.
      </p>
      <p className="mb-2">
        Below are 3 evaluations of the line <InlineMath tex="f(x) = x + 1" /> in{' '}
        <InlineMath tex="\mathbb{F}_{17}" />. Drag the slider to nudge a value off
        the line and watch the polynomial bend through the new point — its degree
        has to jump.
      </p>
      <DegreeProbe />
      <h3 id="interactive-folding" className="font-heading text-xl font-semibold text-text mt-10 mb-4">
        Folding Example
      </h3>
      <p className="mb-2">
        Here we demonstrate the same operation on 8 points in{' '}
        <InlineMath tex="\mathbb{F}_{17}" />, reusing the referee example from
        Section 4. The output column of the trace is{' '}
        <InlineMath tex="[3, 4, 8, 0]" /> (Alice, Bob, Charlie, pad). The prover
        interpolates these 4 values into a unique degree-3 polynomial and then
        commits to it by evaluating it on 8 points (rate 1/2).
      </p>

      <div className="bg-bg-card border border-border rounded-lg p-5 space-y-5">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" onClick={handleFold} disabled={!canFold}>
            Fold once
          </Button>
          <Button variant="ghost" onClick={handleReset}>Reset</Button>
          <span className="text-sm text-text-muted ml-2">
            <InlineMath tex={`\\alpha = ${ALPHA}`} />
          </span>
          <span className="ml-auto text-xs text-text-muted text-right max-w-[280px]">
            Click any point in the <strong>Initial</strong> row to tamper with it,
            then fold and watch the actual degree diverge from the expected one.
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
          <svg width="18" height="18" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="7" fill="#fefdfb" stroke="#1a365d" strokeWidth="2" strokeDasharray="3 2" />
          </svg>
          dashed = Reed-Solomon redundancy
        </div>

        {/* Layers — append on each fold */}
        <div className="space-y-3">
          {visibleLayers.map((layer, layerIdx) => {
            const isInitial = layerIdx === 0;
            const degOk = layer.actualDeg <= layer.expectedDeg;
            return (
              <div
                key={layerIdx}
                className={`rounded border p-3 ${degOk ? 'bg-bg border-border-light' : 'bg-red/5 border-red/30'}`}
              >
                <div className="flex items-center justify-between mb-2 text-xs">
                  <span className="font-semibold text-text">
                    {isInitial ? 'Initial' : `After fold ${layerIdx}`}
                    <span className="text-text-muted ml-2">
                      ({layer.domain.length} point{layer.domain.length === 1 ? '' : 's'})
                    </span>
                  </span>
                  <span className="font-mono">
                    expected deg ≤ {layer.expectedDeg} · actual deg ={' '}
                    <span className={degOk ? 'text-green font-bold' : 'text-red font-bold'}>
                      {layer.actualDeg}
                    </span>{' '}
                    {degOk ? '✓' : '✗'}
                  </span>
                </div>
                {(() => {
                  const svgW = 560;
                  const svgH = 70;
                  const spacing = svgW / (layer.domain.length + 1);
                  return (
                    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-[560px] mx-auto block">
                      {layer.domain.map((x, i) => {
                        const px = spacing * (i + 1);
                        const isTampered = tamperedIndicesPerLayer[layerIdx]?.has(i);
                        const isData = isInitial && dataDomain.has(x);
                        const stroke = isTampered ? '#c53030' : '#1a365d';
                        const fill = isTampered ? '#fef2f2' : '#fefdfb';
                        const clickable = isInitial;
                        return (
                          <g
                            key={x}
                            onClick={clickable ? () => {
                              setTamperIdx((cur) => (cur === i ? null : i));
                            } : undefined}
                            style={clickable ? { cursor: 'pointer' } : undefined}
                          >
                            <circle
                              cx={px}
                              cy={35}
                              r={24}
                              fill={fill}
                              stroke={stroke}
                              strokeWidth={2}
                              strokeDasharray={isInitial && !isData ? '3 2' : undefined}
                            />
                            <text x={px} y={30} textAnchor="middle" className="text-[9px] font-mono" fill="#6b6375">
                              x={x}
                            </text>
                            {isTampered ? (
                              <>
                                <text
                                  x={px - 7}
                                  y={46}
                                  textAnchor="middle"
                                  className="text-[11px] font-mono"
                                  fill="#9ca3af"
                                  textDecoration="line-through"
                                >
                                  {layer.honestEvals[i]}
                                </text>
                                <text
                                  x={px + 8}
                                  y={46}
                                  textAnchor="middle"
                                  className="text-[11px] font-mono font-bold"
                                  fill="#c53030"
                                >
                                  {layer.evals[i]}
                                </text>
                              </>
                            ) : (
                              <text x={px} y={46} textAnchor="middle" className="text-[12px] font-mono font-bold" fill="#1a365d">
                                {layer.evals[i]}
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  );
                })()}
                {layer.domain.length >= 2 && (
                  (() => {
                    const sorted = layer.domain
                      .map((x, i) => ({
                        x,
                        y: layer.evals[i],
                        tampered: tamperedIndicesPerLayer[layerIdx]?.has(i) ?? false,
                        data: isInitial ? dataDomain.has(x) : true,
                      }))
                      .sort((a, b) => a.x - b.x);
                    return (
                      <ResponsiveContainer width="100%" height={160}>
                        <ComposedChart data={sorted} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                          <CartesianGrid stroke="#e7e3d9" strokeDasharray="3 3" />
                          <XAxis type="number" dataKey="x" domain={[0, 16]} ticks={[0, 4, 8, 12, 16]} stroke="#6b6375" fontSize={10} />
                          <YAxis type="number" dataKey="y" domain={[0, 16]} ticks={[0, 4, 8, 12, 16]} stroke="#6b6375" fontSize={10} />
                          <Line
                            type="linear"
                            data={sorted}
                            dataKey="y"
                            stroke="#1a365d"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                          />
                          <Scatter
                            data={sorted}
                            shape={(props: { cx?: number; cy?: number; payload?: { tampered: boolean; data: boolean } }) => (
                              <circle
                                cx={props.cx}
                                cy={props.cy}
                                r={6}
                                fill={props.payload?.tampered ? '#c53030' : props.payload?.data ? '#1a365d' : '#fefdfb'}
                                stroke={props.payload?.tampered ? '#c53030' : '#1a365d'}
                                strokeWidth={2}
                                strokeDasharray={!props.payload?.data && !props.payload?.tampered ? '2 2' : undefined}
                              />
                            )}
                            legendType="none"
                            isAnimationActive={false}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    );
                  })()
                )}
              </div>
            );
          })}
        </div>

        {/* Verdict */}
        <div className="text-sm">
          {(() => {
            const failing = visibleLayers.findIndex((l) => l.actualDeg > l.expectedDeg);
            const allOk = failing === -1;
            if (tamperIdx === null) {
              return (
                <p className="text-text-muted">
                  <strong className="text-green">Honest input.</strong> Each fold halves
                  the expected degree (3 → 1 → 0). The interpolated polynomial through
                  the folded values matches the expected degree at every layer — the
                  low-degree property is preserved.
                </p>
              );
            }
            if (allOk && foldCount < layers.length - 1) {
              return (
                <p className="text-text-muted">
                  Tampered, but you haven't folded enough yet to see the divergence.
                  Keep folding.
                </p>
              );
            }
            if (allOk) {
              return (
                <p className="text-text-muted">
                  This particular tamper happened to land on a value that still
                  interpolates to a low-degree polynomial after folding — try a
                  different point or value, the cheating prover almost always gets
                  caught.
                </p>
              );
            }
            const bad = visibleLayers[failing];
            const layerName = failing === 0 ? 'the initial layer' : `fold ${failing}`;
            return (
              <p className="text-text-muted">
                <strong className="text-red">Caught!</strong> At {layerName}, the
                interpolated polynomial has degree {bad.actualDeg}, higher than the
                expected {bad.expectedDeg}. The prover cannot make the folded values
                look low-degree once the input is corrupted — this is the soundness
                guarantee folding gives WHIR.
              </p>
            );
          })()}
        </div>
      </div>

      <p className="mt-6 text-sm text-text-muted">
        Each fold halves the domain size. Starting from size 8, one fold gives size 4, then
        size 2. At size 2, the polynomial is just a constant — the base case. In leanMultisig,
        the folding parameter <InlineMath tex="k" /> can be larger than 1, reducing the
        domain by <InlineMath tex="2^k" /> per iteration rather than just halving it. With
        an initial folding of 7 and subsequent folds, a domain of{' '}
        <InlineMath tex="2^{26}" /> points shrinks to a trivially small base case in just
        a few iterations. This aggressive folding is what makes WHIR practical for
        leanMultisig's large execution traces.
      </p>
    </Section>
  );
}

function DegreeProbe() {
  // 3 evaluations of the line f(x) = x + 1 in F_17.
  // (The size-3 subgroup doesn't exist in F_17, so we use 3 hand-picked points.)
  const xs = useMemo(() => [3, 7, 13], []);
  const honest = useMemo(() => xs.map((x) => (x + 1) % 17), [xs]);
  // One slider per point. Default: each value equals its honest value (no tamper).
  const [values, setValues] = useState<number[]>(() => honest.slice());

  const evals = values;
  const poly = interpolate(xs.map((x, i) => [x, evals[i]]));
  const deg = Math.max(0, degree(poly));
  const ok = deg <= 1;

  // Render the polynomial as a TeX string, normalizing coefficients to [0, 16].
  const polyTex = useMemo(() => {
    const parts: string[] = [];
    for (let i = 0; i <= deg; i++) {
      const c = ((poly[i] ?? 0) % 17 + 17) % 17;
      if (c === 0) continue;
      let term: string;
      if (i === 0) term = `${c}`;
      else if (i === 1) term = c === 1 ? 'x' : `${c}x`;
      else term = c === 1 ? `x^{${i}}` : `${c}x^{${i}}`;
      parts.push(term);
    }
    return parts.length === 0 ? '0' : parts.join(' + ');
  }, [poly, deg]);

  // Sample the interpolated polynomial at the 17 integer points of F_17 only —
  // fractional x has no meaning in a finite field.
  const curve = useMemo(() => {
    const pts: { x: number; y: number }[] = [];
    for (let t = 0; t <= 14; t++) {
      let y = 0;
      for (let i = poly.length - 1; i >= 0; i--) y = (y * t + poly[i]) % 17;
      y = ((y % 17) + 17) % 17;
      pts.push({ x: t, y });
    }
    return pts;
  }, [poly]);

  const points = xs.map((x, i) => ({
    x,
    honest: honest[i],
    evals: evals[i],
    tampered: evals[i] !== honest[i],
  }));

  return (
    <div className="bg-bg-card border border-border rounded-lg p-4 my-4">
      <div className="flex items-center justify-between mb-2 text-xs">
        <span className="font-semibold text-text">
          <InlineMath tex={`f(x) = ${polyTex}`} /> sampled at 3 points in{' '}
          <InlineMath tex="\mathbb{F}_{17}" />
        </span>
        <span className="font-mono">
          polynomial degree ={' '}
          <span className={ok ? 'text-green font-bold' : 'text-red font-bold'}>{deg}</span>
        </span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="#e7e3d9" strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="x"
            domain={[0, 14]}
            ticks={[0, 4, 8, 12, 14]}
            stroke="#6b6375"
            fontSize={11}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[0, 15]}
            ticks={[0, 5, 10, 15]}
            stroke="#6b6375"
            fontSize={11}
          />
          <Line
            type="linear"
            data={curve}
            dataKey="y"
            stroke={ok ? '#1a365d' : '#c53030'}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            xAxisId={0}
            yAxisId={0}
          />
          <Scatter
            data={points.map((p) => ({ x: p.x, y: p.evals, tampered: p.tampered }))}
            xAxisId={0}
            yAxisId={0}
            shape={(props: { cx?: number; cy?: number; payload?: { tampered: boolean } }) => (
              <circle
                cx={props.cx}
                cy={props.cy}
                r={8}
                fill={props.payload?.tampered ? '#c53030' : '#1a365d'}
                stroke="#fefdfb"
                strokeWidth={3}
              />
            )}
            legendType="none"
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="mt-3 max-w-[460px] mx-auto flex items-center gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm">
            <label className="text-text font-medium">f(7) =</label>
            <span className="text-text-muted font-mono text-xs tabular-nums">
              {values[1] === honest[1] ? (
                values[1]
              ) : (
                <>
                  <span className="text-text-muted/50 line-through mr-1">{honest[1]}</span>
                  <span className="text-red">{values[1]}</span>
                </>
              )}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={16}
            value={values[1]}
            onChange={(e) =>
              setValues((cur) => {
                const next = cur.slice();
                next[1] = Number(e.target.value);
                return next;
              })
            }
            className="w-full h-1.5 rounded-full bg-border appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:bg-text
                       [&::-webkit-slider-thumb]:shadow-sm
                       [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4
                       [&::-moz-range-thumb]:rounded-full
                       [&::-moz-range-thumb]:bg-text
                       [&::-moz-range-thumb]:border-0
                       [&::-moz-range-thumb]:cursor-pointer"
            style={{ accentColor: '#2c2c2c' }}
          />
        </div>
        <Button variant="secondary" onClick={() => setValues(honest.slice())}>
          Reset
        </Button>
      </div>
      <p className="text-xs text-text-muted mt-3">
        The chart is capped at <InlineMath tex="x = 14" /> for simplicity, hiding
        the mod-17 wraparound at <InlineMath tex="x = 16" />.
      </p>
    </div>
  );
}
