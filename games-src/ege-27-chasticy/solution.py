# Программа из разбора — в точности как на странице (блок «Вся программа»).
from itertools import combinations

cl = [[], [], []]
for s in open('27.txt'):
    x, y, vx, vy, m, t = s.replace(',', '.').split()
    x, y, vx, vy, m = map(float, [x, y, vx, vy, m])
    E = 0.5 * m * (vx ** 2 + vy ** 2)
    if E < 4:
        cl[0].append([x, y, E, t])
    elif E < 7.5:
        cl[1].append([x, y, E, t])
    else:
        cl[2].append([x, y, E, t])


def dist(p1, p2):
    x1, y1, e1, t1 = p1
    x2, y2, e2, t2 = p2
    return ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5


def centr(group):
    m = []
    for p in group:
        s = sum(abs(p[2] - p1[2]) for p1 in group)
        m.append([s, p])
    return min(m)[1][2]


q1 = float('inf')
for group in cl:
    type_IV = [p for p in group if p[3] == 'IV']
    for p, p1 in combinations(type_IV, 2):
        q1 = min(q1, dist(p, p1))

centers = [centr(group) for group in cl]
q2 = sum(centers) / len(centers)
print(int(q1 * 10000), int(q2 * 10000))
