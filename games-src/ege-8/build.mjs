import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {LESSONS,BASE,MAP} from './lessons.mjs';
import {LINES} from './lines.mjs';
const dir=new URL('./',import.meta.url),read=name=>readFileSync(new URL(name,dir),'utf8');
if(LESSONS.length!==22||MAP.length!==25||new Set(MAP.map(x=>x[0])).size!==25)throw Error('Неполная карта содержания');
for(const l of LESSONS){if(l.note.length!==7||l.note.some(s=>!s))throw Error('Неполная запись: '+l.id);if(typeof LINES[l.id]!=='function'||!LINES[l.id](BASE).length)throw Error('Нет пояснений к коду: '+l.id)}
const inline=name=>read(name).replace(/^import .*;\r?\n/gm,'').replace(/^export /gm,'');
const engine=inline('engine.mjs')+'\n'+inline('lines.mjs')+'\n'+inline('course.mjs')+'\n'+inline('tasks.mjs'),data='const LESSONS='+JSON.stringify(LESSONS)+';\nconst BASE='+JSON.stringify(BASE)+';\nconst MAP='+JSON.stringify(MAP)+';',ui=read('ui.js')+'\n'+read('course-ui.js');
let html=read('template.html').replace('</style>',read('course.css')+'\n</style>').replace('/*__ENGINE__*/',"(()=>{'use strict';\n"+engine).replace('/*__DATA__*/',data).replace('/*__UI__*/',ui+'\n})();');
const output=process.argv[2]?resolve(process.argv[2]):new URL('../ege-8-python-live.html',dir);
writeFileSync(output,html);console.log('Готово: '+output+' · 3 блока · 34 демонстрации · 6 задач · карта 25 приёмов');
