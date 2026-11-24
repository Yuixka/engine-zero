"""Build a downloadable layered CAD preview from the generated sample."""
import argparse
import json
from pathlib import Path
from posed_preview import export_posed_preview
import cadquery as cq

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("input")
    parser.add_argument("output")
    args = parser.parse_args()
    doc = json.loads(Path(args.input).read_text())
    z = 0
    doc["placements"] = {}
    for part in doc["parts"]:
        doc["placements"][part["bodyId"]] = {"zBaseMm": z}
        z += part["parameters"]["thicknessMm"] + 3
    out = Path(args.output)
    result = export_posed_preview(doc, out)
    imported = cq.importers.importStep(str(out))
    solids = imported.solids().vals()
    if len(solids) != len(doc["parts"]) or not all(s.isValid() and s.Volume() > 0 for s in solids):
        raise RuntimeError("STEP preview round-trip lost valid solids")
    result["roundTripSolidCount"] = len(solids)
    result["placementNote"] = "Illustrative axial spacing; XY coordinates remain body-local, not a solved mechanism pose."
    out.with_suffix(".json").write_text(json.dumps(result, indent=2) + "\n")

if __name__ == "__main__":
    main()
