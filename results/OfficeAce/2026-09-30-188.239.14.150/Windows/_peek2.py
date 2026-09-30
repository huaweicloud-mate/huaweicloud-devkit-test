import os
d = 'evidence'
for c in ['D1-4','D1-30','D1-33','D1-65','D1-67','D1-68','D2-2','D3-B1','D3-B5','D3-S5','D3-S6','D10-3']:
    p = os.path.join(d, c, 'probe.mjs')
    t = open(p, encoding='utf-8').read()
    print('='*8, c, f'({len(t)} chars)', '='*8)
    print(t[:700])
    print()