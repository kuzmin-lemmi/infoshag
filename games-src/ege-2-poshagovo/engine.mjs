// Движок разбора задания 2 ЕГЭ: логические выражения, таблицы истинности,
// трасса программы, генерация собственных задач, проверка сопоставления столбцов.
// Все числа для страницы считаются здесь, а не пишутся вручную.

export const VARS = ['x', 'y', 'z', 'w'];

// Детерминированный генератор случайных чисел (mulberry32) — задача воспроизводится по seed.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const v = name => ({op: 'var', name});
const not = a => ({op: 'not', a});
const bin = (op, a, b) => ({op, a, b});
const and = (a, b) => bin('and', a, b);
const or = (a, b) => bin('or', a, b);
const impl = (a, b) => bin('impl', a, b);
const eq = (a, b) => bin('eq', a, b);
const xor = (a, b) => bin('xor', a, b);

export function evalAst(node, env) {
  switch (node.op) {
    case 'var': return env[node.name];
    case 'not': return 1 - evalAst(node.a, env);
    case 'and': return evalAst(node.a, env) & evalAst(node.b, env);
    case 'or': return evalAst(node.a, env) | evalAst(node.b, env);
    case 'impl': return (1 - evalAst(node.a, env)) | evalAst(node.b, env);
    case 'eq': return evalAst(node.a, env) === evalAst(node.b, env) ? 1 : 0;
    case 'xor': return evalAst(node.a, env) !== evalAst(node.b, env) ? 1 : 0;
  }
  throw Error('Неизвестная операция: ' + node.op);
}

export function toPython(node) {
  switch (node.op) {
    case 'var': return node.name;
    case 'not': return `(not ${toPython(node.a)})`;
    case 'and': return `(${toPython(node.a)} and ${toPython(node.b)})`;
    case 'or': return `(${toPython(node.a)} or ${toPython(node.b)})`;
    case 'impl': return `((not ${toPython(node.a)}) or ${toPython(node.b)})`;
    case 'eq': return `(${toPython(node.a)} == ${toPython(node.b)})`;
    case 'xor': return `(${toPython(node.a)} != ${toPython(node.b)})`;
  }
  throw Error('Неизвестная операция: ' + node.op);
}

export function toMath(node, top = true) {
  const sym = {and: '∧', or: '∨', impl: '→', eq: '≡', xor: '⊕'};
  let s;
  if (node.op === 'var') s = node.name;
  else if (node.op === 'not') s = `¬${toMath(node.a, false)}`;
  else s = `(${toMath(node.a, false)} ${sym[node.op]} ${toMath(node.b, false)})`;
  return top && s.startsWith('(') && s.endsWith(')') ? s.slice(1, -1) : s;
}

function rename(node, map) {
  if (node.op === 'var') return v(map[node.name]);
  if (node.op === 'not') return not(rename(node.a, map));
  return bin(node.op, rename(node.a, map), rename(node.b, map));
}

// Собственные выражения для разбора: конъюнкции из 2–4 множителей, все четыре переменные.
const SKELETONS = [
  and(impl(v('x'), v('y')), and(eq(v('y'), v('z')), not(v('w')))),
  and(or(v('x'), v('y')), and(not(eq(v('z'), v('w'))), impl(v('w'), v('x')))),
  and(eq(v('x'), v('y')), and(impl(v('y'), v('z')), not(v('w')))),
  and(not(and(v('x'), v('y'))), and(impl(v('z'), v('w')), or(v('x'), v('z')))),
  and(impl(v('x'), not(v('y'))), and(eq(v('z'), v('w')), or(v('y'), v('z')))),
  and(or(not(v('x')), v('y')), and(not(eq(v('y'), v('z'))), impl(v('w'), v('z')))),
  and(impl(v('x'), v('y')), and(impl(v('y'), v('z')), and(impl(v('z'), v('w')), not(v('x'))))),
  and(xor(v('x'), v('y')), and(eq(v('z'), v('w')), impl(v('x'), v('z')))),
  and(not(or(v('x'), v('y'))), or(eq(v('z'), v('w')), impl(v('x'), v('z')))),
  and(impl(v('x'), v('y')), and(not(eq(v('y'), v('w'))), or(v('z'), v('w')))),
];

