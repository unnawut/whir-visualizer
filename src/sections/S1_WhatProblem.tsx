import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Section } from '../components/Section';
import { Math as InlineMath } from '../components/MathBlock';

const stages = [
  {
    id: 'computation',
    label: 'Computation',
    color: '#1a365d',
    description:
      'LeanMultisig executes a program that verifies leanSig signatures. The execution trace records every step: ADD, MUL, DEREF, JUMP instructions plus Poseidon2 hashes. A batch of 2,500 signatures produces millions of rows — but the prover wants to convince everyone the result is correct without making them redo the entire thing.',
  },
  {
    id: 'piop',
    label: 'Polynomial IOP',
    color: '#1a365d',
    description:
      'The execution trace is encoded as multilinear polynomials over the KoalaBear field. LeanMultisig\'s AIR constraints — degree-5 transition polynomials between consecutive rows — become polynomial equations. Instead of checking "did LeanMultisig run this program correctly?", we now ask "do these polynomials satisfy certain relationships?" Multiple tables (execution, Poseidon2, extension op) are stacked into a single commitment via WHIR\'s simple stacking technique.',
  },
  {
    id: 'iopp',
    label: 'IOP of Proximity',
    highlight: true,
    color: '#8b4513',
    description:
      'This is where WHIR fits in. LeanMultisig uses WHIR — not FRI or STIR — as its polynomial commitment scheme (multilinear PCS). We need to verify that the committed polynomials are "close" to valid low-degree polynomials. Rather than reading the entire function (which could be huge), WHIR uses a clever combination of sumcheck and folding to test proximity by reading only a tiny fraction of the data. WHIR\'s super-fast verification is what makes recursive aggregation practical.',
  },
  {
    id: 'snarg',
    label: 'SNARG',
    color: '#1a365d',
    description:
      'The final product: a Succinct Non-interactive ARGument. This is a short proof that anyone can verify quickly without any interaction with the prover. For LeanMultisig, this means thousands of leanSig signature verifications are compressed into a single proof that Ethereum validators check in under a millisecond — replacing the enormous cost of verifying each hash-based signature individually.',
  },
];

