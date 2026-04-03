import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Section } from '../components/Section';
import { Math as InlineMath } from '../components/MathBlock';

const stages = [
  {
    id: 'execution',
    label: 'Execution',
    color: '#1a365d',
    description:
      'LeanMultisig executes a program that verifies leanSig signatures. The execution trace records every step: ADD, MUL, DEREF, JUMP instructions plus Poseidon2 hashes. A batch of 2,500 signatures produces millions of rows — but the prover wants to convince everyone the result is correct without making them redo the entire thing.',
  },
  {
    id: 'arithmetization',
    label: 'Arithmetization',
    color: '#1a365d',
    description:
      'The execution trace is encoded as multilinear polynomials over the KoalaBear field. LeanMultisig\'s AIR constraints — degree-5 transition polynomials between consecutive rows — become polynomial equations. Instead of checking "did leanMultisig run this program correctly?", we now ask "do these polynomials satisfy certain relationships?" Multiple tables (execution, Poseidon2, extension op) are stacked into a single commitment via WHIR\'s simple stacking technique.',
  },
  {
    id: 'pcs',
    label: 'Polynomial Commitment',
    highlight: true,
    color: '#8b4513',
    description:
      'This is where WHIR fits in. LeanMultisig uses WHIR — not FRI or STIR — as its polynomial commitment scheme (multilinear PCS). We need to verify that the committed polynomials are "close" to valid low-degree polynomials. Rather than reading the entire function (which could be huge), WHIR uses a clever combination of sumcheck and folding to test proximity by reading only a tiny fraction of the data. WHIR\'s super-fast verification is what makes recursive aggregation practical.',
  },
  {
    id: 'composition',
    label: 'Proof Composition',
    color: '#1a365d',
    description:
      'The final product: a Succinct Non-interactive ARGument. This is a short proof that anyone can verify quickly without any interaction with the prover. For leanMultisig, this means thousands of leanSig signature verifications are compressed into a single proof that Ethereum validators check in under a millisecond — replacing the enormous cost of verifying each hash-based signature individually.',
  },
];

