# Оракул разбора задания 2: независимо пересчитывает таблицу истинности,
# запускает обе показанные программы на Python и решает фрагмент перебором.
# Вход (stdin): JSON-список случаев. Выход (stdout): JSON-список результатов.
import io
import json
import sys
from contextlib import redirect_stdout
from itertools import permutations, product


def run(code):
    buf = io.StringIO()
    with redirect_stdout(buf):
        exec(compile(code, '<guide>', 'exec'), {})
    return buf.getvalue()


def solve(expr, target, fragment):
    blanks = [(i, j) for i, row in enumerate(fragment)
              for j, val in enumerate(row[:4]) if val < 0]
    answers = []
    checks = 0
    for p in permutations(range(4)):
        for a in product([0, 1], repeat=len(blanks)):
            checks += 1
            rows = [r[:] for r in fragment]
            for (i, j), val in zip(blanks, a):
                rows[i][j] = val
            if len(set(map(tuple, rows))) != 3:
                continue
            ok = True
            for r in rows:
                x, y, z, w = (r[p[j]] for j in range(4))
                if eval(expr, {'x': x, 'y': y, 'z': z, 'w': w}) != r[4] or r[4] != target:
                    ok = False
                    break
            if ok:
                ans = [''] * 4
                for j in range(4):
                    ans[p[j]] = 'xyzw'[j]
                answers.append(''.join(ans))
    return answers, checks


cases = json.load(sys.stdin)
out = []
for c in cases:
    expr, target = c['expr'], c['target']
    table = []
    for i in range(16):
        x, y, z, w = (i >> 3) & 1, (i >> 2) & 1, (i >> 1) & 1, i & 1
        table.append([x, y, z, w, int(bool(eval(expr, {'x': x, 'y': y, 'z': z, 'w': w})))])
    printed = run(c['mainCode'])
    printed_rows = [[int(t) for t in line.split()] for line in printed.splitlines()[1:]]
    product_rows = [[int(t) for t in line.split()] for line in run(c['productCode']).splitlines()[1:]]
    advanced = run(c['advancedCode']).split()
    answers, checks = solve(expr, target, c['fragment'])
    out.append({
        'table': table,
        'printedRows': printed_rows,
        'productRows': product_rows,
        'header': printed.splitlines()[0],
        'advancedAnswers': advanced,
        'answers': answers,
        'checks': checks,
    })
json.dump(out, sys.stdout)