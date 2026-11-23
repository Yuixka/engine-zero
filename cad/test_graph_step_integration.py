#!/usr/bin/env python3
"""End-to-end graph -> CAD -> STEP regression; nominal geometry only."""
import json
import math
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

import cadquery as cq

from build_3d import export_assembly

ROOT = Path(__file__).resolve().parent.parent


class GraphToStepIntegration(unittest.TestCase):
    def test_every_graph_link_roundtrips_and_retains_bores(self):
        with tempfile.TemporaryDirectory() as tmp:
            work = Path(tmp)
            assembly_path = work / "graph.json"
            subprocess.run(
                ["node", str(ROOT / "cad" / "export_sample.js"), str(assembly_path)],
                cwd=ROOT, check=True, capture_output=True, text=True,
            )
            document = json.loads(assembly_path.read_text(encoding="utf8"))
            parts = document["parts"]
            self.assertEqual(len(parts), 3, "Expected three moving four-bar links")
            output = work / "solids"
            manifest = export_assembly(document, output)
            disk_manifest = json.loads((output / "export_manifest.json").read_text(encoding="utf8"))
            self.assertEqual(manifest, disk_manifest)
            self.assertEqual(len(manifest["parts"]), len(parts))
            self.assertEqual({p["bodyId"] for p in parts},
                             {p["bodyId"] for p in manifest["parts"]})
            for source, entry in zip(parts, manifest["parts"]):
                with self.subTest(body=source["bodyId"]):
                    self.assertEqual(source["bodyId"], entry["bodyId"])
                    self.assertEqual(len(source["holes"]), entry["holeCount"])
                    step = output / entry["STEP"]
                    stl = output / entry["STL"]
                    self.assertTrue(step.is_file() and step.stat().st_size > 1000)
                    self.assertTrue(stl.is_file() and stl.stat().st_size > 500)
                    imported = cq.importers.importStep(str(step)).val()
                    self.assertTrue(imported.isValid())
                    self.assertEqual(len(imported.Solids()), 1)
                    self.assertAlmostEqual(imported.Volume(), entry["volumeMm3"], delta=0.02)
                    self.assertAlmostEqual(
                        imported.BoundingBox().zlen,
                        source["parameters"]["thicknessMm"], delta=0.001,
                    )
                    for hole in source["holes"]:
                        x, y = hole["xyMm"]
                        probe = cq.Solid.makeCylinder(
                            hole["diameterMm"] / 4,
                            source["parameters"]["thicknessMm"],
                            cq.Vector(x, y, 0),
                        )
                        self.assertAlmostEqual(
                            imported.intersect(probe).Volume(), 0, delta=1e-4,
                            msg="STEP round-trip lost a graph-defined bore",
                        )


if __name__ == "__main__":
    unittest.main()
