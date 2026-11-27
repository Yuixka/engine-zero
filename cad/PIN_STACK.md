# Nominal shared-joint pin stack

Depends on main 956691a (PRs #27–29). Independent of PR #30 artifact publishing.
Generate a real three-solid example from the test fixture:

```sh
python -m pip install cadquery==2.8.0
PYTHONPATH=cad python -c 'import json; from test_pin_stack import sample; print(json.dumps(sample()))' > /tmp/pin-stack.json
python cad/pin_stack.py /tmp/pin-stack.json --output cad/generated/pin-stack.step
python -m unittest discover -s cad -p 'test_*.py' -v
```

For your own graph-derived assembly JSON, supply explicit placements as in POSED_PREVIEW.md and a pins array with jointId, diameterMm, zBaseMm and lengthMm. Each pin must span all member bores, share their XY center and have positive nominal clearance. The exporter rejects contact with any solid, including other pins. Dimensions in the fixture are illustrative, not engineering recommendations.

Handoff: cad/pin_stack.py adds the independent CLI; cad/test_pin_stack.py adds round-trip and rejection tests picked up by existing CAD CI. Ground joints with only one moving member are rejected; ground mounting, pin retention, material, loads, tolerance stacks and motion remain unsupported. Next engineer: review CI and add explicit ground geometry and mate frames without inferring dimensions. No manufacturing certification.
