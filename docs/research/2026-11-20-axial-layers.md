# November 20: explicit axial-layer collision risk

**Problem:** A 2D projected overlap cannot distinguish a physical collision from two parts separated in the axial direction. The prior screen marks both as risks, which can mislead future automated candidate ranking.

**Existing prior art:** CAD assembly interference checking (e.g. FreeCAD, Onshape), robot collision libraries such as FCL and MoveIt, and 2.5D layered mechanism design already consider spatial separation. This is an integration of established geometry, **not an invention claim**. Product features and patent novelty have not been independently verified.

**Falsifiable hypothesis:** With explicitly provided non-overlapping axial intervals, all synthetic projected-overlap fixtures with positive z separation must be excluded from sampled extruded overlap, while overlapping/touching z intervals and projected overlap remain flagged. Missing/invalid layer data must fail closed.

**Benchmark:** `node experiments/test-axial-layers.js` includes overlapping, separated, touching, missing layer, thickness mismatch, nonfinite pose and a 36-frame four-bar smoke test. Next: >=10 seeded mechanisms with known 3D geometry, compare false-positive/negative rates to an independent 3D collision oracle and report every failure.

**Scope:** Nominal rigid 2D capsules extruded through user-provided z intervals. Directly joint-connected bodies and ground remain excluded. This is **not** real 3D CAD, continuous collision detection, tolerance analysis, dynamics, or manufacturing validation. No optimization or hardware actuation.
