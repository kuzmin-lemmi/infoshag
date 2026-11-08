# Программа из урока — в точности как на слайде «Ответ».
from itertools import combinations
from math import dist

cl = [[], [], [], []]
for s in open('27.txt'):
    x, y, vx, vy, m, t = s.replace(',', '.').split()
    x, y, vx, vy, m = map(float, [x, y, vx, vy, m])
    E = 0.5 * m * (vx ** 2 + vy ** 2)
    p = [x, y, E, t]
    if E < 3.5:
        cl[0].append(p)
    elif E < 6:
        cl[1].append(p)
    elif E < 8.5:
        cl[2].append(p)
    else:
        cl[3].append(p)

def centr(group):
    m = []
    for p in group:
        s = sum(abs(p[2] - p1[2]) for p1 in group)
        m.append([s, p])
    return min(m)[1][2]

q1 = 0
for group in cl:
    type_III = [p for p in group if p[3] == 'III']
    for p, p1 in combinations(type_III, 2):
        q1 = max(q1, dist(p[:2], p1[:2]))

centers = [centr(group) for group in cl]
q2 = max(centers)
print(int(q1 * 10000), int(q2 * 10000))