export function fullTable(ast) {
  const rows = [];
  for (let i = 0; i < 16; i++) {
    const env = {x: (i >> 3) & 1, y: (i >> 2) & 1, z: (i >> 1) & 1, w: i & 1};
    rows.push([env.x, env.y, env.z, env.w, evalAst(ast, env)]);
  }
  return rows;
}

export function permutations(items) {
  if (items.length <= 1) return [items.slice()];
  const out = [];
  items.forEach((it, i) => {
    const rest = items.slice(0, i).concat(items.slice(i + 1));
    for (const p of permutations(rest)) out.push([it, ...p]);
  });
  return out;
}

export function product01(k) {
  let out = [[]];
  for (let i = 0; i < k; i++) out = out.flatMap(p => [p.concat(0), p.concat(1)]);
  return out;
}

// Фрагмент: три строки по 5 чисел (4 переменные + F), пропуск = -1.
// Перебор всех перестановок «переменная → столбец» и всех заполнений пропусков.
export function solveFragment(ast, target, fragment) {
  const blanks = [];
  fragment.forEach((row, i) => row.slice(0, 4).forEach((val, j) => { if (val < 0) blanks.push([i, j]); }));
  const fillings = product01(blanks.length);
  const answers = [];
  let checks = 0;
  for (const p of permutations([0, 1, 2, 3])) {
    for (const a of fillings) {
      checks++;
      const rows = fragment.map(r => r.slice());
      blanks.forEach(([i, j], t) => { rows[i][j] = a[t]; });
      const seen = new Set(rows.map(r => r.join(',')));
      if (seen.size !== rows.length) continue;
      const ok = rows.every(r => {
        const env = {x: r[p[0]], y: r[p[1]], z: r[p[2]], w: r[p[3]]};
        return evalAst(ast, env) === r[4] && r[4] === target;
      });
      if (ok) {
        const ans = ['?', '?', '?', '?'];
        p.forEach((col, j) => { ans[col] = VARS[j]; });
        answers.push(ans.join(''));
      }
    }
  }
  return {answers, checks, blankCount: blanks.length, permutations: 24, fillings: fillings.length};
}

function shuffle(arr, rand) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function makeTask(seed) {
  const rand = rng(seed);
  for (let attempt = 0; attempt < 80; attempt++) {
    const skeleton = SKELETONS[Math.floor(rand() * SKELETONS.length)];
    const names = shuffle(VARS, rand);
    const map = Object.fromEntries(VARS.map((name, i) => [name, names[i]]));
    const ast = rename(skeleton, map);
    const table = fullTable(ast);
    const ones = table.filter(r => r[4] === 1);
    const zeros = table.filter(r => r[4] === 0);
    let target, sol;
    if (ones.length >= 3 && ones.length <= 6) { target = 1; sol = ones; }
    else if (zeros.length >= 3 && zeros.length <= 6) { target = 0; sol = zeros; }
    else continue;
    // p[j] — столбец фрагмента, в котором стоит переменная j.
    const p = shuffle([0, 1, 2, 3], rand);
    const colOf = p.slice();
    const varOf = [0, 0, 0, 0];
    p.forEach((col, j) => { varOf[col] = j; });
    const picked = shuffle(sol, rand).slice(0, 3);
    const base = picked.map(r => [r[varOf[0]], r[varOf[1]], r[varOf[2]], r[varOf[3]], target]);
    for (let t = 0; t < 40; t++) {
      const k = 2 + Math.floor(rand() * 3);
      const cells = shuffle([[0,0],[0,1],[0,2],[0,3],[1,0],[1,1],[1,2],[1,3],[2,0],[2,1],[2,2],[2,3]], rand).slice(0, k);
      const fragment = base.map(r => r.slice());
      cells.forEach(([i, j]) => { fragment[i][j] = -1; });
      const solved = solveFragment(ast, target, fragment);
      if (solved.answers.length === 1) {
        return {
          seed, ast, target, table, sol, fragment, colOf, varOf,
          answer: solved.answers[0],
          pythonExpr: toPython(ast), mathExpr: toMath(ast),
          blankCount: solved.blankCount, checks: solved.checks,
        };
      }
    }
  }
  throw Error('Не удалось сгенерировать задачу для seed ' + seed);
}

