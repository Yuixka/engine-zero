# Third engineer — paired independent-verification evidence (2026-11-22)

Main inspected: 93b27f8. Recent 4 PM work #20 (objective-integrity audit) merged; second engineer #23 ancestry audit and #24 independent oracle protocol remain review items. Prior third-engineer #22 clearance certificate is conditional on an unproven Lipschitz bound. This branch does not modify their implementations.

## Hypothesis
At identical per-task/per-seed search budgets, verification-gated generation improves **independent-oracle verified yield** over nominal-only generation. Reject if the paired yield difference is nonpositive, or the observed improvement fails prespecified statistical and engineering thresholds on truly held-out objectives.

## Prototype
`experiments/paired-verification-audit.js` consumes matched task/seed/budget outcomes, rejects duplicates and budget mismatches, reports both/discordant outcomes and exact two-sided McNemar p-value. Regression fixtures exercise 6:0 and 0:6 discordance, ties, invalid input and duplicate/budget guards. These are *synthetic statistical fixtures*, not real mechanism evidence.

## Preregister before running
25 genuinely held-out objective families × 20 seeds, equal evaluation budgets and fixed reference oracle; group dependence by objective and report objective-level uncertainty in addition to paired p-values. Independently measure false-negative clearance, runtime and verified yield. No multiple-testing correction or grouped uncertainty is implemented in this prototype; do not use the p-value alone to claim discovery.

## Prior art
Paired binary-outcome tests (McNemar), controlled benchmarks, and verification-gated optimization are established; novelty, if any, must arise from an independently validated engineering capability, not this statistics utility. Current repo lacks robust 3D clearance, force/stress, and physical testing.

## Five-system handoff
- CAD library: expose real tolerances, layer thickness and part provenance for the reference oracle.
- Assembly graph: export consistent joint frames and units for paired candidates.
- Generative design: preserve exact task/seed and matched evaluation budgets.
- Simulation/verification: implement independent dense 3D/tolerance oracle and classify unknown separately from verified.
- Autonomous experimentation: preregister held-out objectives, capture paired records, evaluate uncertainty by objective family and compare to incumbents.

Blockers: no verified 3D reference oracle, no external benchmark data, no physical prototypes. Next experiment: build one independent crossing-between-samples reference fixture, then run matched-budget end-to-end paired evaluation. No world-first claim.
