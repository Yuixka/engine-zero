'use strict';
// Research-only gate: kinematic viability + explicit nominal pin/bore interfaces.
// No material, load, 3D, tolerance or collision proof.
const G=require('../graph-engine.js');
const K=require('../legacy-fourbar.js');
const D=require('../discovery.js');
const {auditRevoluteInterfaces}=require('../components/interfaces.js');
function assess(graph,{samples=36,pinDiameterMm=3.8,groundBoreDiameterMm=4,
  componentOptions={holeDiameterMm:4},minRadialClearanceMm=0.05,maxRadialClearanceMm=0.15}={}){
  if(!Number.isSafeInteger(samples)||samples<8||samples>720)throw RangeError('Invalid samples');
  const joints=graph?.joints;
  if(!Array.isArray(joints))throw TypeError('Graph joints required');
  const pins=Object.fromEntries(joints.filter(j=>j.type==='R').map(j=>[j.id,pinDiameterMm]));
  const groundBores=Object.fromEntries(joints.filter(j=>j.type==='R'&&(j.a==='g'||j.b==='g')).map(j=>[j.id,groundBoreDiameterMm]));
  let motion;
  try{motion=G.motion(graph,samples);}catch(e){return {accepted:false,kinematic:false,nominalInterface:false,reason:'invalid graph: '+e.message};}
  if(!motion.ok)return {accepted:false,kinematic:false,nominalInterface:null,reason:motion.reason};
  try{
    const fit=auditRevoluteInterfaces(graph,{componentOptions,pins,groundBores,minRadialClearanceMm,maxRadialClearanceMm});
    return {accepted:fit.nominalCompatible,kinematic:true,nominalInterface:fit.nominalCompatible,
      reason:fit.nominalCompatible?null:fit.errors.map(e=>e.reason).join('; '),jointCount:joints.length};
  }catch(e){return {accepted:false,kinematic:true,nominalInterface:false,reason:'unsupported component: '+e.message};}
}
function experiment({seed=716,attempts=24,depth=2,samples=36,options={}}={}){
  if(!Number.isSafeInteger(seed)||seed<0||!Number.isSafeInteger(attempts)||attempts<1||attempts>200||
     !Number.isSafeInteger(depth)||depth<0||depth>2)throw RangeError('Invalid experiment configuration');
  const random=G.rng(seed),rows=[];
  for(let i=0;i<attempts;i++){
    let graph;
    try{graph=G.candidateFactory(random,K,depth);}catch(e){
      rows.push({attempt:i+1,family:null,accepted:false,kinematic:false,nominalInterface:null,reason:'generation failed: '+e.message});continue;
    }
    rows.push({attempt:i+1,family:graph.family,...assess(graph,{samples,...options})});
  }
  const count=(fn)=>rows.filter(fn).length;
  return {schema:'engine-zero/generated-interface-yield-0.1',
    protocol:{seed,attempts,depth,samples,pinDiameterMm:options.pinDiameterMm??3.8,
      groundBoreDiameterMm:options.groundBoreDiameterMm??4,
      assumptions:['Nominal 4 mm moving bores unless explicitly overridden','Synthetic 4 mm ground bores assumed for screening, not a designed fixture',
        'One fixed pin size across R joints','No forces, real manufacturing tolerances, collision, 3D stacking or material proof']},
    totals:{attempts,kinematicallyFeasible:count(r=>r.kinematic),nominalInterfaceAccepted:count(r=>r.accepted),
      kinematicButInterfaceRejected:count(r=>r.kinematic&&!r.accepted),
      rejectedOrFailed:count(r=>!r.accepted)},rows};
}
if(require.main===module)process.stdout.write(JSON.stringify(experiment(),null,2)+'\n');
module.exports={assess,experiment};
