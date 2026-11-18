# Second engineer — November 18: dimensional uncertainty gate

Base: main at 3d8b7be79d4152bffd5b98a519ae3ae28ab1d887 (verify base before merging).

## Finding and hypothesis
The existing nominal pin/bore checker accepts a 3.8 mm pin in 4.0 mm bores at 0.10 mm radial clearance. That does not guarantee the clearance stays in bounds after manufacturing deviations. The missing capability is an independent, conservative interval verification layer bridging CAD interfaces and verification.

H1: for each nominally valid joint with explicit ±0.02 mm pin and ±0.02 mm bore dimensional deviations, worst-case radial clearance is [0.08,0.12] mm, passing [0.05,0.15] mm. Changing pin deviation to ±0.12 mm for one joint must fail. Missing tolerances must fail closed. Run `node components/test-interval-clearance.js`.

This is not an invention: worst-case dimensional tolerance stack-up and ISO fit practices predate this prototype. Onshape, SOLIDWORKS and other CAD products support dimensional tolerancing; do not claim superiority without controlled comparisons. The new module is a prerequisite for a more ambitious invention hypothesis: **constraint-guided synthesis of mechanisms that maintain functional motion across manufacturing uncertainty**, not merely nominally.

## Falsifiable experiment
On at least 25 genuinely held-out, nonduplicate target trajectories and five independent seeds per target, compare equal-budget graph synthesis with and without the interval gate. Record valid full-cycle yield, held-out path RMSE, robust interface pass rate, candidate count, runtime, and topology complexity. Require >=20 percentage points higher robust feasible yield without >10% deterioration in held-out path RMSE or >2x runtime. Disprove the claimed advantage if differences vanish under equal budgets, uncertainty sampling, independent geometry checks or a strong tolerance-aware baseline. Avoid treating this threshold as an achieved result.

## Handoff to 4 PM
Run `node components/test-interval-clearance.js` and the complete CI suite, check the existing PRs for overlap, then integrate this gate into candidate acceptance only after hardware/tolerance inputs are explicitly defined. Do not infer manufacturing tolerances from nominal diameters. The interval method assumes independent worst-case dimensional extrema, does not model correlated tolerances, 3D geometry, loads, contact, or physical validation. No local execution was possible in this agent environment because github.com DNS resolution prevented cloning; GitHub Actions should be used for verification.
