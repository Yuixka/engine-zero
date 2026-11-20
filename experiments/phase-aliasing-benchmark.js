'use strict';
// Independent adversarial phase-grid aliasing benchmark. No mechanical safety claims.
const assert = require('node:assert/strict');
const TAU = 2 * Math.PI;
function phaseGrid(n, offset = 0) {
  if (!Number.isInteger(n) || n < 2) throw new RangeError('n must be >= 2');
  return Array.from({length:n}, (_,i) => TAU * ((i + offset) / n % 1));
}
function periodicDistance(a,b) {
  const d = Math.abs(a-b) % TAU;
  return Math.min(d, TAU-d);
}
// Synthetic near-contact event, not a mechanism dynamics model.
// clearance is negative iff phase is within halfWidth of center.
function clearance(phase, center, halfWidth) {
  return periodicDistance(phase,center) - halfWidth;
}
function audit(n, center, halfWidth, offset=0) {
  const values=phaseGrid(n,offset).map(p=>clearance(p,center,halfWidth));
  return {n, offset, minClearance:Math.min(...values), detectsContact:values.some(x=>x<0)};
}
function benchmark(n=36, multiplier=8) {
  const center=TAU/(2*n), halfWidth=TAU/(8*n);
  const coarse=audit(n,center,halfWidth);
  const shifted=audit(n,center,halfWidth,.5);
  const dense=audit(n*multiplier,center,halfWidth);
  const truth=clearance(center,center,halfWidth);
  return {event:{center,halfWidth,truth},coarse,shifted,dense,
    falseNegative:truth<0&&!coarse.detectsContact,
    recoveredByShift:shifted.detectsContact,
    recoveredByDense:dense.detectsContact};
}
if (require.main===module) {
  const r=benchmark();
  assert(r.falseNegative,'coarse grid should miss adversarial narrow event');
  assert(r.recoveredByShift,'half-phase shift should reveal event');
  assert(r.recoveredByDense,'8x sampling should reveal event');
  assert(audit(36,TAU-0.001,0.01).detectsContact,'periodic boundary should be covered');
  assert.throws(()=>phaseGrid(1),RangeError);
  console.log(JSON.stringify({status:'passed',benchmark:r},null,2));
}
module.exports={phaseGrid,periodicDistance,clearance,audit,benchmark};
