'use strict';
const assert=require('node:assert/strict');
const {benchmark,TRAIN,HELD_OUT}=require('./benchmark.js');
const A=benchmark({seed:716,budget:24,depth:2});
const B=benchmark({seed:716,budget:24,depth:2});
assert.deepEqual(A,B,'seeded benchmark must be byte-for-byte deterministic');
assert(A.discovery.valid>0);
assert(A.training_champions.some(c=>c.family==='4R'));
assert.equal(A.held_out.length,HELD_OUT.length);
for(const test of A.held_out){
  assert(test.best_fit_crank_baseline_rms_mm>=0);
  assert(test.champions.length===A.training_champions.length);
  for(const m of test.champions){
    assert.equal(typeof m.valid,'boolean');
    if(m.valid){assert(Number.isFinite(m.rms_mm));assert(Number.isFinite(m.score_mm));assert(Number.isFinite(m.max_closure_residual_mm));}
    else assert.equal(m.rms_mm,null);
  }
}
assert.equal(TRAIN.n,36);
assert.throws(()=>benchmark({budget:-1}),RangeError);
assert.throws(()=>benchmark({budget:2.2}),RangeError);
console.log('Held-out, determinism, validation, and scoring checks: PASS');