// ---------- Программа разбора ----------

export function programLines(task) {
  const cond = task.target === 1 ? 'if F:' : 'if F == 0:';
  const condNote = task.target === 1
    ? 'Условие вывода: F истинно. Запись if F: равносильна if F == 1: — в Python True ведёт себя как 1, False как 0.'
    : 'В этой задаче нужны строки, где функция ложна, поэтому выводим при F == 0.';
  return [
    {code: "print('x y z w')", note: 'Заголовок таблицы. Буквы идут в том же порядке, что и циклы ниже, — так удобнее сопоставлять столбцы.'},
    {code: 'for x in 0, 1:', note: 'Внешний цикл: переменная x принимает значения 0 и 1. Кортеж 0, 1 можно писать без скобок. Внешний цикл меняется медленнее всех.'},
    {code: '    for y in 0, 1:', note: 'Второй цикл: для каждого значения x переменная y пробегает 0 и 1.'},
    {code: '        for z in 0, 1:', note: 'Третий цикл: переменная z. Четыре вложенных цикла перебирают все 2⁴ = 16 наборов значений.'},
    {code: '            for w in 0, 1:', note: 'Внутренний цикл: w меняется быстрее всех. Наборы идут в порядке возрастания двоичного кода: 0000, 0001, …, 1111.'},
    {code: `                F = ${task.pythonExpr}`, note: `Вычисляем функцию. Логика переведена на Python: ∧ → and, ∨ → or, ¬ → not, ≡ → ==, импликация a → b → (not a) or b. Скобки обязательны: в Python сравнение == выполняется раньше and и or. Выражение задачи: ${task.mathExpr}.`},
    {code: `                ${cond}`, note: condNote},
    {code: '                    print(x, y, z, w)', note: 'Печатаем только подходящие строки — получается часть таблицы истинности, которую и сравниваем с фрагментом из условия.'},
  ];
}

export function mainProgram(task) {
  return programLines(task).map(l => l.code).join('\n') + '\n';
}

export function productProgram(task) {
  const cond = task.target === 1 ? 'if F:' : 'if F == 0:';
  return [
    'from itertools import product',
    "print('x y z w')",
    'for x, y, z, w in product([0, 1], repeat=4):',
    `    F = ${task.pythonExpr}`,
    `    ${cond}`,
    '        print(x, y, z, w)',
  ].join('\n') + '\n';
}

// Трасса построчного выполнения главной программы.
export function trace(task) {
  const events = [{line: 1, vars: {}, note: 'Программа начинает работу с заголовка таблицы.', print: null}];
  const rows = [];
  let n = 0;
  for (const r of task.table) {
    const [x, y, z, w, F] = r;
    n++;
    const env = {x, y, z, w};
    events.push({line: 2, vars: {x}, note: `Новый оборот внешнего цикла: x = ${x}.`, print: null});
    events.push({line: 3, vars: {x, y}, note: `y = ${y}.`, print: null});
    events.push({line: 4, vars: {x, y, z}, note: `z = ${z}.`, print: null});
    events.push({line: 5, vars: env, note: `w = ${w}. Набор ${n} из 16: (${x}, ${y}, ${z}, ${w}).`, print: null});
    events.push({line: 6, vars: {...env, F}, note: `Подставляем значения в выражение и вычисляем: F = ${F}.`, print: null});
    const fit = F === task.target;
    events.push({line: 7, vars: {...env, F}, note: fit ? `F = ${task.target} — строка подходит, выводим её.` : `F = ${F} — строка не подходит, пропускаем её.`, print: null});
    if (fit) {
      rows.push([x, y, z, w]);
      events.push({line: 8, vars: {...env, F}, note: `Строка (${x}, ${y}, ${z}, ${w}) добавлена в вывод. Всего выведено строк: ${rows.length}.`, print: [x, y, z, w]});
    }
  }
  return events;
}

