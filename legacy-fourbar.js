/* ENGINE ZERO / MOTION SYNTHESIS: deterministic planar linkage synthesis experiment.
 * No physics engine, no structural FEA, no patent novelty determination.
 * MIT License, experimental educational research software.
 */
(function(root, factory){
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.EngineZero = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function(){
  'use strict';
  const TAU = Math.PI * 2;
  const BOUNDS = [
    [75, 160],  // d: ground separation (mm)
    [15, 68],   // a: crank length
    [45, 180],  // b: coupler length
    [50, 170],  // c: rocker length
    [-35, 205], // p: coupler point along BC
    [-110, 110],// q: coupler point normal to BC
    [-Math.PI, Math.PI], // whole mechanism rotation
    [0, TAU]    // crank starting phase
  ];
  function random(seed){ let x = seed >>> 0; return function(){ x += 0x6D2B79F5; let t=x; t=Math.imul(t^(t>>>15), t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; }
  function meanPts(points){let x=0,y=0;for(const p of points){x+=p.x;y+=p.y;}return {x:x/points.length,y:y/points.length};}
  function standardOptions(opts={}) {return {mode:opts.mode||'step',stroke:Number(opts.stroke)||120,lift:Number(opts.lift)||38,n:opts.n||48};}
  function targetPath(options={}){
    const {mode,stroke,lift,n}=standardOptions(options), pts=[];
    for(let i=0;i<n;i++){
      const t=i/n, stance = mode==='quick'?0.62:0.50;
      let x,y;
      if(mode==='oval'){
        x=stroke/2*Math.cos(TAU*t); y=lift/2*Math.sin(TAU*t);
      } else if(t<stance){
        x=stroke/2-stroke*t/stance; y=0;
      } else {
        const u=(t-stance)/(1-stance);
        x=-stroke/2+stroke*u; y=lift*Math.sin(Math.PI*u);
      }
      pts.push({x,y});
    }
    return pts;
  }
  function geometryValid(v){
    if(!v || v.length!==8 || !v.every(Number.isFinite))return false;
    const [d,a,b,c]=v; if(a>=d || a>=b || a>=c) return false;
    const lengths=[d,a,b,c].sort((u,v)=>u-v);
    // Require useful Grashof margin to support a fully rotating input crank.
    return lengths[0]+lengths[3]+3<=lengths[1]+lengths[2] && d-a>Math.abs(b-c)+3 && b+c>d+a+3;
  }
  function pointAt(v,theta,branch=1){
    const [d,a,b,c,p,q,rot]=v;
    const Bx=a*Math.cos(theta),By=a*Math.sin(theta),Dx=d-Bx,Dy=-By;
    const e=Math.hypot(Dx,Dy);
    if(e<=1e-8 || e>b+c+1e-7 || e<Math.abs(b-c)-1e-7)return null;
    const along=(b*b-c*c+e*e)/(2*e);
    let h2=b*b-along*along;
    if(h2 < -1e-6)return null;
    h2=Math.max(0,h2);const h=Math.sqrt(h2);
    const ux=Dx/e,uy=Dy/e;
    const Cx=Bx+along*ux-branch*h*uy,Cy=By+along*uy+branch*h*ux;
    const vx=(Cx-Bx)/b,vy=(Cy-By)/b;
    const Px=Bx+p*vx-q*vy,Py=By+p*vy+q*vx;
    const cos=Math.cos(rot),sin=Math.sin(rot);
    function transform(x,y){return {x: x*cos-y*sin,y:x*sin+y*cos};}
    return {A:transform(0,0),B:transform(Bx,By),C:transform(Cx,Cy),D:transform(d,0),P:transform(Px,Py),height:h};
  }
  function trace(v, n=48){
    if(!geometryValid(v))return null;
    const points=[],states=[];let minHeight=Infinity;
    for(let i=0;i<n;i++){
      const at=pointAt(v,TAU*i/n+v[7]);
      if(!at)return null;
      points.push(at.P);states.push(at);
      minHeight=Math.min(minHeight,at.height);
    }
    return {points,states,minHeight};
  }
  function align(points,target){
    const m1=meanPts(points),m2=meanPts(target);
    const dx=m2.x-m1.x,dy=m2.y-m1.y;
    return {points:points.map(pt=>({x:pt.x+dx,y:pt.y+dy})),offset:{x:dx,y:dy}};
  }
  function rootMeanSquare(points,target){
    let ss=0;
    for(let i=0;i<points.length;i++){const dx=points[i].x-target[i].x,dy=points[i].y-target[i].y;ss+=dx*dx+dy*dy;}
    return Math.sqrt(ss/points.length);
  }
  function assess(v,target){
    const t=trace(v,target.length);
    if(!t)return {score:1e9,rms:1e9};
    const aligned=align(t.points,target);
    const rms=rootMeanSquare(aligned.points,target);
    // Discourage near-toggle geometry, not a rigorous dynamic load constraint.
    const penalty=Math.max(0,4-t.minHeight)*2;
    return {score:rms+penalty,rms,minHeight:t.minHeight,points:aligned.points,offset:aligned.offset,states:t.states};
  }
  function crankBaseline(target){
    const centered=meanPts(target),n=target.length;
    let best=null;
    for(const direction of [1,-1]){
      let cr=0,ci=0;
      for(let i=0;i<n;i++){
        const x=target[i].x-centered.x,y=target[i].y-centered.y;
        const theta=direction*TAU*i/n;
        cr+=(x*Math.cos(theta)+y*Math.sin(theta))/n;
        ci+=(y*Math.cos(theta)-x*Math.sin(theta))/n;
      }
      const pts=[];let sum=0;
      for(let i=0;i<n;i++){
        const theta=direction*TAU*i/n;
        const x=cr*Math.cos(theta)-ci*Math.sin(theta)+centered.x;
        const y=cr*Math.sin(theta)+ci*Math.cos(theta)+centered.y;
        pts.push({x,y});
        sum+=(x-target[i].x)**2+(y-target[i].y)**2;
      }
      const candidate={points:pts,rms:Math.sqrt(sum/n),radius:Math.hypot(cr,ci)};
      if(!best||candidate.rms<best.rms)best=candidate;
    }
    return best;
  }
  function drawRandom(rng){return BOUNDS.map(([lo,hi])=>lo+(hi-lo)*rng());}
  function normalize(v,i){
    const [lo,hi]=BOUNDS[i];
    if(i===6||i===7){const size=hi-lo;return lo+(((v-lo)%size)+size)%size;}
    return Math.min(hi,Math.max(lo,v));
  }
  function createSearch(target,options={}){
    const rng=random(options.seed===undefined?20261115:options.seed);
    const size=options.population||72;
    const pop=[];
    if (options.seedVector && geometryValid(options.seedVector)) {
      const v=options.seedVector.slice();pop.push({v,assessment:assess(v,target)});
    }
    for(let tries=0;pop.length<size&&tries<100000;tries++){
      const v=drawRandom(rng);
      if(geometryValid(v))pop.push({v,assessment:assess(v,target)});
    }
    if(pop.length<size)throw new Error('Could not initialize linkage candidate population.');
    pop.sort((a,b)=>a.assessment.score-b.assessment.score);
    let gen=0, evalCount=pop.length;
    return {
      get best(){return pop.reduce((a,b)=>a.assessment.score<=b.assessment.score?a:b);},
      get generation(){return gen;},get evaluations(){return evalCount;},
      advance(generations=1){
        for(let j=0;j<generations;j++){
          const F=0.45+rng()*0.35,CR=0.72;
          for(let i=0;i<pop.length;i++){
            let a,b,c;
            do{a=Math.floor(rng()*pop.length);}while(a===i);
            do{b=Math.floor(rng()*pop.length);}while(b===i||b===a);
            do{c=Math.floor(rng()*pop.length);}while(c===i||c===a||c===b);
            const donor=pop[a].v.map((z,k)=>{
              let delta=pop[b].v[k]-pop[c].v[k];
              if(k>=6){const range=BOUNDS[k][1]-BOUNDS[k][0];delta=((delta+range/2)%range+range)%range-range/2;}
              return normalize(z+F*delta,k);
            });
            const forced=Math.floor(rng()*8),trial=pop[i].v.map((z,k)=>(rng()<CR||k===forced)?donor[k]:z);
            if(!geometryValid(trial))continue;
            const assessment=assess(trial,target);evalCount++;
            if(assessment.score<pop[i].assessment.score)pop[i]={v:trial,assessment};
          }
          gen++;
        }
        return this.best;
      }
    };
  }
  function runSearch(target, options={}){
    const search=createSearch(target,options);
    search.advance(options.generations||200);
    return {vector:search.best.v,assessment:search.best.assessment,generations:search.generation,evaluations:search.evaluations};
  }
  return {TAU,BOUNDS,targetPath,geometryValid,pointAt,trace,align,assess,crankBaseline,createSearch,runSearch,random};
});
