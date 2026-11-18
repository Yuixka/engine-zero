'use strict';
/*
 * Third-engineer experiment: tolerance robustness of the existing four-bar incumbent.
 * This is a synthetic kinematic sensitivity screen, NOT manufacturing validation.
 * Run: node experiments/tolerance-screen.js
 */
const G = require('../graph-engine.js');
const K = require('../legacy-fourbar.js');
const BASE = Object.freeze([160,45.5716293901412,136.13500308297267,78.71305737718521,190.36349301013988,-9.201462355515059,-0.6737871086365779,0.35077083256358144]);
const TARGET = Object.freeze({mode:'step',stroke:120,lift:38,n:96});
function finiteNumber(n){return typeof n==='number'&&Number.isFinite(n);}
function percentile(sorted,p){if(!sorted.length)return null;return sorted[Math.ceil(p*sorted.length)-1];}
function screen({seed=716,samples=100,toleranceMm=0.25}={}){
  if(!Number.isSafeInteger(seed)||!Number.isSafeInteger(samples)||samples<1||samples>10000||!finiteNumber(toleranceMm)||toleranceMm<0||toleranceMm>10)
    throw new RangeError('Invalid seed, samples (1..10000), or toleranceMm (0..10)');
  const random=G.rng(seed),target=K.targetPath(TARGET);
  const rows=[],rms=[];
  function evaluate(vector,id){
    if(!K.geometryValid(vector))return {id,valid:false,reason:'invalid geometry'};
    let graph,trace;
    try{graph=G.fromLegacyFourbar(vector);trace=G.motion(graph,TARGET.n);}
    catch(e){return {id,valid:false,reason:'construction error: '+e.message};}
    if(!trace.ok)return {id,valid:false,reason:'solver failure: '+trace.reason};
    const score=G.score(graph,trace,target);
    if(!finiteNumber(score.rms))return {id,valid:false,reason:'nonfinite RMS'};
    return {id,valid:true,rms_mm:score.rms,closure_residual_mm:trace.worstResidual};
  }
  const nominal=evaluate(BASE.slice(),'nominal');
  for(let i=0;i<samples;i++){
    const vec=BASE.slice();
    // Independent uniform bounded deviations in the six length/point coordinates.
    // No angular perturbation, backlash, joint friction, loads, or correlations.
    for(let j=0;j<6;j++)vec[j]+=(2*random()-1)*toleranceMm;
    const row=evaluate(vec,i);
    rows.push(row);if(row.valid)rms.push(row.rms_mm);
  }
  rms.sort((a,b)=>a-b);
  const failures=rows.filter(x=>!x.valid);
  return {
    schema_version:1,experiment:'fourbar-bounded-dimensional-tolerance-screen',
    seed,samples,tolerance_mm:toleranceMm,nominal,
    outcomes:{valid:rows.length-failures.length,failed:failures.length,
      failure_rate:failures.length/samples,
      p50_rms_mm:percentile(rms,0.5),p95_rms_mm:percentile(rms,0.95),
      worst_rms_mm:rms.length?rms[rms.length-1]:null,
      failure_reasons:failures.reduce((acc,x)=>(acc[x.reason]=(acc[x.reason]||0)+1,acc),{})},
    protocol:{
      source:'discovery.js BEST_LEGACY incumbent',
      perturbation:'independent uniform +/- tolerance_mm applied to vector indices 0..5',
      target:TARGET,
      falsifiable_gate:'For a future candidate, at identical seed, sample count and tolerance, require >=95% valid traces and p95 RMS at least 10% below this incumbent, without worse nominal RMS.',
      limitations:['2D ideal kinematics only','uniform synthetic errors not measured fabrication distribution',
        'No joint clearance, loads, collision, material or stress physics',
        'This script measures only the incumbent; no novel mechanism is claimed']
    }
  };
}
if(require.main===module){
  const result=screen();
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
  if(!result.nominal.valid)process.exitCode=1;
}
module.exports={screen};
