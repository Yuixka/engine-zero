#!/usr/bin/env node
'use strict';
// Deterministic briefing generator, NOT five autonomous agents.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
const roles=[
  ['cad-library','Parametric CAD Component Library','Licensed parametric parts, dimensions, provenance, interface metadata'],
  ['assembly-graph','Physics-Aware Assembly Graph','Typed bodies, joints, connectors and compatibility constraints'],
  ['design-engine','Generative Design Engine','Seeded topology generation and objective-driven search'],
  ['verification','Simulation and Verification','Independent regression tests and physical feasibility gates'],
  ['experiment-loop','Autonomous Experimentation','Held-out benchmarks, evidence ledger and next hypotheses']
];
const ignore=new Set(['.git','node_modules','handoffs']);
function scan(dir,prefix=''){
  const out={};
  for(const e of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
    if(ignore.has(e.name)||e.name==='FILE_MANIFEST.json')continue;
    const rel=prefix?prefix+'/'+e.name:e.name;
    if(e.isDirectory())Object.assign(out,scan(path.join(dir,e.name),rel));
    else if(e.isFile())out[rel]=crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,e.name))).digest('hex');
  }
  return out;
}
function readJson(file,fallback){try{return JSON.parse(fs.readFileSync(file,'utf8'));}catch{return fallback;}}
const dateArg=process.argv.find(a=>a.startsWith('--date='));
const day=dateArg?dateArg.slice(7):new Date().toISOString().slice(0,10);
if(!/^\d{4}-\d{2}-\d{2}$/.test(day))throw new Error('Expected --date=YYYY-MM-DD');
const manifestFile=path.join(root,'state/FILE_MANIFEST.json');
const old=readJson(manifestFile,{date:null,files:{}}),now=scan(root);
const added=Object.keys(now).filter(k=>!(k in old.files));
const removed=Object.keys(old.files).filter(k=>!(k in now));
const changed=Object.keys(now).filter(k=>(k in old.files)&&now[k]!==old.files[k]);
const state=readJson(path.join(root,'state/PROJECT_STATE.json'),{});
const folder=path.join(root,'handoffs');fs.mkdirSync(folder,{recursive:true});
const previousDates=fs.readdirSync(folder).filter(f=>/^\d{4}-\d{2}-\d{2}\.json$/.test(f)&&f.slice(0,10)<day).sort();
const previous=previousDates.length?readJson(path.join(folder,previousDates.at(-1)),null):null;
let git_status=null;try{git_status=cp.execFileSync('git',['-C',root,'status','--short'],{encoding:'utf8',timeout:3000}).trim();}catch{}
const briefing={
  date:day,project:'Engine Zero',version:state.baseline_version||'unknown',is_autonomous_agent_run:false,
  compare_to_manifest:old.date,
  yesterday_work:previous?{date:previous.date,completed_work:previous.completed_work||[],failures:previous.failures||[],blockers:previous.blockers||[]}:{status:'No preceding handoff found'},
  file_changes:{added,removed,changed},git_status,
  software_dependency_changes:'Not automatically determined; review dependency manifests and environment.',
  common_handoff:'All five specialists review every other briefing before any interface changes.',
  specialists:roles.map(([id,name,priority])=>({
    id,name,receives_briefings_from:roles.filter(r=>r[0]!==id).map(r=>r[0]),
    yesterday_change_log:{added,removed,changed},today_proposed_priority:priority,
    proposed_files:[],planned_interface_changes:[],completed_work:[],test_evidence:[],blocker_list:[]
  })),
  completed_work:[],failures:[],blockers:[],
  coordinator_decision:'Review five briefings, implement one integrated tested change.'
};
fs.writeFileSync(path.join(folder,day+'.json'),JSON.stringify(briefing,null,2)+'\n');
fs.writeFileSync(manifestFile,JSON.stringify({date:day,files:scan(root)},null,2)+'\n');
console.log('Handoff: '+day+'; roles: 5; added: '+added.length+'; changed: '+changed.length+'; removed: '+removed.length);
