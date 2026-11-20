'use strict';
// Sampled extruded-2D collision risk with explicit axial intervals. Not 3D CAD or continuous collision detection.
const {bindGraph}=require('../components/parametric.js');
const {segmentDistance}=require('./planar-interference.js');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
function world(pose,pt){
  if(!Array.isArray(pose)||pose.length!==3||!pose.every(finite))throw new TypeError('Finite planar body pose required');
  const [x,y,t]=pose;return [x+pt[0]*Math.cos(t)-pt[1]*Math.sin(t),y+pt[0]*Math.sin(t)+pt[1]*Math.cos(t)];
}
function projected(part,frame){
  const p=part.profile,pose=frame[part.bodyId];
  if(p.kind==='disk'){const a=world(pose,p.centerMm);return {a,b:a,r:p.radiusMm};}
  if(p.kind==='capsule')return {a:world(pose,p.startMm),b:world(pose,p.endMm),r:p.radiusMm};
  throw Error('Unknown profile');
}
function screenAxialLayers(graph,trace,{layers={},componentOptions={},xyMarginMm=0,zMarginMm=0}={}){
  if(!trace||trace.ok!==true||!Array.isArray(trace.frames)||!trace.frames.length)throw TypeError('Valid trace required');
  if(!finite(xyMarginMm)||xyMarginMm<0||!finite(zMarginMm)||zMarginMm<0)throw RangeError('Margins must be nonnegative finite');
  if(!layers||typeof layers!=='object'||Array.isArray(layers))throw TypeError('Explicit layer map required');
  const parts=bindGraph(graph,componentOptions).parts,ids=new Set(parts.map(p=>p.bodyId));
  for(const id of Object.keys(layers))if(!ids.has(id))throw Error('Unknown layer body '+id);
  const intervals=new Map();
  for(const p of parts){
    const layer=layers[p.bodyId];
    if(!layer||!finite(layer.zMinMm)||!finite(layer.zMaxMm)||layer.zMinMm>=layer.zMaxMm)
      throw Error('Missing or invalid axial interval for '+p.bodyId);
    const thickness=p.parameters.thicknessMm;
    if(Math.abs((layer.zMaxMm-layer.zMinMm)-thickness)>1e-7)
      throw Error('Axial thickness mismatch for '+p.bodyId);
    intervals.set(p.bodyId,[layer.zMinMm,layer.zMaxMm]);
  }
  const joined=new Set(graph.joints.map(j=>[j.a,j.b].sort().join('|')));
  const rows=[];
  for(let i=0;i<parts.length;i++)for(let j=i+1;j<parts.length;j++){
    const a=parts[i],b=parts[j],pair=[a.bodyId,b.bodyId];
    if(joined.has(pair.slice().sort().join('|')))continue;
    const [az0,az1]=intervals.get(a.bodyId),[bz0,bz1]=intervals.get(b.bodyId);
    const axialGapMm=Math.max(bz0-az1,az0-bz1);
    let minXY=Infinity,firstProjected=null,firstPotential=null;
    for(let k=0;k<trace.frames.length;k++){
      const A=projected(a,trace.frames[k]),B=projected(b,trace.frames[k]);
      const gap=segmentDistance(A.a,A.b,B.a,B.b)-A.r-B.r;
      if(!finite(gap))throw Error('Nonfinite projected gap');
      minXY=Math.min(minXY,gap);
      if(gap<=xyMarginMm){
        if(firstProjected===null)firstProjected=k;
        if(axialGapMm<=zMarginMm&&firstPotential===null)firstPotential=k;
      }
    }
    rows.push({bodies:pair,minimumProjectedGapMm:minXY,axialGapMm,
      firstProjectedOverlapFrame:firstProjected,firstPotentialExtrudedOverlapFrame:firstPotential,
      axialSeparationRulesOutProjectedOverlap:firstProjected!==null&&axialGapMm>zMarginMm});
  }
  return {schema:'engine-zero/sampled-axial-risk-0.1',units:'mm',sampledFrames:trace.frames.length,
    checkedNonadjacentPairs:rows.length,projectedOverlapPairs:rows.filter(r=>r.firstProjectedOverlapFrame!==null).length,
    potentialExtrudedOverlapPairs:rows.filter(r=>r.firstPotentialExtrudedOverlapFrame!==null).length,
    axiallyExcludedProjectedPairs:rows.filter(r=>r.axialSeparationRulesOutProjectedOverlap).length,
    pairs:rows,limitations:['Sampled phases only; missed between-frame collisions possible',
      'Rigid planar extrusion approximation, not true 3D solid geometry',
      'Directly joint-connected pairs and ground excluded',
      'Axial intervals supplied by caller; no verified bearings, fasteners, forces, tolerances or fabrication']};
}
module.exports={screenAxialLayers};
