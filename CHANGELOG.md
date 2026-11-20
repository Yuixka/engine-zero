# Changelog

## 2026-11-15 — v0.2.1 repository bootstrap
- Imported graph-based planar mechanism solver, topology discovery, and offline browser UI.
- Added five-workstream charters and deterministic cross-briefing generator.
- Added baseline regression tests and GitHub Actions workflow (remote CI status not yet verified).
- Established writable GitHub repository as source of truth and scheduled daily 4 PM coordination.
- Known limitations: 2D kinematics only, no CAD library, stress/torque/collision proof, physical verification or novelty claim.

## 2026-11-15 — v0.2.2 immediate R&D run
- Added reproducible cross-topology, held-out trajectory benchmark (synthetic 2D kinematics only).
- Added determinism and validation test and CI check.
- Logged results including configurations that underperform a simple crank.
- Cross-briefed five engineering workstreams; no five independent agents were spun up.

## 2026-11-15 — v0.2.3 geometric audit
- Added independent R/P joint geometry audit, driver and output consistency checks, and corruption tests.
- Gated held-out scores on independently checked planar geometric closure.
- Added documented falsifiable hypothesis and prior-art caveats; no new physics or novelty claim.

## 2026-11-16 — v0.3.0-alpha parametric connector foundation
- Merged independent closure verifier (PR #1; CI green).
- Merged initial nominal 2D parametric link/hub parts with exact revolute graph anchor mapping and SVG geometry (PR #7; CI green).
- Rejects unsupported prismatic/rail bodies and invalid hole/margin dimensions rather than producing fictitious valid components.
- PRs #2–#6 remain under review; multiseed PR #4 needs conflict resolution and held-out integrity review before merge.
- NOT YET 3D STEP solids, realistic tolerance/loads, manufacturing-ready CAD, or genuine invention.

## 2026-11-17 — typed revolute interface research PR
- Added explicit pin/bore and ground fixture compatibility checker with nominal radial-clearance bounds.
- Added adversarial regression controls for missing ground bores, oversized/undersized pins and unsupported joint types.
- Nominal geometry only; no fabrication, bearing, tolerance or load proof.

## 2026-11-19 — research: sampled planar interference risk
- Added independent nonadjacent moving-part capsule overlap screen using graph motion frames and nominal component geometry.
- Added adversarial tests, CI integration and five-workstream handoff.
- Conservative projected risk only, not proof of 3D collision or continuous clearance; no novelty claim.

## 2026-11-20 — research: explicit axial layer collision screening
- Added sampled 2.5D projected-capsule + z-interval screen; requires explicit body intervals and matches component thickness.
- Separates planar overlap from potential extruded overlap, with adversarial tests and CI.
- No 3D collision proof, inferred layers, autonomous selection gate or novelty claim.
