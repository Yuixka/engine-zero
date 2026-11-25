# Independent clearance benchmark protocol — 2026-11-20 (second engineer)

Status: preregistration proposal, **not measured**. Baseline main reviewed at commit `6c6317df90cf117836cb7611eb13ab7a51a7b500`. Compare with pending PRs #15 (metamorphic planar tests), #16 (between-frame risk), and #17 (axial interval screening) before integrating; do not merge duplicate algorithms.

## Missing capability and hypothesis
Engine Zero has a sampled **projected 2D** nonadjacent-body interference screen. A 2D projection can flag physically separated layers, while sparse temporal samples can miss crossings. Axial interval overlap (#17) is an established broad-phase collision concept, not a novel invention. The high-leverage missing capability is an **independent, uncertainty-aware acceptance oracle** spanning the actual motion trajectory, layer stack, and dimensional tolerances, then using its feedback to improve search yield.

Hypothesis H1: Under identical generation and verification budgets, oracle-guided synthesis achieves >=20 percentage points higher independently verified feasible yield than nominal-RMSE-only search on frozen, unseen tasks, without >2x median runtime. No novelty claim unless the *end-to-end workflow* is compared against existing constraint-based mechanism synthesis and CAD verification.

## Prior art to check before any originality claim
- Established broad/narrow-phase collision detection and continuous collision detection; 2D capsule distance, AABB interval culling, and temporal subdivision are standard techniques.
- CAD interference checking and parametric assemblies (e.g. FreeCAD, Onshape, SOLIDWORKS), and multibody motion simulation (e.g. OpenModelica / Simscape Multibody) already offer portions of the workflow.
- Robust design optimization, tolerance stack-up, and mechanism synthesis are established research areas. Search papers, patents, and current product documentation for *integrated search + independent tolerance-aware cycle verification*, not isolated primitives. No external comparison was executed for this note.

## Frozen experiment (before looking at outcomes)
1. Publish 100 held-out trajectory/architecture tasks with fixed seeds and explicit topology family labels. Exclude any target equal to training objectives (especially the earlier `dense-same-objective` case). Freeze generation budgets at 1000 candidates/task, solver iteration limits, CPU and memory settings, and candidate ranking.
2. Arms: A = current nominal path-RMSE ranking; B = nominal ranking plus sampled projected 2D rejection; C = oracle-guided ranking using axial layer intervals, tolerances, and adaptive phase refinement. All arms receive identical candidate streams and total independent oracle calls; account for oracle compute in wall-clock time.
3. Independent oracle: construct poses from an independently implemented kinematic solver or independently checked residuals; check all nonadjacent physical body pairs, including known joint/ground exemptions only when documented. Use axial z intervals with conservative bounds, full 2D capsule/hub geometry, and manufacturing dimension intervals. Validate with 2048 phases plus adaptive subdivision of intervals whose clearance lower bound cannot be proven positive. If no conservative continuous bound is available, label result **unknown**, not collision-free.
4. Negative controls: same planar crossing at disjoint z layers (not collision); same crossing with touching/overlapping z intervals (risk); crossing only between 36 sampled phases; zero-length link; nearly tangent clearance; tolerances crossing nominal fit boundary; missing z metadata (unknown/fail closed); joint-adjacent parts that intentionally share a pivot.
5. Record each attempted candidate and rejection reason (no survivor-only denominators), task ID, topology, seed, exact geometry, layer and tolerance input, verifier version, wall time, and independent-oracle classification (pass/fail/unknown).

## Metrics and falsification
Primary: independently verified feasible yield per 1000 attempted candidates, with 95% task-bootstrap CI for C-A and C-B. Also report false-negative rate of each screening arm against independent oracle, false-positive rate for axially separated parts, unknown rate, median/p95 runtime, path RMSE, topology coverage, and failures by reason. H1 is falsified if the lower 95% CI bound for C-A is <=0, observed gain <20 pp, median runtime >2x, or the advantage disappears after candidate and oracle budgets are equalized. Do not interpret unknown as pass. No hardware claims.

## Five-system handoff for next 4 PM
- **CAD:** define immutable mm-valued part profiles with tolerances, z-low/z-high and thickness consistency; reject missing metadata.
- **Assembly graph:** explicitly encode intentional contact exemptions by joint/body ID, never by visual proximity.
- **Generative design:** preserve candidate denominator and fixed streams across A/B/C; do not optimize against the hidden oracle.
- **Simulation/verification:** provide independent solver cross-check, conservative continuous-clearance bounds or explicit unknown status, and negative controls.
- **Experimentation:** preregister seeds/tasks, produce a machine-readable CSV, confidence intervals and reproducible commands; compare against established CAD/optimization workflows.

## Review and execution status
This change is a protocol document only. No executable tests were added or run; no performance numbers or novelty were established. PR #17's axial interval check is a useful preliminary gate, **not** proof of continuous 3D collision freedom. Next action: run existing CI on #15–#17, inspect and reconcile overlapping checks, then implement a minimal independent oracle with one crossing-between-samples fixture before accepting any generated design as collision-free.
