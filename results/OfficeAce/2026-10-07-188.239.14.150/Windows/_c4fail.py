# -*- coding: utf-8 -*-
import json, os
base = os.path.dirname(os.path.abspath(__file__))
ev = os.path.join(base, 'evidence')
sp = os.path.join(ev, 'c4-service-matrix', 'stdout.log')
j = json.load(open(sp, encoding='utf-8', errors='replace'))
print('total', j['total'], 'passed', j['passed'], 'failed', j['failed'])
print('==== 全部 FAIL 项 ====')
for r in j['results']:
    if not r.get('pass'):
        print(f"{r.get('id')}\t{r.get('name')}\tactual={r.get('actual')}\texpected={r.get('expected')}\tfailMsg={r.get('failMsg')}")