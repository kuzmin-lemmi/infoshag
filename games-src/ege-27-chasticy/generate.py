# Свой файл 27.txt для урока по мотивам задания 27 демоверсии 2027.
# Устроен как файл демоверсии: x, y, Vx, Vy, m, признак I–VII; 6 значащих цифр,
# десятичная запятая, табуляция; x, y от -20 до 20, масса до 2;
# 4 кластера (R = 2) с теми же диапазонами энергии, в файле идут блоками
# 801, 601, 501, 701 строка (в начале блока энергия меняется «ступеньками»).
# Число частиц в кластерах нечётное — центр кластера единственный.
# Запуск: python generate.py  (seed фиксирован — файл всегда одинаковый)
import math
import random

random.seed(20271111)
BLOCKS = [(9.1, 11.0, 801), (4.4, 5.7, 601), (1.2, 3.1, 501), (6.5, 8.3, 701)]   # порядок как в файле
TYPES = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']
sig = lambda v: float(f'{v:.6g}')

def particle(lo, hi):
    while True:
        e = random.uniform(lo, hi)
        m = sig(random.uniform(0.01, 2))
        v = math.sqrt(2 * e / m)
        a = random.uniform(0, 2 * math.pi)
        vx, vy = sig(v * math.cos(a)), sig(v * math.sin(a))
        E = 0.5 * m * (vx ** 2 + vy ** 2)
        if lo <= E <= hi:
            return [sig(random.uniform(-20, 20)), sig(random.uniform(-20, 20)), vx, vy, m, random.choice(TYPES), E]

rows = []
for lo, hi, count in BLOCKS:
    block = [particle(lo, hi) for _ in range(count)]
    k = count // 5                       # начало блока — энергия по убыванию «ступеньками»
    head = sorted(block[:k], key=lambda r: -r[6])
    rows += head + block[k:]

fmt = lambda v: f'{v:g}'.replace('.', ',')
with open('27.txt', 'w', newline='\r\n', encoding='utf-8') as f:
    for x, y, vx, vy, m, t, _ in rows:
        f.write('\t'.join([fmt(x), fmt(y), fmt(vx), fmt(vy), fmt(m), t]) + '\n')
print(len(rows), 'частиц записано в 27.txt')
