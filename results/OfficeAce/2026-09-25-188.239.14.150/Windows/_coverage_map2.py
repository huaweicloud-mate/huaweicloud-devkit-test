import os, json, csv, sys
sys.stdout.reconfigure(encoding='utf-8')
base = os.path.dirname(os.path.abspath(__file__))
ev = os.path.join(base, 'evidence')

grouped = {}
for d in ['d1-upgrade', 'd2-auth', 'd4-security', 'mcp-tools', 'c4-service-matrix']:
    p = os.path.join(ev, d, 'stdout.log')
    if not os.path.isfile(p):
        continue
    j = json.load(open(p, encoding='utf-8-sig'))
    grouped[d] = j

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

rows = list(csv.DictReader(open(os.path.join(base, '用例矩阵-设计级.csv'), encoding='utf-8-sig')))
dids = set(r['ID'].strip() for r in rows)
erows = list(csv.DictReader(open(os.path.join(base, '用例矩阵-展开级.csv'), encoding='utf-8-sig')))
eids = set(r['ID'].strip() for r in erows)

covered_d = dids & set(case_map.keys())
covered_e = eids & set(case_map.keys())
out = []
out.append('design total=%d covered_by_grouped=%d' % (len(dids), len(covered_d)))
out.append('expanded total=%d covered_by_grouped=%d' % (len(eids), len(covered_e)))
out.append('=== design NOT covered by grouped ===')
for cid in sorted(dids - set(case_map.keys())):
    r = next((x for x in rows if x['ID'].strip() == cid), None)
    out.append('  %s | %s | %s' % (cid, r['优先级'] if r else '?', (r['标题'][:40] if r else '')))
out.append('=== expanded NOT covered by grouped ===')
for cid in sorted(eids - set(case_map.keys())):
    r = next((x for x in erows if x['ID'].strip() == cid), None)
    out.append('  %s | %s | %s' % (cid, (r['展开类型'][:20] if r else ''), (r['源用例'] if r else '')))
io2 = open('_coverage_map_out.txt', 'w', encoding='utf-8')
io2.write('\n'.join(out))
print('\n'.join(out))