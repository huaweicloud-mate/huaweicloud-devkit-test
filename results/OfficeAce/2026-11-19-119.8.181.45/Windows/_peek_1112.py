# -*- coding: utf-8 -*-
import io, sys, os, json
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
ev = os.path.join(REPO, 'results', 'OfficeAce', '2026-11-12-119.8.181.45', 'Windows', 'evidence')
print(sorted(os.listdir(ev)))
for g in sorted(os.listdir(ev)):
    p = os.path.join(ev, g, 'stdout.log')
    if os.path.isfile(p):
        try:
            d = json.load(open(p, encoding='utf-8'))
            s = d.get('status') if isinstance(d, dict) else '?'
            n = len(d.get('results', [])) if isinstance(d, dict) else '?'
            print(g, s, 'results:', n)
        except Exception as e:
            print(g, 'ERR', e)
