# November 17 — explicit revolute pin/bore interface compatibility

## Technical limitation and hypothesis
Previously, the graph's revolute joint coordinates mapped to nominal component bores, but there was no explicit pin size, ground mounting bore, or clearance check. A kinematically feasible four-bar could therefore be exported with physically impossible pin-to-hole dimensions.

**Hypothesis H1:** An independent typed interface audit will accept a four-bar with 4.0 mm bores and 3.8 mm pins under a nominal radial clearance window of 0.05–0.15 mm, and reject missing ground fixtures, 4.5 mm oversized pins, 2.0 mm undersized pins, unknown joints and unsupported prismatic connectors. Run `node components/test-interfaces.js`. Pass criterion: all six rejection/acceptance controls and deterministic repeatability; regression suite stays green.

## Prior art / novelty boundary
Dimensioned CAD mating, hole/shaft fits and tolerance analysis are longstanding engineering practice, including ISO 286 fits and commercial assembly tools (FreeCAD, Onshape, SOLIDWORKS). This audit is **not novel**; its role is a falsifiable physical-constraint gate for future automatically generated mechanism candidates. No verified feature-by-feature product comparison or patent clearance has been completed.

## Integration and limits
`components/interfaces.js` uses `bindGraph` to map the generative graph to component holes; it requires pin diameters for every revolute joint and explicit ground bores. No hidden default hardware dimensions. This is a *nominal 2D interface check only*: it cannot prove 3D stacking, bearing fit, loads, manufacturing tolerances, collision freedom, or safe operation. Future synthesis must select feasible hardware and test across manufacturing perturbations rather than relying on a single nominal check.
