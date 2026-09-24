# -*- coding: utf-8 -*-
import json, io
for cid in ['d2-auth']:
    j = json.load(io.open('evidence/' + cid + '/stdout.log', encoding='utf-8-sig'))
    print('total', j.get('total'), 'passed', j.get('passed'), 'failed', j.get('failed'))
    for r in j['results']:
        mark = 'FAIL' if not r.get('pass') else 'PASS'
        print(f"{mark} id={r.get('id'):10s} name={r.get('name'):20s} expected={str(r.get('expected'))[:40]!r}")
        if not r.get('pass'):
            print(f"     actual={str(r.get('actual'))[:100]!r}")
            print(f"     failMsg={str(r.get('failMsg'))[:80]!r}")