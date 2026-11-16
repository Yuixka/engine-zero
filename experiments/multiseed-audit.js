'use strict';
/* Pre-registered multi-seed generalization audit. No held-out tuning.
 * The same predeclared seed and evaluation budget applies to every trial.
 * Family presence is reported, never silently treated as a failure or zero.
 */
const {benchmark}=require('./benchmark.js');
const DEFAULT_SEEDS=Object.freeze([17,71,716,2026,20261116]);
function summarize(values){
  if(!values.length)return null;
  const sorted=[...values].sort((a,b)=>a-b);
  return {count:values.length,mean:Number((values.reduce((a,b)=>a+b,0)/values.length).toFixed(6)),
    min:sorted[0],max:sorted[sorted.length-1],
    median:sorted[Math.floor(sorted.length/2)]};
}
function audit({seeds=DEFAULT_SEEDS,budget=24,depth=2}={}){
  if(!Array.isArray(seeds)||seeds.length<2||seeds.length>30||
     seeds.some(x=>!Number.isSafeInteger(x)||x<0)||
     new Set(seeds).size!==seeds.length)throw new RangeError('2..30 distinct nonnegative integer seeds required');
  if(!Number.isSafeInteger(budget)||budget<0||budget>2000)throw new RangeError('budget must be integer 0..2000');
  if(!Number.isSafeInteger(depth)||depth<0||depth>2)throw new RangeError('depth must be integer 0..2');
  const trials=seeds.map(seed=>benchmark({seed,budget,depth}));
  const targets=trials[0].held_out.map((target,i)=>{
    const families=[...new Set(trials.flatMap(t=>t.held_out[i].champions.map(c=>c.family)))].sort();
    const baseline=trials.map(t=>t.held_out[i].best_fit_crank_baseline_rms_mm);
    return {id:target.id,baseline_rms_mm:summarize(baseline),
      families:families.map(family=>{
        const entries=trials.map(t=>t.held_out[i].champions.find(c=>c.family===family));
        const valid=entries.filter(c=>c?.valid&&Number.isFinite(c.rms_mm));
        const better=valid.filter(c=>c.rms_minus_crank_mm<0).length;
        return {family,present_trials:entries.filter(Boolean).length,
          valid_trials:valid.length,invalid_trials:entries.filter(c=>c&&!c.valid).length,
          absent_trials:trials.length-entries.filter(Boolean).length,
          rms_mm:summarize(valid.map(c=>c.rms_mm)),
          rms_minus_crank_mm:summarize(valid.map(c=>c.rms_minus_crank_mm)),
          beats_baseline_count:better,
          beats_baseline_fraction_of_all_trials:Number((better/trials.length).toFixed(6))};
      })};
  });
  return {schema_version:1,kind:'pre-registered-multiseed-heldout-audit',
    protocol:{seeds:[...seeds],budget_per_seed:budget,depth,
      total_search_attempts:trials.reduce((a,t)=>a+t.discovery.attempts,0),
      training_selection:'existing training-only family champion; one prior incumbent imported per seed',
      heldout_selection:'none; report all target x family combinations including absences',
      limitation:'same fixed incumbent in every seed; seeds are not independent experiments of incumbent discovery'},
    targets};
}
if(require.main===module)process.stdout.write(JSON.stringify(audit(),null,2)+'\n');
module.exports={audit,summarize,DEFAULT_SEEDS};
