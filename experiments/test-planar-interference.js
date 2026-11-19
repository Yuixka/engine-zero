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

// Metamorphic distance tests: rigid transforms, segment reversal and pair exchange
// must not change geometric clearance. These catch asymmetric and coordinate bugs.
let seed=20261119;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const rotate=(p,angle,dx,dy)=>[p[0]*Math.cos(angle)-p[1]*Math.sin(angle)+dx,
  p[0]*Math.sin(angle)+p[1]*Math.cos(angle)+dy];
for(let i=0;i<250;i++){
  const pts=Array.from({length:4},()=>[(random()-.5)*200,(random()-.5)*200]);
  if(i%7===0)pts[1]=pts[0].slice(); // disk/point degeneracy
  if(i%11===0)pts[3]=pts[2].slice();
  const [a,b,c,d]=pts,base=segmentDistance(a,b,c,d);
  assert(Number.isFinite(base)&&base>=0,'invalid segment gap at '+i);
  near(segmentDistance(c,d,a,b),base);
  near(segmentDistance(b,a,c,d),base);
  near(segmentDistance(a,b,d,c),base);
  const angle=(random()-.5)*6,dx=(random()-.5)*1000,dy=(random()-.5)*1000;
  const [aa,bb,cc,dd]=pts.map(p=>rotate(p,angle,dx,dy));
  assert(Math.abs(segmentDistance(aa,bb,cc,dd)-base)<1e-8,'rigid transform mismatch '+i);
}
