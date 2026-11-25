'use strict';
// Paired evidence audit for independent-oracle verified design yield.
// Input: array of {task, seed, budget, baseline:{verified}, experimental:{verified}}.
// Verification MUST be produced by the same independent reference oracle.
function audit(rows) {
  if (!Array.isArray(rows) || rows.length === 0) throw Error('Nonempty paired rows required');
  const keys = new Set();
  let both = 0, neither = 0, baselineOnly = 0, experimentalOnly = 0;
  for (const r of rows) {
    if (!r || typeof r.task !== 'string' || !r.task || !Number.isSafeInteger(r.seed) ||
        !Number.isSafeInteger(r.budget) || r.budget <= 0 ||
        !r.baseline || !r.experimental ||
        typeof r.baseline.verified !== 'boolean' ||
        typeof r.experimental.verified !== 'boolean') throw Error('Invalid paired row');
    const key = JSON.stringify([r.task,r.seed]);
    if (keys.has(key)) throw Error('Duplicate task/seed pair');
    keys.add(key);
    if (r.baseline.budget !== undefined && r.baseline.budget !== r.budget) throw Error('Baseline budget mismatch');
    if (r.experimental.budget !== undefined && r.experimental.budget !== r.budget) throw Error('Experimental budget mismatch');
    if (r.baseline.verified && r.experimental.verified) both++;
    else if (r.baseline.verified) baselineOnly++;
    else if (r.experimental.verified) experimentalOnly++;
    else neither++;
  }
  const n = rows.length, discordant = baselineOnly + experimentalOnly;
  // Exact two-sided McNemar/binomial test, computed by stable recurrence.
  let p = 1;
  if (discordant > 0) {
    const tail = Math.min(baselineOnly, experimentalOnly);
    let term = Math.pow(0.5, discordant), sum = term;
    for (let k = 1; k <= tail; k++) { term *= (discordant-k+1)/k; sum += term; }
    p = Math.min(1, 2*sum);
  }
  return {pairs:n,both,neither,baselineOnly,experimentalOnly,
    baselineYield:(both+baselineOnly)/n,experimentalYield:(both+experimentalOnly)/n,
    yieldDifference:(experimentalOnly-baselineOnly)/n,discordant,
    exactTwoSidedP:p, interpretation:'Exploratory paired association only; no independence or physical-safety guarantee'};
}
if (require.main === module) {
  const fs = require('node:fs');
  if (process.argv.length !== 3) { console.error('Usage: node experiments/paired-verification-audit.js pairs.json'); process.exit(2); }
  try { console.log(JSON.stringify(audit(JSON.parse(fs.readFileSync(process.argv[2],'utf8'))),null,2)); }
  catch (err) { console.error(err.message); process.exit(1); }
}
module.exports = {audit};
