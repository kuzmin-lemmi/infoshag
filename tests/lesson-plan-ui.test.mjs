import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { quarterTopics, topicMaterials, quarterMaterials, lessonRanges } from '../src/lesson-plan.ts';
import { currentQuarter } from '../src/scripts/lesson-plan.ts';

test('Повторы объединяются только в своей четверти, сохраняют номера за год и порядок', () => {
  const plan = { grade: 5, quarterEnds: [4, 6, 7, 8], lessons: ['А', 'Б', ' а ', 'В', 'А', 'А', 'Б', 'В'] };
  assert.deepEqual(quarterTopics(plan, 1), [
    { title: 'А', number: 1, annualNumbers: [1, 3] },
    { title: 'Б', number: 2, annualNumbers: [2] },
    { title: 'В', number: 3, annualNumbers: [4] },
  ]);
  assert.deepEqual(quarterTopics(plan, 2)[0].annualNumbers, [5, 6]);
  assert.equal(lessonRanges([8, 3, 2, 1, 3, 7, 10]), '1–3, 7–8, 10');
});

test('Один основной материал на четверть; повтор становится дополнительной ссылкой', () => {
  const topics = [1, 2, 3].map(n => ({ title: String(n), number: n, annualNumbers: [n] }));
  const item = { id: 'python', data: { access: 'free', grades: [7] } };
  const bindings = [{ itemId: 'python', primary: [{ grade: 8, lessons: [1, 2], reason: 'Трассировка' }], related: [{ grade: 8, lessons: [3], reason: 'Повторение' }] }];
  const result = topicMaterials(topics, [item], bindings, 8);
  assert.equal(result[0].primary[0].item.id, 'python');
  assert.equal(result[1].primary.length, 0);
  assert.equal(result[1].related[0].item.id, 'python');
  assert.equal(result[2].related[0].reason, 'Повторение');
  assert.equal(topicMaterials(topics, [{ ...item, data: { access: 'soon' } }], bindings, 8)[0].primary.length, 0);
  assert.equal(topicMaterials(topics, [item], bindings, 7)[0].primary.length, 0);
});

test('Начальная четверть соответствует месяцу; летом открывается первая', () => {
  assert.deepEqual(Array.from({length: 12}, (_, month) => currentQuarter(new Date(2026, month, 15))), [3, 3, 3, 4, 4, 1, 1, 1, 1, 1, 2, 2]);
});

test('Собранные страницы содержат каждый урок ровно один раз, работают без JS и дают правильные ссылки', () => {
  const root = new URL('../', import.meta.url);
  for (let grade = 5; grade <= 9; grade++) {
    const html = readFileSync(new URL(`dist/klass/${grade}/index.html`, root), 'utf8');
    const numbers = [...html.matchAll(/data-annual-numbers="([\d,]+)"/g)].flatMap(m => m[1].split(',').map(Number));
    assert.deepEqual(numbers, Array.from({length: 34}, (_, n) => n + 1));
    assert.equal([...html.matchAll(/<section\b[^>]*data-plan-pane\b/g)].length, 4);
    assert.doesNotMatch(html, /<section\b[^>]*data-plan-pane[^>]*hidden/);
    assert.match(html, /data-plan-controls hidden/);
    assert.match(html, /8 \+ 8 \+ 10 \+ 8/);
    for (const [, href] of html.matchAll(/href="(\/(?:igra|item)\/[^"?]+)"/g)) {
      assert.ok(existsSync(new URL(`dist${href}index.html`, root)), href);
    }
  }
  const eighth = readFileSync(new URL('dist/klass/8/index.html', root), 'utf8');
  const seventh = readFileSync(new URL('dist/klass/7/index.html', root), 'utf8');
  assert.match(eighth, /data-primary-material="veryu-ne-veryu"/);
  assert.match(seventh, /Ещё материалы 7 класса/);
  const fifth = readFileSync(new URL('dist/klass/5/index.html', root), 'utf8');
  assert.match(fifth, /уроки 33–34 · 2 ч/);
  const eleventh = readFileSync(new URL('dist/klass/11/index.html', root), 'utf8');
  assert.doesNotMatch(eleventh, /<section\b[^>]*data-plan-pane\b/);
  assert.match(eleventh, /ege-27-klastery/);
});

test('Четвертные материалы выбираются только для своего класса и четверти, контрольные отсутствуют у уроков', () => {
  const root = new URL('../', import.meta.url);
  const bindings = JSON.parse(readFileSync(new URL('src/data/lesson-materials.json', root), 'utf8'));
  for (const grade of [5, 6]) {
    const id = `kontrolnaya-${grade}-klass-1-chetvert`;
    const items = [{ id, data: { access: 'free' } }];
    assert.equal(quarterMaterials(items, bindings, grade, 1)[0].item.id, id);
    assert.equal(quarterMaterials(items, bindings, grade, 2).length, 0);
    assert.equal(quarterMaterials(items, bindings, grade === 5 ? 6 : 5, 1).length, 0);
    assert.equal(quarterMaterials([{ id, data: { access: 'soon' } }], bindings, grade, 1).length, 0);
    const html = readFileSync(new URL(`dist/klass/${grade}/index.html`, root), 'utf8');
    assert.equal([...html.matchAll(/data-quarter-additional /g)].length, 4);
    assert.equal([...html.matchAll(new RegExp(`data-quarter-material="${id}"`, 'g'))].length, 1);
    assert.doesNotMatch(html, new RegExp(`data-related-material="${id}"`));
    const position = html.indexOf(`data-quarter-material="${id}"`);
    const listEnd = html.lastIndexOf('</ol>', position);
    const secondQuarter = html.indexOf('data-quarter="2"');
    assert.ok(listEnd > 0 && listEnd < position && position < secondQuarter);
  }
});
