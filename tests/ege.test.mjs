import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { egeRows } from '../src/ege.ts';
const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const exam = JSON.parse(read('src/data/ege-tasks.json'));
const bindings = JSON.parse(read('src/data/ege-materials.json'));

test('Справочник содержит 27 номеров проекта ЕГЭ-2027 и проверяемый источник', () => {
  assert.equal(exam.year, 2027);
  assert.equal(exam.status, 'project');
  assert.deepEqual(exam.tasks.map(t => t.number), Array.from({length:27}, (_, i) => i+1));
  const bytes = readFileSync(new URL('docs/sources/ege-2027/specification.pdf', root));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), exam.specificationSha256);
  assert.match(exam.tasks[9].title, /маски подсети/);
  assert.match(exam.tasks[12].title, /исполнения алгоритма/);
  assert.match(exam.tasks[22].title, /графах/);
  const seen = new Set();
  for (const ref of bindings) {
    assert.ok(ref.number >= 1 && ref.number <= 27);
    assert.ok(['primary', 'related'].includes(ref.kind));
    assert.ok(ref.reason.length > 20);
    assert.ok(existsSync(new URL(`src/content/items/${ref.itemId}.md`, root)));
    const key = `${ref.number}:${ref.itemId}`;
    assert.ok(!seen.has(key)); seen.add(key);
  }
  assert.match(bindings.find(b => b.itemId === 'ege-27-klastery').notice, /2027/);
});

test('Разделение по классам не перенумеровывает задания и не ограничивает привязки классом карточки', () => {
  const items = bindings.map(b => ({id:b.itemId,data:{access:'free',grades:[7]}}));
  assert.deepEqual(egeRows(exam.tasks, bindings, items, 10).map(r=>r.number), Array.from({length:17},(_,i)=>i+1));
  const eleventh = egeRows(exam.tasks, bindings, items, 11);
  assert.deepEqual(eleventh.map(r=>r.number), Array.from({length:10},(_,i)=>i+18));
  assert.equal(eleventh.at(-1).primary[0].item.id, 'ege-27-klastery');
  assert.equal(egeRows(exam.tasks, bindings, items.map(i=>({...i,data:{access:'soon'}})), 11).at(-1).primary.length, 0);
  assert.deepEqual(egeRows(exam.tasks, bindings, items, 9), []);
});

test('Страницы ЕГЭ содержат правильные диапазоны, доступные ссылки и не содержат КТП', () => {
  for (const [grade, first, count] of [[10,1,17],[11,18,10]]) {
    const html = read(`dist/klass/${grade}/index.html`);
    assert.deepEqual([...html.matchAll(/data-ege-task="(\d+)"/g)].map(m=>Number(m[1])), Array.from({length:count},(_,i)=>i+first));
    assert.doesNotMatch(html, /<button\b[^>]*data-quarter-button|<li\b[^>]*data-annual-numbers|<meta name="robots" content="noindex/);
    assert.match(html, /Дополнительные материалы для подготовки/);
    assert.match(html, /data-ege-controls hidden/);
    assert.doesNotMatch(html, /<li\b[^>]*data-ege-task[^>]*hidden/);
    for (const [, href] of html.matchAll(/href="(\/(?:igra|item)\/[^"?]+)"/g)) {
      assert.ok(existsSync(new URL(`dist${href}index.html`,root)), href);
    }
    assert.match(read('dist/sitemap.xml'), new RegExp(`/klass/${grade}/`));
  }
  const html = read('dist/klass/11/index.html');
  assert.match(html, /data-primary-material="ege-27-klastery"/);
  assert.match(html, /формат прежних лет/);
});
