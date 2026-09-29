import os, sys
sys.stdout.reconfigure(encoding='utf-8')
base = os.path.dirname(os.path.abspath(__file__))
for d in ['D4-1','D2-4','D1-39','EXP-E01','D10-1','D3-C4','D6-3','D4-13']:
    p = os.path.join(base, 'evidence', d)
    print('=====', d, sorted(os.listdir(p)) if os.path.isdir(p) else 'MISSING')