'use strict';
const assert=require('node:assert/strict');
const {screenAxialLayers}=require('./axial-layers.js');
const G=require('../graph-engine.js'),D=require('../discovery.js');
const graph={family:'fixture',bodies:[{id:'g'},{id:'a'},{id:'b'},{id:'c'}],joints:[
{id:'ga',type:'R',a:'g',b:'a',pa:[0,0],pb:[0,0]},
{id:'ab',type:'R',a:'a',b:'b',pa:[20,0],pb:[0,0]},
{id:'bc',type:'R',a:'b',b:'c',pa:[20,0],pb:[0,0]},
{id:'cg',type:'R',a:'c',b:'g',pa:[20,0],pb:[40,0]}]};
const frame={a:[0,0,0],b:[20,0,0],c:[0,0,0]};
const common={componentOptions:{widthMm:6,thicknessMm:4,holeDiameterMm:2,edgeMarginMm:1}};
const layers={a:{zMinMm:0,zMaxMm:4},b:{zMinMm:0,zMaxMm:4},c:{zMinMm:10,zMaxMm:14}};
const safe=screenAxialLayers(graph,{ok:true,frames:[frame]},{...common,layers});
assert.equal(safe.projectedOverlapPairs,1);
assert.equal(safe.potentialExtrudedOverlapPairs,0);
assert.equal(safe.axiallyExcludedProjectedPairs,1);
assert.equal(safe.pairs[0].axialGapMm,6);
const same=screenAxialLayers(graph,{ok:true,frames:[frame]},{...common,layers:{...layers,c:{zMinMm:2,zMaxMm:6}}});
assert.equal(same.potentialExtrudedOverlapPairs,1);
const touch=screenAxialLayers(graph,{ok:true,frames:[frame]},{...common,layers:{...layers,c:{zMinMm:4,zMaxMm:8}}});
assert.equal(touch.potentialExtrudedOverlapPairs,1,'touching faces must remain potential contact');
const far=screenAxialLayers(graph,{ok:true,frames:[{...frame,c:[0,50,0]}]},{...common,layers:{...layers,c:{zMinMm:2,zMaxMm:6}}});
assert.equal(far.potentialExtrudedOverlapPairs,0);
assert.throws(()=>screenAxialLayers(graph,{ok:true,frames:[frame]},common),/Missing or invalid axial interval/);
assert.throws(()=>screenAxialLayers(graph,{ok:true,frames:[frame]},{...common,layers:{...layers,c:{zMinMm:10,zMaxMm:15}}}),/thickness mismatch/);
assert.throws(()=>screenAxialLayers(graph,{ok:true,frames:[frame]},{...common,layers:{...layers,unknown:{zMinMm:0,zMaxMm:4}}}),/Unknown layer/);
assert.throws(()=>screenAxialLayers(graph,{ok:true,frames:[{...frame,c:[0,0,NaN]}]},{...common,layers}),TypeError);
const four=G.fromLegacyFourbar(D.BEST_LEGACY),motion=G.motion(four,36);
assert(motion.ok,motion.reason);
const m=screenAxialLayers(four,motion,{layers:{input:{zMinMm:0,zMaxMm:4},coupler:{zMinMm:4,zMaxMm:8},rocker:{zMinMm:8,zMaxMm:12}}});
assert.equal(m.sampledFrames,36);
assert(m.pairs.every(p=>Number.isFinite(p.minimumProjectedGapMm)));
console.log('Sampled axial layer screen PASS');
