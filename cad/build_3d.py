#!/usr/bin/env python3
"""Engine Zero nominal 3D STEP/STL exporter from the graph-linked 2D part schema.

CAD solids only: NOT validated for loads, manufacturing, dynamics or hardware safety.
"""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
import re

import cadquery as cq

SCHEMA = 'engine-zero/parametric-assembly-0.1'
PART_SCHEMA = 'engine-zero/parametric-component-0.1'


def positive(value, label):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value <= 0:
        raise ValueError(f'{label} must be a positive finite number')
    return float(value)


def vector2(value, label):
    if not isinstance(value, list) or len(value) != 2:
        raise ValueError(f'{label}: expected [x,y]')
    if any(isinstance(x, bool) or not isinstance(x, (int, float)) or not math.isfinite(x) for x in value):
        raise ValueError(f'{label}: coordinates must be finite numbers')
    return float(value[0]), float(value[1])


def build_part(part):
    if not isinstance(part, dict) or part.get('schema') != PART_SCHEMA or part.get('units') != 'mm':
        raise ValueError('Expected nominal Engine Zero part schema in millimetres')
    params = part['parameters']
    thickness = positive(params['thicknessMm'], 'thicknessMm')
    width = positive(params['widthMm'], 'widthMm')
    hole_d = positive(params['holeDiameterMm'], 'holeDiameterMm')
    margin = positive(params['edgeMarginMm'], 'edgeMarginMm')
    if width < hole_d + 2 * margin:
        raise ValueError('Hole exceeds allowed width/edge margin')
    holes = part.get('holes')
    if not isinstance(holes, list) or len(holes) not in (1, 2):
        raise ValueError('Only 1 or 2 revolute holes supported')
    if len(set(h['jointId'] for h in holes)) != len(holes):
        raise ValueError('Duplicate joint IDs')
    anchors = [vector2(h['xyMm'], 'hole center') for h in holes]
    for h in holes:
        if abs(positive(h['diameterMm'], 'bore diameter') - hole_d) > 1e-8:
            raise ValueError('Hole diameter does not match parametric bore')
    if len(holes) == 2:
        a, b = anchors
        length = math.dist(a, b)
        if length < hole_d + margin:
            raise ValueError('Overlapping/too-close pin bores')
        nx, ny = -(b[1] - a[1]) / length * width / 2, (b[0] - a[0]) / length * width / 2
        corners = [(a[0]+nx,a[1]+ny),(b[0]+nx,b[1]+ny),
                   (b[0]-nx,b[1]-ny),(a[0]-nx,a[1]-ny)]
        shape = cq.Workplane('XY').polyline(corners).close().extrude(thickness)
    else:
        shape = cq.Workplane('XY')
    for x, y in anchors:
        disk = cq.Workplane('XY').center(x, y).circle(width / 2).extrude(thickness)
        shape = shape.union(disk)
    for x, y in anchors:
        bore = cq.Workplane('XY').center(x, y).circle(hole_d / 2).extrude(thickness)
        shape = shape.cut(bore)
    solid = shape.val()
    if not solid.isValid() or solid.Volume() <= 0:
        raise ValueError('Invalid 3D solid resulting from component')
    bounds = solid.BoundingBox()
    return solid, {'bodyId':part['bodyId'],'holeCount':len(holes),
                   'volumeMm3':round(solid.Volume(),5),
                   'bboxMm':[round(bounds.xlen,5),round(bounds.ylen,5),round(bounds.zlen,5)],
                   'material':'unspecified','validation':'nominal geometric solid only'}


def safe_name(s):
    if not isinstance(s, str) or not re.fullmatch(r'[A-Za-z0-9_-]{1,60}', s):
        raise ValueError('Unsafe part ID')
    return s


def export_assembly(document, output_dir):
    if not isinstance(document, dict) or document.get('schema') != SCHEMA or document.get('units') != 'mm':
        raise ValueError('Wrong assembly schema or units')
    parts = document.get('parts')
    if not isinstance(parts, list) or not parts or len(parts) > 200:
        raise ValueError('Expected between 1 and 200 parts')
    # Validate all geometry before writing any files; reject unsupported designs.
    built = []
    names = set()
    for p in parts:
        name = safe_name(p['bodyId'])
        if name in names:
            raise ValueError('Duplicate body ID')
        names.add(name)
        solid, meta = build_part(p)
        built.append((name, solid, meta))
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    summary = {'schema':'engine-zero/3d-export-0.1','units':'mm','engine':'CadQuery/OpenCascade',
               'parts':[],'unverified':['manufacturability','tolerances','strength','loads','collisions',
                                      'pin retention','3D assembly kinematics','novelty']}
    for name, solid, meta in built:
        step = f'{name}.step'
        stl = f'{name}.stl'
        cq.exporters.export(solid, str(output_dir / step), exportType='STEP')
        cq.exporters.export(solid, str(output_dir / stl), exportType='STL', tolerance=0.05, angularTolerance=0.1)
        summary['parts'].append({**meta,'STEP':step,'STL':stl})
    (output_dir / 'export_manifest.json').write_text(json.dumps(summary, indent=2)+'\n', encoding='utf8')
    return summary


def main():
    ap = argparse.ArgumentParser(description='Export Engine Zero nominal links to CAD solids')
    ap.add_argument('input', help='Assembly JSON from cad/export_sample.js')
    ap.add_argument('--output', default='cad/generated', help='Output directory for STEP/STL solids')
    args = ap.parse_args()
    result = export_assembly(json.loads(Path(args.input).read_text(encoding='utf8')), args.output)
    print(json.dumps({'output':args.output,'parts':result['parts'],'unverified':result['unverified']}, indent=2))


if __name__ == '__main__':
    main()
