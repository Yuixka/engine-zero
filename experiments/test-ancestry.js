'use strict';
const assert=require('node:assert/strict');
const D=require('../discovery.js');
const G=require('../graph-engine.js');
const K=require('../legacy-fourbar.js');
const opts={seed:716,depth:0};
const a=D.createSession({mode:'step',stroke:120,lift:38,n:36},opts);
assert.equal(a.summary().champions.find(c=>c.graph.family==='4R').ancestry,'incumbent-derived');
const imported=G.stripGraph(G.fromLegacyFourbar(D.BEST_LEGACY));
const add=a.addGraph(imported);assert(add.ok);
assert.equal(add.candidate.ancestry,'imported-derived');
a.step(36);
const s=a.summary();
assert(s.champions.every(c=>['generated-root','incumbent-derived','imported-derived'].includes(c.ancestry)));
assert(s.champions.some(c=>c.ancestry==='incumbent-derived'));
const b=D.createSession({mode:'step',stroke:120,lift:38,n:36},opts);b.addGraph(imported);b.step(36);
assert.deepEqual(s.champions.map(c=>[c.graph.family,c.ancestry,c.attempt]),
  b.summary().champions.map(c=>[c.graph.family,c.ancestry,c.attempt]));
console.log('Candidate ancestry provenance: PASS');
