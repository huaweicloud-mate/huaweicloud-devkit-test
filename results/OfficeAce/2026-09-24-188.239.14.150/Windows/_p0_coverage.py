import os, json, csv, sys
sys.stdout.reconfigure(encoding='utf-8')
base = os.path.dirname(os.path.abspath(__file__))
ev = os.path.join(base, 'evidence')

# 逐条 evidence dirs
dirs = set()
for d in os.listdir(ev):
    if os.path.isdir(os.path.join(ev, d)):
        dirs.add(d)

# grouped case_map
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
        m = case_map.setdefault(cid, {'pass': 0, 'fail': 0, 'src': [d]})
        if d not in m['src']:
            m['src'].append(d)
        if r.get('pass') is True:
            m['pass'] += 1
        else:
            m['fail'] += 1

rows = list(csv.DictReader(open(os.path.join(base, '用例矩阵-设计级.csv'), encoding='utf-8-sig')))
print('=== ALL P0 coverage ===')
for r in rows:
    if r['优先级'] != 'P0':
        continue
    cid = r['ID'].strip()
    has_dir = cid in dirs
    gm = case_map.get(cid)
    if has_dir:
        # read dir status
        try:
            j = json.load(open(os.path.join(ev, cid, 'stdout.log'), encoding='utf-8-sig'))
            dstatus = j.get('status') if isinstance(j, dict) else '?'
        except Exception:
            dstatus = 'ERR'
    else:
        dstatus = ''
    if gm:
        gstatus = 'PASS' if gm['fail'] == 0 else 'FAIL'
    else:
        gstatus = ''
    cov = 'DIR' if has_dir else ('GRP' if gm else 'NONE')
    detail = dstatus if has_dir else (f'{gstatus}({gm["pass"]}/{gm["pass"]+gm["fail"]})' if gm else '')
    print(f'{cid:8s} cov={cov:4s} {detail:18s} | {r["标题"][:26]}')