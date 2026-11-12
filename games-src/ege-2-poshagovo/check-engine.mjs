// Проверка движка: задачи для 30 seed сверяются с независимым Python-оракулом,
// обе показанные программы запускаются на Python, ответы и трасса сходятся.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {
  makeTask, trace, quiz, checkMapping, hints, mainProgram, productProgram,
  advancedProgram, solveFragment, programLines, advancedLines, advancedTrace, evalAst, VARS,
} from './engine.mjs';

const seeds = Array.from({length: 30}, (_, i) => 20260000 + i * 137);
const tasks = seeds.map(makeTask);
const cases = [];

tasks.forEach((task, idx) => {
  const seed = seeds[idx];
  assert.deepEqual(makeTask(seed), task, 'повторный seed даёт ту же задачу');
  assert.equal(task.sol.length >= 3 && task.sol.length <= 6, true);
  assert.equal(new Set(task.fragment.map(r => r.join(','))).size, 3);
  assert.equal(task.fragment.every(r => r[4] === task.target), true);
  const solved = solveFragment(task.ast, task.target, task.fragment);
  assert.deepEqual(solved.answers, [task.answer], 'единственный ответ');
  assert.equal(solved.checks, task.checks);
  assert.equal(task.checks, 24 * 2 ** task.blankCount);

  const events = trace(task);
  const printed = events.filter(e => e.print).map(e => e.print);
  assert.deepEqual(printed, task.sol.map(r => r.slice(0, 4)), 'трасса печатает строки решений по порядку');
  assert.equal(events[0].line, 1);
  assert.ok(events.every(e => e.line >= 1 && e.line <= 8));
  assert.equal(programLines(task).length, 8);

  // Слайд 7: комментарий у каждой непустой строки авторешения; трасса доходит до ответа.
  const advLines = advancedLines(task);
  const nonEmpty = advancedProgram(task).split('\n').filter(l => l.trim()).length;
  assert.equal(advLines.length, nonEmpty, 'комментарий у каждой строки авторешения');
  assert.ok(advLines.every(l => l.note.length > 10), 'каждая строка авторешения объяснена');
  const advEvents = advancedTrace(task);
  const advPrinted = advEvents.filter(e => e.print).map(e => e.print);
  assert.deepEqual(advPrinted, [task.answer], 'трасса авторешения печатает единственный ответ');
  assert.ok(advEvents.every(e => e.line >= 1 && e.line <= 26));
  const win = advEvents[advEvents.length - 1];
  assert.equal(win.verdict, 'match');
  assert.equal(new Set(win.rows.map(r => r.join(','))).size, 3, 'строки-кандидата различны');
  assert.ok(win.rows.every(r => evalAst(task.ast, {x: r[win.p[0]], y: r[win.p[1]], z: r[win.p[2]], w: r[win.p[3]]}) === r[4]));
  assert.ok(advEvents.filter(e => e.line === 15).length <= task.checks, 'кандидатов не больше полного перебора');

  const qs = quiz(task);
  assert.equal(qs.length, 5);
  for (const q of qs) {
    assert.equal(q.options.filter(o => o.ok).length, 1, 'ровно один верный вариант');
    assert.equal(q.options.length, 4);
    assert.ok(q.options.every(o => o.why.length > 10), 'каждый вариант объяснён');
  }
  assert.equal(qs[3].options.find(o => o.ok).text, String(task.sol.length));

  assert.equal(checkMapping(task, task.varOf).status, 'ok');
  assert.equal(checkMapping(task, task.varOf).answer, task.answer);
  assert.equal(checkMapping(task, [null, null, null, null]).status, 'incomplete');
  const swapped = task.varOf.slice();
  [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
  assert.notEqual(checkMapping(task, swapped).status, 'ok', 'переставленные столбцы не проходят');
  assert.ok(hints(task).length >= 2);

  cases.push({
    expr: task.pythonExpr, target: task.target, fragment: task.fragment,
    mainCode: mainProgram(task), productCode: productProgram(task),
    advancedCode: advancedProgram(task),
  });
});

const oraclePath = new URL('oracle.py', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const python = spawnSync(process.env.PYTHON || 'python', ['-X', 'utf8', oraclePath], {
  input: JSON.stringify(cases), encoding: 'utf8', maxBuffer: 20e6,
});
assert.equal(python.status, 0, python.stderr);
const actual = JSON.parse(python.stdout);
assert.equal(actual.length, cases.length);

tasks.forEach((task, i) => {
  const a = actual[i];
  assert.deepEqual(a.table, task.table, 'таблица истинности seed ' + seeds[i]);
  assert.deepEqual(a.printedRows, task.sol.map(r => r.slice(0, 4)), 'вывод главной программы');
  assert.deepEqual(a.productRows, a.printedRows, 'версия с product даёт тот же вывод');
  assert.equal(a.header, 'x y z w');
  assert.deepEqual(a.advancedAnswers, [task.answer], 'автоматическая программа');
  assert.deepEqual(a.answers, [task.answer], 'перебор оракула');
  assert.equal(a.checks, task.checks);
});

const report = `PASS: ${tasks.length} задач сверены с Python: таблицы, вывод обеих программ, ` +
  `автоматическое решение, единственный ответ, трасса, квиз и проверка сопоставления.\n`;
writeFileSync(new URL('ENGINE-RESULT.txt', import.meta.url), report);
console.log(report.trim());