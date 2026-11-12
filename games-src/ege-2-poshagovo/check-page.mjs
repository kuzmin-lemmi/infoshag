// Автотест страницы в jsdom: открывается без ошибок, трасса доходит до конца,
// сопоставление и квиз работают, ответы совпадают с движком (сверенным с Python).
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM, VirtualConsole} from 'jsdom';
import {makeTask, mainProgram, advancedProgram, quiz, trace, advancedLines, advancedTrace} from './engine.mjs';

const html = readFileSync(new URL('../../public/games/ege-2-poshagovo.html', import.meta.url), 'utf8');
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push(e.message));
vc.on('error', (...a) => errors.push(a.join(' ')));
const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  url: 'http://localhost/',
  pretendToBeVisual: true,
  virtualConsole: vc,
  beforeParse(window) {
    window.scrollTo = () => {};
    window.URL.createObjectURL = () => 'blob:test';
    window.URL.revokeObjectURL = () => {};
  },
});
const {window} = dom;
const {document} = window;
const $ = id => document.getElementById(id);
const click = n => n.dispatchEvent(new window.MouseEvent('click', {bubbles: true}));
const change = n => n.dispatchEvent(new window.Event('change', {bubbles: true}));

const task = makeTask(20261112);
assert.equal($('error').hidden, true, 'страница открылась без ошибок запуска');
assert.equal($('step-1').hidden, false);
assert.equal($('condition-expr').textContent, 'F = ' + task.mathExpr);
assert.equal($('fragment-wrap').querySelectorAll('tbody tr').length, 3);
assert.equal($('task-stats').textContent.includes(String(task.sol.length)), true);

// Шаг 3: трасса до конца, вывод совпадает со строками решений.
click($('next')); click($('next'));
assert.equal($('title').textContent, 'Программа по строкам');
const events = trace(task);
for (let i = 0; i < events.length; i++) click($('trace-next'));
assert.equal($('trace-next').disabled, true);
assert.equal($('trace-pos').textContent, `Шаг ${events.length} из ${events.length}`);
const outRows = [...$('out-wrap').querySelectorAll('tbody tr')].map(tr => [...tr.children].map(td => Number(td.textContent)));
assert.deepEqual(outRows, task.sol.map(r => r.slice(0, 4)));
click($('trace-reset'));
assert.equal($('out-wrap').querySelectorAll('tbody tr').length, 0);
click($('trace-skip'));
assert.equal($('out-wrap').querySelectorAll('tbody tr').length, 1, 'пропуск до первой строки вывода');
click($('code-lines').children[5]);
assert.equal($('line-note').textContent.includes('Вычисляем функцию'), true);
click($('trace-play'));
assert.equal($('trace-play').textContent, 'Пауза');
click($('trace-play'));
assert.equal($('trace-play').textContent, 'Автопоказ');

// Шаг 4: неверный порядок объясняется, верный проходит.
click($('next'));
assert.equal($('title').textContent, 'Сопоставление столбцов');
const selects = [...$('match-wrap').querySelectorAll('select')];
assert.equal(selects.length, 4);
const wrong = task.varOf.slice();
[wrong[0], wrong[1]] = [wrong[1], wrong[0]];
selects.forEach((sel, c) => { sel.value = String(wrong[c]); change(sel); });
click($('match-check'));
assert.equal($('match-feedback').className, 'feedback bad');
assert.ok($('match-feedback').textContent.length > 20, 'ошибка объяснена');
selects.forEach((sel, c) => { sel.value = String(task.varOf[c]); change(sel); });
click($('match-check'));
assert.equal($('match-feedback').className, 'feedback ok');
assert.equal($('match-feedback').textContent.includes(task.answer), true);
click($('match-hint'));
assert.equal($('match-hints').children.length, 1);
click($('match-answer'));
assert.deepEqual(selects.map(s => Number(s.value)), task.varOf);

// Шаг 5: квиз — неверный ответ объясняется, верный засчитывается.
click($('next'));
assert.equal($('title').textContent, 'Проверь себя');
const qs = quiz(task);
const cards = [...$('quiz').children];
assert.equal(cards.length, qs.length);
const firstWrong = cards[0].querySelectorAll('.quiz-opts button')[qs[0].options.findIndex(o => !o.ok)];
click(firstWrong);
assert.equal(firstWrong.classList.contains('bad'), true);
assert.equal(firstWrong.nextElementSibling.hidden, false);
qs.forEach((q, i) => {
  const okText = q.options.find(o => o.ok).text;
  const btn = [...cards[i].querySelectorAll('.quiz-opts button')].find(b => b.textContent === okText);
  click(btn);
  assert.equal(btn.classList.contains('ok'), true, 'вопрос ' + (i + 1));
});
assert.equal($('quiz-stats').textContent.includes('5 из 5'), true);
assert.equal($('quiz-stats').textContent.includes('С первой попытки'), true);

// Шаг 6: программы совпадают с движком.
click($('next'));
assert.equal($('title').textContent, 'Вся программа');
assert.equal($('full-code').textContent, mainProgram(task));
assert.equal($('advanced-code').textContent, advancedProgram(task));
assert.equal($('advanced-result').textContent.includes(task.answer), true);
assert.equal($('advanced-stats').textContent.includes(String(task.checks)), true);

// Шаг 7: авторешение по строкам — комментарии и трасса до ответа.
click($('next'));
assert.equal($('title').textContent, 'Авторешение по строкам');
const advLines = advancedLines(task);
assert.equal($('adv-lines').children.length, advLines.length);
const advEvents = advancedTrace(task);
click($('adv-lines').children[advLines.findIndex(l => l.line === 21)]);
assert.equal($('adv-line-note').textContent.includes('Главная проверка'), true);
click($('adv-reset'));
assert.equal($('adv-pos').textContent, `Шаг 1 из ${advEvents.length}`);
click($('adv-skip'));
assert.equal($('adv-out').textContent.includes(task.answer), true, 'пропуск до ответа');
for (let i = 0; i < advEvents.length; i++) click($('adv-next'));
assert.equal($('adv-pos').textContent, `Шаг ${advEvents.length} из ${advEvents.length}`);
assert.equal($('adv-out').textContent.trim(), task.answer);

// Клавиатура, тема, новая задача.
document.dispatchEvent(new window.KeyboardEvent('keydown', {key: 'ArrowLeft', bubbles: true}));
document.dispatchEvent(new window.KeyboardEvent('keydown', {key: 'ArrowLeft', bubbles: true}));
assert.equal($('title').textContent, 'Проверь себя');
const themeBefore = document.documentElement.dataset.theme;
click($('theme'));
assert.notEqual(document.documentElement.dataset.theme, themeBefore);
click($('new-task'));
assert.equal($('title').textContent, 'Условие и план');
assert.equal($('error').hidden, true);
assert.equal($('fragment-wrap').querySelectorAll('tbody tr').length, 3);
assert.notEqual($('condition-expr').textContent, '', 'новая задача отрисована');
document.dispatchEvent(new window.KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));

assert.deepEqual(errors, [], 'ошибок консоли нет');
window.close();
console.log('PASS: страница открывается без ошибок; трасса, сопоставление, квиз, программы и новая задача работают.');