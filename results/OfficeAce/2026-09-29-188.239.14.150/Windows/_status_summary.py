# -*- coding: utf-8 -*-
import os, io, json
base = os.path.dirname(os.path.abspath(__file__))
ev = os.path.join(base, 'evidence')
dirs = [d for d in os.listdir(ev) if os.path.isdir(os.path.join(ev, d))]
dirs.sort()
from collections import Counter
cnt = Counter()
rows = []
for d in dirs:
    p = os.path.join(ev, d, 'stdout.log')
    if not os.path.isfile(p):
        rows.append((d, 'NO_STDOUT', '', ''))
        cnt['NO_STDOUT'] += 1
        continue
    raw = open(p, encoding='utf-8').read().strip()
    st = ''
    try:
        j = json.loads(raw)
        if isinstance(j, dict):
            if 'status' not in j and len(j) == 1:
                j = list(j.values())[0]
            st = (j.get('status') or '').upper()
            why = (j.get('why') or j.get('blockedReason') or '')
    except Exception:
        for s in ('SPEC-MISMATCH','BLOCKED','NOT_RUN','FAIL','PASS'):
            if s in raw.upper():
                st = s; break
        why = ''
    rows.append((d, st, why[:120], ''))
    cnt[st] += 1

o = io.open(os.path.join(base, '_status_summary.txt'), 'w', encoding='utf-8')
o.write('TOTAL %d\n' % len(dirs))
o.write('DIST %s\n' % dict(cnt))
for d, st, why, _ in rows:
    o.write('%-22s %-14s %s\n' % (d, st, why))
o.close()
print('TOTAL', len(dirs))
print(dict(cnt))