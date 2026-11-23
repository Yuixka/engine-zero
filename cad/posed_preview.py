#!/usr/bin/env python3
"""Explicitly layered, nominal posed STEP preview; not a mechanical fit verification."""
import argparse
import json
import math
from pathlib import Path
import cadquery as cq
from build_3d import SCHEMA, build_part, safe_name

def finite_number(v, label):
    if isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v):
        raise ValueError(f'{label} must be finite')
    return float(v)

def export_posed_preview(document, output_path):
    if not isinstance(document, dict) or document.get('schema') != SCHEMA or document.get('units') != 'mm':
        raise ValueError('Expected millimetre assembly document')
    parts = document.get('parts')
    if not isinstance(parts, list) or not parts or len(parts) > 200:
        raise ValueError('Expected 1..200 parts')
    placements = document.get('placements')
    if not isinstance(placements, dict):
        raise ValueError('Explicit placements required: {bodyId: {zBaseMm}}')
    names = [safe_name(p['bodyId']) for p in parts]
    if len(set(names)) != len(names) or set(placements) != set(names):
        raise ValueError('Placements must match unique body IDs exactly')
    solids, intervals = [], []
    for p in parts:
        name = p['bodyId']
        placement = placements[name]
        if not isinstance(placement, dict) or set(placement) != {'zBaseMm'}:
            raise ValueError(f'{name}: only explicit zBaseMm placement is supported')
        z = finite_number(placement['zBaseMm'], f'{name}.zBaseMm')
        solid, _ = build_part(p)
        thickness = finite_number(p['parameters']['thicknessMm'], 'thicknessMm')
        intervals.append((name, z, z + thickness))
        solids.append(solid.translate(cq.Vector(0, 0, z)))
    # This deliberately rejects even touching axial envelopes: no clearance or fit is inferred.
    for i, (a, alo, ahi) in enumerate(intervals):
        for b, blo, bhi in intervals[i + 1:]:
            if max(alo, blo) <= min(ahi, bhi):
                raise ValueError(f'Unsafe/unsupported axial overlap or contact: {a}, {b}')
    result = cq.Compound.makeCompound(solids)
    if not result.isValid():
        raise ValueError('Invalid posed compound')
    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    cq.exporters.export(result, str(out), exportType='STEP')
    return {'STEP':str(out),'bodyCount':len(solids),'axialIntervalsMm':intervals,
            'validation':'nominal noncontacting layered visual preview only',
            'unverified':['pins','ground mounts','kinematic mates','3D motion','clearance tolerances','loads','manufacturability']}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('input')
    parser.add_argument('--output', default='cad/posed_preview.step')
    args = parser.parse_args()
    print(json.dumps(export_posed_preview(json.loads(Path(args.input).read_text()), args.output), indent=2))

if __name__ == '__main__':
    main()
