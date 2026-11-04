import sys, json
from itertools import product, permutations, combinations
from collections import Counter

def proof(id, c):
    alphabet, k = c['alphabet'], c['length']
    words = lambda: [''.join(p) for p in product(alphabet, repeat=k)]
    if id == 'product': return list(product(alphabet, repeat=k))
    if id == 'permutations': return list(permutations(c['word']))
    if id == 'combinations': return list(combinations(alphabet, k))
    if id == 'join': return words()
    if id == 'unique': return sorted(set(''.join(p) for p in permutations(c['word'])))
    if id == 'map':
        it = map(''.join, product(alphabet, repeat=k))
        return [list(it), list(it)]
    if id in ['count', 'sum_words', 'sum_letters']:
        return [[w, n, n == c['need']] for w in words()
                for n in [sum(x in c['vowels'] for x in w) if id == 'sum_letters' else w.count(c['char'])]]
    if id == 'membership': return [c['pattern'] in c['word'], c['pattern'] not in c['word'], c['word'].find(c['pattern'])]
    if id == 'edges': return [c['word'].startswith(c['pattern']), c['word'].endswith(c['pattern'])]
    if id == 'positions': return list(product(c['first'], *([alphabet] * (k-2)), c['last']))
    if id == 'any_all': return [[w, any(x in c['vowels'] for x in w), all(x in c['vowels'] for x in w)] for w in words()]
    if id == 'neighbors': return [[w, all(x != y for x, y in zip(w, w[1:]))] for w in words()]
    if id == 'overlap': return [[i for i in range(len(c['word'])-len(c['pattern'])+1) if c['word'].startswith(c['pattern'], i)], c['word'].count(c['pattern'])]
    if id == 'counter':
        target = c['word']
        return [''.join(p) for p in product(''.join(dict.fromkeys(target)), repeat=len(target)) if Counter(p) == Counter(target)]
    if id == 'translate': return c['word'].translate(str.maketrans({x: 'Г' if x in c['vowels'] else 'Д' for x in set(c['word'])}))
    if id == 'enumerate': return [[i, w, w.count(c['char']) == c['need'] and (c['parity'] == 'any' or i % 2 == (0 if c['parity'] == 'even' else 1))] for i, w in enumerate(words(), c['start'])]
    if id == 'order': return [words(), [''.join(p) for p in product(sorted(alphabet), repeat=k)]]
    if id in ['first', 'last']:
        answer, examined = None, 0
        for i, w in enumerate(words(), 1):
            examined += 1
            if w.count(c['char']) == c['need']:
                answer = [i, w]
                if id == 'first': break
        return [answer, examined]
    if id == 'islice':
        from itertools import islice
        p = next(islice(product(alphabet, repeat=k), c['number']-1, c['number']), None)
        return ''.join(p) if p is not None else None
    raise ValueError(id)

cases = json.load(sys.stdin)
out = []
for case in cases:
    # Каждый показанный пример дополнительно компилируется и запускается.
    namespace = {'__name__': '__main__'}
    import contextlib, io
    with contextlib.redirect_stdout(io.StringIO()):
        exec(compile(case['code'], '<displayed-code>', 'exec'), namespace)
    out.append(proof(case['id'], case['config']))
json.dump(out, sys.stdout, ensure_ascii=False)
