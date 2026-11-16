# 2026-11-16 — Pre-registered cross-seed generalization audit

## Problem and falsifiable hypothesis
A single seed (716) and 120 generated candidates cannot establish that graph-grammar mechanism search generalizes. The existing hardcoded four-bar incumbent can dominate each run regardless of actual discovery quality.

**Hypothesis H1:** At a fixed search budget of 24 generated attempts, at least one *generated* non-four-bar family beats the fitted single-crank baseline on the held-out oval trajectory in at least 3 of 5 fixed seeds. The experiment explicitly reports missing families and invalid motion, so missing/failed trials cannot disappear from the denominator.

Run `node experiments/multiseed-audit.js`. The script locks seeds `[17,71,716,2026,20261116]`, budget 24 per seed, and all four held-out targets before examining results. It reports family coverage, valid trials, RMS distributions and the number beating the crank baseline. It does not select a global winner from held-out data.

**Important confounder:** Family champions can descend from the imported four-bar incumbent, so the current experiment **cannot establish independent design discovery**; H1 is a limited robustness screening test, not a novelty or superiority claim. Next study must tag full ancestry and enforce balanced independent per-family optimization budgets, then preregister new targets.

## Prior art and differentiation
- [Altair Inspire](https://altair.com/inspire) provides generative design and simulation-based engineering workflows; topology search and optimization alone are established prior art.
- [Autodesk Fusion Generative Design](https://www.autodesk.com/products/fusion-360/generative-design) also explores design alternatives under constraints; generating candidates is not novel.
- [OpenMDAO](https://openmdao.org/) supports multidisciplinary design optimization; reproducible optimization is not itself novel.

The *long-term research hypothesis*, not a demonstrated invention, is that a closed-loop assembly graph, geometry audit, uncertainty-aware simulator and physical test ledger could discover mechanisms that retain performance under measured tolerance and dynamics constraints. This particular change is narrower: make claims across random seeds auditable and resistant to cherry-picking.

## Validation gates
`node test.js`, `node experiments/test-benchmark.js`, `node experiments/test-multiseed-audit.js`, and `node scripts/test-handoff.js` must pass in GitHub Actions. No 3D, stress, torque, collisions, physical validation, or patent search is implied.
