import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {COURSE_BASE,LABS,labModel,validateLab,rankWord,unrankWord,countFormula,dynamicCount,recursiveCount,positionalCount,uniqueWords} from './course.mjs';
import {TASKS,taskModel} from './tasks.mjs';
const cases=[];
for(const spec of LABS){for(const extra of [{},{alphabet:'АБ',word:'БАА',length:3,need:0,base:3,digit:0,number:1},{alphabet:'БАВ',word:'АБВ',length:4,need:2,base:4,digit:1,number:20},{alphabet:'АБ',word:'А',length:1,need:1,base:2,digit:0,number:2},{alphabet:'АБВГ',word:'210',length:5,need:2,base:8,digit:0,number:1}]){const c={...COURSE_BASE,...spec.defaults,...extra};if(validateLab(spec,c))continue;const model=labModel(spec.id,c);cases.push({label:spec.id,code:model.code,expected:model.answer});}}
for(const task of TASKS){for(const big of task.id==='t6'?[false,true]:[false]){const m=taskModel(task.id,big);cases.push({label:task.id+(big?'-big':''),code:m.code,expected:m.answer});cases.push({label:task.id+'-alternative'+(big?'-big':''),code:m.alternative,expected:m.answer});if(task.id==='t6'){for(const row of m.comparison)if(row[1]!==null)assert.equal(row[1],m.answer);}}}
const py=String.raw`import sys,json,io,contextlib
cases=json.load(sys.stdin)
out=[]
for case in cases:
    namespace={}
    with contextlib.redirect_stdout(io.StringIO()):
        exec(compile(case['code'],case['label'],'exec'),namespace)
    out.append(namespace['result'])
json.dump(out,sys.stdout,ensure_ascii=False)
`;
const result=spawnSync(process.env.PYTHON||'python',['-X','utf8','-c',py],{input:JSON.stringify(cases),encoding:'utf8',maxBuffer:20e6});assert.equal(result.status,0,result.stderr);const answers=JSON.parse(result.stdout);cases.forEach((c,i)=>assert.deepEqual(answers[i],c.expected,c.label));
for(const alphabet of ['АБ','БАВ','КЛМН']){for(let L=1;L<=4;L++)for(let n=1;n<=alphabet.length**L;n++){const word=unrankWord(n,alphabet,L).word;assert.equal(word.length,L);assert.equal(rankWord(word,alphabet).number,n)}}
for(const alphabet of ['АБ','АБВ','БВА'])for(let L=1;L<=6;L++)for(let r=0;r<=L;r++){const expected=countFormula(alphabet.length,L,r);assert.equal(dynamicCount(alphabet,L,r).answer,expected);assert.equal(positionalCount(alphabet,L,r).answer,expected);assert.equal(recursiveCount(alphabet,L,r).answer,expected);assert.equal(recursiveCount(alphabet,L,r,true).answer,expected)}
assert.equal(new Set(uniqueWords('ААБВ')).size,uniqueWords('ААБВ').length);assert.deepEqual(uniqueWords('210').slice(0,2),['210','201']);
assert.ok(validateLab(LABS.find(x=>x.id==='unrank'),{...COURSE_BASE,length:2,number:10}));assert.ok(validateLab(LABS.find(x=>x.id==='recursion'),{...COURSE_BASE,length:18}));assert.ok(validateLab(LABS.find(x=>x.id==='numbers'),{...COURSE_BASE,base:8,length:3,digit:8}));
const report='PASS: '+cases.length+' lab/task programs executed in Python with matching answers; rank/unrank round trips; 4 counting methods match for all small parameters; invalid/big brute inputs rejected.\n'+TASKS.map(t=>t.id+': '+JSON.stringify(taskModel(t.id).answer)).join('\n')+'\nt6-big: '+JSON.stringify(taskModel('t6',true).answer)+'\n';writeFileSync(new URL('COURSE-RESULT.txt',import.meta.url),report);console.log(report);
