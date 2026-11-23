## 2026-11-23 — Feature: actual 3D CAD geometry via OpenCascade

- Starting from the existing real Engine Zero mechanism graph, `node cad/export_sample.js` writes parametric graph-bound 2D part JSON.
- `python cad/build_3d.py` turns these into editable STEP solids and STL preview meshes (1 body per moving link).
- Installed CAD kernel: CadQuery 2.8.0 / OpenCascade. No invented or substituted third-party part geometry.
- Unit tests cover positive volumes, exact through-bore clearance at anchors, invalid dimension rejection and STEP import round-trip.
- Current sample: input, coupler and rocker; 3 bodies, all real nominal CAD solids.
- Limitations: no assembled hardware, pins, structural FEA, motor, 3D collision verification, tolerances, material properties or novel invention claim.
- Prioritize next: build a real exploded/posed *3D assembly* with explicit connector pins and ground fixture, then validate collisions and kinematics with the same CAD geometry.
