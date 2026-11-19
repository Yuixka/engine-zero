'use strict';
const assert=require('node:assert/strict');
const {segmentDistance,screenPlanarInterference}=require('./planar-interference.js');
const G=require('../graph-engine.js'),D=require('../discovery.js');
const near=(a,b)=>assert(Math.abs(a-b)<1e-9, a+' != '+b);
near(segmentDistance([0,0],[10,0],[5,3],[5,8]),3);
near(segmentDistance([0,0],[0,0],[3,4],[3,4]),5);
near(segmentDistance([0,0],[10,0],[5,-5],[5,5]),0);
near(segmentDistance([0,0],[10,0],[20,1],[30,1]),Math.hypot(10,1));
const graph={family:'test',bodies:[{id:'g'},{id:'a'},{id:'b'},{id:'c'}],joints:[
{id:'ga',type:'R',a:'g',b:'a',pa:[0,0],pb:[0,0]},
{id:'ab',type:'R',a:'a',b:'b',pa:[20,0],pb:[0,0]},
{id:'bc',type:'R',a:'b',b:'c',pa:[20,0],pb:[0,0]},
{id:'cg',type:'R',a:'c',b:'g',pa:[20,0],pb:[40,0]}]};
const frame={a:[0,0,0],b:[20,0,0],c:[0,0,0]};
const opts={componentOptions:{widthMm:6,holeDiameterMm:2,edgeMarginMm:1}};
const collision=screenPlanarInterference(graph,{ok:true,frames:[frame]},opts);
assert.equal(collision.checkedNonadjacentPairs,1);
assert.equal(collision.overlapCount,1);
assert.deepEqual(collision.pairs[0].bodies,['a','c']);
assert.equal(collision.pairs[0].firstOverlapFrame,0);
const separated=screenPlanarInterference(graph,{ok:true,frames:[{...frame,c:[0,50,0]}]},opts);
assert.equal(separated.overlapCount,0);
near(separated.pairs[0].minimumPlanarGapMm,44);
assert.deepEqual(separated,screenPlanarInterference(graph,{ok:true,frames:[{...frame,c:[0,50,0]}]},opts));
assert.throws(()=>screenPlanarInterference(graph,{ok:true,frames:[{...frame,c:[0,0,NaN]}]},opts),TypeError);
assert.throws(()=>screenPlanarInterference(graph,{ok:true,frames:[]},opts),TypeError);
const four=G.fromLegacyFourbar(D.BEST_LEGACY),motion=G.motion(four,36);
assert(motion.ok,motion.reason);
const real=screenPlanarInterference(four,motion,opts);
assert.equal(real.sampledFrames,36);
assert(real.checkedNonadjacentPairs>=1);
assert(real.pairs.every(p=>Number.isFinite(p.minimumPlanarGapMm)));
console.log('planar interference risk screen PASS');
