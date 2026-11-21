# Third engineer: conditional clearance certificate (2026-11-21)

Base main inspected: 93b27f8f324fa6c855c6d9d2c847c39950a7d8b1. Main supports ideal planar kinematics and sampled 2D interference, not certified continuous clearance or 3D mechanics. PR #21 guards benchmark sample counts; #17–#19 explore axial layers, between-frame risk and aliasing; this branch avoids their files.

## Falsifiable hypothesis
A **conservative, three-valued clearance gate** (certified clear / collision observed / unknown), using an independently justified phase-Lipschitz constant, will eliminate false 'safe' classifications on preregistered narrow-contact fixtures while using fewer evaluations than uniform 288-sample screening for sufficiently smooth, well-separated cases. Failure: any certified-clear case contains a true collision under a valid bound, or median evaluation budget is not better at matched miss rate.

## Prototype
`node experiments/test-clearance-certificate.js` runs the dependency-free scalar interval certificate. A 36-point uniform grid misses the negative-clearance fixture; adaptive certification observes it. A positive sinusoidal fixture must certify clear; a three-evaluation budget must yield unknown, never safe. The interval bound is derived from endpoint clearance and an assumed global Lipschitz constant. **This is a mathematical conditional certificate only**, not a validated bound on Engine Zero's actual joint-constrained motion.

## Prior art and novelty boundary
Lipschitz global optimization, interval branch-and-bound and conservative continuous collision detection are established methods. No patent search or world-first claim is made. Potential innovation lies in combining independently bounded mechanism motion, manufacturing tolerance, physical connector geometry, and automated synthesis under a reproducible evidence gate; this integration is not demonstrated here.

## Next engineer handoff / five-system briefing
- **CAD components:** require dimensional provenance, capsule radii, axial thickness and tolerance intervals; missing metadata => unknown.
- **Assembly graph:** derive or conservatively bound joint-velocity and positional sensitivities, including near singularities; never guess L.
- **Generative design:** rank candidates by verified yield at matched search budgets; count unknown separately.
- **Simulation/verification:** validate L against dense solver samples and independent geometric oracle; an empirical maximum derivative alone is not a proof.
- **Autonomous experimentation:** preregister 20 seeds, held-out 4R/slider/dyad families, 36/288 grid baselines, runtime/evaluation counts, false-safe rate, unknown rate, and confidence intervals.

## Evidence and blockers
Only source-level fixture assertions were added; execution and CI are not claimed until run. No physically justified L, no true 3D oracle, no physical validation. Keep this PR draft pending tests and independent review. Existing #17–#19 need rebase/review separately.
