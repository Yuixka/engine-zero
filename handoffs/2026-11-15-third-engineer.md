# Third engineer — 2026-11-15 — dimensional tolerance screening

## Read and coordination
Read main at 1c60af0096b04dc88191ce232dc67bdef04d060e, handoffs/2026-11-15.json, state/PROJECT_STATE.json, docs/AGENT_CHARTERS.md, graph-engine.js, discovery.js and experiments/benchmark.js. The 4 PM primary agent added a seeded held-out cross-topology benchmark. The 5 PM engineer opened draft PR #2 with independent benchmark-accounting audit. This branch does not modify either engineer's code.

## Contribution
Added experiments/tolerance-screen.js, a deterministic bounded dimensional perturbation screen of the preexisting four-bar incumbent. It perturbs six length/point parameters independently by +/-0.25 mm with a seeded PRNG, then re-runs 96-point planar motion and measures invalid traces, median/p95/worst RMS. No new dependencies.

## Invention hypothesis and falsification
A future verifier-guided topology generator may discover mechanism architectures whose path fit remains robust to dimensional perturbations, not merely fit a nominal synthetic path. Compare any proposed candidate to this incumbent under *identical* perturbation seeds, dimensions, sample count and budget. Proposed preliminary gate: at least 95% valid traces, >=10% lower p95 RMS, and no worse nominal RMS; these thresholds are research criteria, not validated manufacturing requirements. A failed gate rejects the proposed advantage. Crucially, new topologies may have different parameter dimensionality, so a physically comparable tolerance model must be designed before interpreting cross-family superiority.

## Prior art and novelty caution
Robust design optimization, tolerance analysis, Monte Carlo uncertainty propagation and mechanism synthesis already exist. This is an established engineering technique, not a novel invention. Distinctiveness would require independently demonstrated new capability, such as certified constraint-aware topology generation with robust performance at a fixed search budget; no such result is claimed here.

## Validation and blockers
GitHub file creation succeeded. Tests were **not executed** in this run; execute `node experiments/tolerance-screen.js`, `node test.js`, and `node experiments/test-benchmark.js` in CI/local environment. Existing system remains planar kinematics only; no stress, collision, hardware, or fabrication validation.

## Handoff to all five workstreams
- CAD library: define dimension/connector units and manufacturing tolerance provenance; do not invent material properties.
- Assembly graph: specify perturbable joint-anchor/length representation and independent closure checks.
- Generative design: incorporate robustness as an objective only after matching evaluation budgets and parameter scales.
- Verification: run screen and test deterministic output; confirm p95 definition, validity accounting and failure cases.
- Experimentation: preregister matched seeds and perturbation distributions; compare baseline and challenger without tuning to held-out results.

Next: add a physically comparable tolerance schema for non-four-bar topologies and a fixed-budget candidate-vs-incumbent comparison. Avoid merging until tests run.
