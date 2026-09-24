import os, json, csv, sys
sys.stdout.reconfigure(encoding='utf-8')
base = os.path.dirname(os.path.abspath(__file__))
ev = os.path.join(base, 'evidence')
grouped = {}
for d in ['d1-upgrade', 'd2-auth', 'd4-security', 'mcp-tools', 'c4-service-matrix']:
    p = os.path.join(ev, d, 'stdout.log')
    if os.path.isfile(p):
        grouped[d] = json.load(open(p, encoding='utf-8-sig'))
case_map = {}
for d, j in grouped.items():
    for r in j.get('results', []):
        cid = (r.get('id') or '').strip()
        if not cid:
            continue
        m = case_map.setdefault(cid, {'pass': 0, 'fail': 0})
        if r.get('pass') is True:
            m['pass'] += 1
        else:
            m['fail'] += 1
dids = set()
rows = list(csv.DictReader(open(os.path.join(base, '用例矩阵-设计级.csv'), encoding='utf-8-sig')))
for r in rows:
    dids.add(r['ID'].strip())
eids = set()
erows = list(csv.DictReader(open(os.path.join(base, '用例矩阵-展开级.csv'), encoding='utf-8-sig')))
for r in erows:
    eids.add(r['ID'].strip())
print('DESIGN NOT COVERED BY GROUPED:')
for cid in sorted(dids - set(case_map.keys())):
    r = next((x for x in rows if x['ID'].strip() == cid), None)
    print(' ', cid, '|', r['优先级'] if r else '?', '|', (r['标题'][:36] if r else ''))
print()
print('EXPANDED NOT COVERED BY GROUPED:')
for cid in sorted(eids - set(case_map.keys())):
    r = next((x for x in erows if x['ID'].strip() == cid), None)
    print(' ', cid, '|', (r['展开类型'][:18] if r else ''), '|', (r['源用例'] if r else ''))