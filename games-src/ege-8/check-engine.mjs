import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {writeFileSync,readFileSync} from 'node:fs';
import {LESSONS,BASE,MAP} from './lessons.mjs';
import {compute,validate} from './engine.mjs';
assert.equal(LESSONS.length,22);assert.deepEqual(MAP.map(x=>x[0]),Array.from({length:25},(_,i)=>i+1));
const cases=[];
for(const l of LESSONS){const base={...BASE,...l.defaults};for(const extra of [{},{searchStyle:'break',alphabet:'БА',length:2,word:'БААБ',pattern:'АА',first:'А',last:'Б',number:2,start:5,parity:'even'},{alphabet:'А',length:1,word:'А',pattern:'АА',need:3,first:'А',last:'А',number:100},{alphabet:'БАЁ',length:3,word:'АААА',pattern:'АА',vowels:'',need:0,start:2,parity:'odd',number:1},{alphabet:'01',word:'101',char:'1',length:2,first:'1',last:'0',pattern:'10',need:1}]){const c={...base,...extra};if(validate(l,c))continue;let m=compute(l.id,c);cases.push({id:l.id,config:c,code:m.code,expected:m.proof});assert.equal(m.visuals.length,m.rows.length);assert.ok(m.code.length>10)}}
const python=spawnSync(process.env.PYTHON||'python',['-X','utf8',new URL('oracle.py',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')],{input:JSON.stringify(cases),encoding:'utf8',maxBuffer:20e6});
assert.equal(python.status,0,python.stderr);const actual=JSON.parse(python.stdout);assert.equal(actual.length,cases.length);cases.forEach((c,i)=>assert.deepEqual(actual[i],c.expected,c.id+' '+JSON.stringify(c.config)));
assert.ok(validate(LESSONS[0],{...BASE,alphabet:'АА'}));assert.ok(validate(LESSONS[0],{...BASE,alphabet:'АБВГДЕЖЗ',length:6}));assert.ok(validate(LESSONS[0],{...BASE,length:NaN}));assert.ok(validate(LESSONS[0],{...BASE,alphabet:'<script>'}));
assert.equal(compute('overlap',{...BASE,word:'ААА',pattern:'АА'}).stats[1][1],2);assert.equal(compute('unique',{...BASE,word:'ААБ'}).stats[1][1],3);
const report='PASS: '+cases.length+' cases across 22 demonstrations match Python; all displayed programs compile and run; map1–25 complete; invalid/oversized input rejected.\n';writeFileSync(new URL('ENGINE-RESULT.txt',import.meta.url),report);console.log(report.trim());
