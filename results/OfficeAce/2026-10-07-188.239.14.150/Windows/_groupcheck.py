# -*- coding: utf-8 -*-
import json, os
base = os.path.dirname(os.path.abspath(__file__))
ev = os.path.join(base, 'evidence')
for g in ['d1-upgrade','d2-auth','d4-security','mcp-tools','c4-service-matrix']:
    sp = os.path.join(ev, g, 'stdout.log')
    if not os.path.isfile(sp):
        print(g, 'NO stdout.log'); continue
    raw = open(sp, encoding='utf-8', errors='replace').read()
    try:
        j = json.loads(raw)
    except Exception as e:
        print(g, 'UNPARSE', e); continue
    if isinstance(j, dict) and 'results' in j:
        ids = set()
        fails = []
        for r in j['results']:
            ids.add(r.get('id'))
            if not r.get('pass'):
                fails.append((r.get('id'), r.get('name')))
        print(f'== {g}: total={j.get("total")} passed={j.get("passed")} failed={j.get("failed")}')
        print('   ids:', sorted(ids))
        print('   FAIL items:', fails)
    else:
        print(g, 'structure keys', list(j.keys()) if isinstance(j,dict) else type(j))