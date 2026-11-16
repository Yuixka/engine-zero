'use strict';
// Nominal 2D parametric component geometry. Millimetres only. NOT fabrication validated.
function finite(n){return typeof n==='number'&&Number.isFinite(n);}
function xy(p){if(!Array.isArray(p)||p.length!==2||!p.every(finite))throw new TypeError('Expected finite xy coordinate');return p.slice();}
function pos(n,name){if(!finite(n)||n<=0)throw new RangeError(name+' must be positive finite');return n;}
function settings({widthMm=12,thicknessMm=4,holeDiameterMm=4,edgeMarginMm=2}={}){
  for(const [k,v] of Object.entries({widthMm,thicknessMm,holeDiameterMm,edgeMarginMm}))pos(v,k);
  if(holeDiameterMm+2*edgeMarginMm>widthMm)throw new RangeError('Hole plus margins exceeds width');
  return {widthMm,thicknessMm,holeDiameterMm,edgeMarginMm};
}
function component(bodyId,anchors,configuration){
  if(!bodyId||!/^[\w-]+$/.test(bodyId))throw new Error('Invalid body ID');
  if(![1,2].includes(anchors.length))throw new Error('Only one/two revolute anchors supported');
  const holes=anchors.map(a=>({jointId:a.jointId,xyMm:xy(a.xyMm),diameterMm:configuration.holeDiameterMm}));
  if(new Set(holes.map(h=>h.jointId)).size!==holes.length)throw Error('Duplicate joint');
  const profile=holes.length===1
    ? {kind:'disk',centerMm:holes[0].xyMm,radiusMm:configuration.widthMm/2}
    : {kind:'capsule',startMm:holes[0].xyMm,endMm:holes[1].xyMm,
       lengthMm:Math.hypot(...holes[0].xyMm.map((v,i)=>holes[1].xyMm[i]-v)),radiusMm:configuration.widthMm/2};
  if(profile.kind==='capsule'&&profile.lengthMm<configuration.holeDiameterMm+configuration.edgeMarginMm)
    throw new RangeError('Separate bores overlap or lack clearance');
  return {schema:'engine-zero/parametric-component-0.1',id:'ez-'+bodyId,bodyId,units:'mm',
    parameters:{...configuration},holes,profile,material:null,massKg:null,verified:false,
    limitations:['No pin/shaft/fastener definition','No material or load validation','2D nominal geometry only']};
}
function bindGraph(graph,opts={}){
  const params=settings(opts);
  if(!graph||!Array.isArray(graph.bodies)||!Array.isArray(graph.joints))throw TypeError('Invalid graph');
  const ids=graph.bodies.map(b=>b.id);
  if(new Set(ids).size!==ids.length||!ids.includes('g'))throw Error('Missing ground or duplicate bodies');
  const parts=[];
  for(const body of graph.bodies){
    if(body.id==='g')continue; // Do not synthesize mounting structure from missing site details
    const joints=graph.joints.filter(j=>j.a===body.id||j.b===body.id);
    if(joints.some(j=>j.type!=='R'))throw Error('Unsupported prismatic/unknown connector on '+body.id);
    const anchors=joints.map(j=>({jointId:j.id,xyMm:xy(j.a===body.id?j.pa:j.pb)}));
    parts.push(component(body.id,anchors,params));
  }
  return {schema:'engine-zero/parametric-assembly-0.1',units:'mm',graphFamily:graph.family??null,parts,
    notModeled:['ground','pins','bearings','fasteners','clearance','loads','manufacturing tolerances']};
}
const fmt=n=>Number(n.toFixed(6));
function toSVG(part){
  if(part?.schema!=='engine-zero/parametric-component-0.1')throw TypeError('Invalid component');
  const {profile:p,holes}=part,r=p.radiusMm;
  let primitive;
  if(p.kind==='disk')primitive='<circle cx="'+fmt(p.centerMm[0])+'" cy="'+fmt(p.centerMm[1])+'" r="'+fmt(r)+'"/>';
  else if(p.kind==='capsule'){
    const [a,b]=[p.startMm,p.endMm],theta=Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI;
    primitive='<g transform="translate('+fmt(a[0])+' '+fmt(a[1])+') rotate('+fmt(theta)+')">'+
      '<rect x="0" y="'+fmt(-r)+'" width="'+fmt(p.lengthMm)+'" height="'+fmt(2*r)+'"/>'+
      '<circle cx="0" cy="0" r="'+fmt(r)+'"/>'+
      '<circle cx="'+fmt(p.lengthMm)+'" cy="0" r="'+fmt(r)+'"/></g>';
  }else throw Error('Unknown profile kind');
  const cx=holes.reduce((s,h)=>s+h.xyMm[0],0)/holes.length;
  const cy=holes.reduce((s,h)=>s+h.xyMm[1],0)/holes.length;
  const dim=(p.kind==='capsule'?p.lengthMm:0)+2*r+20;
  const bores=holes.map(h=>'<circle cx="'+fmt(h.xyMm[0])+'" cy="'+fmt(h.xyMm[1])+
      '" r="'+fmt(h.diameterMm/2)+'" fill="white" stroke="black" stroke-width=".15"/>').join('');
  return '<svg xmlns="http://www.w3.org/2000/svg" width="'+fmt(dim)+'mm" height="'+fmt(dim)+
    'mm" viewBox="'+fmt(cx-dim/2)+' '+fmt(cy-dim/2)+' '+fmt(dim)+' '+fmt(dim)+'">'+
    '<g fill="#c7d4df" stroke="black" stroke-width=".15">'+primitive+'</g>'+bores+'</svg>';
}
module.exports={settings,component,bindGraph,toSVG};
