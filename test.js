'use strict';
const assert=require('node:assert/strict');
const K=require('./legacy-fourbar.js');
const G=require('./graph-engine.js');
const v=[100,25,95,75,55,30,0,0],target=K.targetPath({mode:'step',stroke:120,lift:38,n:36});
function check(g,steps=36){
  G.validate(g);const t=G.motion(g,steps);assert(t.ok,g.family+' failed: '+t.reason);
  assert(t.worstResidual<1e-4,'bad constraint: '+t.worstResidual);
  assert(t.cycleError<.1,'bad cycle: '+t.cycleError);
  const s=G.score(g,t,target);assert(Number.isFinite(s.rms));return {t,s};
}
const four=G.fromLegacyFourbar(v),f=check(four);assert(f.t.points.length===36);
const old=K.trace(v,36);assert(old);
for(let i=0;i<36;i++)assert(G.len(G.sub([f.t.points[i].x,f.t.points[i].y],[old.points[i].x,old.points[i].y]))<1e-6,'four-bar legacy mismatch frame '+i);
const slider=G.sliderCrank({crank:25,rod:95,offset:4,point:65,normal:25,rotation:.22,phase:.55});check(slider);
for(const graph of [four,slider]){
  const theta=.37,sol=G.solve(graph,theta,graph.initial(theta));assert(sol.ok);
  const sys=G.equationSystem(graph,sol.poses,theta,true),epsilon=1e-6;
  for(let col=0;col<sys.cols;col++){
    const copy=G.clone(sol.poses),body=sys.vars[Math.floor(col/3)];copy[body][col%3]+=epsilon;
    const perturbed=G.equationSystem(graph,copy,theta,false).residual;
    for(let row=0;row<sys.residual.length;row++){
      const derivative=(perturbed[row]-sys.residual[row])/epsilon;
      assert(Math.abs(derivative-sys.jac[row][col])<5e-4,'Jacobian discrepancy '+graph.family+' row '+row+' col '+col);
    }
  }
}
const custom={family:'custom-1R',label:'Imported one-crank graph',bodies:[{id:'g',length:0},{id:'input',length:35}],
  joints:[{id:'pivot',type:'R',a:'g',b:'input',pa:[10,20],pb:[0,0]}],driver:{body:'input',offset:0},
  output:{body:'input',point:[35,0]},seedPoses:{input:[10,20,0]}};
const customMotion=G.motion(custom,36);assert(customMotion.ok,'custom graph must close');
for(const p of customMotion.points)assert(Math.abs(Math.hypot(p.x-10,p.y-20)-35)<1e-5);
const perturb=G.clone(four.initial(.36));perturb.coupler[0]+=4;perturb.coupler[1]-=7;perturb.rocker[2]+=.04;
const recovered=G.solve(four,.36,perturb);assert(recovered.ok&&recovered.iterations>0,'Newton recovery failed');
let rand=G.rng(716),six=null,eight=null;
for(let i=0;i<100&&!six;i++)six=G.attachDyad(four,rand);
assert(six,'six-bar grammar failed');const q=check(six);
for(let i=0;i<100&&!eight;i++)eight=G.attachDyad(six,rand);
assert(eight,'eight-bar grammar failed');const z=check(eight);
check(G.restoreGraph(G.stripGraph(six)));check(G.restoreGraph(G.stripGraph(eight)));
let tested=0,valid=0,features=new Set();
for(let i=0;i<30;i++){
  const g=G.candidateFactory(rand,K,2);tested++;const t=G.motion(g,24);if(t.ok)valid++;features.add(g.family);
}
assert(features.size>=3,'too few generated families');
console.log(JSON.stringify({status:'passed',fourbarRms:f.s.rms,slider:true,sixbarRms:q.s.rms,eightbarRms:z.s.rms,solverRecoveryIterations:recovered.iterations,customGraph:true,analyticJacobianVerified:true,grammarTested:tested,grammarCycleValid:valid,families:[...features]},null,2));
