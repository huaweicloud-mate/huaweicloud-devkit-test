import os
d = 'evidence'
targets = ['D4-11','D4-13','D4-14','D4-17','D4-24','D4-25','D4-26','D4-27','D5-1','D5-3','D6-1','D6-3','D6-4','D6-9','D8-1','D8-4','D8-6','D8-9','D9-1','D9-2','D9-3','D9-4','D9-5','D9-7','D9-8','D10-3','D1-65','D1-67','D1-68','D2-2','D3-B1','D3-B5','D3-S5','D3-S6']
for c in targets:
    p = os.path.join(d, c, 'probe.mjs')
    t = open(p, encoding='utf-8').read()
    print('='*6, c, f'({len(t)})', '='*6)
    print(t)
    print()