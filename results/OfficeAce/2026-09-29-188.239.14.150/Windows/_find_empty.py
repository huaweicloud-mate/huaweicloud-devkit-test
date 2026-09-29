# -*- coding: utf-8 -*-
import io, os, json
base = os.path.dirname(os.path.abspath(__file__))
ev = os.path.join(base, 'evidence')
for d in sorted(os.listdir(ev)):
    p = os.path.join(ev, d, 'stdout.log')
    if not os.path.isfile(p):
        print('NO_LOG', d)
        continue
    raw = open(p, encoding='utf-8').read().strip()
    st = ''
    try:
        j = json.loads(raw)
        if isinstance(j, dict):
            if 'status' not in j and len(j) == 1:
                j = list(j.values())[0]
            st = (j.get('status') or '').upper()
    except Exception:
        pass
    if not st:
        if 'PASS' in raw.upper():
            st = 'PASS'
        elif 'FAIL' in raw.upper():
            st = 'FAIL'
    if not st:
        print('EMPTY_STATUS', d, '=>', raw[:200])