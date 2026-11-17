# Third engineer handoff — 2026-11-17

Base main: `3d8b7be79d4152bffd5b98a519ae3ae28ab1d887`. Reviewed main's nominal revolute pin/bore interface check, five-workstream charters, 2026-11-17 primary handoff, recent commits and second engineer PR #9. Existing draft PRs #2–#6 include related tolerance, phase-resolution and benchmark audits; avoid merging blindly.

## Change
`experiments/interval-clearance-audit.js` independently screens **bounded worst-case radial clearance** using exact endpoint arithmetic for one pin and two bores. It returns both nominal and guaranteed-fit results, including an explicit nominal-pass / worst-case-fail example. No production modules modified, no dependencies added or removed. Test command: `node experiments/interval-clearance-audit.js`, then `node test.js` and full CI. **Not executed in this run; no PASS claim.**

## Falsifiable hypothesis
Explicit worst-case interval gates catch nominally compatible but tolerance-incompatible joints. Fixture: 5.0±0.08 mm pin, two 5.2±0.08 mm bores; nominal radial clearance 0.10 mm is within [0.02,0.20], while minimum worst-case radial clearance 0.02 mm is at boundary (floating point tolerances apply) and maximum 0.18 mm remains within; **this example does not actually fail** at those bounds. The code's intended nominal-only failure fixture therefore needs correction before merge: increase both tolerances to ±0.10 mm (worst-case radial minimum 0 mm) and rerun. This is an explicit blocker, not validated evidence.

## Prior art / novelty
ISO 286 fit systems, tolerance stack-up analysis and commercial CAD fit checks are established. The novelty candidate is **independently verified tolerance-aware generative mechanism synthesis**, not interval arithmetic. Benchmark matched-budget nominal-only vs robust search on 100 independently held-out targets and 10 seeded runs; preregister a >=20 percentage-point improvement in independent verified feasible yield with confidence intervals excluding zero. Disprove if gains vanish under equal budgets, alternate target families or independent evaluation.

## Five-system cross-brief
- Parametric components: need measured or specified per-hole tolerances and pin provenance; no default fabrication assumptions.
- Assembly graph: require typed interfaces and explicit bore-to-joint mapping, including ground fixtures; PR #9 addresses malformed metadata.
- Generative design: integrate worst-case screen as a **separate** acceptance gate after validated nominal interface checks, not a search-score shortcut.
- Simulation and verification: add endpoint/brute-force cross-checks and test degenerate/missing inputs; no force, collision or axial fit claims.
- Autonomous experimentation: freeze targets, budgets and random seeds; compare yield using an independent verifier, track rejected candidates and failure reasons.

Next engineer: correct fixture and run tests before review, then integrate the gate into a matched-budget benchmark without touching existing draft branches.
