'use strict';
/*
 * Reproducible cross-topology benchmark.
 * All paths are synthetic kinematics (mm). No hardware, dynamics, or novelty claim.
 * Design selection uses TRAINING trajectory only. All held-out trajectories are
 * evaluated only after a single champion for each discovered family is frozen.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const G = require('../graph-engine.js');
const K = require('../legacy-fourbar.js');
const D = require('../discovery.js');
const {verifyMotion}=require('./geometry-audit.js');

const TRAIN = Object.freeze({mode:'step',stroke:120,lift:38,n:36});
const HELD_OUT = Object.freeze([
  Object.freeze({id:'dense-same-objective',mode:'step',stroke:120,lift:38,n:96}),
  Object.freeze({id:'different-gait',mode:'quick',stroke:120,lift:38,n:96}),
  Object.freeze({id:'different-height-stroke',mode:'step',stroke:135,lift:46,n:96}),
  Object.freeze({id:'different-trajectory-family',mode:'oval',stroke:120,lift:38,n:96})
]);
const round = (v) => Number.isFinite(v) ? Number(v.toFixed(6)) : null;

/* Audit objective independence using the actual target geometry, not the labels.
 * Resampling an identical objective at higher n is a numerical convergence control.
 * Translation-invariant, phase-aligned RMS in millimetres; no phase reoptimization.
 */
function objectiveShapeDistance(a,b,n=192){
  if(!Number.isSafeInteger(n)||n<2||n>100000)throw new RangeError('Objective sample count must be an integer in 2..100000');
  const A=K.targetPath({...a,n}),B=K.targetPath({...b,n});
  if(A.length!==n||B.length!==n)throw Error('Unexpected target length');
  const coords=arr=>arr.map(p=>Array.isArray(p)?p:[p.x,p.y]);
  const x=coords(A),y=coords(B);
  if([...x,...y].some(p=>p.length!==2||!p.every(Number.isFinite)))throw Error('Invalid objective coordinates');
  const mean=z=>z.reduce((s,p)=>[s[0]+p[0]/n,s[1]+p[1]/n],[0,0]);
  const mx=mean(x),my=mean(y);
  return Math.sqrt(x.reduce((s,p,i)=>{
    const dx=(p[0]-mx[0])-(y[i][0]-my[0]);
    const dy=(p[1]-mx[1])-(y[i][1]-my[1]);
    return s+dx*dx+dy*dy;
  },0)/n);
}
function classifyTargets(train=TRAIN,targets=HELD_OUT,{toleranceMm=1e-7}={}){
  if(!Number.isFinite(toleranceMm)||toleranceMm<0)throw RangeError('Invalid independence tolerance');
  const earlier=[train],rows=[];
  for(const target of targets){
    const distances=earlier.map(spec=>objectiveShapeDistance(spec,target));
    const firstMatch=distances.findIndex(d=>d<=toleranceMm);
    const role=firstMatch===0?'training-resample-control':firstMatch>0?'duplicate-evaluation-control':'independent-objective';
    rows.push({id:target.id,role,shape_distance_from_training_mm:Number(distances[0].toFixed(9)),
      duplicate_of:firstMatch>=0?(firstMatch===0?'TRAIN':earlier[firstMatch].id):null});
    earlier.push(target);
  }
  return {rows,independent_objectives:rows.filter(x=>x.role==='independent-objective').length,
    controls:rows.filter(x=>x.role!=='independent-objective').length,
    definition:'phase-aligned, translation-invariant sampled shape RMS; independence is geometric distinction, not statistical independence'};
}