export function S1_WhatProblem() {
  const [activeStage, setActiveStage] = useState<string | null>(null);

  const boxWidth = 140;
  const boxHeight = 52;
  const gap = 36;
  const arrowLen = gap;
  const totalWidth = stages.length * boxWidth + (stages.length - 1) * gap;
  const svgWidth = totalWidth + 40;
  const svgHeight = 110;

  return (
    <Section
      id="problem"
      number={1}
      title="What Problem Does WHIR Solve?"
      subtitle="From computations to succinct proofs: where WHIR fits in LeanMultisig's pipeline."
    >
      <h3 id="snargs-pipeline" className="font-heading text-xl font-semibold text-text mb-3">
        SNARGs and the Pipeline
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
        leanSig signatures into a single compact proof using a hash-based SNARG. WHIR is the
        polynomial commitment scheme inside LeanMultisig that makes verification fast enough for on-chain
        checking and recursive proof composition.
      </p>

      <div className="bg-bg-card border border-border rounded-lg p-5 my-6">
        <h3 className="font-heading text-lg font-semibold text-navy mb-2">
          What is a SNARG?
        </h3>
        <p className="text-sm text-text-muted mb-3">
          A <strong>Succinct Non-interactive ARGument</strong> is a proof system where:
        </p>
        <ul className="list-disc list-inside text-sm text-text-muted space-y-1">
          <li>
            <strong>Succinct</strong> -- the proof is tiny compared to the computation
          </li>
          <li>
            <strong>Non-interactive</strong> -- the prover sends one message; no back-and-forth needed
          </li>
          <li>
            <strong>Argument</strong> -- security holds against computationally bounded provers
          </li>
        </ul>
      </div>

      <p>
        Building a SNARG involves a pipeline of transformations. Each stage converts one kind of
        problem into another, until we arrive at a short, easily-checked proof. In LeanMultisig, this
        pipeline turns leanSig signature verifications into a compact proof. Click each stage
        below to learn more:
      </p>

      {/* Pipeline SVG */}
      <div className="my-8 overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full max-w-[700px] mx-auto"
          style={{ minWidth: 500 }}
        >
          {stages.map((stage, i) => {
            const x = 20 + i * (boxWidth + gap);
            const y = 20;
            const isHighlighted = stage.highlight;
            const isActive = activeStage === stage.id;

            return (
              <g key={stage.id}>
                {/* Glow filter for IOPP */}
                {isHighlighted && (
                  <defs>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                )}

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
                    x={x + boxWidth / 2}
                    y={y + boxHeight + 16}
                    textAnchor="middle"
                    className="text-[10px] font-bold"
                    fill="#8b4513"
                  >
                    WHIR fits here
                  </text>
                )}

                {/* Arrow to next stage */}
                {i < stages.length - 1 && (
                  <g>
                    <line
                      x1={x + boxWidth + 4}
                      y1={y + boxHeight / 2}
                      x2={x + boxWidth + arrowLen - 8}
                      y2={y + boxHeight / 2}
                      stroke="#6b6375"
                      strokeWidth={1.5}
                    />
                    <polygon
                      points={`${x + boxWidth + arrowLen - 8},${y + boxHeight / 2 - 4} ${x + boxWidth + arrowLen - 8},${y + boxHeight / 2 + 4} ${x + boxWidth + arrowLen},${y + boxHeight / 2}`}
                      fill="#6b6375"
                    />
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Description panel */}
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

      {/* Prover-Verifier model */}
      <h3 id="prover-verifier-model" className="font-heading text-xl font-semibold text-text mt-10 mb-3">
        The Prover-Verifier Model
      </h3>
      <p>
        At the heart of every proof system are two parties: the <strong>Prover</strong> and
        the <strong>Verifier</strong>. In LeanMultisig's architecture, the prover runs the full
        signature verification computation off-chain — executing ADD, MUL, DEREF, JUMP instructions
        and Poseidon2 hashes over the KoalaBear field — and produces a compact proof. The verifier
        (an Ethereum smart contract or another recursive proof layer) checks the proof quickly,
        doing far less work than the original computation.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 my-6">
        <div className="flex-1 bg-bg-card border border-border rounded-lg p-4">
          <div className="text-sienna font-heading font-semibold text-base mb-1">
            Prover
          </div>
          <p className="text-sm text-text-muted">
            Runs LeanMultisig to verify a batch of leanSig signatures. Generates an execution trace
            (up to <InlineMath tex="2^{25}" /> rows, 20 columns), commits it via WHIR, and
            produces a proof. Might be dishonest — tries to convince the verifier of false claims.
          </p>
        </div>
        <div className="flex-1 bg-bg-card border border-border rounded-lg p-4">
          <div className="text-navy font-heading font-semibold text-base mb-1">
            Verifier
          </div>
          <p className="text-sm text-text-muted">
            Checks the proof on-chain or inside a recursive circuit. Must catch cheating provers
            with high probability while accepting honest provers. WHIR's fast verification keeps
            this cost minimal.
          </p>
        </div>
      </div>

      {/* Why it matters */}
      <h3 id="why-fast-verification" className="font-heading text-xl font-semibold text-text mt-10 mb-3">
        Why Does Fast Verification Matter?
      </h3>

      <div className="bg-bg-card border border-border rounded-lg p-5 my-4">
        <div className="font-heading font-semibold text-lg text-text mb-3">
          Example: LeanMultisig's Post-Quantum Signature Aggregation
        </div>
        <p className="text-sm text-text-muted mb-3">
          Ethereum currently relies on BLS signatures for validator attestations. BLS allows cheap
          aggregation — thousands of signatures compress into one — but BLS is broken by quantum
          computers. The post-quantum replacement is <strong>leanSig</strong>, a hash-based
          signature scheme that is quantum-resistant but has a problem:
        </p>
        <ul className="list-disc list-inside text-sm text-text-muted space-y-1 mb-4">
          <li>Each leanSig signature is several KB (vs. 48 bytes for BLS)</li>
          <li>Verification requires thousands of hash evaluations per signature</li>
          <li>No native aggregation — verifying <InlineMath tex="N" /> signatures costs <InlineMath tex="O(N)" /> work</li>
        </ul>
        <p className="text-sm text-text-muted mb-3">
          LeanMultisig solves this with <strong>recursive aggregation</strong>. As described in the
          LeanMultisig paper, the process works as a tree: batches of ~2,500 leanSig signatures are
          each verified by a LeanMultisig instance that produces a proof. These proofs are then merged
          pairwise up the tree until a single final proof remains. Each node verifies this one
          compact proof instead of tens of thousands of individual signatures.
        </p>
        <p className="text-sm text-text-muted mb-3">
          Under the hood, LeanMultisig operates over the <strong>KoalaBear
          field</strong> (<InlineMath tex="p = 2^{31} - 2^{24} + 1" />) and
          uses <strong>Poseidon2</strong> as its hash function — chosen because its
          cubing S-box <InlineMath tex="x \mapsto x^3" /> is efficient in this field.
          WHIR serves as the multilinear polynomial commitment scheme, enabling "simple stacking"
          where multiple polynomials from different tables are concatenated into one commitment.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="flex-1 bg-bg border border-border-light rounded p-3">
            <div className="text-xs font-semibold text-red mb-1">Without LeanMultisig</div>
            <p className="text-xs text-text-muted">
              Every node verifies 10,000+ leanSig signatures individually.
              Costs millions of hash operations per block.
            </p>
          </div>
          <div className="flex items-center justify-center text-text-muted text-lg">&rarr;</div>
          <div className="flex-1 bg-bg border border-border-light rounded p-3">
            <div className="text-xs font-semibold text-green mb-1">With LeanMultisig (using WHIR)</div>
            <p className="text-xs text-text-muted">
              Provers aggregate signatures in a recursive tree. Every node verifies one final
              proof in ~400us. WHIR's fast verifier keeps on-chain costs minimal.
            </p>
          </div>
        </div>
        <p className="text-xs text-text-muted mt-4 italic">
          WHIR is the component that makes the <em>verifier</em> fast. Its query complexity of{' '}
          <InlineMath tex="O(\lambda + \frac{\lambda}{k} \cdot \log \frac{m}{k})" /> is what
          enables verification in hundreds of microseconds rather than milliseconds — critical
          when this cost is paid by every node in the network, or when verification happens
          inside a recursive proof circuit at each level of LeanMultisig's aggregation tree.
        </p>
      </div>

      {/* Prior Art */}
      <h3 id="road-to-whir" className="font-heading text-xl font-semibold text-text mt-10 mb-3">
        The Road to WHIR: Prior Proof Systems
      </h3>
      <p className="mb-4">
        WHIR didn't appear out of nowhere. It builds on a lineage of proof systems, each making
        different tradeoffs between proof size, prover speed, verifier speed, and trust assumptions.
        Understanding where WHIR came from helps explain <em>why</em> LeanMultisig chose it over
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
                which is <strong>not quantum-resistant</strong> — the very threat LeanMultisig is
                designed to address.
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
                <strong>Why not for LeanMultisig:</strong> FRI has larger proofs (~150-250 KB) and slower
                verification. The verifier must make{' '}
                <InlineMath tex="O(\lambda + \frac{\lambda}{k} \cdot m)" /> queries — the
                linear <InlineMath tex="m" /> factor makes verification cost grow with the problem
                size. FRI also lacks a natural multilinear PCS mode, which LeanMultisig needs for its
                simple stacking technique.
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
                in the millisecond range. Not fast enough for LeanMultisig's recursive aggregation,
                where verification happens inside the circuit at every tree level.
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
                <strong>Why LeanMultisig chose WHIR:</strong> WHIR functions as a multilinear polynomial
                commitment scheme, which enables LeanMultisig's "simple stacking" — multiple multilinear
                polynomials (from the execution table, Poseidon2 table, and extension op table) are
                concatenated into one and committed via a single WHIR instance. No need for
                univariate FFT-based commitment like FRI or Plonky3. Being hash-based, it is
                post-quantum secure and requires no trusted setup.
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
        combining into the protocol that powers LeanMultisig's polynomial commitment layer.
      </p>
    </Section>
  );
}