// ---------- Сопоставление столбцов ----------

// assign[c] — номер переменной (0..3) в столбце c, либо null.
export function checkMapping(task, assign) {
  if (assign.some(a => a === null)) return {status: 'incomplete'};
  if (new Set(assign).size !== 4) return {status: 'invalid', reason: 'Каждая переменная должна стоять ровно в одном столбце: выбери четыре разные буквы.'};
  const p = [0, 0, 0, 0];
  assign.forEach((j, c) => { p[j] = c; });
  const blanks = [];
  task.fragment.forEach((row, i) => row.slice(0, 4).forEach((val, j) => { if (val < 0) blanks.push([i, j]); }));
  for (const a of product01(blanks.length)) {
    const rows = task.fragment.map(r => r.slice());
    blanks.forEach(([i, j], t) => { rows[i][j] = a[t]; });
    if (new Set(rows.map(r => r.join(','))).size !== rows.length) continue;
    const ok = rows.every(r => {
      const env = {x: r[p[0]], y: r[p[1]], z: r[p[2]], w: r[p[3]]};
      return evalAst(task.ast, env) === r[4];
    });
    if (ok) return {status: 'ok', answer: assign.map(j => VARS[j]).join(''), rows};
  }
  // Ищем конкретное противоречие: строка фрагмента, которой нет среди решений.
  for (let i = 0; i < task.fragment.length; i++) {
    const frag = task.fragment[i];
    const compatible = task.sol.filter(s => frag.slice(0, 4).every((val, c) => val < 0 || s[assign[c]] === val));
    if (compatible.length === 0) {
      const known = frag.slice(0, 4).map((val, c) => val < 0 ? null : `${VARS[assign[c]]} = ${val}`).filter(Boolean).join(', ');
      return {status: 'bad', reason: `Строка ${i + 1} фрагмента (${known}) не совпадает ни с одной из ${task.sol.length} строк решений: при таком порядке столбцов функция не даёт F = ${task.target}.`};
    }
  }
  return {status: 'bad', reason: `При таком порядке столбцов пустые клетки нельзя заполнить так, чтобы все три строки фрагмента оказались различными строками решений (F = ${task.target}).`};
}

export function hints(task) {
  const out = [];
  const ones = VARS.map((_, j) => task.sol.filter(r => r[j] === 1).length);
  VARS.forEach((name, j) => {
    if (ones[j] === 0) out.push(`Переменная ${name} во всех ${task.sol.length} строках решений равна 0. Её столбец во фрагменте не может содержать единиц.`);
    else if (ones[j] === task.sol.length) out.push(`Переменная ${name} во всех строках решений равна 1. Её столбец во фрагменте не может содержать нулей.`);
  });
  out.push(`В таблице решений ${task.sol.length} строк. Посчитай единицы в каждом столбце фрагмента и сравни с числом единиц у переменных в строках решений: столбец с «лишними» единицами уже не может быть переменной, у которой их меньше.`);
  out.push(`Строки фрагмента не повторяются. Если после подстановки двух строк решений пустые клетки вынужденно совпадут, такой порядок столбцов не подходит.`);
  return out.slice(0, 4);
}

// ---------- «Проверь себя» ----------

