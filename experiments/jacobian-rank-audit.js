'use strict';
/*
 * Research-only local constraint Jacobian rank diagnostic.
 * A generic mobility count is necessary but not sufficient: dependent
 * constraints may leave instantaneous degrees of freedom. This diagnostic
 * does not certify global mobility, stability, or fabrication feasibility.
 */
const G=require('../graph-engine.js');
function numericalRank(matrix,{relativeTolerance=1e-8}={}){
  if(!Array.isArray(matrix)||!matrix.length||!Array.isArray(matrix[0]))throw new TypeError('Expected nonempty matrix');
  const cols=matrix[0].length;
  if(!cols||matrix.some(r=>r.length!==cols||r.some(x=>!Number.isFinite(x))))throw new TypeError('Invalid matrix');
  if(!Number.isFinite(relativeTolerance)||relativeTolerance<=0)throw new RangeError('Invalid tolerance');
  // Column scaling makes translation (mm) and rotation (radians) comparable.
  const scales=Array.from({length:cols},(_,j)=>Math.max(1,...matrix.map(r=>Math.abs(r[j]))));
  const a=matrix.map(r=>r.map((v,j)=>v/scales[j]));
  const norm=r=>Math.hypot(...r);
  const maxRow=Math.max(...a.map(norm));
  const threshold=relativeTolerance*Math.max(1,maxRow);
  const basis=[];let minPivot=Infinity,maxPivot=0;
  // Reorthogonalized pivoted modified Gram-Schmidt on constraint rows.
  while(basis.length<Math.min(a.length,cols)){
    let best=-1,bestNorm=0,bestVector=null;
    for(let i=0;i<a.length;i++){
      let v=a[i].slice();
      for(let pass=0;pass<2;pass++)for(const b of basis){
        const dot=v.reduce((s,x,j)=>s+x*b[j],0);
        v=v.map((x,j)=>x-dot*b[j]);
      }
      const n=norm(v);
      if(n>bestNorm){bestNorm=n;best=i;bestVector=v;}
    }
    if(best<0||bestNorm<=threshold)break;
    basis.push(bestVector.map(x=>x/bestNorm));
    minPivot=Math.min(minPivot,bestNorm);maxPivot=Math.max(maxPivot,bestNorm);
  }
  return {rank:basis.length,rows:a.length,cols,deficiency:cols-basis.length,
    threshold,smallestAcceptedPivot:Number.isFinite(minPivot)?minPivot:null,
    largestAcceptedPivot:maxPivot||null,
    note:'Heuristic numerical rank; pivot ratio is not an SVD condition number'};
}
function auditPose(graph,poses,inputAngle,options={}){
  G.validate(graph);
  const sys=G.equationSystem(graph,poses,inputAngle,true);
  const result=numericalRank(sys.jac,options);
  return {...result,fullColumnRank:result.rank===sys.cols,
    maxConstraintResidual:Math.max(...sys.residual.map(Math.abs))};
}
function auditMotion(graph,trace,options={}){
  if(!trace?.ok||!Array.isArray(trace.frames)||trace.frames.length<2)
    return {valid:false,reason:'Successful sampled motion required'};
  const samples=trace.frames.map((poses,i)=>({
    phase:i, ...auditPose(graph,poses,2*Math.PI*i/trace.frames.length,options)
  }));
  const deficient=samples.filter(s=>!s.fullColumnRank);
  return {valid:deficient.length===0,frames:samples.length,
    deficientFrames:deficient.map(s=>s.phase),
    minimumAcceptedPivot:Math.min(...samples.map(s=>s.smallestAcceptedPivot??0)),
    maxConstraintResidual:Math.max(...samples.map(s=>s.maxConstraintResidual)),
    limitation:'Sampled local rank only; not a continuous singularity certificate'};
}
module.exports={numericalRank,auditPose,auditMotion};
