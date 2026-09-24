import os, json, csv, sys
sys.stdout.reconfigure(encoding='utf-8')
base = os.path.dirname(os.path.abspath(__file__))
ev = os.path.join(base, 'evidence')

# Gather per-grouped-probe: dict caseId -> set of result names + any fail
grouped = {}
for d in ['d1-upgrade', 'd2-auth', 'd4-security', 'mcp-tools', 'c4-service-matrix']:
    p = os.path.join(ev, d, 'stdout.log')
    if not os.path.isfile(p):
        continue
    j = json.load(open(p, encoding='utf-8-sig'))
    grouped[d] = j

# Build map caseId -> {pass_count, fail_count, names}
case_map = {}
for d, j in grouped.items():
    for r in j.get('results', []):
        cid = (r.get('id') or '').strip()
        if not cid:
            continue
        m = case_map.setdefault(cid, {'pass': 0, 'fail': 0, 'names': []})
        m['names'].append(r.get('name'))
        if r.get('pass') is True:
            m['pass'] += 1
        else:
            m['fail'] += 1

print('=== grouped probe coverage: caseId => pass/fail count ===')
for cid in sorted(case_map):
    m = case_map[cid]
    print(f'{cid:14s} pass={m["pass"]:2d} fail={m["fail"]:2d}  {m["names"][:6]}')

# design CSV ids
dids = set()
rows = list(csv.DictReader(open(os.path.join(base, '用例矩阵-设计级.csv'), encoding='utf-8-sig')))
for r in rows:
    dids.add(r['ID'].strip())

eids = set()
erows = list(csv.DictReader(open(os.path.join(base, '用例矩阵-展开级.csv'), encoding='utf-8-sig')))
for r in erows:
    eids.add(r['ID'].strip())

covered_d = dids & set(case_map.keys())
covered_e = eids & set(case_map.keys())
print()
print('design total=', len(dids), 'covered_by_grouped=', len(covered_d))
print('expanded total=', len(eids), 'covered_by_grouped=', len(covered_e))
print()
print('=== design cases NOT covered by grouped probes ===')
for cid in sorted(dids - set(case_map.keys())):
    r = next((x for x in rows if x['ID'].strip() == cid), None)
    print(' ', cid, '|', r['优先级'] if r else '?', '|', (r['标题'][:38] if r else ''))
print()
print('=== expanded cases NOT covered by grouped probes ===')
for cid in sorted(eids - set(case_map.keys())):
    r = next((x for x in erows if x['ID'].strip() == cid), None)
    print(' ', cid, '|', (r['展开类型'][:20] if r else ''), '|', (r['源用例'] if r else ''))