export function quiz(task) {
  const rand = rng(task.seed + 7);
  const n = task.sol.length;
  const qs = [];
  qs.push({
    q: 'Сколько строк в полной таблице истинности функции четырёх переменных?',
    options: shuffle([
      {text: '16', ok: true, why: 'Каждая из 4 переменных принимает 2 значения: 2⁴ = 16 строк.'},
      {text: '4', ok: false, why: '4 — это число переменных, а строк 2⁴ = 16.'},
      {text: '8', ok: false, why: '8 = 2³ — столько строк у функции трёх переменных. Здесь переменных четыре: 2⁴ = 16.'},
      {text: '12', ok: false, why: 'Строк столько, сколько наборов значений: 2⁴ = 16, а не 4·3 = 12.'},
    ], rand),
  });
  const implOptions = [
    {text: 'not x or y', ok: true, why: 'Импликация x → y ложна только при x = 1, y = 0 — это в точности not x or y.'},
    {text: 'x and not y', ok: false, why: ''},
    {text: 'x == y', ok: false, why: ''},
    {text: 'not x and y', ok: false, why: ''},
  ];
  const implFn = {
    'x and not y': (a, b) => a & (1 - b),
    'x == y': (a, b) => a === b ? 1 : 0,
    'not x and y': (a, b) => (1 - a) & b,
  };
  for (const opt of implOptions) {
    if (opt.ok) continue;
    const f = implFn[opt.text];
    const pair = [[0,0],[0,1],[1,0],[1,1]].find(([a, b]) => f(a, b) !== ((1 - a) | b));
    opt.why = `При x = ${pair[0]}, y = ${pair[1]} импликация равна ${(1 - pair[0]) | pair[1]}, а ${opt.text} даёт ${f(pair[0], pair[1])}. Верная запись: not x or y (или x <= y для 0/1).`;
  }
  qs.push({q: 'Как записать импликацию x → y на Python?', options: shuffle(implOptions, rand)});
  const printed = shuffle(task.sol, rand)[0].slice(0, 4);
  const wrongRows = shuffle(task.table.filter(r => r[4] !== task.target), rand).slice(0, 3);
  qs.push({
    q: `Какую строку напечатает программа? (выводятся только строки с F = ${task.target})`,
    options: shuffle([
      {text: printed.join(' '), ok: true, why: `При (${printed.join(', ')}) функция F = ${task.target} — программа выведет эту строку.`},
      ...wrongRows.map(r => ({text: r.slice(0, 4).join(' '), ok: false, why: `При (${r.slice(0, 4).join(', ')}) функция F = ${r[4]}, а программа печатает только строки с F = ${task.target}.`})),
    ], rand),
  });
  const countOptions = [{text: String(n), ok: true, why: `Программа печатает строки, где F = ${task.target}; в полной таблице их ${n}.`}];
  for (const cand of [16, n + 1, 3, n - 1]) {
    if (countOptions.length >= 4) break;
    if (cand === n || cand < 0 || countOptions.some(o => o.text === String(cand))) continue;
    const why = cand === 16 ? '16 — это вся таблица истинности, а программа печатает только подходящие строки.'
      : cand === 3 ? '3 — это число строк во фрагменте из условия, а не число строк, которые напечатает программа.'
      : `Программа печатает строки, где F = ${task.target}; подсчёт по полной таблице даёт ${n}, а не ${cand}.`;
    countOptions.push({text: String(cand), ok: false, why});
  }
  qs.push({q: 'Сколько строк напечатает программа для этой функции?', options: shuffle(countOptions, rand)});
  qs.push({
    q: 'Что Python вычислит первым в выражении x or y == z?',
    options: shuffle([
      {text: 'сравнение y == z', ok: true, why: 'В Python сравнения (==, !=, <=, …) выполняются раньше and и or. Поэтому эквивалентность в логических выражениях берут в скобки: x or (y == z).'},
      {text: 'x or y', ok: false, why: 'Операция or выполняется после сравнений: сначала y == z, потом x or результат.'},
      {text: 'всё слева направо', ok: false, why: 'Python соблюдает приоритет операций: сравнение == старше or, поэтому порядок не слева направо.'},
      {text: 'сначала or, потом ==', ok: false, why: 'Наоборот: сравнение == выполняется раньше or. Без скобок смысл выражения меняется.'},
    ], rand),
  });
  return qs;
}

// ---------- Программа, которая решает задачу целиком ----------

