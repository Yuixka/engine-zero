import json
import tempfile
import unittest
from pathlib import Path
import cadquery as cq
from posed_preview import export_posed_preview

def part(name, x):
    return {'schema':'engine-zero/parametric-component-0.1','id':name,'bodyId':name,'units':'mm',
            'parameters':{'widthMm':14,'thicknessMm':5,'holeDiameterMm':5,'edgeMarginMm':2},
            'holes':[{'jointId':name+'a','xyMm':[x,0],'diameterMm':5},
                     {'jointId':name+'b','xyMm':[x+42,0],'diameterMm':5}]}

def doc():
    return {'schema':'engine-zero/parametric-assembly-0.1','units':'mm',
            'parts':[part('input',0),part('rocker',20)],
            'placements':{'input':{'zBaseMm':0},'rocker':{'zBaseMm':8}}}

class PosedPreviewTests(unittest.TestCase):
    def test_step_roundtrip(self):
        with tempfile.TemporaryDirectory() as d:
            out=Path(d)/'preview.step'
            result=export_posed_preview(doc(),out)
            self.assertEqual(result['bodyCount'],2)
            imported=cq.importers.importStep(str(out))
            self.assertTrue(imported.val().isValid())
            self.assertGreater(out.stat().st_size,1000)
            self.assertAlmostEqual(imported.val().BoundingBox().zlen,13,places=3)

    def test_reject_overlap_contact_and_missing_placement(self):
        for z in (0,4,5):
            data=doc()
            data['placements']['rocker']['zBaseMm']=z
            with tempfile.TemporaryDirectory() as d:
                with self.assertRaisesRegex(ValueError,'overlap or contact'):
                    export_posed_preview(data,Path(d)/'bad.step')
                self.assertFalse((Path(d)/'bad.step').exists())
        data=doc()
        del data['placements']['rocker']
        with self.assertRaisesRegex(ValueError,'match unique'):
            export_posed_preview(data,'unused.step')

    def test_reject_nonfinite_and_unsupported_pose(self):
        for value in (float('nan'),float('inf'),True):
            data=doc()
            data['placements']['rocker']['zBaseMm']=value
            with self.assertRaises(ValueError):
                export_posed_preview(data,'unused.step')
        data=doc()
        data['placements']['rocker']['rotationDeg']=90
        with self.assertRaisesRegex(ValueError,'only explicit'):
            export_posed_preview(data,'unused.step')

if __name__=='__main__':
    unittest.main()
