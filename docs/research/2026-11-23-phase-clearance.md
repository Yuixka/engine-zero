# 2026-11-23 — Phase-resolution clearance convergence screen

## Concrete gap
The existing 2D projected interference screen samples only the solver's supplied frames. A low-resolution pass may miss narrow overlaps or solver discontinuities. Treating a clean sample as collision-free is scientifically invalid.

## Falsifiable hypothesis and benchmark
H1: for at least one preregistered synthetic mechanism and fixed width, increasing phase sampling from 36 to 288 reveals an overlap or invalid mechanism that was absent at 36. H0: none is revealed. Run a fixed set of >=10 seeds and log all failures and counts, not only successful traces. The new `auditGraph` runs 36/72/144/288 by default and reports minimum projected gap, overlap counts, and coarse-pass/fine-fail events. The regression includes a deliberately perturbed synthetic pose as a detection control; it does not demonstrate a real missed collision.

## Prior art and novelty boundary
This is standard numerical convergence testing and computational geometry, not novel continuous collision detection. Established prior art includes adaptive numerical refinement, swept-volume checks and CAD/robotics collision engines (e.g. Open CASCADE and FCL); exact feature/benchmark comparisons and licensing remain unverified. Future novelty would require a reproducible improvement over independent continuous/3D oracles and matched compute budgets.

## Integration
The CAD workstream supplies nominal capsule profiles; the graph supplies pose traces; design search can later reject or penalize resolution-sensitive candidates; verification compares phase levels; experimentation records reproducible results. No changes to optimizer selection or core physics in this PR.

## Known limitations
2D projected overlap is not a 3D collision, and no number of discrete samples proves continuous clearance. Adjacent links and ground are excluded; force, load, manufacturing tolerance and axial stacking are unmodeled.
