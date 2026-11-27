"""Nominal coaxial pin-stack STEP exporter; no fit or load certification."""
import argparse
import json
import math
from pathlib import Path
import cadquery as cq
from build_3d import SCHEMA, build_part, positive, safe_name, vector2
from posed_preview import finite_number

def export_pin_stack(doc, output):
    if not isinstance(doc, dict) or doc.get('schema') != SCHEMA or doc.get('units') != 'mm':
        raise ValueError('Expected millimetre assembly')
    parts, placements, pins = doc.get('parts'), doc.get('placements'), doc.get('pins')
    if not isinstance(parts, list) or not 1 <= len(parts) <= 200:
        raise ValueError('Expected 1..200 parts')
    if not isinstance(pins, list) or not 1 <= len(pins) <= 200:
        raise ValueError('Explicit pins required')
    names = [safe_name(p['bodyId']) for p in parts]
    if len(set(names)) != len(names) or not isinstance(placements, dict) or set(placements) != set(names):
        raise ValueError('Placements must match unique body IDs')
    solids, intervals, holes = {}, {}, {}
    for p in parts:
        name = p['bodyId']
        place = placements[name]
        if not isinstance(place, dict) or set(place) != {'zBaseMm'}:
            raise ValueError('Only explicit axial placement supported')
        z = finite_number(place['zBaseMm'], 'zBaseMm')
        solid, _ = build_part(p)
        intervals[name] = (z, z + positive(p['parameters']['thicknessMm'], 'thickness'))
        solids[name] = solid.translate(cq.Vector(0, 0, z))
        for h in p['holes']:
            holes.setdefault(h['jointId'], {})[name] = (vector2(h['xyMm'], 'center'), positive(h['diameterMm'], 'bore'))
    for i, a in enumerate(names):
        for b in names[i+1:]:
            if max(intervals[a][0], intervals[b][0]) <= min(intervals[a][1], intervals[b][1]):
                raise ValueError('Link axial overlap or contact')
    seen = set()
    pin_meta = []
    for pin in pins:
        if not isinstance(pin, dict) or set(pin) != {'jointId','diameterMm','zBaseMm','lengthMm'}:
            raise ValueError('Invalid pin fields')
        joint = safe_name(pin['jointId'])
        if joint in seen or joint not in holes or len(holes[joint]) < 2:
            raise ValueError('Pin requires unique shared moving-body joint')
        seen.add(joint)
        d = positive(pin['diameterMm'], 'pin diameter')
        z = finite_number(pin['zBaseMm'], 'pin base')
        length = positive(pin['lengthMm'], 'pin length')
        members = holes[joint]
        center = next(iter(members.values()))[0]
        for body, (xy, bore) in members.items():
            if math.dist(center, xy) > 1e-8 or bore - d <= 1e-6:
                raise ValueError('Noncoaxial or insufficient nominal radial clearance')
            lo, hi = intervals[body]
            if z > lo or z + length < hi:
                raise ValueError('Pin does not span every member bore')
        # Conservative rejection of any unintended body or pin intersection.
        shape = cq.Solid.makeCylinder(d/2, length, cq.Vector(*center, z))
        for other in solids.values():
            if shape.distance(other) <= 1e-6:
                raise ValueError('Pin contact or interference')
        if not shape.isValid():
            raise ValueError('Invalid pin solid')
        solids['pin:' + joint] = shape
        pin_meta.append({'jointId':joint,'members':sorted(members),'diameterMm':d,'lengthMm':length})
    compound = cq.Compound.makeCompound(list(solids.values()))
    if not compound.isValid():
        raise ValueError('Invalid compound')
    out = Path(output)
    out.parent.mkdir(parents=True, exist_ok=True)
    cq.exporters.export(compound, str(out), exportType='STEP')
    return {'STEP':str(out),'solidCount':len(solids),'pins':pin_meta,
            'unverified':['ground mounting','retention','tolerances','loads','motion','manufacturability']}

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input')
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    print(json.dumps(export_pin_stack(json.loads(Path(args.input).read_text()), args.output), indent=2))
