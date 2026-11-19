'use strict';
// Conservative 2D planar capsule-overlap risk screen; NOT a 3D collision proof.
const {bindGraph}=require('../components/parametric.js');
const finite=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);
function segmentDistance(a,b,c,d){
  if(![a,b,c,d].every(finite))throw TypeError('Invalid segment endpoints');
  const ux=b[0]-a[0],uy=b[1]-a[1],vx=d[0]-c[0],vy=d[1]-c[1];
  const wx=a[0]-c[0],wy=a[1]-c[1];
  const A=ux*ux+uy*uy,B=ux*vx+uy*vy,C=vx*vx+vy*vy,D=ux*wx+uy*wy,E=vx*wx+vy*wy;
  // Degenerate segments represent disks; evaluate endpoints robustly.
  if(A<1e-20&&C<1e-20)return Math.hypot(wx,wy);
  if(A<1e-20)return pointSegmentDistance(a,c,d);
  if(C<1e-20)return pointSegmentDistance(c,a,b);
  let sN,sD=A*C-B*B,tN,tD=sD;
  if(sD<1e-20){sN=0;sD=1;tN=E;tD=C;}
  else {sN=B*E-C*D;tN=A*E-B*D;
    if(sN<0){sN=0;tN=E;tD=C;}
    else if(sN>sD){sN=sD;tN=E+B;tD=C;}}
  if(tN<0){tN=0;if(-D<0)sN=0;else if(-D>A)sN=sD;else{sN=-D;sD=A;}}
  else if(tN>tD){tN=tD;if(-D+B<0)sN=0;else if(-D+B>A)sN=sD;else{sN=-D+B;sD=A;}}
  const s=Math.abs(sN)<1e-20?0:sN/sD,t=Math.abs(tN)<1e-20?0:tN/tD;
  return Math.hypot(wx+s*ux-t*vx,wy+s*uy-t*vy);
}
function pointSegmentDistance(p,a,b){
  const dx=b[0]-a[0],dy=b[1]-a[1],length2=dx*dx+dy*dy;
  const t=length2?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length2)):0;
  return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);
}
function worldPoint(pose,point){
  if(!Array.isArray(pose)||pose.length!==3||!pose.every(Number.isFinite))throw TypeError('Missing or nonfinite body pose');
  const [x,y,t]=pose;return [x+point[0]*Math.cos(t)-point[1]*Math.sin(t),y+point[0]*Math.sin(t)+point[1]*Math.cos(t)];
}
function capsule(part,poses){
  const p=part.profile,pose=poses[part.bodyId];
  if(p.kind==='disk'){const center=worldPoint(pose,p.centerMm);return {a:center,b:center,r:p.radiusMm};}
  if(p.kind==='capsule')return {a:worldPoint(pose,p.startMm),b:worldPoint(pose,p.endMm),r:p.radiusMm};
  throw Error('Unsupported part profile');
}
function screenPlanarInterference(graph,trace,{componentOptions={},marginMm=0}={}){
  if(typeof marginMm!=='number'||!Number.isFinite(marginMm)||marginMm<0)throw RangeError('Invalid margin');
  if(!trace||trace.ok!==true||!Array.isArray(trace.frames)||!trace.frames.length)throw TypeError('Valid sampled motion trace required');
  const assembly=bindGraph(graph,componentOptions);
  const directlyJoined=new Set(graph.joints.map(j=>[j.a,j.b].sort().join('|')));
  const pairs=[];
  for(let i=0;i<assembly.parts.length;i++)for(let j=i+1;j<assembly.parts.length;j++){
    const a=assembly.parts[i],b=assembly.parts[j];
    if(directlyJoined.has([a.bodyId,b.bodyId].sort().join('|')))continue;
    pairs.push([a,b]);
  }
  const rows=pairs.map(([a,b])=>({bodies:[a.bodyId,b.bodyId],minimumPlanarGapMm:Infinity,firstOverlapFrame:null}));
  trace.frames.forEach((frame,k)=>{
    for(let i=0;i<pairs.length;i++){
      const [a,b]=pairs[i],pa=capsule(a,frame),pb=capsule(b,frame);
      const gap=segmentDistance(pa.a,pa.b,pb.a,pb.b)-pa.r-pb.r;
      if(!Number.isFinite(gap))throw Error('Nonfinite gap');
      rows[i].minimumPlanarGapMm=Math.min(rows[i].minimumPlanarGapMm,gap);
      if(gap<=marginMm&&rows[i].firstOverlapFrame===null)rows[i].firstOverlapFrame=k;
    }
  });
  const overlaps=rows.filter(r=>r.firstOverlapFrame!==null);
  return {schema:'engine-zero/planar-interference-risk-0.1',units:'mm',sampledFrames:trace.frames.length,
    checkedNonadjacentPairs:pairs.length,overlapCount:overlaps.length,
    potentialPlanarInterference:overlaps.length>0,
    pairs:rows,limitations:[
      'Only sampled phases; may miss collisions between frames',
      'Adjacent joint-connected moving bodies and ground are excluded',
      '2D projected overlap may be harmless with proper axial stacking',
      'No 3D geometry, forces, manufacturing tolerances or collision proof']};
}
module.exports={segmentDistance,screenPlanarInterference};
