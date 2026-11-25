'use strict';
const assert = require('node:assert/strict');
const {audit} = require('./paired-verification-audit');
const rows = (a,b) => [...Array(a+b)].map((_,i)=>({task:'fixture',seed:i,budget:100,
  baseline:{verified:i>=a},experimental:{verified:i<a}}));
let r=audit(rows(6,0));
assert.equal(r.experimentalOnly,6);
assert.equal(r.exactTwoSidedP,0.03125);
assert.equal(r.yieldDifference,1);
r=audit(rows(0,6));
assert.equal(r.baselineOnly,6);
assert.equal(r.exactTwoSidedP,0.03125);
r=audit([{task:'x',seed:0,budget:1,baseline:{verified:true},experimental:{verified:true}}]);
assert.equal(r.exactTwoSidedP,1);
assert.equal(r.yieldDifference,0);
assert.throws(()=>audit([]));
assert.throws(()=>audit([{task:'x',seed:0,budget:1,baseline:{verified:true},experimental:{verified:false}},
 {task:'x',seed:0,budget:1,baseline:{verified:false},experimental:{verified:true}}]),/Duplicate/);
assert.throws(()=>audit([{task:'x',seed:0,budget:10,baseline:{verified:true,budget:9},experimental:{verified:false}}]),/mismatch/);
console.log('paired verification audit: 7 regression checks passed');
