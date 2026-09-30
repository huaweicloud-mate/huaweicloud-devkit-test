import os
d = 'evidence'
for x in ['D1-26','D1-27','D1-3','D1-31','D4-10','D9-1','D6-1','D8-1','D2-12','D5-1']:
    p = os.path.join(d, x, 'stdout.log')
    print('='*8, x, '='*8)
    if os.path.isfile(p):
        print(repr(open(p, encoding='utf-8').read()[:400]))
    else:
        print('(no stdout.log)')
    print()