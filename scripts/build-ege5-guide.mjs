// Собирает самостоятельный HTML-разбор из проверенного конспекта и шаблона.
import {readFileSync, writeFileSync} from 'node:fs';
const root = new URL('../', import.meta.url);
const read = p => readFileSync(new URL(p,root),'utf8').replaceAll('\r\n','\n');
const escape = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function markdown(s){
  const blocks=[];
  s=s.replace(/```python\n([\s\S]*?)```/g,(_,code)=>{blocks.push(`<pre><code>${escape(code.trimEnd())}</code></pre>`);return `\n@@${blocks.length-1}@@\n`});
  return s.trim().split(/\n\s*\n/).map(p=>{
    if(/^@@\d+@@$/.test(p.trim()))return blocks[+p.trim().slice(2,-2)];
    return `<p>${escape(p.trim()).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')}</p>`;
  }).join('\n');
}
const draft=read('docs/ege-5/GUIDE-DRAFT.md');
const core=draft.split('## Часть 1')[1].split('## Часть 2')[0];
const lessons=[...core.matchAll(/### (\d+) ([^\n]+)\n([\s\S]*?)(?=\n### |$)/g)].map(m=>({id:+m[1],title:m[2],html:markdown(m[3])}));
const extra=draft.split('## Часть 3')[1].split('## Устройство')[0];
const extras=[...extra.matchAll(/### ([^\n]+)\n([\s\S]*?)(?=\n### |$)/g)].map(m=>`<details><summary>${escape(m[1])}</summary><div class="reading">${markdown(m[2])}</div></details>`).join('\n');
let html=read('games-src/ege-5/template.html');
html=html.replace('/*__LESSONS__*/',JSON.stringify(lessons).replaceAll('<','\\u003c')).replace('<!--__EXTRAS__-->',extras);
writeFileSync(new URL('public/games/ege-5-poshagovo.html',root),html);
console.log(`Собраны ${lessons.length} блоков Python и справочник дополнительных приёмов.`);