export function advancedProgram(task) {
  const rows = task.fragment.map(r => '    [' + r.join(', ') + '],').join('\n');
  return `from itertools import product, permutations

def f(x, y, z, w):
    return int(${task.pythonExpr})

# строки фрагмента: -1 — пустая клетка, последнее число — F
st = [
${rows}
]
names = 'xyzw'
blanks = [(i, j) for i in range(3) for j in range(4) if st[i][j] < 0]
for p in permutations(range(4)):      # p[j] — столбец переменной j
    for a in product([0, 1], repeat=len(blanks)):
        rows = [r[:] for r in st]
        for (i, j), val in zip(blanks, a):
            rows[i][j] = val
        if len(set(map(tuple, rows))) != 3:
            continue                  # строки фрагмента не повторяются
        if all(f(*[r[p[j]] for j in range(4)]) == r[4] for r in rows):
            ans = [''] * 4
            for j in range(4):
                ans[p[j]] = names[j]
            print(''.join(ans))
            break
`;
}

// Построчные комментарии к автоматическому решению: номер строки -> пояснение.
export function advancedLines(task) {
  const rowNote = i => `Строка ${i + 1} фрагмента: [${task.fragment[i].join(', ')}]. Четыре столбца и F последним; -1 — пустая клетка, которую предстоит заполнить.`;
  const notes = {
    1: 'Подключаем из itertools две функции: permutations — все перестановки столбцов, product — все заполнения пустых клеток.',
    3: 'Объявляем функцию f от четырёх переменных — это логическая функция задачи. Отдельная функция нужна, чтобы вызывать её для каждой строки-кандидата.',
    4: 'Тело функции: то же выражение, что в переборной программе, но обёрнуто в int(...), чтобы результат был числом 0/1, а не True/False. Скобки вокруг сравнений обязательны.',
    6: 'Комментарий в коде поясняет формат данных ниже: -1 — пустая клетка, последнее число — F.',
    7: 'Начало списка st — фрагмент таблицы истинности из условия.',
    8: rowNote(0), 9: rowNote(1), 10: rowNote(2),
    11: 'Конец списка st: три строки фрагмента загружены.',
    12: 'Имена переменных в фиксированном порядке. Явная строка вместо чтения имён из кода функции — поэтому программа не ломается на Python 3.12.',
    13: 'Генератор списка собирает координаты всех пустых клеток (строка i, столбец j): проходит по всем 3×4 клеткам и берёт те, где стоит -1.',
    14: 'Внешний цикл: p — перестановка чисел 0..3, p[j] = столбец переменной j. Всего 4! = 24 перестановки столбцов.',
    15: 'Внутренний цикл: a — одно заполнение пропусков, кортеж из 0/1 длины len(blanks). product даёт все 2^len(blanks) заполнений.',
    16: 'Копируем фрагмент в rows, чтобы не портить исходный st: r[:] — копия каждой строки.',
    17: 'zip(blanks, a) соединяет координаты пропусков со значениями заполнения: каждому пропуску достаётся свой 0 или 1.',
    18: 'Подставляем значение в пустую клетку: rows[i][j] = val.',
    19: 'Проверяем, что три строки различны: set из кортежей должен содержать 3 элемента. map(tuple, ...) превращает строки-списки в кортежи, чтобы их можно было положить в set.',
    20: 'Если строки совпали — кандидат не подходит (в условии строки различные): continue пропускает остальное и берёт следующее заполнение.',
    21: 'Главная проверка: для каждой строки вызываем f от значений в порядке переменных (r[p[j]] — значение переменной j) и сравниваем с F строки (r[4]). all(...) истинно, только если совпало всё.',
    22: 'Готовим пустой ответ из четырёх клеток — по одной на столбец фрагмента.',
    23: 'Проходим по переменным j = 0..3.',
    24: 'Ставим имя переменной j в её столбец p[j]: ответ собирается в порядке столбцов, а не в порядке переменных.',
    25: 'Печатаем ответ — буквы переменных в порядке столбцов фрагмента.',
    26: 'Подходящий кандидат найден: break выходит из цикла заполнений. Ответ единственный, поэтому дальше перебор ничего нового не даст.',
  };
  const out = [];
  advancedProgram(task).split('\n').forEach((code, i) => {
    const line = i + 1;
    if (!code.trim()) return;
    out.push({line, code, note: notes[line] || ''});
  });
  return out;
}

