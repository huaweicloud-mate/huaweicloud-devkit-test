import os
d = 'evidence'
for x in ['D4-10','D4-13','D4-24','D5-1','D5-3','D6-1','D8-1','D9-1','D9-8']:
    p = os.path.join(d, x, 'probe.mjs')
    print('='*8, x, '='*8)
    if os.path.isfile(p):
        print(open(p, encoding='utf-8').read()[:600])
    else:
        print('(no probe.mjs)')
    print()