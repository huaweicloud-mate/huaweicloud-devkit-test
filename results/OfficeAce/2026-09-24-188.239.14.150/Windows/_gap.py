import csv, os, json, sys
sys.stdout.reconfigure(encoding='utf-8')
base = os.path.dirname(os.path.abspath(__file__))
ev = os.path.join(base, 'evidence')

def ev_ids():
    ids = {}
    for d in os.listdir(ev):
        p = os.path.join(ev, d, 'stdout.log')
        if os.path.isfile(p):
            try:
                j = json.load(open(p, encoding='utf-8-sig'))
            except Exception:
                ids[d] = 'PARSE_ERR'
                continue
            if isinstance(j, dict):
                if 'status' in j:
                    ids[d] = j['status']
                else:
                    # grouped: total/passed/failed
                    ids[d] = f"grouped({j.get('passed')}/{j.get('total')})"
    return ids

eids = ev_ids()
print('=== evidence dirs ===')
for k, v in sorted(eids.items()):
    print(' ', k, '=>', v)

print()
print('=== design CSV: missing evidence ===')
rows = list(csv.DictReader(open(os.path.join(base, '用例矩阵-设计级.csv'), encoding='utf-8-sig')))
for r in rows:
    cid = r['ID'].strip()
    if cid not in eids:
        print('  MISSING', cid, '|', r['优先级'], '|', r['标题'][:45])

print()
print('=== expanded CSV: missing evidence ===')
erows = list(csv.DictReader(open(os.path.join(base, '用例矩阵-展开级.csv'), encoding='utf-8-sig')))
for r in erows:
    cid = r['ID'].strip()
    if cid not in eids:
        print('  MISSING', cid, '|', r['优先级'], '|', r['展开类型'], '|', r['源用例'])