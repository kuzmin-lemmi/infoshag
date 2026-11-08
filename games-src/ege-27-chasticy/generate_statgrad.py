# Свой файл 27_2.txt для урока по мотивам задания 27 СтатГрада.
# Формат как в задаче: x, y, Vx, Vy, m, признак I–VII; десятичная запятая,
# между значениями — пробелы и табуляции вперемешку. 5 кластеров, R = 5,61.
# Проверки: в каждом кластере нечётное число частиц (центр единственный),
# наименьшее и наибольшее число частиц V — каждое ровно в одном кластере.
# Запуск: python generate_statgrad.py  (seed фиксирован — файл всегда одинаковый)
import random

random.seed(20271112)
RANGES = [(32.33 + 7.04 * k, 37.93 + 7.04 * k) for k in range(5)]   # те же диапазоны, что в задаче
COUNTS = [1681] * 5
TYPES = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']
TAG = 'V'
SEPS = ['  ', '   ', '    ', ' \t', '  \t', '   \t']

while True:
    rows = []
    for (lo, hi), count in zip(RANGES, COUNTS):
        made = 0
        while made < count:
            e = random.uniform(lo, hi)
            vx, vy = random.uniform(-10, 10), random.uniform(-10, 10)
            if vx * vx + vy * vy < 2 * e / 99:          # масса не больше 100 (по условию)
                continue
            m = 2 * e / (vx * vx + vy * vy)
            E = 0.5 * m * (vx ** 2 + vy ** 2)
            if not lo <= E <= hi:
                continue
            rows.append([random.uniform(-6, 10), random.uniform(-7, 10), vx, vy, m, random.choice(TYPES), lo])
            made += 1
    counts = [sum(r[5] == TAG and r[6] == lo for r in rows) for lo, _ in RANGES]
    s = sorted(counts)
    if s[1] - s[0] >= 4 and s[-1] - s[-2] >= 4:
        break

random.shuffle(rows)
fmt = lambda v: repr(v).replace('.', ',')
with open('27_2.txt', 'w', newline='\r\n', encoding='utf-8') as f:
    for x, y, vx, vy, m, t, _ in rows:
        parts = [fmt(x), fmt(y), fmt(vx), fmt(vy), fmt(m), t]
        line = parts[0]
        for p in parts[1:]:
            line += random.choice(SEPS) + p
        f.write(line + '\n')
print(len(rows), 'частиц записано в 27_2.txt; частиц V по кластерам:', counts)
