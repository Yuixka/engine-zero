'use strict';
const assert=require('node:assert/strict');
const {numericalRank,auditPose,auditMotion}=require('./jacobian-rank-audit.js');
const G=require('../graph-engine.js');
assert.equal(numericalRank([[1,0],[0,1]]).rank,2);
assert.equal(numericalRank([[1,0],[2,0]]).deficiency,1);
assert.equal(numericalRank([[1,1],[1,1+1e-10]]).rank,1);
assert.equal(numericalRank([[1,1],[1,1+1e-4]]).rank,2);
assert.throws(()=>numericalRank([[NaN]]),/Invalid matrix/);
assert.throws(()=>numericalRank([[1,2],[1]]),/Invalid matrix/);
const graph={version:'0.2',family:'test-crank',bodies:[{id:'g'},{id:'input'}],
  joints:[{id:'pivot',type:'R',a:'g',b:'input',pa:[0,0],pb:[0,0]}],
  driver:{body:'input',offset:0},output:{body:'input',point:[20,0]},
  seedPoses:{input:[0,0,0]}};
const poses={input:[0,0,0]};
const local=auditPose(graph,poses,0);
assert.equal(local.fullColumnRank,true);
assert.equal(local.deficiency,0);
const frames=Array.from({length:24},(_,i)=>({input:[0,0,2*Math.PI*i/24]}));
const trace={ok:true,frames};
assert.equal(auditMotion(graph,trace).valid,true);
assert.equal(auditMotion(graph,{ok:false}).valid,false);
console.log('Jacobian rank audit assertions passed (synthetic planar fixtures)');
