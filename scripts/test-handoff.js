'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'handoffs');
const files=fs.readdirSync(dir).filter(f=>/^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
assert(files.length>0,'No handoff generated');
const x=JSON.parse(fs.readFileSync(path.join(dir,files.at(-1)),'utf8'));
assert.equal(x.specialists.length,5);
assert.equal(new Set(x.specialists.map(s=>s.id)).size,5);
for(const s of x.specialists){assert.equal(s.receives_briefings_from.length,4);assert(s.today_proposed_priority);assert(s.yesterday_change_log);}
assert(Array.isArray(x.file_changes.added));assert.equal(x.is_autonomous_agent_run,false);
console.log('Five-system handoff schema: PASS');
