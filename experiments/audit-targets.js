'use strict';
// Independent benchmark-integrity audit. No mechanism optimization is performed here.
// Run: node experiments/audit-targets.js
const assert = require('node:assert/strict');
const K = require('../legacy-fourbar.js');
const { TRAIN, HELD_OUT } = require('./benchmark.js');

function normalizedPath(spec, n=192) {
  const points = K.targetPath({...spec,n});
  assert.equal(points.length,n,'Unexpected target sample count');
  return points.map(p => {
    const x = Array.isArray(p) ? p[0] : p.x;
    const y = Array.isArray(p) ? p[1] : p.y;
    assert(Number.isFinite(x)&&Number.isFinite(y),'Nonfinite target coordinate');
    return [x,y];
  });
}
function shapeDistance(a,b) {
  assert.equal(a.length,b.length);
  const n=a.length;
  const centroid=pts=>pts.reduce((s,p)=>[s[0]+p[0]/n,s[1]+p[1]/n],[0,0]);
  const ca=centroid(a),cb=centroid(b);
  return Math.sqrt(a.reduce((sum,p,i)=>{
    const dx=(p[0]-ca[0])-(b[i][0]-cb[0]);
    const dy=(p[1]-ca[1])-(b[i][1]-cb[1]);
    return sum+dx*dx+dy*dy;
  },0)/n);
}
function audit(){
  const train=normalizedPath(TRAIN);
  const ids=new Set(), rows=[];
  for(const spec of HELD_OUT){
    assert(!ids.has(spec.id),'Duplicate benchmark ID: '+spec.id);
    ids.add(spec.id);
    const delta=shapeDistance(train,normalizedPath(spec));
    rows.push({id:spec.id,shape_rmse_mm:Number(delta.toFixed(6)),
      classification:delta<1e-7?'resampling-control-not-independent-target':'different-target'});
  }
  return rows;
}
if(require.main===module){
  const rows=audit();
  process.stdout.write(JSON.stringify({audit:'translation-invariant target shape comparison',
    interpretation:'resampling-control is NOT independent held-out evidence',
    rows},null,2)+'\n');
  assert(rows.some(r=>r.classification==='different-target'),'No distinct target trajectories');
}
module.exports={audit,shapeDistance};
