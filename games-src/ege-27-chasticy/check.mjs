// Автотест урока «Кластеры частиц»: страница открывается в jsdom без ошибок, все слайды обеих задач
// проходят до последнего шага, программы на слайдах «Ответ» совпадают с solution*.py, а ответы — с Python.
// Запуск: npm i --no-save jsdom && node scripts/build-ege27-guide.mjs && node games-src/ege-27-chasticy/check.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {JSDOM, VirtualConsole} from 'jsdom';

const here = new URL('./', import.meta.url);
const root = new URL('../../', import.meta.url);
const html = readFileSync(new URL('public/games/ege-27-chasticy.html', root), 'utf8');
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push(e.message));
vc.on('error', e => errors.push(String(e)));
const dom = new JSDOM(html, {runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'https://infoshag.ru/games/ege-27-chasticy.html'});
const w = dom.window;
assert.deepEqual(errors, [], 'ошибки при загрузке');

const run = code => w.eval(code);
for (const [task, file, solution] of [['demo', '27.txt', 'solution.py'], ['stat', '27_2.txt', 'solution_statgrad.py']]) {
  // все слайды задачи, каждый шаг
  run(`setTask('${task}'); idx = 0; render();`);
  const total = run('list().length');
  assert.equal(total, 12, `${task}: 12 слайдов`);
  let guard = 0;
  while (guard++ < 200) {
    const done = run(`(() => { const L = list(), s = L[idx]; return idx === L.length - 1 && state.get(s) >= +s.dataset.steps; })()`);
    if (done) break;
    run('next()');
  }
  assert.ok(guard < 200, `${task}: дошли до конца`);
  assert.deepEqual(errors, [], `${task}: ошибки при показе слайдов`);
  // программа на странице = solution*.py без первой строки-комментария
  const py = readFileSync(new URL(solution, here), 'utf8').replaceAll('\r\n', '\n').split('\n').slice(1).join('\n').trim();
  assert.equal(run(`DATA.${task}.code.join('\\n')`), py, `${task}: программа на странице совпадает с ${solution}`);
  // ответ страницы = ответ Python
  const page = run(`Math.trunc(DATA.${task}.Q1 * 10000) + ' ' + Math.trunc(DATA.${task}.Q2 * 10000)`);
  const res = spawnSync('python', ['-I', solution], {cwd: here, encoding: 'utf8'});
  if (res.status === 0) assert.equal(page, res.stdout.trim(), `${task}: ответ как в Python`);
  else console.warn('Python не найден — ответ не сверен:', res.error?.message ?? res.stderr);
  // единственность центров и выбор кластеров без ничьих
  const sizes = run(`DATA.${task}.CL.map(g => g.length)`);
  assert.ok(sizes.every(n => n % 2 === 1), `${task}: в каждом кластере нечётное число частиц`);
  if (task === 'stat') {
    const c = [...run('DATA.stat.counts')].sort((a, b) => a - b);
    assert.ok(c[0] < c[1] && c.at(-2) < c.at(-1), 'stat: наименьшее и наибольшее число частиц V — по одному кластеру');
  }
  // скачивание файла отдаёт тот же файл данных
  const data = readFileSync(new URL(file, here), 'utf8').replaceAll('\r\n', '\n').trim();
  assert.equal(run(`DATA.${task}.lines.join('\\n')`), data, `${task}: данные на странице = ${file}`);
  console.log(`${task}: ${total} слайдов, ответ ${page} — ок`);
}
w.close();
