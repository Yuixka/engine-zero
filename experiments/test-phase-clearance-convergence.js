'use strict';
const assert=require('node:assert/strict');
const G=require('../graph-engine.js'),D=require('../discovery.js');
const {compareTraces,auditGraph}=require('./phase-clearance-convergence.js');
const graph=G.fromLegacyFourbar(D.BEST_LEGACY);
const options={componentOptions:{widthMm:6,holeDiameterMm:2,edgeMarginMm:1}};
const result=auditGraph(graph,{levels:[36,72],...options});
assert.deepEqual(result,auditGraph(graph,{levels:[36,72],...options}));
assert.deepEqual(result.rows.map(r=>r.samples),[36,72]);
assert(result.rows.every(r=>r.valid),JSON.stringify(result.rows));
assert(result.rows.every(r=>r.checkedNonadjacentPairs>=1));
assert.equal(result.certifiedCollisionFree,false);
assert.equal(result.converged,false);
const coarse=G.motion(graph,4),fine=G.motion(graph,8);
assert(coarse.ok&&fine.ok);
const artificial=structuredClone(fine);
// Deliberate synthetic corruption: move nonadjacent rocker into the input body at one fine phase.
// This is a diagnostic test of risk detection, not a physically valid linkage motion.
artificial.frames[1].rocker=artificial.frames[1].input.slice();
const fixture=compareTraces(graph,[coarse,artificial],options);
assert.equal(fixture.rows[1].samples,8);
assert(fixture.rows[1].overlapCount>=fixture.rows[0].overlapCount);
assert.throws(()=>auditGraph(graph,{levels:[72,36]}),RangeError);
assert.throws(()=>compareTraces(graph,[coarse,coarse]),RangeError);
console.log('phase clearance convergence regression PASS');
