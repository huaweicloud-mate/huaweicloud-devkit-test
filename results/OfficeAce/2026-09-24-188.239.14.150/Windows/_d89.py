import os, sys
sys.stdout.reconfigure(encoding='utf-8')
base = os.path.dirname(os.path.abspath(__file__))
for d in ['D8-7', 'D9-12', 'D9-13']:
    p = os.path.join(base, 'evidence', d)
    print('=====', d, 'isdir=', os.path.isdir(p))
    if os.path.isdir(p):
        for f in os.listdir(p):
            print('   ', f, os.path.getsize(os.path.join(p, f)))
        sp = os.path.join(p, 'stdout.log')
        if os.path.isfile(sp):
            print(open(sp, encoding='utf-8-sig').read()[:500])