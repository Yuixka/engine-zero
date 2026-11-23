#!/usr/bin/env python3
"""Geometric smoke tests. No safety or fabrication certification."""
import json
import math
import tempfile
import unittest
from pathlib import Path
import cadquery as cq
from build_3d import build_part, export_assembly

PART = {
    'schema':'engine-zero/parametric-component-0.1','id':'ez-link','bodyId':'link','units':'mm',
    'parameters':{'widthMm':14,'thicknessMm':5,'holeDiameterMm':5,'edgeMarginMm':2},
    'holes':[{'jointId':'a','xyMm':[0,0],'diameterMm':5},
             {'jointId':'b','xyMm':[42,0],'diameterMm':5}],
    'profile':{'kind':'capsule','startMm':[0,0],'endMm':[42,0],'lengthMm':42,'radiusMm':7}
}

class SolidTests(unittest.TestCase):
    def test_cad_solids_and_bores(self):
        solid,meta=build_part(PART)
        self.assertTrue(solid.isValid())
        self.assertAlmostEqual(solid.BoundingBox().zlen,5,places=4)
        self.assertEqual(meta['holeCount'],2)
        expected=(42*14+math.pi*7**2-2*math.pi*2.5**2)*5
        self.assertAlmostEqual(solid.Volume(),expected,delta=0.02)
        for x in (0,42):
            probe=cq.Solid.makeCylinder(.8,5,cq.Vector(x,0,0))
            self.assertAlmostEqual(solid.intersect(probe).Volume(),0,delta=1e-5)

    def test_rejects_bad_dimensions(self):
        x=json.loads(json.dumps(PART));x['parameters']['widthMm']=4
        with self.assertRaises(ValueError): build_part(x)
        x=json.loads(json.dumps(PART));x['holes'][1]['xyMm']=[2,0]
        with self.assertRaises(ValueError): build_part(x)
        x=json.loads(json.dumps(PART));x['holes'][0]['xyMm']=[float('nan'),0]
        with self.assertRaises(ValueError): build_part(x)

    def test_step_stl_roundtrip(self):
        assembly={'schema':'engine-zero/parametric-assembly-0.1','units':'mm','parts':[PART]}
        with tempfile.TemporaryDirectory() as d:
            m=export_assembly(assembly,d)
            self.assertEqual(len(m['parts']),1)
            self.assertGreater(Path(d,'link.step').stat().st_size,1000)
            self.assertGreater(Path(d,'link.stl').stat().st_size,500)
            imported=cq.importers.importStep(str(Path(d,'link.step'))).val()
            self.assertTrue(imported.isValid())
            self.assertAlmostEqual(imported.Volume(),m['parts'][0]['volumeMm3'],delta=.01)

if __name__=='__main__': unittest.main(verbosity=2)
