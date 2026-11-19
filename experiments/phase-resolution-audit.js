'use strict';
/*
 * Independent resolution-convergence diagnostic for sampled planar kinematics.
 * This is NOT a continuous-motion proof, physical simulation, or novelty claim.
 * Does not alter the discovery search, scoring, or existing benchmark.
 */
const assert = require('node:assert/strict');
const D = require('../discovery.js');
const G = require('../graph-engine.js');

const RESOLUTIONS = Object.freeze([36, 72, 144, 288]);
function diagnostic({seed=716,budget=24,depth=2}={}) {
  assert(Number.isSafeInteger(seed));
  assert(Number.isSafeInteger(budget) && budget>=0 && budget<=2000);
  assert(Number.isSafeInteger(depth) && depth>=0 && depth<=2);
  const session=D.createSession({mode:'step',stroke:120,lift:38,n:36},{seed,depth});
  session.step(budget);
  const champions=session.summary().champions;
  const rows=champions.map(c=>{
    const graph=G.stripGraph(c.graph);
    const runs=RESOLUTIONS.map(samples=>{
      const result=G.motion(G.restoreGraph(graph),samples);
      return {samples,ok:result.ok,reason:result.ok?null:(result.reason||'unspecified'),
        worstResidual:result.ok?result.worstResidual:null,
        cycleError:result.ok?result.cycleError:null};
    });
    const coarse=runs[0],fine=runs[runs.length-1];
    return {family:c.graph.family,coarsePass:coarse.ok,finePass:fine.ok,
      classificationChanged:coarse.ok!==fine.ok,
      runs};
  });
  return {schema_version:1,kind:'planar-phase-resolution-convergence-diagnostic',
    seed,budget,depth,resolutions:RESOLUTIONS,
    limitations:['Same solver at all resolutions: not independent validation',
      'Discrete sampling cannot prove continuous full-cycle feasibility',
      'Selection of champions is based on the original 36-sample training objective',
      'No loads, collision geometry, tolerances, or physical validation'],
    champions:rows,coarsePassFineFail:rows.filter(x=>x.coarsePass&&!x.finePass).length,
    classificationChanges:rows.filter(x=>x.classificationChanged).length};
}
if(require.main===module) {
  const a=diagnostic();
  const b=diagnostic();
  assert.deepStrictEqual(a,b,'diagnostic must be deterministic');
  assert(a.champions.length>0,'at least one champion required');
  for(const row of a.champions) {
    assert.deepStrictEqual(row.runs.map(r=>r.samples),RESOLUTIONS);
    for(const run of row.runs) {
      assert.equal(typeof run.ok,'boolean');
      if(run.ok) {
        assert(Number.isFinite(run.worstResidual));
        assert(Number.isFinite(run.cycleError));
      }
    }
  }
  process.stdout.write(JSON.stringify(a,null,2)+'\n');
}
module.exports={diagnostic,RESOLUTIONS};
