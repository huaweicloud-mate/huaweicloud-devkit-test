# -*- coding: utf-8 -*-
import csv, os, json
base = os.path.dirname(os.path.abspath(__file__))
ev = os.path.join(base, 'evidence')

def status_of(cid):
    d = os.path.join(ev, cid)
    sp = os.path.join(d, 'stdout.log')
    if not os.path.isfile(sp):
        return 'NO_DIR_OR_NO_LOG'
    raw = open(sp, encoding='utf-8', errors='replace').read().strip()
    if not raw:
        return 'EMPTY_LOG'
    try:
        j = json.loads(raw)
        return j.get('status', 'NO_STATUS')
    except Exception:
        return 'UNPARSEABLE'

for kind in ['设计级', '展开级']:
    f = os.path.join(base, f'用例矩阵-{kind}.csv')
    rows = list(csv.DictReader(open(f, encoding='utf-8-sig')))
    print(f'========== {kind} 缺失 evidence 的用例 ==========')
    for r in rows:
        cid = r['ID']
        if not os.path.isfile(os.path.join(ev, cid, 'stdout.log')):
            print(f"{cid}\t{r['优先级']}\t{r.get('标题','')}")
    print()