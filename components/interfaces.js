'use strict';
// Nominal interface compatibility, not load or manufacturing verification.
// All lengths in millimetres. Ground fixtures are always explicit.
const {bindGraph}=require('./parametric.js');
const finitePositive=(n)=>typeof n==='number'&&Number.isFinite(n)&&n>0;
function auditRevoluteInterfaces(graph,{componentOptions={},pins={},groundBores={},minRadialClearanceMm=0.02,maxRadialClearanceMm=0.2}={}){
  if(!graph||!Array.isArray(graph.joints))throw new TypeError('Graph with joints required');
  if(!finitePositive(minRadialClearanceMm)||!finitePositive(maxRadialClearanceMm)||
      maxRadialClearanceMm<minRadialClearanceMm)throw new RangeError('Invalid radial clearance window');
  if(!pins||typeof pins!=='object'||Array.isArray(pins)||
      !groundBores||typeof groundBores!=='object'||Array.isArray(groundBores))
    throw new TypeError('Explicit pin and ground-bore maps required');
  const assembly=bindGraph(graph,componentOptions);
  const parts=new Map(assembly.parts.map(p=>[p.bodyId,p]));
  const rows=[],errors=[];
  const jointIds=new Set();
  for(const j of graph.joints){
    if(jointIds.has(j.id))throw new Error('Duplicate joint ID');
    jointIds.add(j.id);
    if(j.type!=='R'){errors.push({jointId:j.id,reason:'unsupported joint type'});continue;}
    const pin=pins[j.id],diameters=[];
    for(const id of [j.a,j.b]){
      if(id==='g')diameters.push(groundBores[j.id]);
      else{
        const part=parts.get(id);
        const hole=part?.holes.find(h=>h.jointId===j.id);
        diameters.push(hole?.diameterMm);
      }
    }
    const reasons=[];
    if(!finitePositive(pin))reasons.push('pin diameter missing or invalid');
    for(let i=0;i<2;i++)if(!finitePositive(diameters[i]))reasons.push(((i===0?j.a:j.b)==='g'?'ground':(i===0?j.a:j.b))+' bore diameter missing or invalid');
    let radialClearanceMm=null;
    if(!reasons.length){
      const radial=diameters.map(b=>(b-pin)/2);
      radialClearanceMm=radial;
      if(radial.some(c=>c<minRadialClearanceMm||c>maxRadialClearanceMm))
        reasons.push('radial clearance outside configured window');
    }
    const row={jointId:j.id,bodies:[j.a,j.b],pinDiameterMm:finitePositive(pin)?pin:null,
      boreDiametersMm:diameters.map(d=>finitePositive(d)?d:null),radialClearanceMm,
      nominalCompatible:reasons.length===0,reasons};
    rows.push(row);
    if(reasons.length)errors.push({jointId:j.id,reason:reasons.join('; ')});
  }
  for(const id of Object.keys(pins))if(!jointIds.has(id))errors.push({jointId:id,reason:'pin refers to unknown joint'});
  for(const id of Object.keys(groundBores))if(!jointIds.has(id))errors.push({jointId:id,reason:'ground bore refers to unknown joint'});
  return {schema:'engine-zero/revolute-interface-audit-0.1',units:'mm',
    nominalCompatible:errors.length===0,rows,errors,
    validated:['explicit pin/bore diameter presence','nominal radial clearance window','joint-to-part hole correspondence'],
    unverified:['axial stacking and washers','pin retention','bearings','tolerances and thermal effects','material, forces, fatigue','3D collisions and fabrication']};
}
module.exports={auditRevoluteInterfaces};
