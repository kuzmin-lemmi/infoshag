# Генератор учебного файла 27.txt для разбора ege-27-chasticy.
# Данные свои: три кластера по энергии, признаки I–VI, десятичная запятая.
# Запуск: python generate.py  (результат детерминирован: seed фиксирован)
import math
import random

random.seed(20271031)
RANGES = [(1.2, 3.1, 301), (4.6, 6.5, 401), (8.2, 10.1, 351)]   # E от, E до, частиц
TYPES = ['I', 'II', 'III', 'IV', 'V', 'VI']

rows = []
for lo, hi, count in RANGES:
    mid, half = (lo + hi) / 2, (hi - lo) / 2
    made = 0
    while made < count:
        # энергия гуще к середине группы, но не выходит за её границы
        e = mid + half * (random.random() + random.random() - 1)
        m = round(random.uniform(0.5, 4.0), 2)
        v = math.sqrt(2 * e / m)
        a = random.uniform(0, 2 * math.pi)
        vx, vy = round(v * math.cos(a), 3), round(v * math.sin(a), 3)
        E = 0.5 * m * (vx ** 2 + vy ** 2)
        if not lo <= E <= hi:
            continue
        x, y = round(random.uniform(-20, 20), 3), round(random.uniform(-20, 20), 3)
        rows.append((x, y, vx, vy, m, random.choice(TYPES)))
        made += 1

random.shuffle(rows)
fmt = lambda v: f'{v:g}'.replace('.', ',')
with open('27.txt', 'w', newline='\r\n') as f:
    for x, y, vx, vy, m, t in rows:
        f.write('\t'.join([fmt(x), fmt(y), fmt(vx), fmt(vy), fmt(m), t]) + '\n')
print(len(rows), 'частиц записано в 27.txt')
