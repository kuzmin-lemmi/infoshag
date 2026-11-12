// Интерфейс разбора: шаги, трасса программы, сопоставление столбцов, квиз.
const $ = id => document.getElementById(id);
const STEPS = [
  {id: 'step-1', title: 'Условие и план'},
  {id: 'step-2', title: 'Логика на Python'},
  {id: 'step-3', title: 'Программа по строкам'},
  {id: 'step-4', title: 'Сопоставление столбцов'},
  {id: 'step-5', title: 'Проверь себя'},
  {id: 'step-6', title: 'Вся программа'},
  {id: 'step-7', title: 'Авторешение по строкам'},
];
const store = {
  get(k, d) { try { const v = localStorage.getItem('ege2-' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('ege2-' + k, JSON.stringify(v)); } catch {} },
};
const S = {
  seed: store.get('seed', 20261112), task: null, events: [], lines: [],
  step: 0, idx: 0, timer: null, assign: [null, null, null, null],
  hintsShown: 0, quizState: [], a: 0, b: 0,
  advLines: [], advEvents: [], advIdx: 0, advTimer: null,
};

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

function buildTable(headCells, bodyRows) {
  const t = el('table');
  const hr = el('tr');
  headCells.forEach(h => {
    const th = el('th');
    if (h instanceof Node) th.appendChild(h); else th.textContent = h;
    hr.appendChild(th);
  });
  const thead = el('thead'); thead.appendChild(hr); t.appendChild(thead);
  const tb = el('tbody');
  bodyRows.forEach(row => {
    const tr = el('tr');
    row.forEach(c => {
      const td = el('td');
      if (c instanceof Node) td.appendChild(c);
      else { td.textContent = c.text !== undefined ? c.text : c; if (c.cls) td.className = c.cls; }
      tr.appendChild(td);
    });
    tb.appendChild(tr);
  });
  t.appendChild(tb);
  return t;
}

function fragCells(row) {
  return row.slice(0, 4).map(v => v < 0 ? {text: '?', cls: 'q'} : String(v)).concat(String(row[4]));
}

// ---------- Шаг 1: условие ----------
function renderCondition() {
  const t = S.task;
  $('condition-expr').textContent = `F = ${t.mathExpr}`;
  $('fragment-wrap').replaceChildren(buildTable(['?', '?', '?', '?', 'F'], t.fragment.map(fragCells)));
  const stats = [
    ['Переменных', VARS.length],
    ['Строк в полной таблице', 2 ** VARS.length],
    ['Строк решений (F = ' + t.target + ')', t.sol.length],
    ['Пустых клеток', t.blankCount],
  ];
  $('task-stats').replaceChildren(...stats.map(([label, val]) => {
    const d = el('div'); d.appendChild(el('small', '', label)); d.appendChild(el('strong', '', String(val)));
    return d;
  }));
  $('plan').replaceChildren(...STEPS.map((s, i) => {
    const b = el('button'); b.type = 'button';
    b.appendChild(el('b', '', String(i + 1)));
    b.appendChild(document.createTextNode(s.title));
    b.addEventListener('click', () => setStep(i));
    return b;
  }));
}

// ---------- Шаг 2: логика на Python ----------
function renderOps() {
  const a = S.a, b = S.b;
  const rows = [
    ['¬a', 'not a', 1 - a],
    ['a ∧ b', 'a and b', a & b],
    ['a ∨ b', 'a or b', a | b],
    ['a → b', 'not a or b', (1 - a) | b],
    ['a → b (короче)', 'a <= b', a <= b ? 1 : 0],
    ['a ≡ b', 'a == b', a === b ? 1 : 0],
    ['a ⊕ b', 'a != b', a !== b ? 1 : 0],
  ];
  $('ops-table').replaceChildren(buildTable(['Операция', 'Python', 'Результат'],
    rows.map(([sym, code, val]) => [sym, code, {text: String(val), cls: 'val'}])));
  $('toggle-a').textContent = `a = ${a}`;
  $('toggle-b').textContent = `b = ${b}`;
  $('impl-note').textContent = 'Импликации в Python нет: a → b это ¬a ∨ b, то есть not a or b. Для значений 0/1 работает и запись a <= b: импликация ложна только при a = 1, b = 0. Эквивалентность a ≡ b — это a == b, строгая дизъюнкция a ⊕ b — это a != b.';
}

// ---------- Шаг 3: трасса ----------
function renderCode() {
  S.lines = programLines(S.task);
  S.events = trace(S.task);
  S.idx = 0;
  const box = $('code-lines');
  box.replaceChildren(...S.lines.map((l, i) => {
    const b = el('button', 'code-line'); b.type = 'button';
    b.appendChild(el('span', 'ln', String(i + 1)));
    b.appendChild(el('span', '', l.code));
    b.addEventListener('click', () => {
      const first = S.events.findIndex(e => e.line === i + 1);
      if (first >= 0) { stopPlay(); setIdx(first); }
    });
    return b;
  }));
  renderTrace();
}

function setIdx(i) {
  S.idx = Math.max(0, Math.min(S.events.length - 1, i));
  renderTrace();
}

function renderTrace() {
  const e = S.events[S.idx];
  [...$('code-lines').children].forEach((n, i) => n.classList.toggle('current', i === e.line - 1));
  const tiles = VARS.concat('F').map(name => {
    const d = el('div', 'tile' + (name in e.vars ? ' active' : ''));
    d.appendChild(el('small', '', name));
    d.appendChild(document.createTextNode(name in e.vars ? String(e.vars[name]) : '—'));
    return d;
  });
  $('tiles').replaceChildren(...tiles);
  $('line-note').textContent = S.lines[e.line - 1].note;
  $('trace-note').textContent = e.note;
  $('trace-pos').textContent = `Шаг ${S.idx + 1} из ${S.events.length}`;
  const printed = S.events.slice(0, S.idx + 1).filter(ev => ev.print).map(ev => ev.print);
  $('out-wrap').replaceChildren(buildTable(VARS, printed.map(r => r.map(String))));
  $('trace-back').disabled = S.idx === 0;
  $('trace-next').disabled = S.idx === S.events.length - 1;
  $('trace-skip').disabled = S.idx === S.events.length - 1;
}

function stopPlay() {
  if (S.timer) { clearInterval(S.timer); S.timer = null; }
  $('trace-play').textContent = 'Автопоказ';
}

function togglePlay() {
  if (S.timer) { stopPlay(); return; }
  if (S.idx >= S.events.length - 1) setIdx(0);
  $('trace-play').textContent = 'Пауза';
  S.timer = setInterval(() => {
    if (S.idx >= S.events.length - 1) { stopPlay(); return; }
    setIdx(S.idx + 1);
  }, 700);
}

function skipToPrint() {
  stopPlay();
  const next = S.events.findIndex((e, i) => i > S.idx && e.print);
  setIdx(next >= 0 ? next : S.events.length - 1);
}

// ---------- Шаг 4: сопоставление ----------
function renderMatch() {
  const t = S.task;
  S.assign = [null, null, null, null];
  S.hintsShown = 0;
  $('sol-wrap').replaceChildren(buildTable(VARS.concat('F'), t.sol.map(r => r.map(String))));
  const heads = [0, 1, 2, 3].map(c => {
    const sel = el('select');
    sel.setAttribute('aria-label', `Столбец ${c + 1}`);
    sel.appendChild(new Option('—', ''));
    VARS.forEach((name, j) => sel.appendChild(new Option(name, String(j))));
    sel.addEventListener('change', () => {
      S.assign[c] = sel.value === '' ? null : Number(sel.value);
      $('match-feedback').className = 'feedback info';
      $('match-feedback').textContent = 'Выбери по одной переменной в каждом столбце и нажми «Проверить».';
    });
    return sel;
  });
  $('match-wrap').replaceChildren(buildTable(heads.concat('F'), t.fragment.map(fragCells)));
  $('match-hints').replaceChildren();
  $('match-hint').disabled = false;
  $('match-feedback').className = 'feedback info';
  $('match-feedback').textContent = 'Выбери по одной переменной в каждом столбце.';
}

function matchSelects() { return [...$('match-wrap').querySelectorAll('select')]; }

function doCheck() {
  const res = checkMapping(S.task, S.assign);
  const fb = $('match-feedback');
  if (res.status === 'ok') {
    fb.className = 'feedback ok';
    fb.replaceChildren(document.createTextNode('Верно! Ответ: '));
    fb.appendChild(el('span', 'answer', res.answer));
    fb.appendChild(document.createTextNode('. Пустые клетки заполнились так, что все три строки совпали со строками решений и не повторились.'));
  } else if (res.status === 'incomplete') {
    fb.className = 'feedback info';
    fb.textContent = 'Назначь переменные всем четырём столбцам, потом нажми «Проверить».';
  } else {
    fb.className = 'feedback bad';
    fb.textContent = res.reason;
  }
}

function showHint() {
  const all = hints(S.task);
  if (S.hintsShown >= all.length) return;
  $('match-hints').appendChild(el('div', 'note soft', all[S.hintsShown]));
  S.hintsShown++;
  if (S.hintsShown >= all.length) $('match-hint').disabled = true;
}

function showAnswer() {
  matchSelects().forEach((sel, c) => { sel.value = String(S.task.varOf[c]); });
  S.assign = S.task.varOf.slice();
  const fb = $('match-feedback');
  fb.className = 'feedback ok';
  fb.replaceChildren(document.createTextNode('Ответ: '));
  fb.appendChild(el('span', 'answer', S.task.answer));
  fb.appendChild(document.createTextNode('. Столбцы расставлены верно; проверь себя кнопкой «Проверить» или разбери подсказки.'));
}

// ---------- Шаг 5: квиз ----------
function renderQuiz() {
  const qs = quiz(S.task);
  S.quizState = qs.map(() => ({solved: false, firstTry: true}));
  const box = $('quiz');
  box.replaceChildren(...qs.map((q, qi) => {
    const card = el('div', 'quiz-q');
    card.appendChild(el('h3', '', `${qi + 1}. ${q.q}`));
    const opts = el('div', 'quiz-opts');
    q.options.forEach(opt => {
      const wrap = el('div');
      const b = el('button', '', opt.text); b.type = 'button';
      const why = el('p', 'quiz-why'); why.hidden = true;
      b.addEventListener('click', () => {
        const st = S.quizState[qi];
        if (st.solved) return;
        why.hidden = false;
        why.textContent = opt.why;
        if (opt.ok) {
          st.solved = true;
          b.classList.add('ok');
          why.className = 'quiz-why ok';
          [...opts.querySelectorAll('button')].forEach(x => { x.disabled = true; });
          b.disabled = false;
        } else {
          st.firstTry = false;
          b.classList.add('bad');
          why.className = 'quiz-why bad';
        }
        updateQuizStats();
      });
      wrap.appendChild(b); wrap.appendChild(why);
      opts.appendChild(wrap);
    });
    card.appendChild(opts);
    return card;
  }));
  updateQuizStats();
}

function updateQuizStats() {
  const solved = S.quizState.filter(s => s.solved).length;
  const first = S.quizState.filter(s => s.solved && s.firstTry).length;
  $('quiz-stats').replaceChildren(...[
    ['Решено', `${solved} из ${S.quizState.length}`],
    ['С первой попытки', String(first)],
  ].map(([label, val]) => {
    const d = el('div'); d.appendChild(el('small', '', label)); d.appendChild(el('strong', '', val));
    return d;
  }));
}

// ---------- Шаг 6: программы ----------
function renderPrograms() {
  const t = S.task;
  $('full-code').textContent = mainProgram(t);
  $('main-result').textContent = `Программа печатает ${t.sol.length} строк, где F = ${t.target}. Ответ задачи: ${t.answer}.`;
  $('advanced-stats').replaceChildren(...[
    ['Перестановок столбцов', 24],
    ['Заполнений пропусков', 2 ** t.blankCount],
    ['Всего вариантов', t.checks],
  ].map(([label, val]) => {
    const d = el('div'); d.appendChild(el('small', '', label)); d.appendChild(el('strong', '', String(val)));
    return d;
  }));
  $('advanced-code').textContent = advancedProgram(t);
  $('advanced-result').textContent = `Ответ: ${t.answer}. Программа проверяет ${t.checks} вариантов и печатает единственный подходящий.`;
}

// ---------- Шаг 7: авторешение по строкам ----------
function renderAdvanced() {
  S.advLines = advancedLines(S.task);
  S.advEvents = advancedTrace(S.task);
  S.advIdx = 0;
  const box = $('adv-lines');
  box.replaceChildren(...S.advLines.map(l => {
    const b = el('button', 'code-line'); b.type = 'button';
    b.dataset.line = String(l.line);
    b.appendChild(el('span', 'ln', String(l.line)));
    b.appendChild(el('span', '', l.code));
    b.addEventListener('click', () => {
      const first = S.advEvents.findIndex(e => e.line === l.line);
      if (first >= 0) { stopAdvPlay(); setAdvIdx(first); }
    });
    return b;
  }));
  renderAdvTrace();
}

function setAdvIdx(i) {
  S.advIdx = Math.max(0, Math.min(S.advEvents.length - 1, i));
  renderAdvTrace();
}

function renderAdvTrace() {
  const e = S.advEvents[S.advIdx];
  [...$('adv-lines').children].forEach(n => n.classList.toggle('current', Number(n.dataset.line) === e.line));
  const line = S.advLines.find(l => l.line === e.line);
  $('adv-line-note').textContent = line ? line.note : '';
  $('adv-note').textContent = e.note;
  $('adv-pos').textContent = `Шаг ${S.advIdx + 1} из ${S.advEvents.length}`;
  const verdict = {dup: 'строки совпали — отброшен', nomatch: 'функция не совпала — отброшен', match: 'кандидат подходит'}[e.verdict];
  $('adv-cand').textContent = e.p
    ? `p = (${e.p.join(', ')})${e.a ? ` · a = (${e.a.join(', ')})` : ''}${verdict ? ' · ' + verdict : ''}`
    : 'Перебор ещё не начался: загружаем фрагмент и считаем пустые клетки.';
  $('adv-rows').replaceChildren(buildTable(['?', '?', '?', '?', 'F'], (e.rows || S.task.fragment).map(fragCells)));
  const printed = S.advEvents.slice(0, S.advIdx + 1).filter(ev => ev.print).map(ev => ev.print);
  $('adv-out').replaceChildren(printed.length
    ? el('div', 'answer', printed.join(' '))
    : el('p', 'hint', 'Пока ничего не напечатано: подходящий кандидат ещё не найден.'));
  $('adv-back').disabled = S.advIdx === 0;
  $('adv-next').disabled = S.advIdx === S.advEvents.length - 1;
  $('adv-skip').disabled = S.advIdx === S.advEvents.length - 1;
}

function stopAdvPlay() {
  if (S.advTimer) { clearInterval(S.advTimer); S.advTimer = null; }
  $('adv-play').textContent = 'Автопоказ';
}

function toggleAdvPlay() {
  if (S.advTimer) { stopAdvPlay(); return; }
  if (S.advIdx >= S.advEvents.length - 1) setAdvIdx(0);
  $('adv-play').textContent = 'Пауза';
  S.advTimer = setInterval(() => {
    if (S.advIdx >= S.advEvents.length - 1) { stopAdvPlay(); return; }
    setAdvIdx(S.advIdx + 1);
  }, 700);
}

function advSkipToAnswer() {
  stopAdvPlay();
  const next = S.advEvents.findIndex((e, i) => i > S.advIdx && e.print);
  setAdvIdx(next >= 0 ? next : S.advEvents.length - 1);
}

function copyText(text, btn) {
  const done = () => {
    const old = btn.textContent;
    btn.textContent = 'Скопировано ✓';
    setTimeout(() => { btn.textContent = old; }, 1500);
  };
  const fallback = () => {
    const ta = el('textarea');
    ta.value = text;
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch {}
    ta.remove();
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(fallback);
  } else fallback();
}

function download(name, text) {
  const blob = new Blob([text], {type: 'text/x-python;charset=utf-8'});
  const a = el('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

// ---------- Шаги и общее ----------
function setStep(i) {
  stopPlay();
  stopAdvPlay();
  S.step = Math.max(0, Math.min(STEPS.length - 1, i));
  STEPS.forEach((s, k) => { $(s.id).hidden = k !== S.step; });
  $('counter').textContent = `Шаг ${S.step + 1} из ${STEPS.length}`;
  $('title').textContent = STEPS[S.step].title;
  $('step-select').value = String(S.step);
  $('prev').disabled = S.step === 0;
  $('next').disabled = S.step === STEPS.length - 1;
  window.scrollTo({top: 0});
}

function renderAll() {
  stopPlay();
  stopAdvPlay();
  S.task = makeTask(S.seed);
  renderCondition();
  renderOps();
  renderCode();
  renderMatch();
  renderQuiz();
  renderPrograms();
  renderAdvanced();
}

function newTask() {
  S.seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
  store.set('seed', S.seed);
  renderAll();
  setStep(0);
}

// тему сохраняем только по явному переключению: иначе светлый снимок постера ломает тёмный
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

function applyFont(size) {
  const s = Math.max(18, Math.min(32, size));
  document.documentElement.style.setProperty('--size', s + 'px');
  $('font-size').textContent = String(s);
  store.set('font', s);
}

function init() {
  applyTheme(store.get('theme', window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  applyFont(store.get('font', 24));
  $('step-select').replaceChildren(...STEPS.map((s, i) => new Option(`${i + 1}. ${s.title}`, String(i))));
  $('step-select').addEventListener('change', () => setStep(Number($('step-select').value)));
  $('prev').addEventListener('click', () => setStep(S.step - 1));
  $('next').addEventListener('click', () => setStep(S.step + 1));
  $('new-task').addEventListener('click', newTask);
  $('theme').addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    store.set('theme', next);
  });
  $('smaller').addEventListener('click', () => applyFont(parseInt($('font-size').textContent, 10) - 1));
  $('larger').addEventListener('click', () => applyFont(parseInt($('font-size').textContent, 10) + 1));
  $('fullscreen').addEventListener('click', () => {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
    } catch {}
  });
  $('toggle-a').addEventListener('click', () => { S.a = 1 - S.a; renderOps(); });
  $('toggle-b').addEventListener('click', () => { S.b = 1 - S.b; renderOps(); });
  $('trace-back').addEventListener('click', () => { stopPlay(); setIdx(S.idx - 1); });
  $('trace-next').addEventListener('click', () => { stopPlay(); setIdx(S.idx + 1); });
  $('trace-play').addEventListener('click', togglePlay);
  $('trace-skip').addEventListener('click', skipToPrint);
  $('trace-reset').addEventListener('click', () => { stopPlay(); setIdx(0); });
  $('copy-step3').addEventListener('click', () => copyText(mainProgram(S.task), $('copy-step3')));
  $('match-check').addEventListener('click', doCheck);
  $('match-hint').addEventListener('click', showHint);
  $('match-answer').addEventListener('click', showAnswer);
  $('quiz-reset').addEventListener('click', renderQuiz);
  $('copy-main').addEventListener('click', () => copyText(mainProgram(S.task), $('copy-main')));
  $('download-main').addEventListener('click', () => download('ege-2.py', mainProgram(S.task)));
  $('copy-advanced').addEventListener('click', () => copyText(advancedProgram(S.task), $('copy-advanced')));
  $('download-advanced').addEventListener('click', () => download('ege-2-avto.py', advancedProgram(S.task)));
  $('copy-step7').addEventListener('click', () => copyText(advancedProgram(S.task), $('copy-step7')));
  $('adv-back').addEventListener('click', () => { stopAdvPlay(); setAdvIdx(S.advIdx - 1); });
  $('adv-next').addEventListener('click', () => { stopAdvPlay(); setAdvIdx(S.advIdx + 1); });
  $('adv-play').addEventListener('click', toggleAdvPlay);
  $('adv-skip').addEventListener('click', advSkipToAnswer);
  $('adv-reset').addEventListener('click', () => { stopAdvPlay(); setAdvIdx(0); });
  document.addEventListener('keydown', ev => {
    const tag = ev.target.tagName;
    if (tag === 'SELECT' || tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (ev.key === 'ArrowRight') { setStep(S.step + 1); ev.preventDefault(); }
    else if (ev.key === 'ArrowLeft') { setStep(S.step - 1); ev.preventDefault(); }
    else if (ev.key === 'PageDown' && S.step === 2) { stopPlay(); setIdx(S.idx + 1); ev.preventDefault(); }
    else if (ev.key === 'PageUp' && S.step === 2) { stopPlay(); setIdx(S.idx - 1); ev.preventDefault(); }
    else if (ev.key === 'PageDown' && S.step === 6) { stopAdvPlay(); setAdvIdx(S.advIdx + 1); ev.preventDefault(); }
    else if (ev.key === 'PageUp' && S.step === 6) { stopAdvPlay(); setAdvIdx(S.advIdx - 1); ev.preventDefault(); }
    else if (ev.key === 'Escape') { stopPlay(); stopAdvPlay(); }
  });
  renderAll();
  setStep(0);
}

try { init(); } catch (err) {
  const box = $('error');
  box.hidden = false;
  box.textContent = 'Ошибка запуска: ' + err.message;
  throw err;
}