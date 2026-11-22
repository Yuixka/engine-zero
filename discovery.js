/* Mechanism graph mutation + objective search; experimental, kinematics only. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./graph-engine.js'),require('./legacy-fourbar.js'));
  else root.EZDiscovery=factory(root.EZGraph,root.EngineZero);
})(typeof globalThis!=='undefined'?globalThis:this,function(G,K){
'use strict';
const BEST_LEGACY=[160,45.5716293901412,136.13500308297267,78.71305737718521,190.36349301013988,-9.201462355515059,-0.6737871086365779,0.35077083256358144];
function mutate(g,rand,depth){
  const count=(g.dyads||[]).length;
  if(count<depth&&rand()<.18){const candidate=G.attachDyad(g,rand);if(candidate)return candidate;}
  if(count>0&&rand()<.17){
    const plain=G.stripGraph(g);plain.dyads.pop();plain.output=count===1?{body:plain.meta.base==='4R'?'coupler':'rod',point:plain.meta.base==='4R'?[plain.meta.parameters[4],plain.meta.parameters[5]]:[plain.meta.parameters.point,plain.meta.parameters.normal]}:{body:plain.dyads[count-2].uid,point:[plain.dyads[count-2].l1*.6,18]};
    try{return G.restoreGraph(plain);}catch(e){return null;}
  }
  if(count>0&&rand()<.22){
    const plain=G.stripGraph(g),removed=plain.dyads.pop();
    plain.output=count===1?{body:plain.meta.base==='4R'?'coupler':'rod',point:[55,20]}:{body:plain.dyads[count-2].uid,point:[plain.dyads[count-2].l1*.6,18]};
    try{
      const parent=G.restoreGraph(plain);
      const newG=G.attachDyad(parent,rand);if(newG)return newG;
    }catch(e){}
  }
  const plain=G.stripGraph(g),size=rand()<.16?1.6:.55;
  if(count>0&&rand()<.35){
    const d=plain.dyads[count-1];
    const property=rand()<.5?'pA':'pB',k=Math.floor(rand()*2);
    d[property][k]+=(rand()-.5)*22*size;
    if(rand()<.6){d.l1=Math.max(12,d.l1+(rand()-.5)*18*size);d.l2=Math.max(12,d.l2+(rand()-.5)*18*size);}
  } else if(rand()<.55){
    const p=plain.meta.parameters;
    if(plain.meta.base==='4R'){
      const k=Math.floor(rand()*8),steps=[12,7,12,12,18,16,.23,.28];
      p[k]+=(rand()-.5)*2*steps[k]*size;
      if(!K.geometryValid(p))return null;
      if(count===0&&k===4)plain.output.point[0]=p[4];
      if(count===0&&k===5)plain.output.point[1]=p[5];
    }else{
      const keys=['crank','rod','offset','point','normal','rotation','phase'];const k=keys[Math.floor(rand()*keys.length)],step={crank:9,rod:12,offset:7,point:15,normal:18,rotation:.20,phase:.22}[k];
      p[k]+=(rand()-.5)*2*step*size;
      if(p.crank<8||p.rod<=p.crank+Math.abs(p.offset)+5)return null;
      if(count===0&&k==='point')plain.output.point[0]=p.point;
      if(count===0&&k==='normal')plain.output.point[1]=p.normal;
    }
  }else{
    const k=Math.floor(rand()*2);plain.output.point[k]+=(rand()-.5)*28*size;
    if(count>0&&rand()<.09){
      const d=plain.dyads[count-1];plain.output.body=plain.output.body===d.uid?d.vid:d.uid;
    }
  }
  try{return G.restoreGraph(plain);}catch(e){return null;}
}
function createSession(brief={},opts={}){
  const target=K.targetPath({mode:brief.mode||'step',stroke:brief.stroke||120,lift:brief.lift||38,n:brief.n||36});
  const rand=G.rng(opts.seed??20261115),depth=opts.depth??2;
  const archive=[],champions=new Map(),recent=[],wiringSignatures=new Set();
  let count=0,failed=0,best=null,imported=0;
  const baseline=K.crankBaseline(target);
  function evaluate(g,origin='generated',ancestry='generated-root'){
    if(!['generated-root','incumbent-derived','imported-derived'].includes(ancestry))throw Error('Invalid candidate ancestry');
    count++;
    const trace=G.motion(g,target.length);
    if(!trace.ok){failed++;return {ok:false,reason:trace.reason};}
    const fitness=G.score(g,trace,target);
    wiringSignatures.add(g.joints.map(j=>[j.a,j.b].sort().join(':')+':'+j.type).sort().join('|'));
    const candidate={graph:g,trace,fitness,origin,ancestry,attempt:count};
    recent.unshift({family:g.family,rms:fitness.rms,score:fitness.score,attempt:count});if(recent.length>40)recent.pop();
    const former=champions.get(g.family);
    if(!former||candidate.fitness.score<former.fitness.score)champions.set(g.family,candidate);
    archive.push(candidate);archive.sort((a,b)=>a.fitness.score-b.fitness.score);
    if(archive.length>18)archive.length=18;
    if(!best||candidate.fitness.score<best.fitness.score)best=candidate;
    return {ok:true,candidate};
  }
  // This prior numerical result is an incumbent, not a novel or withheld design.
  evaluate(G.fromLegacyFourbar(BEST_LEGACY),'prior four-bar incumbent','incumbent-derived');
  function step(batch=10){
    for(let i=0;i<batch;i++){
      let g=null,ancestry='generated-root';
      if(rand()<.29||!archive.length)g=G.candidateFactory(rand,K,depth);
      else{
        let parent;
        if(champions.size>1&&rand()<.52)parent=[...champions.values()][Math.floor(rand()*champions.size)];
        else parent=archive[Math.floor(Math.pow(rand(),1.5)*archive.length)];
        g=mutate(parent.graph,rand,depth);
        ancestry=parent.ancestry;
      }
      if(g)evaluate(g,'generated',ancestry);
      else{count++;failed++;}
    }
    return summary();
  }
  function addGraph(graph){
    const g=G.restoreGraph(graph);const result=evaluate(g,'imported design','imported-derived');if(result.ok)imported++;
    return result;
  }
  function summary(){return {attempts:count,feasible:count-failed,failed,best,baseline,champions:[...champions.values()].sort((a,b)=>a.fitness.score-b.fitness.score),recent,repertoire:champions.size,uniqueWiringPatterns:wiringSignatures.size,imported};}
  return {target,step,addGraph,summary,brief,seed:opts.seed??20261115,depth};
}
return {BEST_LEGACY,mutate,createSession};
});
