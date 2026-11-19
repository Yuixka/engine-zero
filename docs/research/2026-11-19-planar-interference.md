# 2026-11-19 — sampled 2D projected interference diagnostic

**Limitation:** Engine Zero's motion solver can accept planar graph trajectories without checking whether nominal physical link profiles overlap. The existing connector audit only checks pin/bore fit. A candidate may therefore look kinematically sound while its projected geometry intersects.

**Prior art:** CAD collision/interference checks and swept-volume collision detection are well-established (e.g. FreeCAD assembly workflows, commercial CAD motion studies, robotics collision libraries). This is not a novel collision algorithm or a 3D feasibility proof. The research question is whether incorporating *independent, reproducible physical-risk gates* improves generated candidate yield versus kinematics-only ranking.

**Falsifiable hypothesis:** For at least 10 fixed seeds and matched 120-attempt budgets, the 2D capsule screen identifies at least one nominal nonadjacent overlap among kinematically valid generated four-bar designs that the existing kinematics/nominal pin-fit checks do not flag. Count overlap cases, false positives when compared with independently built layered 3D geometry, and runtime per candidate. Failure to find any extra flagged case falsifies this narrow diagnostic benefit on that test suite.

**Implementation:** `experiments/planar-interference.js` builds nominal component capsules from `components/parametric.js`, transforms them using sampled solver poses, and reports minimum signed projected gap and first flagged frame for nonadjacent moving-body pairs. Connected neighbors and ground are excluded. A negative gap means projected overlap, **not** proven 3D collision. No optimizer rankings are modified.

**Next:** Compare the risk screen against independent 3D CAD geometry, add inter-frame adaptive sampling and axial stacking, then test on a preregistered candidate set with fair budgets. Current limitations: no 3D, no continuous-time collision proof, no tolerance or force validation.
