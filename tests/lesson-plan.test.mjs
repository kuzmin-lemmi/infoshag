import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const plans = JSON.parse(read('src/data/lesson-plans.json'));
const sources = JSON.parse(read('src/data/lesson-plan-sources.json'));
const bindings = JSON.parse(read('src/data/lesson-materials.json'));

test('Пять полных планов и непрерывное распределение 170 уроков по четвертям', () => {
  assert.deepEqual(plans.map(p => p.grade), [5, 6, 7, 8, 9]);
  assert.equal(plans.reduce((sum, p) => sum + p.lessons.length, 0), 170);
  for (const plan of plans) {
    assert.equal(plan.subject, 'informatics');
    assert.equal(plan.weeklyHours, 1);
    assert.equal(plan.lessons.length, 34);
    assert.equal(plan.quarterEnds.length, 4);
    let start = 0;
    for (const end of plan.quarterEnds) {
      assert.ok(Number.isInteger(end) && end > start && end <= plan.lessons.length);
      start = end;
    }
    assert.equal(start, plan.lessons.length);
    for (const title of plan.lessons) {
      assert.ok(title.trim().length > 8);
      assert.doesNotMatch(title, /https?:|\n|\uFFFD|\d{2}\.\d{2}\.202\d/);
    }
  }
});

test('У каждого урока есть существующий источник и страницы; исходные PDF не изменены', () => {
  assert.equal(new Set(sources.map(s => s.id)).size, sources.length);
  for (const source of sources) {
    const filename = new URL(source.url).pathname.split('/').at(-1);
    const bytes = readFileSync(new URL(`docs/sources/lesson-plans/${filename}`, root));
    assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
    assert.equal(createHash('sha256').update(bytes).digest('hex'), source.sha256);
    assert.equal(source.approved, '2025-08-29');
  }
  for (const plan of plans) {
    const source = sources.find(s => s.id === plan.sourceId);
    assert.ok(source?.grades.includes(plan.grade));
    assert.equal(plan.lessonPages.length, plan.lessons.length);
    for (const pages of plan.lessonPages) {
      assert.ok(pages.length > 0);
      assert.ok(pages.every(n => Number.isInteger(n) && n >= source.pages[0] && n <= source.pages[1]));
    }
  }
  const ninth = plans.find(p => p.grade === 9);
  assert.deepEqual(ninth.lessonPages[14], [36, 37]);
  assert.match(ninth.lessons[14], /ветвлений, циклов и вспомогательных алгоритмов$/);
});

test('Все карточки рассмотрены; привязки существуют, уникальны и не противоречат друг другу', () => {
  const cards = readdirSync(new URL('src/content/items/', root)).filter(f => f.endsWith('.md')).map(f => f.slice(0, -3));
  assert.deepEqual(bindings.map(b => b.itemId).sort(), cards.sort());
  assert.equal(new Set(bindings.map(b => b.itemId)).size, bindings.length);
  for (const binding of bindings) {
    const seen = new Set();
    for (const kind of ['primary', 'related']) {
      assert.ok(Array.isArray(binding[kind]));
      for (const ref of binding[kind]) {
        const plan = plans.find(p => p.grade === ref.grade);
        assert.ok(plan, binding.itemId);
        assert.ok(ref.reason?.length > 10);
        assert.ok(ref.lessons.length > 0);
        assert.deepEqual([...ref.lessons].sort((a, b) => a - b), ref.lessons);
        for (const n of ref.lessons) {
          assert.ok(Number.isInteger(n) && n > 0 && n <= plan.lessons.length);
          const key = `${ref.grade}:${n}`;
          assert.ok(!seen.has(key), `${binding.itemId}: повтор ${key}`);
          seen.add(key);
        }
      }
    }
    const quarterSeen = new Set();
    for (const ref of binding.quarters ?? []) {
      const plan = plans.find(p => p.grade === ref.grade);
      assert.ok(plan);
      assert.ok(ref.reason?.length > 10 && ref.quarters.length > 0);
      for (const quarter of ref.quarters) {
        assert.ok(Number.isInteger(quarter) && quarter >= 1 && quarter <= 4);
        const key = `${ref.grade}:${quarter}`;
        assert.ok(!quarterSeen.has(key));
        quarterSeen.add(key);
        const start = plan.quarterEnds[quarter - 2] ?? 0;
        const end = plan.quarterEnds[quarter - 1];
        assert.ok([...binding.primary, ...binding.related].every(r => r.grade !== ref.grade || r.lessons.every(n => n <= start || n > end)), 'Материал четверти не должен дублироваться у её уроков');
      }
    }
    if (!seen.size && !quarterSeen.size) assert.ok(binding.note?.length > 10, binding.itemId);
  }
});

test('Несовпадающие контрольные и закрытые главы не объявлены основными материалами урока', () => {
  for (const id of ['kontrolnaya-5-klass-1-chetvert', 'kontrolnaya-6-klass-1-chetvert']) {
    const entry = bindings.find(b => b.itemId === id);
    assert.deepEqual(entry.primary, []);
    assert.ok(entry.note);
  }
  const kaldera = bindings.find(b => b.itemId === 'kaldera');
  assert.ok([...kaldera.primary, ...kaldera.related].filter(r => r.grade === 6).every(r => r.lessons.every(n => n < 29)));
  const python = bindings.find(b => b.itemId === 'veryu-ne-veryu');
  assert.ok([...python.primary, ...python.related].every(r => r.grade !== 7));
  const search = bindings.find(b => b.itemId === 'poiskovye-krugi');
  assert.ok([...search.primary, ...search.related].every(r => r.grade !== 9 || !r.lessons.includes(9)));
});
