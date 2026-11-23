# Engine Zero — actual parametric 3D CAD solids (experimental)

This is the first **usable geometric CAD deliverable**: the existing 2D revolute graph and parametric part library produce **real OpenCascade BREP solids**, with one editable STEP and one preview STL file per moving link/hub. No external 3D files are silently substituted.

## Build

Requires Node.js 22 and Python with CadQuery 2.8.0.

```bash
python -m pip install cadquery==2.8.0
node cad/export_sample.js cad/sample_parts.json
python cad/build_3d.py cad/sample_parts.json --output cad/generated
python -m unittest discover -s cad -p 'test_*.py'
```

The current built-in four-bar produces input, coupler and rocker parts with dimensions in **mm** and nominal through holes corresponding to the actual graph's revolute-joint anchors. Files can be opened in FreeCAD or other STEP readers. The GitHub Actions CAD job also publishes the sample files as a build artifact.

**Not fabrication-ready:** generated shapes are valid geometric solids, but pins, bearing fits, ground mount, axial spacing, tolerance stack, stiffness, material loads, 3D motion clearance, and physical verification are not supplied. Slider-cranks and bodies requiring unsupported connectors fail closed rather than silently producing bad CAD.
