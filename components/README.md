# Parametric component library — experimental v0.1

Engine Zero can now derive **nominal 2D planar part profiles** from the existing four-bar mechanism graph, creating a link/hub component for each moving body and preserving each revolute joint's local hole coordinates. Exports self-contained SVG measured in millimetres, and structured JSON with component ancestry. No external software dependencies.

Run `node components/test-parametric.js`, then generate a sample with:
```node -e "const C=require('./components/parametric'),G=require('./graph-engine'),D=require('./discovery'); const x=C.bindGraph(G.fromLegacyFourbar(D.BEST_LEGACY)); console.log(JSON.stringify(x,null,2));"
```

Supported: one-anchor hub, two-anchor capsule; body-to-joint mapping; input dimensions validated; nominal bores and finite coordinates.

Not supported: three or more anchors, slider rails/prismatic joints, generic ground fixtures, bearing selection, real shafts/fasteners, 3D parametric solids/STEP, tolerances, stress, motion interference, assembly clearance or manufacturing-ready drawings. A visual SVG is **not a verified CAD solid or fabrication instruction**. Material and mass are deliberately null. Generated geometry is not proof of engineering novelty.
