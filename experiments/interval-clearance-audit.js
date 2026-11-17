'use strict';
// Third engineer: exact worst-case interval clearance screen, millimetres.
// No probability, material, loads, stack-up, thermal or 3D claims.
const assert = require('node:assert/strict');
function interval(nominalMm, toleranceMm) {
  if (![nominalMm,toleranceMm].every(x=>typeof x==='number'&&Number.isFinite(x)) ||
      nominalMm<=0 || toleranceMm<0 || nominalMm<=toleranceMm)
    throw new RangeError('Positive nominal diameter and nonnegative bounded tolerance required');
  return [nominalMm-toleranceMm,nominalMm+toleranceMm];
}
function auditTolerance({pin,bores,minRadialClearanceMm=0.02,maxRadialClearanceMm=0.2}) {
  if (!pin || !Array.isArray(bores) || bores.length!==2 ||
      !Number.isFinite(minRadialClearanceMm)||!Number.isFinite(maxRadialClearanceMm)||
      minRadialClearanceMm<0 || maxRadialClearanceMm<minRadialClearanceMm)
    throw new TypeError('Pin, two bores, valid radial clearance bounds required');
  const [pLo,pHi]=interval(pin.nominalMm,pin.toleranceMm);
  const rows=bores.map(b=>{
    const [bLo,bHi]=interval(b.nominalMm,b.toleranceMm);
    const worstMinMm=(bLo-pHi)/2, worstMaxMm=(bHi-pLo)/2;
    const nominalMm=(b.nominalMm-pin.nominalMm)/2;
    return {nominalMm,worstMinMm,worstMaxMm,
      nominalPass:nominalMm>=minRadialClearanceMm&&nominalMm<=maxRadialClearanceMm,
      guaranteedPass:worstMinMm>=minRadialClearanceMm-1e-12&&worstMaxMm<=maxRadialClearanceMm+1e-12};
  });
  return {units:'mm',rows,nominalPass:rows.every(r=>r.nominalPass),
    guaranteedPass:rows.every(r=>r.guaranteedPass),
    scope:'Independent bounded radial clearance interval arithmetic; not a full physical fit verification'};
}
if (require.main===module) {
  const good=auditTolerance({pin:{nominalMm:5,toleranceMm:0.01},
    bores:[{nominalMm:5.2,toleranceMm:0.01},{nominalMm:5.2,toleranceMm:0.01}]});
  assert.equal(good.guaranteedPass,true);
  assert(Math.abs(good.rows[0].worstMinMm-0.09)<1e-10);
  const nominalOnly=auditTolerance({pin:{nominalMm:5,toleranceMm:0.08},
    bores:[{nominalMm:5.2,toleranceMm:0.08},{nominalMm:5.2,toleranceMm:0.08}]});
  assert.equal(nominalOnly.nominalPass,true);
  assert.equal(nominalOnly.guaranteedPass,false);
  assert.equal(auditTolerance({pin:{nominalMm:5,toleranceMm:0},
    bores:[{nominalMm:5.01,toleranceMm:0},{nominalMm:5.2,toleranceMm:0}]}).nominalPass,false);
  assert.throws(()=>auditTolerance({pin:{nominalMm:5,toleranceMm:-1},bores:[{nominalMm:5.2,toleranceMm:0},{nominalMm:5.2,toleranceMm:0}]}),RangeError);
  console.log('Interval clearance checks passed (4 assertions groups)');
}
module.exports={auditTolerance};