function evaluate(graph, targetSpec) {
  const trace = G.motion(graph, targetSpec.n);
  if (!trace.ok) return {valid:false,reason:trace.reason,rms_mm:null,score_mm:null};
  const audit=verifyMotion(graph,trace);
  if(!audit.valid)return {valid:false,reason:'Independent geometric audit failed',rms_mm:null,score_mm:null,audit};
  const fit = G.score(graph,trace,K.targetPath(targetSpec));
  return {valid:true,rms_mm:round(fit.rms),score_mm:round(fit.score),
    complexity_penalty_mm:round(fit.complexityPenalty),
    max_closure_residual_mm:round(trace.worstResidual),cycle_error_mm:round(trace.cycleError),independent_audit:audit};
}
function benchmark({seed=716,budget=120,depth=2}={}) {
  if(!Number.isSafeInteger(seed)||!Number.isSafeInteger(budget)||budget<0||budget>2000||!Number.isSafeInteger(depth)||depth<0||depth>2)
    throw new RangeError('Expected integer seed, budget 0..2000 and depth 0..2');
  const session = D.createSession(TRAIN,{seed,depth});
  if(budget)session.step(budget);
  const s=session.summary();
  const champions=s.champions.map(c=>({
    family:c.graph.family,
    bodies:c.graph.bodies.length,
    joints:c.graph.joints.length,
    design_source:c.origin,
    training:{rms_mm:round(c.fitness.rms),score_mm:round(c.fitness.score)},
    serialized_graph:G.stripGraph(c.graph)
  })).sort((a,b)=>a.family.localeCompare(b.family));
  const integrity=classifyTargets();
  const targetRows=HELD_OUT.map((spec,index)=>{
    const target=K.targetPath(spec),base=K.crankBaseline(target);
    return {id:spec.id,mode:spec.mode,stroke_mm:spec.stroke,lift_mm:spec.lift,samples:spec.n,
      objective_role:integrity.rows[index].role,shape_distance_from_training_mm:integrity.rows[index].shape_distance_from_training_mm,
      duplicate_of:integrity.rows[index].duplicate_of,
      best_fit_crank_baseline_rms_mm:round(base.rms),
      champions:champions.map(c=>{
        const graph=G.restoreGraph(c.serialized_graph);
        const e=evaluate(graph,spec);
        const difference=e.valid?round(e.rms_mm-base.rms):null;
        return {family:c.family,...e,rms_minus_crank_mm:difference};
      })};
  });
  return {schema_version:1,engine:'Engine Zero v0.2.1',kind:'synthetic-kinematic-held-out-benchmark',
    protocol:{seed,budget,depth,training_spec:TRAIN,selection:'one champion per family by training score only',
      evaluation:'held-out targets not used to select parameters; full-cycle motion rerun on 96 samples',
      limitations:['All objectives synthetic, not measured','Translation-only output alignment (phase and rotation are fixed)',
      'No component library, stress, torque, collision, fabrication, or novelty validation',
      'Original four-bar incumbent is hardcoded, not discovered in this run',
      'No claim of statistically representative generalization',
      'Independent joint/driver/output geometry audit uses sampled solver poses, not external ground truth']},
    objective_integrity:{independent_objectives:integrity.independent_objectives,controls:integrity.controls,definition:integrity.definition},
    discovery:{attempts:s.attempts,valid:s.feasible,failed:s.failed,distinct_family_champions:champions.length,
      distinct_labeled_wiring_patterns:s.uniqueWiringPatterns,
      training_best_family:s.best?.graph.family??null,training_best_rms_mm:round(s.best?.fitness.rms)},
    training_champions:champions.map(({serialized_graph,...rest})=>rest),
    held_out:targetRows};
}
function parseArgs(argv) {
  const opts={};
  for(const arg of argv){
    const m=arg.match(/^--(seed|budget|depth|output)=(.+)$/);
    if(!m)throw Error('Unknown argument '+arg);
    opts[m[1]]=m[1]==='output'?m[2]:Number(m[2]);
  }
  return opts;
}
if(require.main===module){
  const options=parseArgs(process.argv.slice(2));const result=benchmark(options);
  const serialized=JSON.stringify(result,null,2)+'\n';
  if(options.output){const outfile=path.resolve(options.output);fs.mkdirSync(path.dirname(outfile),{recursive:true});fs.writeFileSync(outfile,serialized);}
  else process.stdout.write(serialized);
}
module.exports={benchmark,evaluate,TRAIN,HELD_OUT,objectiveShapeDistance,classifyTargets};
