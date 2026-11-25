# Third engineer handoff — 2026-11-20

Base: main as fetched for branch research/third-engineer-phase-aliasing-20261120. Latest observed main commit: 6c6317df90cf117836cb7611eb13ab7a51a7b500 (sampled 2D interference risk diagnostic). Prior engineering changes on main include nominal pin/bore checks, parametric components, seeded held-out benchmarks and independent geometry audits. Existing third-engineer draft PRs discussed previously concern tolerance, rank, and between-frame collisions; do not merge or duplicate those blindly.

## Research question and prior-art boundary
Uniform phase sampling can miss narrow collision/clearance events, a known numerical aliasing problem. Adaptive time stepping, interval methods and continuous collision detection already address related problems in established simulation tools; this is NOT a claim of a novel algorithm. The potentially differentiating system capability is an integrated, evidence-backed **adversarial verification loop**: autonomously generate counterexamples to its own acceptance tests, promote confirmed failures to held-out regression fixtures, and only then rank generated mechanisms. This requires further comparative research and implementation.

## Change
Added `experiments/phase-aliasing-benchmark.js`, a dependency-free, deterministic counterexample to uniform sampling. A periodic negative-clearance window centered halfway between 36 nominal phases is missed at 36 samples, but found by a half-step shifted grid or 288 samples. Includes periodic-wrap and input-validation assertions. This is synthetic geometry only; it does not validate any real linkage, 3D stacking, loads, or collision guarantee.

## Falsifiable hypothesis and benchmark
H1: A fixed-budget, risk-directed or shifted phase audit detects more planted sub-frame clearance violations than a single uniform phase grid at equal total solver evaluations, on held-out seeds and across 4R, slider-crank, six- and eight-link families. Compare false-negative rate, solver evaluations, runtime, and any false positives, against uniform 36/72/144/288 phases and the existing independent interference screen. Pre-register 100+ held-out configurations with contact width and phase offset varied independently; reject H1 if no statistically defensible improvement at matched cost. The current fixture demonstrates only an aliasing counterexample, not H1.

## Five-system briefing
- CAD components: provide swept shape/clearance bounds and axial layer metadata; nominal 2D capsules alone cannot certify physical clearance.
- Assembly graph: expose valid joint configurations and singularity flags so verification can prioritize suspicious intervals.
- Generative design: preserve deterministic seeds and reserve held-out cases; do not optimize on the test fixtures.
- Simulation/verification: integrate independent phase-offset checks and eventually interval/continuous collision tests; keep risk screen non-certifying.
- Autonomous experimentation: report detection recall at matched solver budget and archive adversarial counterexamples with provenance.

## Execution and handoff
Run `node experiments/phase-aliasing-benchmark.js` and `node test.js` in CI or a checked-out environment. No claims of passing CI or physical validation without recorded execution. Primary 4 PM engineer should assess integration with interference screen; second 5 PM engineer should review independence and held-out evaluation. Avoid merging without reviewing overlapping draft PRs.
