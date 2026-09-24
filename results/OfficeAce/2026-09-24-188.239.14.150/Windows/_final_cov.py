import os, json, csv, sys
sys.stdout.reconfigure(encoding='utf-8')
base = os.path.dirname(os.path.abspath(__file__))
ev = os.path.join(base, 'evidence')

dirs = set()
for d in os.listdir(ev):
    if os.path.isdir(os.path.join(ev, d)):
        dirs.add(d)

# dir status
def dirstatus(cid):
    p = os.path.join(ev, cid, 'stdout.log')
    if not os.path.isfile(p):
        return 'EMPTY'
    try:
        j = json.load(open(p, encoding='utf-8-sig'))
    except Exception as e:
        return 'PARSE_ERR'
    if isinstance(j, dict) and 'status' in j:
        return j['status']
    if isinstance(j, dict) and 'results' in j:
        return f'grouped({j.get("passed")}/{j.get("total")})'
    return 'NOSTATUS'

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

rows = list(csv.DictReader(open(os.path.join(base, '用例矩阵-设计级.csv'), encoding='utf-8-sig')))
print(f'design total = {len(rows)}')
covered = 0
uncovered = []
for r in rows:
    cid = r['ID'].strip()
    if cid in dirs:
        covered += 1
    elif cid in case_map:
        covered += 1
    else:
        uncovered.append((cid, r['优先级'], r['标题']))
print(f'covered (dir or grouped) = {covered}')
print(f'uncovered = {len(uncovered)}')
for cid, pri, t in sorted(uncovered):
    print(f'  {cid:10s} {pri:3s} {t[:40]}')