export function S1_WhatProblem() {
  const [activeStage, setActiveStage] = useState<string | null>(null);

  const boxWidth = 220;
  const boxHeight = 40;
  const gap = 44;
  const arrowLen = gap;
  const svgWidth = boxWidth + 180;
  const halfArrow = arrowLen / 2;
  const topPad = 22 + halfArrow;
  const bottomPad = halfArrow + 20;
  const totalHeight = stages.length * boxHeight + (stages.length - 1) * gap;
  const svgHeight = topPad + totalHeight + bottomPad;

  const arrowLabels = ['Execution trace', 'Polynomials + AIR', 'Commitment'];

  return (
    <Section
      id="problem"
      number={1}
      title="What Are SNARGs and WHIR?"
      subtitle="WHIR is the polynomial commitment layer inside leanMultisig's SNARG — the component that makes verification fast enough for recursive proof composition."
    >
      <h3 id="what-are-snargs" className="font-heading text-xl font-semibold text-text mb-3">
        What Are SNARGs?
      </h3>
      <p>
        Ethereum validators currently use BLS signatures for consensus attestations. BLS allows
        cheap aggregation — thousands of signatures compress into one — but BLS is{' '}
        <strong>not quantum-resistant</strong>. When large-scale quantum computers arrive, BLS
        signatures will be forgeable, breaking Ethereum's consensus security.
      </p>
      <p className="mt-3">
        The post-quantum alternative is{' '}
        <a href="https://github.com/leanEthereum/leanSig" target="_blank" rel="noopener noreferrer" className="text-sienna hover:underline font-semibold">leanSig</a>, a hash-based signature scheme
        that is secure against quantum attacks. But leanSig signatures are large (several KB each)
        and expensive to verify — each requires thousands of hash evaluations. With no native
        aggregation, verifying <InlineMath tex="N" /> signatures costs <InlineMath tex="O(N)" /> work.
        For Ethereum's 800,000+ validators, this is prohibitive.
      </p>
      <p className="mt-3">
        <strong>LeanMultisig</strong> solves this. It is a minimal zkVM that aggregates thousands of
        leanSig signatures into a single compact proof using a hash-based{' '}
        <strong>SNARG</strong> — a <em>Succinct Non-interactive ARGument</em>.
      </p>

      <div className="bg-bg-card border border-border rounded-lg p-5 my-6">
        <h3 className="font-heading text-lg font-semibold text-navy mb-2">
          What is a SNARG?
        </h3>
        <p className="text-sm text-text-muted mb-3">
          A SNARG is a proof system where:
        </p>
        <ul className="list-disc list-inside text-sm text-text-muted space-y-1">
          <li>
            <strong>Succinct</strong> — the proof is tiny compared to the computation
          </li>
          <li>
            <strong>Non-interactive</strong> — the prover sends one message; no back-and-forth needed
          </li>
          <li>
            <strong>Argument</strong> — security holds against computationally bounded provers
          </li>
        </ul>
      </div>

      <div className="bg-bg-card border border-border rounded-lg p-5 my-6">
        <h3 className="font-heading text-lg font-semibold text-navy mb-2">
          SNARG vs SNARK vs STARK
        </h3>
        <p className="text-sm text-text-muted">
          A <strong>SNARG</strong> is the broadest: any succinct non-interactive proof.
        </p>
        <p className="text-sm text-text-muted mt-3">
          A <strong>SNARK</strong> (Succinct Non-interactive ARgument
          of <em>Knowledge</em>) is a SNARG with a stronger guarantee — not only is the
          statement true, but the prover actually "knows" a witness for it.
        </p>
        <p className="text-sm text-text-muted mt-3">
          A <strong>STARK</strong> (Scalable Transparent ARgument of Knowledge) is a SNARK
          that additionally requires <strong>no trusted setup</strong> — its security relies
          only on hash functions, making it quantum-resistant.
        </p>
        <p className="text-sm text-text-muted mt-3">
          In other words, all STARKs are SNARKs, and all SNARKs are SNARGs.
        </p>
        <p className="text-sm text-text-muted mt-3">
          <strong>LeanMultisig's proof system is a STARK:</strong> it uses hash-based commitments
          (Poseidon2 + Merkle trees) with no pairing-based trusted setup, which is exactly
          what you want when defending against quantum attackers.
        </p>
      </div>

      <h3 id="snarg-pipeline" className="font-heading text-xl font-semibold text-text mt-10 mb-3">
        SNARG Pipeline and WHIR
      </h3>
      <p>
        Building a SNARG involves a pipeline of stages. Each stage converts one kind of problem
        into a simpler one, until we arrive at a short, easily-checked proof:
      </p>
      <ol className="list-decimal list-inside space-y-3 my-4">
        <li>
          <strong>Execution</strong> — takes a <em>program + inputs</em> (leanSig signatures),
          produces an <em>execution trace</em> recording every step
        </li>
        <li>
          <strong>Arithmetization</strong> — takes the <em>execution trace</em> (from step 1),
          produces <em>polynomials + constraint equations</em> (an AIR) that encode
          "the program ran correctly"
        </li>
        <li>
          <strong>Polynomial commitment</strong> — takes the <em>polynomials</em> (from step 2),
          produces a <em>compact commitment</em> the verifier can query without seeing
          the full data. This is the <em>PCS</em> layer — and <strong><em>this is
          where WHIR lives</em></strong>
        </li>
        <li>
          <strong>Proof composition</strong> — takes the <em>commitment</em> (from step 3)
          + <em>constraint equations</em> (from step 2), produces a <em>single
          proof</em> that anyone can verify quickly
        </li>
      </ol>
      <p>
        WHIR's fast verification at step 3 is what makes <strong>recursive aggregation</strong> practical:
        LeanMultisig can nest proofs inside proofs, merging thousands of signature checks into one
        final proof small enough for on-chain verification.
      </p>

      <p>
        In leanMultisig, this pipeline turns leanSig signature verifications into a compact proof.
        Click each stage below to learn more:
      </p>

      {/* Pipeline SVG */}
      <div className="bg-bg-card border border-border rounded-lg p-5 my-6">
      <div>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full max-w-[400px] mx-auto"
        >
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Input label + arrow */}
          <text
            x={(svgWidth - boxWidth) / 2 + boxWidth / 2}
            y={12}
            textAnchor="middle"
            className="text-[10px] italic"
            fill="#6b6375"
          >
            Program + inputs
          </text>
          <line
            x1={(svgWidth - boxWidth) / 2 + boxWidth / 2}
            y1={20}
            x2={(svgWidth - boxWidth) / 2 + boxWidth / 2}
            y2={topPad - 8}
            stroke="#6b6375"
            strokeWidth={1.5}
          />
          <polygon
            points={`${(svgWidth - boxWidth) / 2 + boxWidth / 2 - 4},${topPad - 8} ${(svgWidth - boxWidth) / 2 + boxWidth / 2 + 4},${topPad - 8} ${(svgWidth - boxWidth) / 2 + boxWidth / 2},${topPad}`}
            fill="#6b6375"
          />

          {stages.map((stage, i) => {
            const x = (svgWidth - boxWidth) / 2;
            const y = topPad + i * (boxHeight + gap);
            const isHighlighted = stage.highlight;
            const isActive = activeStage === stage.id;

            return (
              <g key={stage.id}>
                {/* Box */}
                <rect
                  x={x}
                  y={y}
                  width={boxWidth}
                  height={boxHeight}
                  rx={10}
                  fill={isActive ? (isHighlighted ? '#8b4513' : '#1a365d') : '#fefdfb'}
                  stroke={stage.color}
                  strokeWidth={isHighlighted ? 2.5 : 1.5}
                  filter={isHighlighted ? 'url(#glow)' : undefined}
                  className="cursor-pointer transition-all duration-200"
                  onClick={() =>
                    setActiveStage(activeStage === stage.id ? null : stage.id)
                  }
                />

                {/* Label */}
                <text
                  x={x + boxWidth / 2}
                  y={y + boxHeight / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-[11px] font-medium pointer-events-none select-none"
                  fill={isActive ? '#fefdfb' : stage.color}
                >
                  {stage.label}
                </text>

                {/* "WHIR" badge */}
                {isHighlighted && (
                  <text
                    x={x + boxWidth + 8}
                    y={y + boxHeight / 2}
                    dominantBaseline="central"
                    className="text-[10px] font-bold"
                    fill="#8b4513"
                  >
                    ← WHIR is here
                  </text>
                )}

                {/* Arrow to next stage */}
                {i < stages.length - 1 && (
                  <g>
                    <line
                      x1={x + boxWidth / 2}
                      y1={y + boxHeight + 4}
                      x2={x + boxWidth / 2}
                      y2={y + boxHeight + arrowLen - 8}
                      stroke="#6b6375"
                      strokeWidth={1.5}
                    />
                    <polygon
                      points={`${x + boxWidth / 2 - 4},${y + boxHeight + arrowLen - 8} ${x + boxWidth / 2 + 4},${y + boxHeight + arrowLen - 8} ${x + boxWidth / 2},${y + boxHeight + arrowLen}`}
                      fill="#6b6375"
                    />
                    <text
                      x={x + boxWidth / 2 + 12}
                      y={y + boxHeight + arrowLen / 2 + 2}
                      dominantBaseline="central"
                      className="text-[9px] italic"
                      fill="#6b6375"
                    >
                      {arrowLabels[i]}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Output arrow + label */}
          {(() => {
            const cx = (svgWidth - boxWidth) / 2 + boxWidth / 2;
            const lastBoxBottom = topPad + (stages.length - 1) * (boxHeight + gap) + boxHeight;
            return (
              <g>
                <line
                  x1={cx}
                  y1={lastBoxBottom + 4}
                  x2={cx}
                  y2={lastBoxBottom + halfArrow - 8}
                  stroke="#6b6375"
                  strokeWidth={1.5}
                />
                <polygon
                  points={`${cx - 4},${lastBoxBottom + halfArrow - 8} ${cx + 4},${lastBoxBottom + halfArrow - 8} ${cx},${lastBoxBottom + halfArrow}`}
                  fill="#6b6375"
                />
                <text
                  x={cx}
                  y={lastBoxBottom + halfArrow + 14}
                  textAnchor="middle"
                  className="text-[10px] italic"
                  fill="#6b6375"
                >
                  Succinct proof
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Description panel */}
      <div className="mt-6" />
      <AnimatePresence mode="wait">
        {activeStage && (
          <motion.div
            key={activeStage}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="bg-bg-card border border-border rounded-lg p-5 mb-6"
          >
            <h4 className="font-heading text-base font-semibold text-text mb-2">
              {stages.find((s) => s.id === activeStage)?.label}
            </h4>
            <p className="text-sm text-text-muted leading-relaxed">
              {stages.find((s) => s.id === activeStage)?.description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* Prior Art */}
      <h3 id="road-to-whir" className="font-heading text-xl font-semibold text-text mt-10 mb-3">
        The Road to WHIR: Prior Proof Systems
      </h3>
      <p className="mb-4">
        WHIR didn't appear out of nowhere. It builds on a lineage of proof systems, each making
        different tradeoffs between proof size, prover speed, verifier speed, and trust assumptions.
        Understanding where WHIR came from helps explain <em>why</em> leanMultisig chose it over
        alternatives.
      </p>

      <div className="space-y-4 my-4">
        {/* Groth16 */}
        <div className="bg-bg-card border border-border rounded-lg p-5">
          <div className="flex items-start gap-3">
            <div className="text-xs font-mono bg-navy text-white rounded px-2 py-0.5 mt-0.5 shrink-0">
              2016
            </div>
            <div>
              <div className="font-heading font-semibold text-base text-text mb-1">
                Groth16
              </div>
              <p className="text-sm text-text-muted mb-2">
                The gold standard for succinct proofs for nearly a decade. Groth16 produces the
                smallest proofs (~128 bytes) with the fastest verification (~280k gas on Ethereum).
                It's based on elliptic curve pairings, which gives it remarkable succinctness.
              </p>
              <p className="text-sm text-text-muted mb-2">
                <strong>The catch:</strong> Groth16 requires a <em>trusted setup</em> — a ceremony
                where secret randomness is generated and must be destroyed. If any participant keeps
                the secret, they can forge proofs. It also relies on pairing-based cryptography,
                which is <strong>not quantum-resistant</strong> — the very threat leanMultisig is
                designed to address.
              </p>
              <p className="text-xs text-text-muted mt-2 mb-2">
                <strong>Used by:</strong> Zcash (2018–present), Tornado Cash, Filecoin, Loopring (2019–2022).
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs bg-green/10 text-green rounded-full px-2 py-0.5">Tiny proofs</span>
                <span className="text-xs bg-green/10 text-green rounded-full px-2 py-0.5">Fast verification</span>
                <span className="text-xs bg-red/10 text-red rounded-full px-2 py-0.5">Trusted setup</span>
                <span className="text-xs bg-red/10 text-red rounded-full px-2 py-0.5">Not post-quantum</span>
              </div>
            </div>
          </div>
        </div>

        {/* FRI */}
        <div className="bg-bg-card border border-border rounded-lg p-5">
          <div className="flex items-start gap-3">
            <div className="text-xs font-mono bg-navy text-white rounded px-2 py-0.5 mt-0.5 shrink-0">
              2018
            </div>
            <div>
              <div className="font-heading font-semibold text-base text-text mb-1">
                FRI <span className="text-text-muted font-normal">(Fast Reed-Solomon IOP of Proximity)</span>
              </div>
              <p className="text-sm text-text-muted mb-2">
                FRI was a breakthrough: a proximity test for Reed-Solomon codes that uses only
                hashing — no elliptic curves, no pairings, no trusted setup. This makes it
                <strong> transparent</strong> (anyone can verify the setup) and
                <strong> plausibly post-quantum secure</strong> (security relies only on
                hash functions).
              </p>
              <p className="text-sm text-text-muted mb-2">
                FRI works by repeatedly <em>folding</em> a polynomial using random challenges,
                halving the domain each round until the polynomial is small enough to check
                directly. It powers STARKs and systems like Plonky3. However, FRI operates as a
                univariate polynomial commitment scheme, requiring FFT-based evaluation domains.
              </p>
              <p className="text-sm text-text-muted">
                <strong>Why not for leanMultisig:</strong> FRI has larger proofs (~150-250 KB) and slower
                verification. The verifier must make{' '}
                <InlineMath tex="O(\lambda + \frac{\lambda}{k} \cdot m)" /> queries — the
                linear <InlineMath tex="m" /> factor makes verification cost grow with the problem
                size. FRI also lacks a natural multilinear PCS mode, which leanMultisig needs for its
                simple stacking technique.
              </p>
              <p className="text-xs text-text-muted mt-2 mb-2">
                <strong>Used by:</strong> StarkNet/StarkEx (2020–present), Polygon Miden, Plonky2/Plonky3 (Polygon, 2022–present), zkSync Era (via Boojum, 2023–present), RISC Zero.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs bg-green/10 text-green rounded-full px-2 py-0.5">No trusted setup</span>
                <span className="text-xs bg-green/10 text-green rounded-full px-2 py-0.5">Post-quantum</span>
                <span className="text-xs bg-red/10 text-red rounded-full px-2 py-0.5">Larger proofs</span>
                <span className="text-xs bg-red/10 text-red rounded-full px-2 py-0.5">Slower verification</span>
                <span className="text-xs bg-red/10 text-red rounded-full px-2 py-0.5">Univariate only</span>
              </div>
            </div>
          </div>
        </div>

        {/* STIR */}
        <div className="bg-bg-card border border-border rounded-lg p-5">
          <div className="flex items-start gap-3">
            <div className="text-xs font-mono bg-navy text-white rounded px-2 py-0.5 mt-0.5 shrink-0">
              2024
            </div>
            <div>
              <div className="font-heading font-semibold text-base text-text mb-1">
                STIR <span className="text-text-muted font-normal">(Shift To Improve Rate)</span>
              </div>
              <p className="text-sm text-text-muted mb-2">
                STIR improved on FRI by introducing <em>rate improvements</em> across rounds.
                In FRI, the code rate stays constant, meaning each round does as many queries
                relative to the domain size. STIR observed that by decreasing the rate (increasing
                redundancy) each round, you need fewer queries per round.
              </p>
              <p className="text-sm text-text-muted mb-2">
                This brought the query complexity down to{' '}
                <InlineMath tex="O(\lambda + \frac{\lambda}{k} \cdot \log \frac{m}{k})" /> —
                replacing FRI's linear <InlineMath tex="m" /> with a logarithmic{' '}
                <InlineMath tex="\log m" />. STIR also matched proof sizes with the best known
                schemes.
              </p>
              <p className="text-sm text-text-muted">
                <strong>What remained:</strong> STIR's verifier, while making fewer queries,
                still did <InlineMath tex="O(\frac{\lambda^2}{k} \cdot 2^k)" /> field operations
                per query — the per-query cost was high, keeping total verification time
                in the millisecond range. Not fast enough for leanMultisig's recursive aggregation,
                where verification happens inside the circuit at every tree level.
              </p>
              <p className="text-xs text-text-muted mt-2 mb-2">
                <strong>Used by:</strong> Research/academic stage — no production deployments yet.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs bg-green/10 text-green rounded-full px-2 py-0.5">Fewer queries than FRI</span>
                <span className="text-xs bg-green/10 text-green rounded-full px-2 py-0.5">Smaller proofs</span>
                <span className="text-xs bg-green/10 text-green rounded-full px-2 py-0.5">Post-quantum</span>
                <span className="text-xs bg-red/10 text-red rounded-full px-2 py-0.5">Expensive per-query verification</span>
              </div>
            </div>
          </div>
        </div>

        {/* WHIR */}
        <div className="bg-bg-card border-2 border-sienna rounded-lg p-5">
          <div className="flex items-start gap-3">
            <div className="text-xs font-mono bg-sienna text-white rounded px-2 py-0.5 mt-0.5 shrink-0">
              2024
            </div>
            <div>
              <div className="font-heading font-semibold text-base text-sienna mb-1">
                WHIR <span className="text-text-muted font-normal">(Weights Help Improving Rate)</span>
              </div>
              <p className="text-sm text-text-muted mb-2">
                WHIR keeps STIR's optimal query complexity but dramatically reduces the
                <em> cost per query</em>. The key insight: instead of working with standard
                Reed-Solomon codes, WHIR uses <strong>constrained Reed-Solomon codes</strong> that
                natively integrate the sumcheck protocol. This lets the verifier combine the
                constraint check and the proximity test into a single operation.
              </p>
              <p className="text-sm text-text-muted mb-2">
                The result: verification in <strong>hundreds of microseconds</strong> instead of
                milliseconds. WHIR's verifier does{' '}
                <InlineMath tex="O(q_{\text{WHIR}} \cdot (2^k + m))" /> field operations total —
                linear in the data it reads, with no field divisions required. This makes it the
                fastest known verifier for proximity testing.
              </p>
              <p className="text-sm text-text-muted mb-2">
                <strong>Why leanMultisig chose WHIR:</strong> WHIR functions as a multilinear polynomial
                commitment scheme, which enables leanMultisig's "simple stacking" — multiple multilinear
                polynomials (from the execution table, Poseidon2 table, and extension op table) are
                concatenated into one and committed via a single WHIR instance. No need for
                univariate FFT-based commitment like FRI or Plonky3. Being hash-based, it is
                post-quantum secure and requires no trusted setup.
              </p>
              <p className="text-xs text-text-muted mt-2 mb-2">
                <strong>Used by:</strong> LeanMultisig (2025–present), Whirlaway (LambdaClass), ProveKit (World Foundation). Plonky3 integration via whir-p3 (community port). Scroll's Ceno zkVM evaluating as a replacement for BaseFold.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs bg-green/10 text-green rounded-full px-2 py-0.5">Fastest verification</span>
                <span className="text-xs bg-green/10 text-green rounded-full px-2 py-0.5">Multilinear PCS</span>
                <span className="text-xs bg-green/10 text-green rounded-full px-2 py-0.5">No trusted setup</span>
                <span className="text-xs bg-green/10 text-green rounded-full px-2 py-0.5">Post-quantum</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm text-text-muted mt-6 italic">
        In the sections that follow, we will build up the ideas behind WHIR step by step:
        Reed-Solomon codes, constrained codes, the sumcheck protocol, and folding — all
        combining into the protocol that powers leanMultisig's polynomial commitment layer.
      </p>
    </Section>
  );
}
