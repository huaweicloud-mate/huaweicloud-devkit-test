import os, json, sys
sys.stdout.reconfigure(encoding='utf-8')
base = os.path.dirname(os.path.abspath(__file__))
ev = os.path.join(base, 'evidence')
for cid in ['D4-2', 'D4-16', 'D4-28']:
    p = os.path.join(ev, cid, 'stdout.log')
    print('=====', cid, '=====')
    print(open(p, encoding='utf-8-sig').read())
    print()