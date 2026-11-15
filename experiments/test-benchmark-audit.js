'use strict';
// Independent accounting audit for the existing held-out benchmark.
// This does not validate physics, novelty, or statistical generalization.
const assert = require('node:assert/strict');
const {benchmark, TRAIN, HELD_OUT} = require('./benchmark.js');
const R = benchmark({seed:716,budget:24,depth:2});
const near = (a,b,tol=0.000003) => Math.abs(a-b)<=tol;
assert.equal(R.protocol.training_spec.n,TRAIN.n);
assert.equal(R.held_out.length,HELD_OUT.length);
assert.equal(new Set(R.held_out.map(x=>x.id)).size,R.held_out.length);
assert(R.held_out.every(x=>x.samples>TRAIN.n),'holdouts must have denser phase sampling');
assert(R.held_out.some(x=>x.mode!==TRAIN.mode),'include a distinct trajectory family');
assert(R.held_out.some(x=>x.stroke_mm!==TRAIN.stroke || x.lift_mm!==TRAIN.lift),'include changed dimensions');
const families=R.training_champions.map(c=>c.family).sort();
assert.equal(new Set(families).size,families.length,'one champion per family');
for(const row of R.held_out){
  assert(Number.isFinite(row.best_fit_crank_baseline_rms_mm));
  assert.deepEqual(row.champions.map(c=>c.family).sort(),families);
  for(const c of row.champions){
    if(c.valid){
      assert(Number.isFinite(c.rms_mm)&&c.rms_mm>=0);
      assert(Number.isFinite(c.complexity_penalty_mm)&&c.complexity_penalty_mm>=0);
      assert(near(c.score_mm,c.rms_mm+c.complexity_penalty_mm),
        'score accounting mismatch: '+row.id+' / '+c.family);
      assert(near(c.rms_minus_crank_mm,c.rms_mm-row.best_fit_crank_baseline_rms_mm),
        'baseline delta mismatch: '+row.id+' / '+c.family);
      assert(Number.isFinite(c.max_closure_residual_mm)&&c.max_closure_residual_mm>=0);
      assert(Number.isFinite(c.cycle_error_mm)&&c.cycle_error_mm>=0);
    } else {
      assert.equal(c.rms_mm,null);
      assert.equal(c.score_mm,null);
      assert.equal(c.rms_minus_crank_mm,null);
    }
  }
}
console.log('Independent benchmark accounting audit: PASS');
