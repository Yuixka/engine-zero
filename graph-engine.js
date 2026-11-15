/* ENGINE ZERO v0.2 — graph-based planar mechanism engine.
 * Ideal kinematics only. Geometry and graph grammar are not evidence of invention novelty.
 * CommonJS + browser global. No dependencies.
 */
(function(root,factory){
  if(typeof module==='object' && module.exports)module.exports=factory();
  else root.EZGraph=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const TAU=Math.PI*2, EPS=1e-9;
const v=(x,y)=>[x,y], add=(a,b)=>[a[0]+b[0],a[1]+b[1]], sub=(a,b)=>[a[0]-b[0],a[1]-b[1]], len=(a)=>Math.hypot(a[0],a[1]);
const rot=(p,t)=>[p[0]*Math.cos(t)-p[1]*Math.sin(t),p[0]*Math.sin(t)+p[1]*Math.cos(t)];
const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
const wrap=(t)=>Math.atan2(Math.sin(t),Math.cos(t));
const bodyPose=(poses,id)=>id==='g'?[0,0,0]:poses[id];
const world=(poses,id,pt)=>{const [x,y,t]=bodyPose(poses,id);return add([x,y],rot(pt,t));};
const arm=(poses,id,p)=>rot([-p[1],p[0]],bodyPose(poses,id)[2]);
function rng(seed){let n=seed>>>0;return ()=>{n+=0x6D2B79F5;let t=n;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
function choose(rand,items){return items[Math.floor(rand()*items.length)];}
function clone(x){return JSON.parse(JSON.stringify(x));}
function validate(g){
  if(!g||!Array.isArray(g.bodies)||!Array.isArray(g.joints)||!g.driver||!g.output)throw Error('Invalid graph structure');
  const ids=g.bodies.map(b=>b.id),known=new Set(ids);
  if(new Set(ids).size!==ids.length||!known.has('g'))throw Error('Bodies must have unique IDs and ground body g');
  if(!known.has(g.driver.body)||g.driver.body==='g'||!known.has(g.output.body))throw Error('Unknown driver/output body');
  for(const j of g.joints){if(!known.has(j.a)||!known.has(j.b)||j.a===j.b||!['R','P'].includes(j.type))throw Error('Invalid joint '+j.id);
    if(!Array.isArray(j.pa)||!Array.isArray(j.pb)||![...j.pa,...j.pb].every(Number.isFinite))throw Error('Invalid joint anchors');}
  const mobility=3*(ids.length-1)-2*g.joints.length-1;
  if(mobility!==0)throw Error('Generic one-driver mobility count is '+mobility+' instead of 0');
  return true;
}
function equationSystem(g,poses,inputAngle,derivatives){
  const vars=g.bodies.filter(b=>b.id!=='g').map(b=>b.id);
  const cols=vars.length*3,index={}; vars.forEach((id,k)=>index[id]=3*k);
  const residual=[], jac=[];
  const row=(r,parts)=>{residual.push(r);if(derivatives){const out=Array(cols).fill(0);for(const [id,dx,dy,dt] of parts){if(id!=='g'){const k=index[id];out[k]+=dx;out[k+1]+=dy;out[k+2]+=dt;}}jac.push(out);}};
  for(const j of g.joints){
    const pa=world(poses,j.a,j.pa),pb=world(poses,j.b,j.pb),da=arm(poses,j.a,j.pa),db=arm(poses,j.b,j.pb);
    if(j.type==='R'){
      row(pa[0]-pb[0],[[j.a,1,0,da[0]],[j.b,-1,0,-db[0]]]);
      row(pa[1]-pb[1],[[j.a,0,1,da[1]],[j.b,0,-1,-db[1]]]);
    }else{
      const ta=bodyPose(poses,j.a)[2],tb=bodyPose(poses,j.b)[2];
      const axis=rot([1,0],ta+(j.axisA||0)),daxis=[-axis[1],axis[0]],delta=sub(pb,pa);
      const dpa=cross(daxis,delta)-cross(axis,da),dpb=cross(axis,db);
      row(cross(axis,delta),[[j.a,axis[1],-axis[0],dpa],[j.b,-axis[1],axis[0],dpb]]);
      const factor=40;
      row(factor*wrap(tb+(j.axisB||0)-ta-(j.axisA||0)),[[j.a,0,0,-factor],[j.b,0,0,factor]]);
    }
  }
  const factor=40;
  row(factor*wrap(bodyPose(poses,g.driver.body)[2]-inputAngle*(g.driver.speed??1)-g.driver.offset),[[g.driver.body,0,0,factor]]);
  return {residual,jac,cols,vars};
}
function maxAbs(ar){return ar.reduce((m,x)=>Math.max(m,Math.abs(x)),0);}
function solveLinear(A,b){
  const n=b.length,M=A.map((r,i)=>[...r,b[i]]);
  for(let k=0;k<n;k++){
    let pivot=k;for(let i=k+1;i<n;i++)if(Math.abs(M[i][k])>Math.abs(M[pivot][k]))pivot=i;
    if(Math.abs(M[pivot][k])<1e-12)return null;
    [M[pivot],M[k]]=[M[k],M[pivot]];
    for(let i=k+1;i<n;i++){
      const s=M[i][k]/M[k][k];M[i][k]=0;
      for(let j=k+1;j<=n;j++)M[i][j]-=s*M[k][j];
    }
  }
  const x=Array(n).fill(0);
  for(let i=n-1;i>=0;i--){let sum=M[i][n];for(let j=i+1;j<n;j++)sum-=M[i][j]*x[j];x[i]=sum/M[i][i];}
  return x;
}
function dampedLeastSquares(jac,residual,lambda){
  const n=jac[0].length,A=Array.from({length:n},()=>Array(n).fill(0)),b=Array(n).fill(0);
  for(let r=0;r<jac.length;r++){
    for(let i=0;i<n;i++){
      b[i]-=jac[r][i]*residual[r];
      for(let j=0;j<=i;j++)A[i][j]+=jac[r][i]*jac[r][j];
    }
  }
  for(let i=0;i<n;i++){for(let j=0;j<i;j++)A[j][i]=A[i][j];A[i][i]+=lambda;}
  return solveLinear(A,b);
}
function clonePoses(poses){const out={};for(const [id,p] of Object.entries(poses))out[id]=p.slice();return out;}
function solve(g,angle,initial,opts={}){
  const tol=opts.tolerance??1e-5,maxIter=opts.maxIter??18;
  let poses=clonePoses(initial||{});
  for(const b of g.bodies)if(b.id!=='g'&&!poses[b.id])return {ok:false,error:'Missing initial body pose: '+b.id};
  let best=Infinity,iteration=0;
  for(;iteration<=maxIter;iteration++){
    const sys=equationSystem(g,poses,angle,true),r=sys.residual;
    const error=maxAbs(r);
    if(!Number.isFinite(error))return {ok:false,error:'Non-finite residual'};
    best=error;
    if(error<tol)return {ok:true,poses,maxResidual:error,iterations:iteration};
    if(iteration===maxIter)break;
    let stepped=false;
    for(const lambda of [1e-7,1e-4,1e-2,0.1,1]){
      const delta=dampedLeastSquares(sys.jac,r,lambda);
      if(!delta||!delta.every(Number.isFinite))continue;
      const currentSse=r.reduce((s,q)=>s+q*q,0);
      for(const alpha of [1,0.5,0.25,0.125,0.0625]){
        const guess=clonePoses(poses);
        for(let i=0;i<sys.vars.length;i++){
          const p=guess[sys.vars[i]],k=i*3;
          p[0]+=alpha*delta[k];p[1]+=alpha*delta[k+1];p[2]+=alpha*delta[k+2];
        }
        const rr=equationSystem(g,guess,angle,false).residual;
        if(rr.reduce((s,q)=>s+q*q,0)<currentSse*(1-1e-9)){
          poses=guess;stepped=true;break;
        }
      }
      if(stepped)break;
    }
    if(!stepped)break;
  }
  return {ok:false,poses,maxResidual:best,error:'Solver failed to close constraints ('+best.toFixed(3)+' mm-equivalent)'};
}
function intersection(A,r1,B,r2,branch=1){
  const d=len(sub(B,A));if(d<EPS||d>r1+r2-EPS||d<Math.abs(r1-r2)+EPS)return null;
  const along=(r1*r1-r2*r2+d*d)/(2*d),h2=r1*r1-along*along;
  if(h2<0)return null;
  const u=[(B[0]-A[0])/d,(B[1]-A[1])/d],h=Math.sqrt(h2);
  return add(add(A,[along*u[0],along*u[1]]),[branch*(-u[1])*h,branch*u[0]*h]);
}
function fromLegacyFourbar(vec){
  const [d,a,b,c,p,q,rotation,phase]=vec;
  const graph={version:'0.2',family:'4R',label:'Four-bar graph',bodies:[{id:'g',length:d},{id:'input',length:a},{id:'coupler',length:b},{id:'rocker',length:c}],joints:[
    {id:'A',type:'R',a:'g',b:'input',pa:[0,0],pb:[0,0]},
    {id:'B',type:'R',a:'input',b:'coupler',pa:[a,0],pb:[0,0]},
    {id:'C',type:'R',a:'coupler',b:'rocker',pa:[b,0],pb:[c,0]},
    {id:'D',type:'R',a:'rocker',b:'g',pa:[0,0],pb:rot([d,0],rotation)}
  ],driver:{body:'input',offset:phase+rotation},output:{body:'coupler',point:[p,q]},meta:{base:'4R',parameters:vec.slice()},dyads:[]};
  graph.joints[0].pa=[0,0];
  graph.initial=(angle)=>{
    const phi=angle+phase;
    const B=[a*Math.cos(phi),a*Math.sin(phi)],D=[d,0];
    const C=intersection(B,b,D,c,1);if(!C)return null;
    const coords={input:[0,0,phi],coupler:[B[0],B[1],Math.atan2(C[1]-B[1],C[0]-B[0])],rocker:[d,0,Math.atan2(C[1],C[0]-d)]};
    for(const pose of Object.values(coords)){const xy=rot(pose.slice(0,2),rotation);pose[0]=xy[0];pose[1]=xy[1];pose[2]+=rotation;}
    return coords;
  };
  return graph;
}
function sliderCrank(params){
  const {crank:a,rod:l,offset:h,point:p,normal:q,rotation:r,phase:ph}=params;
  if(l<=a+Math.abs(h)+4)throw Error('Slider rod must exceed crank + offset + margin');
  const graph={version:'0.2',family:'3R1P',label:'Slider-crank graph',bodies:[{id:'g',length:150},{id:'input',length:a},{id:'rod',length:l},{id:'slider',length:8}],joints:[
    {id:'A',type:'R',a:'g',b:'input',pa:rot([0,h],r),pb:[0,0]},
    {id:'B',type:'R',a:'input',b:'rod',pa:[a,0],pb:[0,0]},
    {id:'C',type:'R',a:'rod',b:'slider',pa:[l,0],pb:[0,0]},
    {id:'rail',type:'P',a:'g',b:'slider',pa:[0,0],pb:[0,0],axisA:r,axisB:0}
  ],driver:{body:'input',offset:r+ph},output:{body:'rod',point:[p,q]},meta:{base:'3R1P',parameters:params},dyads:[]};
  graph.initial=(angle)=>{
    const t=angle+ph,B=[a*Math.cos(t),h+a*Math.sin(t)],Cx=B[0]+Math.sqrt(l*l-B[1]*B[1]),C=[Cx,0];
    const poses={input:[0,h,t],rod:[B[0],B[1],Math.atan2(-B[1],Cx-B[0])],slider:[Cx,0,0]};
    for(const pose of Object.values(poses)){const xy=rot(pose.slice(0,2),r);pose[0]=xy[0];pose[1]=xy[1];pose[2]+=r;}
    return poses;
  };
  return graph;
}
function randomSlider(rand){const a=20+rand()*46,h=(rand()-.5)*30,l=a+Math.abs(h)+30+rand()*90;
  return sliderCrank({crank:a,rod:l,offset:h,point:(rand()*.8+.1)*l,normal:(rand()-.5)*100,rotation:(rand()-.5)*TAU,phase:rand()*TAU});}
function randomFourbar(rand,legacy){
  for(let i=0;i<400;i++){
    const d=70+rand()*110,a=16+rand()*45,b=55+rand()*125,c=45+rand()*115;
    const vals=[d,a,b,c,(rand()-.15)*b,(rand()-.5)*120,(rand()-.5)*TAU,rand()*TAU];
    if(legacy.geometryValid(vals))return fromLegacyFourbar(vals);
  }
  throw Error('Failed to find valid four-bar');
}
function motion(g,steps=48,options={}){
  validate(g);
  const points=[],frames=[];
  let old=g.initial?g.initial(0):g.seedPoses;
  if(!old)return {ok:false,reason:'Graph lacks seed poses'};
  let worst=0,totalIterations=0,largestPassiveAngularStep=0;
  for(let k=0;k<steps;k++){
    const theta=TAU*k/steps;
    // Continue from the prior solution, rather than invoking a family-specific trajectory formula.
    let sol=solve(g,theta,old,options);
    if(!sol.ok){
      // Single recovery attempt from the analytic initial assembly, when available.
      const fresh=g.initial?g.initial(theta):null;
      if(fresh)sol=solve(g,theta,fresh,options);
    }
    if(!sol.ok)return {ok:false,reason:`Frame ${k}: ${sol.error}`,frame:k};
    if(k>0){
      for(const body of g.bodies){if(body.id==='g'||body.id===g.driver.body)continue;
        const change=Math.abs(wrap(sol.poses[body.id][2]-old[body.id][2]));
        largestPassiveAngularStep=Math.max(largestPassiveAngularStep,change);
        if(change>1.7)return {ok:false,reason:`Assembly branch discontinuity at frame ${k} on ${body.id}`,frame:k};
      }
    }
    totalIterations+=sol.iterations;worst=Math.max(worst,sol.maxResidual);
    const end=world(sol.poses,g.output.body,g.output.point);
    points.push({x:end[0],y:end[1]});frames.push(sol.poses);
    old=sol.poses;
  }
  // Extra closure test, including the final interval back to the first configuration.
  const endSolution=solve(g,TAU,old,options);
  if(!endSolution.ok)return {ok:false,reason:'Cycle closure solve failed'};
  const out0=points[0],out1=world(endSolution.poses,g.output.body,g.output.point);
  const closeErr=len(sub([out0.x,out0.y],out1));
  if(closeErr>0.5)return {ok:false,reason:'Cycle did not return to original assembly (jump '+closeErr.toFixed(2)+' mm)'};
  return {ok:true,points,frames,worstResidual:worst,cycleError:closeErr,iterations:totalIterations,largestPassiveAngularStep};
}
function score(g,trace,target){
  if(!trace.ok)return {score:Infinity,rms:Infinity};
  const m=(a)=>a.reduce((s,p)=>[s[0]+p.x/a.length,s[1]+p.y/a.length],[0,0]);
  const a=m(trace.points),b=m(target),offset={x:b[0]-a[0],y:b[1]-a[1]};
  const aligned=trace.points.map(p=>({x:p.x+offset.x,y:p.y+offset.y}));
  const rms=Math.sqrt(aligned.reduce((s,p,i)=>s+(p.x-target[i].x)**2+(p.y-target[i].y)**2,0)/target.length);
  const moving=g.bodies.length-1;
  const complexityPenalty=Math.max(0,moving-3)*0.4;
  return {score:rms+complexityPenalty,rms,complexityPenalty,offset,aligned};
}
function attachDyad(base,rand,options={}){
  const g=clone(base);g.dyads=clone(base.dyads||[]);
  const ids=g.bodies.map(b=>b.id),choices=ids.filter(x=>x!=='g');
  let idA=options.a||choose(rand,ids),idB=options.b||choose(rand,ids);
  if(idA===idB)idB=choose(rand,ids.filter(x=>x!==idA));
  const anchor=(id)=>{const b=g.bodies.find(q=>q.id===id);if(id==='g')return [(rand()-.15)*(b.length||100),(rand()-.5)*36];
    return [(rand()*.95+.025)*(b.length||20),(rand()-.5)*20];};
  const pA=anchor(idA),pB=anchor(idB);
  const oldMotion=motion(base,20);
  if(!oldMotion.ok)return null;
  let minDist=Infinity,maxDist=0;
  for(const poses of oldMotion.frames){const d=len(sub(world(poses,idA,pA),world(poses,idB,pB)));minDist=Math.min(minDist,d);maxDist=Math.max(maxDist,d);}
  if(minDist<8||maxDist>400)return null;
  const middle=Math.max(22,maxDist*.66+16),skew=Math.min(minDist*.17,7)*(rand()-.5);
  const l1=middle+skew,l2=middle-skew;
  const k=g.dyads.length+1,uid='dyad'+k+'a',vid='dyad'+k+'b';
  g.bodies.push({id:uid,length:l1},{id:vid,length:l2});
  g.joints.push({id:'dyad'+k+'pinA',type:'R',a:idA,b:uid,pa:pA,pb:[0,0]},
    {id:'dyad'+k+'knuckle',type:'R',a:uid,b:vid,pa:[l1,0],pb:[l2,0]},
    {id:'dyad'+k+'pinB',type:'R',a:vid,b:idB,pa:[0,0],pb:pB});
  const descriptor={idA,idB,pA,pB,l1,l2,uid,vid,branch:rand()>.5?1:-1};
  g.dyads.push(descriptor);
  // End effector shifts onto a newly created body, rather than merely adding a cosmetic link.
  const selected=rand()>.4?uid:vid,chosenL=selected===uid?l1:l2;
  g.output={body:selected,point:[(.2+.65*rand())*chosenL,(rand()-.5)*100]};
  g.family=(g.dyads.length===1?'6-body':'8-body')+(base.family==='3R1P'?'+P':'');
  g.label=g.dyads.length+' generated dyad'+(g.dyads.length===1?'':'s')+' on '+base.meta.base;
  // Recreate seed poses from recursively appended dyad geometry. A generic solver verifies all joints.
  const priorInitial=base.initial;
  g.initial=(angle)=>{
    const poses=priorInitial?priorInitial(angle):clonePoses(base.seedPoses||{});
    if(!poses)return null;
    for(const d of g.dyads){
      const A=world(poses,d.idA,d.pA),B=world(poses,d.idB,d.pB),X=intersection(A,d.l1,B,d.l2,d.branch);
      if(!X)return null;
      const a=Math.atan2(X[1]-A[1],X[0]-A[0]),b=Math.atan2(X[1]-B[1],X[0]-B[0]);
      poses[d.uid]=[A[0],A[1],a];poses[d.vid]=[B[0],B[1],b];
    }
    return poses;
  };
  try{validate(g);const trial=motion(g,20);if(!trial.ok)return null;}catch(e){return null;}
  return g;
}
function stripGraph(g){const copy=clone(g);delete copy.initial;return copy;}
function restoreGraph(g){
  // Restores seed functions for exported grammar-generated graphs.
  if(g.meta.base==='4R'){
    let fresh=fromLegacyFourbar(g.meta.parameters);
    if(!g.dyads||!g.dyads.length){fresh.output=g.output;return fresh;}
    const descs=g.dyads.slice();
    for(const d of descs){
      const g0=fresh,newG=clone(g0);newG.bodies.push({id:d.uid,length:d.l1},{id:d.vid,length:d.l2});
      newG.joints.push({id:d.uid+'a',type:'R',a:d.idA,b:d.uid,pa:d.pA,pb:[0,0]},
        {id:d.uid+'x',type:'R',a:d.uid,b:d.vid,pa:[d.l1,0],pb:[d.l2,0]},
        {id:d.uid+'b',type:'R',a:d.vid,b:d.idB,pa:[0,0],pb:d.pB});
      newG.dyads=[...(fresh.dyads||[]),d];
      const priorInitial=g0.initial;
      newG.initial=(angle)=>{const poses=priorInitial(angle);if(!poses)return null;const A=world(poses,d.idA,d.pA),B=world(poses,d.idB,d.pB),X=intersection(A,d.l1,B,d.l2,d.branch);if(!X)return null;
        poses[d.uid]=[...A,Math.atan2(X[1]-A[1],X[0]-A[0])];poses[d.vid]=[...B,Math.atan2(X[1]-B[1],X[0]-B[0])];return poses;};
      fresh=newG;
    }
    fresh.output=g.output;fresh.label=g.label;fresh.family=g.family;return fresh;
  }
  if(g.meta.base==='3R1P'){
    let fresh=sliderCrank(g.meta.parameters);
    if(!g.dyads||!g.dyads.length){fresh.output=g.output;return fresh;}
    const descs=g.dyads.slice();
    for(const d of descs){const g0=fresh,newG=clone(g0);newG.bodies.push({id:d.uid,length:d.l1},{id:d.vid,length:d.l2});
      newG.joints.push({id:d.uid+'a',type:'R',a:d.idA,b:d.uid,pa:d.pA,pb:[0,0]},
        {id:d.uid+'x',type:'R',a:d.uid,b:d.vid,pa:[d.l1,0],pb:[d.l2,0]},
        {id:d.uid+'b',type:'R',a:d.vid,b:d.idB,pa:[0,0],pb:d.pB});newG.dyads=[...(fresh.dyads||[]),d];
      const priorInitial=g0.initial;
      newG.initial=(angle)=>{const poses=priorInitial(angle);if(!poses)return null;const A=world(poses,d.idA,d.pA),B=world(poses,d.idB,d.pB),X=intersection(A,d.l1,B,d.l2,d.branch);if(!X)return null;
        poses[d.uid]=[...A,Math.atan2(X[1]-A[1],X[0]-A[0])];poses[d.vid]=[...B,Math.atan2(X[1]-B[1],X[0]-B[0])];return poses;};fresh=newG;}
    fresh.output=g.output;fresh.label=g.label;fresh.family=g.family;return fresh;
  }
  return {...g,seedPoses:g.seedPoses};
}
function candidateFactory(rand,legacy,depth=1,elite=null){
  let base;
  if(elite&&rand()<.18){base=restoreGraph(stripGraph(elite));return base;}
  if(rand()<.58)base=randomFourbar(rand,legacy);else base=randomSlider(rand);
  const additions=Math.floor(rand()*(Math.min(2,depth)+1));
  for(let i=0;i<additions;i++){
    const next=attachDyad(base,rand);
    if(!next)break;
    base=next;
  }
  return base;
}
return {TAU,rot,add,sub,len,cross,world,bodyPose,clone,rng,validate,equationSystem,solve,intersection,fromLegacyFourbar,sliderCrank,randomSlider,randomFourbar,motion,score,attachDyad,stripGraph,restoreGraph,candidateFactory};
});
