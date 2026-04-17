import { Section } from '../components/Section';
import { Math as InlineMath } from '../components/MathBlock';

export function S8_WhirInLeanMultisig() {
  return (
    <Section
      id="whir-in-leanmultisig"
      number={8}
      title="WHIR in leanMultisig"
      subtitle="How WHIR fits into leanMultisig's full proving pipeline."
    >
      <p>
        The previous sections covered WHIR's proximity testing in isolation — the
        recursive loop of sumcheck, fold, OOD probe, and shift queries. But in
        leanMultisig, WHIR is one piece of a larger pipeline.
      </p>

      <h3 id="what-leanmultisig-needs" className="font-heading text-xl font-semibold text-text mt-10 mb-3">
        What leanMultisig Needs to Prove
      </h3>
      <p>
        leanMultisig is a zkVM for aggregating post-quantum signatures. To produce
        a proof of correct execution, it needs to convince a verifier of three
        things:
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
        {/* Card 1: Execution rules */}
        <div className="bg-bg-card border border-border rounded-lg p-4">
          <div className="h-28 flex items-center justify-center mb-3">
            <svg viewBox="0 0 200 100" className="w-full h-full">
              <text x="2" y="24" fontSize="8" fill="#6b6375">row n</text>
              {[40, 66, 92, 118].map(x => (
                <rect key={x} x={x} y="14" width="26" height="18" fill="#fefdfb" stroke="#1a365d" strokeWidth="1" />
              ))}
              <line x1="92" y1="36" x2="92" y2="62" stroke="#1a365d" strokeWidth="1.5" />
              <polygon points="88,59 96,59 92,65" fill="#1a365d" />
              <text x="100" y="52" fontSize="9" fill="#1a365d" fontStyle="italic">degree-5</text>
              <text x="2" y="80" fontSize="8" fill="#6b6375">row n+1</text>
              {[40, 66, 92, 118].map(x => (
                <rect key={x} x={x} y="68" width="26" height="18" fill="#fefdfb" stroke="#1a365d" strokeWidth="1" />
              ))}
            </svg>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <strong className="text-sm">1. Execution rules hold</strong>
          </div>
          <p className="text-xs text-text-muted">
            Each transition between consecutive rows obeys the VM's degree-5
            AIR constraints (execution, Poseidon1, extension ops).
          </p>
        </div>

        {/* Card 2: Memory accesses */}
        <div className="bg-bg-card border border-border rounded-lg p-4">
          <div className="h-28 flex items-center justify-center mb-3">
            <svg viewBox="0 0 200 100" className="w-full h-full">
              {/* Execution rows on the left */}
              <text x="2" y="22" fontSize="7" fill="#6b6375">row 5</text>
              <rect x="22" y="14" width="55" height="14" fill="#fefdfb" stroke="#2f855a" strokeWidth="1" />
              <text x="26" y="24" fontSize="8" fill="#2f855a" fontWeight="bold">W: x=42</text>
              <line x1="50" y1="30" x2="50" y2="62" stroke="#6b6375" strokeWidth="1" strokeDasharray="2 2" />
              <text x="56" y="48" fontSize="7" fill="#6b6375" fontStyle="italic">...</text>
              <text x="2" y="76" fontSize="7" fill="#6b6375">row 500</text>
              <rect x="22" y="68" width="55" height="14" fill="#fefdfb" stroke="#2f855a" strokeWidth="1" />
              <text x="26" y="78" fontSize="8" fill="#2f855a" fontWeight="bold">R: x=42</text>
              {/* Memory array on the right */}
              <text x="145" y="9" fontSize="7" fill="#6b6375">memory</text>
              <rect x="140" y="12" width="55" height="14" fill="#fefdfb" stroke="#1a365d" strokeWidth="1" />
              <text x="145" y="22" fontSize="8" fontFamily="monospace">addr 0</text>
              <rect x="140" y="26" width="55" height="14" fill="#fefdfb" stroke="#1a365d" strokeWidth="1" />
              <text x="145" y="36" fontSize="8" fontFamily="monospace">addr 1</text>
              <rect x="140" y="40" width="55" height="14" fill="#8b4513" fillOpacity="0.18" stroke="#8b4513" strokeWidth="1.5" />
              <text x="145" y="50" fontSize="8" fontFamily="monospace" fill="#8b4513" fontWeight="bold">addr 2: 42</text>
              <rect x="140" y="54" width="55" height="14" fill="#fefdfb" stroke="#1a365d" strokeWidth="1" />
              <text x="145" y="64" fontSize="8" fontFamily="monospace">addr 3</text>
              <rect x="140" y="68" width="55" height="14" fill="#fefdfb" stroke="#1a365d" strokeWidth="1" />
              <text x="145" y="78" fontSize="8" fontFamily="monospace">addr 4</text>
              {/* Arrow from W to addr 2 */}
              <path d="M 77 21 Q 110 21 140 45" fill="none" stroke="#2f855a" strokeWidth="1.5" />
              <polygon points="137,42 141,47 138,48" fill="#2f855a" />
              {/* Arrow from R to addr 2 */}
              <path d="M 77 75 Q 110 75 140 49" fill="none" stroke="#2f855a" strokeWidth="1.5" strokeDasharray="3 3" />
              <polygon points="137,46 141,50 138,52" fill="#2f855a" />
            </svg>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <strong className="text-sm">2. Memory accesses are valid</strong>
          </div>
          <p className="text-xs text-text-muted">
            Memory reads match writes, and lookups into precomputed tables
            (range checks, bitwise ops) are valid.
          </p>
        </div>

        {/* Card 3: Trace well-formed */}
        <div className="bg-bg-card border border-border rounded-lg p-4">
          <div className="h-28 flex items-center justify-center mb-3">
            <svg viewBox="0 0 200 100" className="w-full h-full">
              <path
                d="M 20,75 Q 60,5 100,55 T 180,30"
                fill="none"
                stroke="#8b4513"
                strokeWidth="2.5"
              />
              {/* On-curve dots — valid */}
              <circle cx="20" cy="75" r="5" fill="#8b4513" />
              <circle cx="100" cy="55" r="5" fill="#8b4513" />
              <circle cx="180" cy="30" r="5" fill="#8b4513" />
              {/* Off-curve dots — what WHIR rejects */}
              <circle cx="60" cy="80" r="5" fill="#c53030" />
              <line x1="56" y1="76" x2="64" y2="84" stroke="#fefdfb" strokeWidth="1.5" />
              <line x1="64" y1="76" x2="56" y2="84" stroke="#fefdfb" strokeWidth="1.5" />
              <circle cx="140" cy="42" r="5" fill="#c53030" />
              <line x1="136" y1="38" x2="144" y2="46" stroke="#fefdfb" strokeWidth="1.5" />
              <line x1="144" y1="38" x2="136" y2="46" stroke="#fefdfb" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <strong className="text-sm">3. Trace well-formed</strong>
            <span className="text-[10px] bg-sienna text-white font-semibold px-1.5 py-0.5 rounded">
              WHIR
            </span>
          </div>
          <p className="text-xs text-text-muted">
            Every committed column is a low-degree polynomial — not arbitrary
            data dressed up as one.
          </p>
        </div>
      </div>

      <p>
        WHIR handles the trace check — proximity to a low-degree polynomial,
        plus opening that polynomial at requested points — and it does so{' '}
        <strong>really fast, even in recursion</strong>, which is exactly what
        leanMultisig needs. The execution-rules and memory-access checks need
        different machinery.
      </p>
      <p className="mt-4">
        This separation is what makes leanMultisig modular: the AIR design, the
        lookup protocol, and the polynomial commitment scheme are independent
        components. WHIR could be swapped for another PCS (like FRI) without
        changing the constraint system — the only difference would be
        verification speed and proof size.
      </p>

      <h3 className="font-heading text-lg font-semibold text-text mt-6 mb-2">
        Why leanMultisig Checks Execution Rules Separately
      </h3>
      <p>
        WHIR's CRS framework <em>can</em> check constraints, but only{' '}
        <strong>linear</strong> ones. leanMultisig's AIR constraints are{' '}
        <strong>degree-5</strong> transition polynomials between consecutive
        rows that involve multiplications between columns — more expressive
        than WHIR's CRS layer handles on its own. leanMultisig runs a
        dedicated AIR sumcheck first to reduce the constraint check down to
        a few equality claims, which WHIR can then open.
      </p>

      <div className="bg-bg-card border-l-4 border-sienna rounded-r-md p-4 my-6">
        <div className="text-xs font-heading font-semibold text-sienna uppercase tracking-wide mb-2">
          Why degree-5 specifically?
        </div>
        <p className="text-sm text-text-muted mb-0">
          It's a design choice — the highest constraint degree leanMultisig
          allows across all its AIR tables. A lower ceiling would force the
          prover to split operations across more rows and columns, bloating
          the trace size and the Merkle tree committed over it. A higher
          ceiling would make each row's constraint more expensive to
          evaluate and inflate the sumcheck messages that verify them,
          growing both prover compute and proof size. Degree-5 is the sweet
          spot leanMultisig settled on.
        </p>
      </div>

      <h3 className="font-heading text-lg font-semibold text-text mt-6 mb-2">
        Why leanMultisig Checks Memory Accesses Separately
      </h3>
      <p>
        WHIR handles <strong>compute</strong> — arithmetic that happens
        within a row or between adjacent rows. But <strong>memory</strong> is
        different: a write on row 5 might be read on row 500, and no per-row
        polynomial constraint can say "the value I just read matches a value
        written much earlier". Without that check, a prover could make up any
        read value it likes.
      </p>
      <p className="mt-4">
        leanMultisig uses <strong>logup-GKR</strong> for this — a protocol
        that checks that every read has a matching write somewhere in the
        trace, and nothing is left unaccounted for, before WHIR ever gets
        involved.
      </p>

      <h3 id="full-pipeline" className="font-heading text-xl font-semibold text-text mt-10 mb-3">
        The Full Pipeline
      </h3>
      <p className="mb-4">
        Here's the complete flow in leanMultisig, from trace to proof. Notice
        that Logup-GKR runs before the AIR sumcheck — this lets the AIR
        sumcheck absorb Logup-GKR's results alongside the execution-rule
        check, so <strong>a single sumcheck</strong> covers both at once.
        Their final evaluation claims are then batched into a single set of
        WHIR openings at the end.
      </p>
      <ol className="list-decimal ml-6 my-4 space-y-3">
        <li>
          <strong>Commit</strong> — the prover encodes all trace columns
          (execution, Poseidon1, extension ops) into a single multilinear
          polynomial and commits it via WHIR's Merkle tree. This is the only
          step where WHIR is involved before the constraint checks.
        </li>
        <li>
          <strong>Logup-GKR</strong> — a dedicated protocol verifies the
          memory interactions (lookups and permutations). This checks that
          values read from memory match values written, and that lookup tables
          are used correctly. Not part of WHIR.
        </li>
        <li>
          <strong>AIR constraint sumcheck</strong> — a separate sumcheck verifies
          that the AIR constraints (degree-5 transition polynomials between
          consecutive rows) hold across the entire trace. This reduces the
          constraint check to a few <strong>equality claims</strong> — "the
          committed polynomial evaluates to this value at this point."
          Not part of WHIR.
        </li>
        <li>
          <strong>WHIR opens</strong> — the equality claims from steps 2–3
          become the input to WHIR's proximity testing. This is where the
          5-step iteration loop from Section 6 runs: sumcheck, fold, OOD probe,
          shift queries, repeat — until the polynomial is small enough to check
          directly.
        </li>
      </ol>

      <h3 id="leanmultisig-parameters" className="font-heading text-xl font-semibold text-text mt-10 mb-3">
        leanMultisig Parameters
      </h3>
      <p className="mb-4">
        For reference, here are the key WHIR-related parameters used in
        leanMultisig (from the{' '}
        <a href="https://github.com/leanEthereum/leanMultisig" target="_blank" rel="noopener noreferrer" className="underline hover:text-sienna">
          source code
        </a>):
      </p>
      <ul className="list-disc ml-6 space-y-2">
        <li>
          <strong>Field</strong>: KoalaBear
          prime <InlineMath tex="p = 2^{31} - 2^{24} + 1" />, with degree-5
          extension for 128-bit security
        </li>
        <li>
          <strong>Code rate</strong>: <InlineMath tex="\rho = 1/2" /> for leaf
          proofs, up to <InlineMath tex="1/16" /> for final wrap layers
        </li>
        <li>
          <strong>Folding</strong>: <InlineMath tex="k = 7" /> for the first
          iteration, <InlineMath tex="k = 5" /> for subsequent rounds
        </li>
        <li>
          <strong>Queries</strong>: computed dynamically based on the security
          level and soundness assumption — not hardcoded
        </li>
      </ul>
      <p className="mt-4">
        These parameters, analyzed under the{' '}
        <a
          href="https://en.wikipedia.org/wiki/Johnson_bound"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-sienna"
        >
          <strong>Johnson Bound</strong>
        </a>{' '}
        (leanMultisig's default; a Capacity Bound option is also available),
        yield <strong>123-bit hash security</strong> (cost of breaking the
        Merkle commitments via hash collisions) and{' '}
        <strong>~105-bit effective query security</strong> (cost of fooling
        WHIR's proximity testing). The protocol's real security is the{' '}
        <em>minimum</em> of the two.
      </p>
    </Section>
  );
}
