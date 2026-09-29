# -*- coding: utf-8 -*-
import io, os, json
base = os.path.dirname(os.path.abspath(__file__))
ev = os.path.join(base, 'evidence')
for d in sorted(os.listdir(ev)):
    p = os.path.join(ev, d, 'stdout.log')
    if not os.path.isfile(p):
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
    if not st and j is dict and 'pass' in j:
        st = 'PASS' if j['pass'] else 'FAIL'
    for s in ('SPEC-MISMATCH', 'BLOCKED', 'NOT_RUN', 'FAIL', 'PASS'):
        if s in st:
            break
    else:
        if not st:
            print('EMPTY', d, '=>', repr(raw[:300]))