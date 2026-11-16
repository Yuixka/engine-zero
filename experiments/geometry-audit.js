'use strict';
// Independent geometric audit: does not use solver residuals or Jacobian.
const TAU=2*Math.PI;
const wrap=x=>Math.atan2(Math.sin(x),Math.cos(x));
const rotate=([x,y],t)=>[x*Math.cos(t)-y*Math.sin(t),x*Math.sin(t)+y*Math.cos(t)];
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
function verifyFrame(graph,poses,inputAngle,{positionToleranceMm=0.01,angleToleranceRad=0.00025}={}){
  if(!graph||!poses||!Number.isFinite(inputAngle))throw new TypeError('Invalid audit inputs');
  const known=new Set(graph.bodies.map(b=>b.id));
  function pose(id){
    if(!known.has(id))throw new Error('Unknown body '+id);
    const p=id==='g'?[0,0,0]:poses[id];
    if(!Array.isArray(p)||p.length!==3||!p.every(Number.isFinite))throw new Error('Invalid pose '+id);
    return p;
  }
  function point(id,anchor){
    const p=pose(id),r=rotate(anchor,p[2]);
    return [p[0]+r[0],p[1]+r[1]];
  }
  let maxPositionMm=0,maxAngleRad=0,worstJoint=null;
  for(const j of graph.joints){
    const a=point(j.a,j.pa),b=point(j.b,j.pb);
    let positional,angular=0;
    if(j.type==='R')positional=distance(a,b);
    else if(j.type==='P'){
      const pa=pose(j.a),pb=pose(j.b);
      const axis=rotate([1,0],pa[2]+(j.axisA||0));
      positional=Math.abs(axis[0]*(b[1]-a[1])-axis[1]*(b[0]-a[0]));
      angular=Math.abs(wrap(pb[2]+(j.axisB||0)-pa[2]-(j.axisA||0)));
    }else throw new Error('Unknown joint type '+j.type);
    if(positional>maxPositionMm||angular>maxAngleRad)worstJoint=j.id;
    maxPositionMm=Math.max(maxPositionMm,positional);
    maxAngleRad=Math.max(maxAngleRad,angular);
  }
  const driver=pose(graph.driver.body);
  const driverErrorRad=Math.abs(wrap(driver[2]-inputAngle*(graph.driver.speed??1)-graph.driver.offset));
  maxAngleRad=Math.max(maxAngleRad,driverErrorRad);
  const valid=maxPositionMm<=positionToleranceMm&&maxAngleRad<=angleToleranceRad;
  return {valid,maxPositionMm,maxAngleRad,driverErrorRad,worstJoint};
}
function verifyMotion(graph,trace,{positionToleranceMm=0.01,angleToleranceRad=0.00025,cycleToleranceMm=0.5}={}){
  if(!trace?.ok||!Array.isArray(trace.frames)||trace.frames.length<2||trace.frames.length!==trace.points?.length)
    return {valid:false,reason:'No complete successful motion frames'};
  let maxPositionMm=0,maxAngleRad=0,maxOutputMismatchMm=0,worstFrame=null;
  for(let k=0;k<trace.frames.length;k++){
    const poses=trace.frames[k],theta=TAU*k/trace.frames.length;
    const result=verifyFrame(graph,poses,theta,{positionToleranceMm,angleToleranceRad});
    const p=poses[graph.output.body]|| (graph.output.body==='g'?[0,0,0]:null);
    if(!p)throw new Error('Output pose missing');
    const offset=rotate(graph.output.point,p[2]);
    const expected=[p[0]+offset[0],p[1]+offset[1]];
    const actual=trace.points[k];
    const mismatch=distance(expected,[actual.x,actual.y]);
    if(!result.valid||mismatch>positionToleranceMm)worstFrame=k;
    maxPositionMm=Math.max(maxPositionMm,result.maxPositionMm);
    maxAngleRad=Math.max(maxAngleRad,result.maxAngleRad);
    maxOutputMismatchMm=Math.max(maxOutputMismatchMm,mismatch);
  }
  const cycleErrorMm=trace.cycleError;
  const valid=maxPositionMm<=positionToleranceMm&&maxAngleRad<=angleToleranceRad&&
    maxOutputMismatchMm<=positionToleranceMm&&Number.isFinite(cycleErrorMm)&&cycleErrorMm<=cycleToleranceMm;
  return {valid,maxPositionMm,maxAngleRad,maxOutputMismatchMm,cycleErrorMm,worstFrame,
    thresholds:{positionToleranceMm,angleToleranceRad,cycleToleranceMm}};
}
module.exports={verifyFrame,verifyMotion};
