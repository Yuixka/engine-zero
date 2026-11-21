'use strict';
// Scalar Lipschitz clearance certification, NOT a 3D collision solver.
// L must be an independently justified upper bound on |d(clearance)/d(phase)|.
function certify(clearance, L, {start=0,end=1,maxEvaluations=4097,tolerance=1e-6}={}) {
  if (!(Number.isFinite(L)&&L>=0&&Number.isFinite(start)&&Number.isFinite(end)&&end>start&&Number.isInteger(maxEvaluations)&&maxEvaluations>=3&&Number.isFinite(tolerance)&&tolerance>0)) throw Error('Invalid certificate inputs');
  let evaluations=0, minimum=Infinity;
  function sample(t) {const d=clearance(t);evaluations++;if(!Number.isFinite(d))throw Error('Nonfinite clearance');minimum=Math.min(minimum,d);return d;}
  const a=sample(start),b=sample(end);
  if(a<=0||b<=0)return {status:'collision-observed',evaluations,minimum};
  const queue=[{a:start,b:end,da:a,db:b}];
  let unresolved=0,certified=0;
  while(queue.length){
    const s=queue.pop(),width=s.b-s.a;
    // From either endpoint, d(t)>=max(da-L*(t-a),db-L*(b-t)).
    // Their intersection yields a conservative interval lower bound.
    const lower=(s.da+s.db-L*width)/2;
    if(lower>0){certified++;continue;}
    if(width<=tolerance||evaluations>=maxEvaluations){unresolved++;continue;}
    const mid=(s.a+s.b)/2,dm=sample(mid);
    if(dm<=0)return {status:'collision-observed',evaluations,minimum};
    queue.push({a:s.a,b:mid,da:s.da,db:dm},{a:mid,b:s.b,da:dm,db:s.db});
  }
  return {status:unresolved?'unknown':'certified-clear',evaluations,minimum,certifiedIntervals:certified,unresolvedIntervals:unresolved};
}
module.exports={certify};
if(require.main===module){
 const assert=require('node:assert/strict');
 const narrow=t=>Math.abs(t-0.513)-0.002;
 const grid=Array.from({length:36},(_,i)=>narrow(i/35));
 assert(grid.every(x=>x>0),'fixture must fool 36-point grid');
 const hit=certify(narrow,1,{maxEvaluations:4097});
 assert.equal(hit.status,'collision-observed');
 const safe=certify(t=>0.1+0.01*Math.sin(2*Math.PI*t),0.02*Math.PI);
 assert.equal(safe.status,'certified-clear');
 const unknown=certify(narrow,1,{maxEvaluations:3});
 assert.equal(unknown.status,'unknown');
 assert.throws(()=>certify(narrow,0,{maxEvaluations:2}));
 console.log(JSON.stringify({status:'passed',grid36:'missed collision',narrow:hit,safe,unknown},null,2));
}
