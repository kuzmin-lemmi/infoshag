import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {buildSearchIndex, searchEntries} from '../src/search.ts';
const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const plans=JSON.parse(read('src/data/lesson-plans.json'));
const tasks=JSON.parse(read('src/data/ege-tasks.json')).tasks;
const bindings=JSON.parse(read('src/data/lesson-materials.json'));
const egeBindings=JSON.parse(read('src/data/ege-materials.json'));
const html=read('dist/poisk/index.html');
const index=JSON.parse(html.match(/<script[^>]*id="topic-search-index"[^>]*>([\s\S]*?)<\/script>/)[1]);

test('Поиск находит темы всех четвертей, включая темы без материалов, и учитывает класс',()=>{
  const hits=searchEntries(index,'ЧЕРТЕЖНИК');
  assert.ok(hits.some(row=>row.id==='topic-6-27' && row.href.includes('quarter=4#lesson-27')));
  assert.ok(searchEntries(index,'файлы','6').some(row=>row.id==='topic-6-2'));
  assert.ok(searchEntries(index,'файлы','6').every(row=>row.grades.includes(6)));
  assert.equal(searchEntries(index,'файлы','11').some(row=>row.id==='topic-6-2'),false);
  assert.equal(searchEntries(index,'несуществующийзапрос').length,0);
  assert.deepEqual(searchEntries(index,'  '),[]);
  assert.deepEqual(searchEntries(index,'<script>alert(1)</script>'),[]);
});

test('Номер ЕГЭ ищется точно: 27 не совпадает с годом 2027 у других заданий',()=>{
  for(const query of ['ЕГЭ 27','егэ27','ЕГЭ №27']){
    const hits=searchEntries(index,query);
    assert.ok(hits.some(row=>row.id==='ege-27'));
    assert.ok(hits.some(row=>row.id==='item-ege-27-klastery'));
    assert.ok(hits.filter(row=>row.kind==='Задание ЕГЭ').every(row=>row.id==='ege-27'));
  }
  assert.ok(searchEntries(index,'логика').some(row=>row.id==='ege-15'));
  assert.ok(searchEntries(index,'системы счисления').some(row=>row.id==='ege-14'));
});

test('Все результаты имеют рабочие адреса и точные якоря; поле поиска есть на главной и страницах классов',()=>{
  assert.equal(new Set(index.map(row=>row.id)).size,index.length);
  for(const row of index){
    const url=new URL(row.href,'https://infoshag.ru');
    assert.equal(url.origin,'https://infoshag.ru');
    const file=`dist${url.pathname}index.html`;
    assert.ok(existsSync(new URL(file,root)),row.href);
    if(url.hash)assert.ok(read(file).includes(`id="${url.hash.slice(1)}"`),row.href);
  }
  for(const path of ['dist/index.html','dist/klass/6/index.html','dist/klass/11/index.html']){
    assert.match(read(path),/action="\/poisk\/"/);
    assert.match(read(path),/id="site-search"[^>]*name="q"/);
  }
});

test('Индекс не зависит от корня сайта и не включает неопубликованные карточки',()=>{
  const items=[{id:'soon',data:{title:'Скрыто',summary:'Скрыто',grades:[6],tags:[],access:'soon'}}];
  const built=buildSearchIndex(plans,tasks,items,bindings,egeBindings,'/prefix/');
  assert.ok(built.every(row=>row.href.startsWith('/prefix/')));
  assert.ok(!built.some(row=>row.id==='item-soon'));
  assert.ok(built.some(row=>row.id==='topic-5-33' && row.meta.includes('33, 34')));
});
