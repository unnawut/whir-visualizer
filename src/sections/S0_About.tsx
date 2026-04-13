import { Section } from '../components/Section';
import { Math as InlineMath } from '../components/MathBlock';

export function S0_About() {
  return (
    <Section
      id="introduction"
      title="About"
      subtitle="An interactive guide to understanding the WHIR protocol — the polynomial commitment scheme inside leanMultisig."
    >
      <h3 id="about-this-visualizer" className="font-heading text-xl font-semibold text-text mb-3">
        WHIR — A Gentle Introduction
      </h3>
      <p>
        This is an interactive, step-by-step guide to <strong>WHIR</strong> (Weights
        Help Improving Rate), the polynomial commitment scheme used
        inside <strong>LeanMultisig</strong> — a minimal zkVM designed to aggregate
        post-quantum hash-based signatures for Ethereum.
      </p>
      <p className="mt-3">
        Ethereum's consensus layer currently relies on BLS signatures for validator attestations.
        BLS is efficient and supports cheap aggregation, but it is vulnerable to quantum computers.
        One candidate migration path is hash-based signatures such as{' '}
        <a href="https://github.com/leanEthereum/leanSig" target="_blank" rel="noopener noreferrer" className="text-sienna hover:underline font-semibold">leanSig</a>,
        which are quantum-resistant but 10–100x larger than BLS and lack native aggregation. LeanMultisig is a
        minimal zkVM that aggregates thousands of these signatures into a single compact proof using
        a hash-based SNARK powered by WHIR.
      </p>
      <p className="mt-3">
        WHIR is the component that makes leanMultisig's verifier fast enough for on-chain verification
        and recursive proof composition. Its super-fast verification time — hundreds of microseconds
        — is what enables a tree of recursive proofs to aggregate batches of leanSig signatures
        into one final proof that Ethereum validators can check cheaply.
      </p>
      <p className="mt-3">
        This site is an interactive, step-by-step guide that builds up the ideas behind WHIR from
        scratch. No prior knowledge of cryptography or zero-knowledge proofs is assumed — just a
        software engineering background.
      </p>

      <h3 id="the-papers" className="font-heading text-xl font-semibold text-text mt-10 mb-3">
        The Papers
      </h3>
      <div>
        <ul className="space-y-2 list-disc ml-5">
          <li>
            <strong>WHIR</strong> — Gal Arnon, Alessandro Chiesa, Giacomo Fenzi, and
            Eylon Yogev,{' '}
            <a href="https://eprint.iacr.org/2024/1586" target="_blank" rel="noopener noreferrer" className="underline hover:text-sienna">
              <em>"WHIR: Reed-Solomon Proximity Testing with Super-Fast Verification"</em>
            </a> (2024).
            This visualizer is based on the protocol described in that paper.
          </li>
          <li>
            <strong>LeanMultisig</strong> —{' '}
            <a href="https://github.com/leanEthereum/leanMultisig" target="_blank" rel="noopener noreferrer" className="underline hover:text-sienna">
              <em>"Minimal zkVM for Lean Ethereum"</em>
            </a> (draft 0.6.0).
            Specifies how WHIR is used as the polynomial commitment scheme inside
            a minimal zkVM for post-quantum signature aggregation on Ethereum.
          </li>
        </ul>
      </div>

      <h3 id="simplifications" className="font-heading text-xl font-semibold text-text mt-10 mb-3">
        Simplifications
      </h3>
      <div>
        <p className="mb-3">
          This visualizer prioritizes intuition over precision. A few places where
          the presentation compresses or simplifies the real protocol:
        </p>
        <ul className="space-y-2 list-disc ml-5">
          <li>
            <strong>Challenge-response pairs are presented as single steps.</strong> The
            OOD probe and shift queries each involve two messages — the verifier
            issues a challenge, then the prover computes a response. In practice,
            challenges are derived via Fiat-Shamir (the prover computes them from
            the transcript but cannot control them), hence we present them as
            single steps.
          </li>
          <li>
            <strong>The folding parameter <InlineMath tex="k" /> is shown as constant.</strong> In
            leanMultisig, <InlineMath tex="k" /> varies per iteration (7 for the first
            round, 5 for subsequent rounds). The visualizer uses a single value for
            simplicity.
          </li>
          <li>
            <strong>Security estimates are approximate.</strong> The real WHIR soundness
            analysis uses the Johnson Bound and accounts for proximity gaps. Our
            simplified model uses a basic union-bound formula that gives
            directionally correct but not precise security levels.
          </li>
          <li>
            <strong>Performance estimates absorb all costs into a single hash rate.</strong> Real
            proving involves NTT, sumcheck computation, field arithmetic, and
            parallelization — our ~12ns/hash effective rate is calibrated to match
            reported benchmarks, not derived from first principles.
          </li>
          <li>
            <strong>The referee example is a toy trace.</strong> LeanMultisig's execution
            trace has ~20 columns per cycle (execution, Poseidon, extension ops)
            stacked into one committed polynomial. The 3-referee / 4-row example
            illustrates the concept without the full complexity.
          </li>
        </ul>
      </div>

      <h3 id="how-demos-work" className="font-heading text-xl font-semibold text-text mt-10 mb-3">
        How the Interactive Demos Work
      </h3>
      <p>
        Throughout this site, interactive demos let you explore the math hands-on. To keep
        things readable, all demos operate over a small finite field rather than the large
        fields used in leanMultisig's production implementation.
      </p>

      <ul className="space-y-3 list-disc ml-5 mt-4">
        <li>
          <strong>Demo field: <InlineMath tex="\mathbb{F}_{17}" /></strong> — The demos
          use <InlineMath tex="\mathbb{F}_{17}" /> (arithmetic modulo the
          prime <InlineMath tex="p = 17" />) for readability. In leanMultisig, the field
          is the <strong>KoalaBear prime</strong>{' '}
          <InlineMath tex="p = 2^{31} - 2^{24} + 1" />, which fits in a single{' '}
          <code>u32</code> and enables an efficient Poseidon2 S-box via the cubing
          map <InlineMath tex="x \mapsto x^3" />. For 128-bit security in WHIR, leanMultisig works
          over the degree-5 extension field <InlineMath tex="\mathbb{F}_{p^5}" />.
        </li>
        <li>
          <strong>Multiplicative subgroup and domain</strong> — The multiplicative group
          of <InlineMath tex="\mathbb{F}_{17}^*" /> has order 16,
          generated by the primitive root <InlineMath tex="g = 3" /> (meaning{' '}
          <InlineMath tex="3^{16} \equiv 1 \pmod{17}" />). This gives us subgroups of size
          16, 8, 4, and 2 — perfect for demonstrating the repeated domain halving that WHIR
          relies on. The demos typically start with a domain of size 8 and fold down to 4,
          then 2. In leanMultisig, the KoalaBear field has a much larger multiplicative group,
          enabling commitment domains of up to <InlineMath tex="2^{30}" /> elements.
        </li>
        <li>
          <strong>Pre-selected randomness</strong> — In the real protocol, the verifier's
          challenges are derived from hashing the transcript (Fiat-Shamir). In the demos,
          we use fixed values so that the walkthrough is deterministic and reproducible.
        </li>
      </ul>
    </Section>
  );
}
