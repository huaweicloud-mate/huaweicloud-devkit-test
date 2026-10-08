# -*- coding: utf-8 -*-
import os, json, collections, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
ev = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-10-04-188.239.14.150\Windows\evidence'
c = collections.Counter()
details = {}
for d in sorted(os.listdir(ev)):
    p = os.path.join(ev, d, 'stdout.log')
    if not os.path.isfile(p):
        c['NO_LOG'] += 1
        details.setdefault('NO_LOG', []).append(d)
        continue
    try:
        j = json.load(open(p, encoding='utf-8'))
        st = str(j.get('status') or '?').upper()
    except Exception as e:
        st = 'PARSE_ERR'
    c[st] += 1
    details.setdefault(st, []).append(d)
print('STATUS DIST:', dict(c))
for st in sorted(details):
    print(st, len(details[st]), '->', ' '.join(details[st]))