'use strict';
const assert=require('node:assert/strict');
const {audit,summarize}=require('./multiseed-audit.js');
const opts={seeds:[17,71,716],budget:8,depth:1};
const a=audit(opts),b=audit(opts);
assert.deepEqual(a,b,'same seeds must reproduce the same audit');
assert.equal(a.protocol.total_search_attempts,27,'8 generated plus 1 incumbent per seed');
assert.equal(a.targets.length,4);
for(const target of a.targets){
  assert.equal(target.baseline_rms_mm.count,3);
  for(const f of target.families){
    assert.equal(f.present_trials+f.absent_trials,3);
    assert.equal(f.valid_trials+f.invalid_trials,f.present_trials);
    assert(f.beats_baseline_count<=f.valid_trials);
    assert(f.beats_baseline_fraction_of_all_trials>=0&&f.beats_baseline_fraction_of_all_trials<=1);
    if(f.valid_trials)assert(Number.isFinite(f.rms_minus_crank_mm.mean));
  }
}
assert.deepEqual(summarize([1,2,3,4]),{count:4,mean:2.5,min:1,max:4,median:3});
assert.equal(summarize([]),null);
for(const seeds of [[1],[1,1],[1,-1],[1,1.2]])assert.throws(()=>audit({seeds}),RangeError);
assert.throws(()=>audit({seeds:[1,2],budget:-1}),RangeError);
console.log('Multi-seed audit determinism, accounting and validation: PASS');