// Трасса автоматического решения: перебор перестановок и заполнений до первого ответа.
export function advancedTrace(task) {
  const blanks = [];
  task.fragment.forEach((row, i) => row.slice(0, 4).forEach((val, j) => { if (val < 0) blanks.push([i, j]); }));
  const fillings = product01(blanks.length);
  const perms = permutations([0, 1, 2, 3]);
  const events = [];
  const push = (line, note, extra = {}) => events.push({line, note, print: null, ...extra});
  const frag = () => task.fragment.map(r => r.slice());
  push(1, 'Подключаем product и permutations из itertools.');
  push(3, 'Объявляем функцию f — логическую функцию задачи.');
  push(4, 'f возвращает int(выражение): число 0/1.');
  push(6, 'Комментарий: формат фрагмента.');
  push(7, 'Создаём список st — фрагмент из условия.', {rows: frag()});
  push(8, 'Строка 1 фрагмента.', {rows: frag()});
  push(9, 'Строка 2 фрагмента.', {rows: frag()});
  push(10, 'Строка 3 фрагмента.', {rows: frag()});
  push(11, 'Список st готов.', {rows: frag()});
  push(12, 'names = xyzw — фиксированный порядок переменных.');
  push(13, `Пустых клеток: ${blanks.length}. Координаты: ${blanks.map(([i, j]) => `(${i + 1},${j + 1})`).join(', ')}.`, {rows: frag()});
  let cand = 0;
  for (let pi = 0; pi < perms.length; pi++) {
    const p = perms[pi];
    push(14, `Перестановка ${pi + 1} из 24: p = (${p.join(', ')}). ${VARS.map((n, j) => `${n} → столбец ${p[j] + 1}`).join(', ')}.`, {p, rows: frag()});
    for (let ai = 0; ai < fillings.length; ai++) {
      const a = fillings[ai];
      cand++;
      push(15, `Заполнение ${ai + 1} из ${fillings.length}: a = (${a.join(', ')}). Кандидат №${cand}.`, {p, a, rows: frag()});
      push(16, 'Копируем фрагмент в rows.', {p, a, rows: frag()});
      push(17, 'zip соединяет координаты пропусков со значениями a.', {p, a, rows: frag()});
      const rows = frag();
      blanks.forEach(([i, j], t) => { rows[i][j] = a[t]; });
      push(18, 'Пустые клетки заполнены.', {p, a, rows});
      const distinct = new Set(rows.map(r => r.join(','))).size === rows.length;
      if (!distinct) {
        push(19, 'Строки совпали: set меньше 3.', {p, a, rows, verdict: 'dup'});
        push(20, 'continue: кандидат отброшен — строки фрагмента должны быть различными.', {p, a, rows, verdict: 'dup'});
        continue;
      }
      push(19, 'Три строки различны — проверяем функцию.', {p, a, rows});
      let bad = -1, badVal = 0;
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const env = {x: r[p[0]], y: r[p[1]], z: r[p[2]], w: r[p[3]]};
        const val = evalAst(task.ast, env);
        if (val !== r[4]) { bad = i; badVal = val; break; }
      }
      if (bad >= 0) {
        push(21, `Строка ${bad + 1} не совпала: f даёт ${badVal}, а во фрагменте F = ${rows[bad][4]}. Кандидат отброшен.`, {p, a, rows, verdict: 'nomatch'});
        continue;
      }
      push(21, 'all(...) истинно: все три строки дают нужное F.', {p, a, rows, verdict: 'match'});
      push(22, 'Готовим ответ из четырёх клеток.', {p, a, rows, verdict: 'match'});
      push(23, 'Проходим по переменным j = 0..3.', {p, a, rows, verdict: 'match'});
      const ans = ['', '', '', ''];
      p.forEach((col, j) => { ans[col] = VARS[j]; });
      push(24, `Ответ собран: ${ans.join('')}.`, {p, a, rows, verdict: 'match'});
      push(25, `Печатаем ответ: ${ans.join('')}.`, {p, a, rows, verdict: 'match', print: ans.join('')});
      push(26, 'break: ответ найден и единственный, перебор можно остановить.', {p, a, rows, verdict: 'match'});
      return events;
    }
  }
  return events;
}