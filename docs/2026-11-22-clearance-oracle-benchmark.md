# Independent clearance-oracle benchmark protocol (2026-11-22)

Status: PROPOSAL ONLY; no implementation, executed experiments, or novelty claim.

## Gap and hypothesis
The repository currently has sampled planar interference screening, but lacks an independent continuous-sweep 3D clearance oracle. A passing sampled 2D check is not evidence of manufacturable clearance. **Hypothesis H1:** under identical search budgets, an oracle-guided generator achieves at least +20 percentage points absolute independently verified feasible yield compared with an otherwise identical sampled-2D-screened generator, on held-out mechanism tasks. The oracle must not be the sole evaluator of its own candidates.

## Prior-art positioning (verify citations before publication)
Topology synthesis and numerical mechanism optimization are established; so are configuration-space collision detection, continuous collision detection (CCD), interval arithmetic, and robust design optimization. Compare against representative established approaches including Open CASCADE geometry checks, FCL-style collision libraries, and motion-planning collision checking; these are candidate baselines, **not evidence of novelty**. A meaningful claim would be an experimentally demonstrated integrated workflow from editable graph topology through tolerance-aware clearance to independently validated candidate selection, not invention of collision checking itself.

## Reproducible proof of concept
1. Freeze 25 genuinely distinct held-out objective trajectories and 20 random seeds per objective; ensure no training target is duplicated by phase shift, rotation, translation, scaling, or resampling. Publish objective hashes and train/test split before tuning.
2. Export each candidate as planar capsules/hubs with explicit thickness, z-layer, pin/bore dimensions, ground interfaces, and tolerance intervals. Reject missing physical inputs rather than filling them silently.
3. Baseline A: existing generator + sampled 2D screening. Baseline B: same generator + dense sampled independent 3D checker. Experimental C: same generator + interval/CCD-informed rejection or repair. Equalize candidate evaluations, CPU-time caps, search seeds and hardware; report both evaluation-matched and wall-clock-matched results.
4. Independent oracle: use a separately implemented geometry kernel or conservative interval-distance checker, with a higher-precision reference and adversarial fixtures. Measure minimum signed separation over the entire actuator sweep including between sampled frames, under worst-case declared tolerances. Self-contact exemptions must be explicit by component pair and joint, not blanket exclusions for connected bodies.
5. Include adversarial cases: crossing capsules between samples; near-tangent clearance; coincident/overlapping hubs; adjacent link bodies that collide away from their shared pin; varying layer heights; worst-case tolerance stackups; degenerate zero-length segments; missing ground bore; and solver branch jumps.
6. Report feasible-yield numerator/denominator, Wilson 95% intervals, missed-collision false negatives, median/p95 wall time, path RMSE, number of generated topologies and mechanical complexity. Count solver failures as infeasible, never drop them from the denominator.

## Acceptance and disproof
Pass only if C improves verified yield by >=20 absolute percentage points against the stronger of A/B, with a predeclared confidence interval excluding zero, while meeting equal wall-clock constraints and no regression in path RMSE beyond a predeclared 10% relative margin. Any independently verified collision falsely marked safe is a safety-critical failure and must be reported even if aggregate yield improves. H1 is falsified if the advantage vanishes under independent oracle, matched budgets, held-out tasks, or tolerance perturbations; or if the method only improves sampled proxy metrics. Do not claim continuous collision safety from finite sampling.

## Five-system handoff
- CAD library: define thickness, layers, tolerance ranges and provenance for each primitive.
- Assembly graph: encode pair-specific permitted contact and joint clearance constraints.
- Generative engine: expose identical evaluation budgets and deterministic seeds across A/B/C.
- Verification: implement independent oracle and adversarial crossing-between-frames fixture first.
- Experimentation: freeze held-out suite, log failures and calculate confidence intervals without tuning on test targets.

Next 4 PM engineer: implement **one** adversarial between-frame crossing fixture and an independent distance reference before adding any optimizer feature. Run `node test.js` and `node scripts/test-handoff.js` in CI; report exact results. No tests were executed for this document-only change.
