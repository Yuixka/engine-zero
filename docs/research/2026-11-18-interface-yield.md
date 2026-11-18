# 2026-11-18 — Candidate-level nominal interface feasibility gate

## Problem
The generator ranks mechanisms on synthetic path fit and ideal 2D closure, but a candidate can lack representable physical connectors. Today the component library supports only one/two R-joint anchors per moving body; P joints and 3+-anchor links cannot be fabricated from that schema. Ranking them as physical candidates without an explicit rejection gate is misleading.

## Hypothesis / falsification
H1: Applying a typed nominal connector gate to the *same frozen generated candidate stream* detects kinematically viable but component-incompatible designs without changing the candidate count or seeds. H0: No such cases are detected. Report attempts, kinematic passes, interface passes and reasons; use >=10 fixed seeds and >=100 attempts each before estimating rates. A pass is only nominal 2D geometry feasibility, not physical viability.

Run `node experiments/generated-interface-yield.js` for a reproducible small screen. `node experiments/test-generated-interface-yield.js` tests known positive/negative controls and deterministic accounting. Gate is deliberately a post-generation diagnostic, not an optimizer improvement: fair matched-budget selection is future work.

## Prior art / limitations
Classical constraint-based CAD assemblies, pin-hole clearance analysis, and design-for-assembly screening are established, including ISO 286 fits and commercial mechanical CAD assembly checks; this is an integration experiment, not evidence of novelty. We have not established a unique capability against current FreeCAD, Onshape, Fusion or published linkage synthesis. Fixture dimensions are *synthetic screening assumptions* and must not be mistaken for actual supplied ground geometry. No loads, tolerances, 3D stackups, independent collision solver, experimental validation, or patent search. Current gate's synthetic 4 mm ground bores do not constitute ground-fixture design.
