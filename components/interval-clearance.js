'use strict';
// Worst-case dimensional interval gate. This is not a statistical fit or 3D validation.
const finiteNonnegative=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0;
function auditClearanceIntervals(nominalAudit,{pinToleranceMm={},boreToleranceMm={},minRadialClearanceMm=0.02,maxRadialClearanceMm=0.2}={}){
  if(!nominalAudit||!Array.isArray(nominalAudit.rows))throw new TypeError('Nominal interface audit required');
  if(!finiteNonnegative(minRadialClearanceMm)||!finiteNonnegative(maxRadialClearanceMm)||maxRadialClearanceMm<minRadialClearanceMm)
    throw new RangeError('Invalid clearance window');
  for(const map of [pinToleranceMm,boreToleranceMm])
    if(!map||typeof map!=='object'||Array.isArray(map))throw new TypeError('Tolerance maps required');
  const errors=[],rows=[],known=new Set(nominalAudit.rows.map(r=>r.jointId));
  for(const row of nominalAudit.rows){
    const id=row.jointId,pt=pinToleranceMm[id],bt=boreToleranceMm[id],reasons=[];
    if(!row.nominalCompatible)reasons.push('nominal interface not compatible');
    if(!finiteNonnegative(pt))reasons.push('pin tolerance missing or invalid');
    if(!Array.isArray(bt)||bt.length!==2||!bt.every(finiteNonnegative))reasons.push('two bore tolerances required');
    let clearanceBoundsMm=null;
    if(!reasons.length){
      clearanceBoundsMm=row.boreDiametersMm.map((b,i)=>{
        const p=row.pinDiameterMm;
        return [(b-bt[i]-(p+pt))/2,(b+bt[i]-(p-pt))/2];
      });
      if(clearanceBoundsMm.some(([lo,hi])=>lo<minRadialClearanceMm||hi>maxRadialClearanceMm))
        reasons.push('worst-case radial clearance outside window');
    }
    rows.push({jointId:id,clearanceBoundsMm,robustCompatible:reasons.length===0,reasons});
    if(reasons.length)errors.push({jointId:id,reason:reasons.join('; ')});
  }
  for(const map of [pinToleranceMm,boreToleranceMm])
    for(const id of Object.keys(map))if(!known.has(id))errors.push({jointId:id,reason:'tolerance for unknown joint'});
  return {schema:'engine-zero/interval-clearance-audit-0.1',units:'mm',robustCompatible:errors.length===0,rows,errors,
    unverified:['tolerance correlation and manufacturing distributions','3D stacking','loads and thermal effects','physical testing']};
}
module.exports={auditClearanceIntervals};
