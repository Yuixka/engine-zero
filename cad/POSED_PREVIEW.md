# Nominal posed 3D STEP preview (experimental)

This feature exports one STEP compound containing the graph-derived CAD link solids at **explicitly supplied axial Z offsets**. The XY hole coordinates remain the original graph coordinates. It does **not** create pins, mates, ground hardware, or simulate motion. The result is a visually positioned noncontacting stack, not a functioning assembly.

After generating `cad/sample_parts.json` with `node cad/export_sample.js cad/sample_parts.json`, add a top-level `placements` object with **exactly one entry per bodyId**:

```json
"placements": {
  "input": {"zBaseMm": 0},
  "coupler": {"zBaseMm": 8},
  "rocker": {"zBaseMm": 16}
}
```

These Z offsets are **illustrative only**, not recommended mechanical clearances. They must be independently selected for the specific design; all body Z intervals must be strictly separated. Any contact/overlap, missing body, unsupported pose, or nonfinite coordinate is rejected before output.

```bash
python -m pip install cadquery==2.8.0
python cad/posed_preview.py cad/sample_parts.json --output cad/posed_preview.step
python -m unittest discover -s cad -p 'test_*.py' -v
```

The resulting STEP is a compound of actual BREP solids; inspect it in FreeCAD. No pin/ground retention, tolerance stack, dynamic interference, material, force, strength, manufacturing suitability, or physical certification is implied. The next product milestone is typed pin/ground geometry with justified interface dimensions, followed by joint-constrained 3D motion.
