import tempfile
import unittest
from pathlib import Path
import cadquery as cq
from pin_stack import export_pin_stack
from test_posed_preview import doc

def sample():
    data = doc()
    data['parts'][1]['holes'][0].update(jointId='inputb', xyMm=[42,0])
    data['pins'] = [{'jointId':'inputb','diameterMm':4,'zBaseMm':-1,'lengthMm':15}]
    return data

class PinStackTests(unittest.TestCase):
    def test_roundtrip(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)/'stack.step'
            result = export_pin_stack(sample(), out)
            self.assertEqual(result['solidCount'], 3)
            imported = cq.importers.importStep(str(out))
            self.assertEqual(len(imported.solids().vals()), 3)
            self.assertAlmostEqual(imported.val().BoundingBox().zlen, 15, places=3)

    def test_reject_invalid_pin(self):
        for field, value in [('diameterMm',5),('lengthMm',5),('jointId','inputa'),('diameterMm',True)]:
            with self.subTest(field=field,value=value), tempfile.TemporaryDirectory() as tmp:
                data = sample()
                data['pins'][0][field] = value
                out = Path(tmp)/'bad.step'
                with self.assertRaises(ValueError):
                    export_pin_stack(data,out)
                self.assertFalse(out.exists())

    def test_reject_noncoaxial(self):
        data = sample()
        data['parts'][1]['holes'][0]['xyMm'] = [41,0]
        with self.assertRaisesRegex(ValueError,'Noncoaxial'):
            export_pin_stack(data,'unused.step')
