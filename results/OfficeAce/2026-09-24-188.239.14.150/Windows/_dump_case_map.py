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
        m = case_map.setdefault(cid, {'pass': 0, 'fail': 0, 'src': []})
        if d not in m['src']:
            m['src'].append(d)
        if r.get('pass') is True:
            m['pass'] += 1
        else:
            m['fail'] += 1
print('CASEID | PASS | FAIL | SRC')
for cid in sorted(case_map):
    m = case_map[cid]
    status = 'PASS' if m['fail'] == 0 else 'FAIL'
    print(f'{cid} | {m["pass"]} | {m["fail"]} | {status} | {",".join(m["src"])}')