# Independent 5 PM engineering review — 2026-11-15 (America/Toronto)

Base: main at 1c60af0096b04dc88191ce232dc67bdef04d060e.

## Findings and prior-art caution
Engine Zero currently discovers idealized planar R/P linkage graphs and evaluates synthetic trajectory fits. Four-bar synthesis, topology optimization, constraint-based CAD, and mechanism simulation are established research and commercial categories. Relevant comparison candidates to investigate include OpenSCAD/CadQuery (parametric geometry), FreeCAD/Onshape (CAD assemblies), and academic linkage synthesis / optimization methods. Their precise current capabilities and licensing were **not independently verified** in this review; conduct literature/product feature and patent searches before any novelty claim.

The existing benchmark's four-bar incumbent is pretrained/hardcoded, family search budgets are not equal, and the four held-out cases are variations of a single synthetic task suite. It measures interpolation/generalization of frozen champions, **not** performance after retraining each topology for each task. Its best family cannot establish a new invention. Sampling 96 phases cannot rule out between-sample collisions, singularities, or branch changes.

## High-leverage missing capability
**Verification-guided topology synthesis with counterexample feedback:** automatically find a candidate, independently challenge its full-cycle motion at adaptively selected phase intervals and with physical clearance constraints, then use a discovered failure as a new constraint for the next synthesis attempt. This is a *hypothesis for a useful integrated workflow*, not an assertion that nobody has done it.

## Falsifiable POC
1. Freeze 25 procedurally generated target trajectories from a public seed list *before* optimization; stratify by path family and stroke/lift, and retain a genuinely unseen final test set.
2. Use identical wall-clock and objective-evaluation budgets for each competing method; report hardware, Node version, seeds, timeout, failed runs, and full output graphs. Compare to a tuned 4R-only optimizer, a fixed-topology graph optimizer, and a graph-grammar optimizer without verifier feedback.
3. Add an independent adaptive interval verifier for phase continuity and link clearance (first on 2D line-segment geometry), with a specified minimum clearance threshold (e.g. 2 mm). Treat unknown/timeout as not verified.
4. On each counterexample, add a targeted constraint and rerun the optimizer. Measure independently verified feasible success rate, held-out path RMSE, median objective evaluations, and wall time. Count a design as successful only if full-cycle verifier passes and held-out RMSE <= 10 mm.
5. Pre-register a **material advantage** gate: at least +20 percentage points verified-success rate against the strongest budget-matched baseline across >=25 test cases and >=5 seeds, with paired bootstrap 95% CI lower bound above zero. Publish failures and all cases.

**Disproof:** if the verifier-guided approach fails to beat the strongest baseline under matched compute, cannot resolve false positives on adversarial near-singular examples, or needs human-selected graph seeds, do not claim an advance.

## Scoped code change on this branch
Added `experiments/test-benchmark-audit.js` to check family coverage, distinct held-out conditions, baseline-delta arithmetic, score/penalty accounting, and finite nonnegative metrics. It does not establish solver correctness. It is deliberately separate from the primary agent's test file and CI config.

## Execution limitation
The GitHub connector accepted the branch and file commits. The local execution environment could not resolve github.com to clone the repository, so **no new tests were run or claimed PASS** in this independent review. Next 4 PM agent: run `node experiments/test-benchmark-audit.js`, `node experiments/test-benchmark.js`, and `node test.js` on the PR branch; investigate any failure before merging, then consider wiring the audit into CI after review.
