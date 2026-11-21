# 2026-11-21: independent-objective benchmark integrity

## Engineering limitation
The baseline `dense-same-objective` case changes only phase sampling, yet it was previously grouped with held-out targets. This can overstate generalization evidence even when no new target geometry is evaluated.

## Hypothesis and falsification
A phase-aligned, translation-invariant shape comparison at 192 samples with 1e-7 mm threshold will identify exactly one training-resampling control and three geometrically distinct objectives in the current four-target suite. The regression must fail if the control is labeled independent, if duplicate evaluation targets are treated as independent, or if the audit output is nondeterministic.

## Prior art and novelty boundary
Grouped train/test splitting, leakage detection and held-out evaluation are established in machine learning; geometric curve comparison is established computational geometry. This is an evidence-integrity improvement, **not** a new invention. The metric does not establish independent data generation or physical novelty.

## Limits and next benchmark
Retain raw target fit scores, but never count resampling controls as independent generalization evidence. Next: >=10 seeds, matched topology budgets, independent measured target trajectories, design ancestry, and external 3D geometry validation. No 3D collision, torque, manufacturing or experimental hardware claims.
