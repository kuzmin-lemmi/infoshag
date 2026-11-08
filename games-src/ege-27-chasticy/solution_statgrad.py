# Программа из урока (СтатГрад) — в точности как на слайде «Ответ».
from math import dist

cl = [[], [], [], [], []]
for s in open('27_2.txt'):
    x, y, vx, vy, m, t = s.replace(',', '.').split()
    x, y, vx, vy, m = map(float, [x, y, vx, vy, m])
    E = 0.5 * m * (vx ** 2 + vy ** 2)
    p = [x, y, E, t]
    if E < 38.5:
        cl[0].append(p)
    elif E < 45.5:
        cl[1].append(p)
    elif E < 52.5:
        cl[2].append(p)
    elif E < 59.5:
        cl[3].append(p)
    else:
        cl[4].append(p)

def centr(group):
    m = []
    for p in group:
        s = sum(abs(p[2] - p1[2]) for p1 in group)
        m.append([s, p])
    return min(m)[1]

centers = [centr(group) for group in cl]
counts = [sum(p[3] == 'V' for p in group) for group in cl]

i_min = counts.index(min(counts))
i_max = counts.index(max(counts))
q1 = centers[i_min][2]
q2 = dist([1, 4.5], centers[i_max][:2])
print(int(q1 * 10000), int(q2 * 10000))
