import os, csv, json, io

d = 'evidence'
valid = {'PASS','FAIL','BLOCKED','SPEC-MISMATCH','NOT_RUN'}
HERE = os.path.dirname(os.path.abspath(__file__))

def read_status(cid):
    p = os.path.join(HERE, d, cid, 'stdout.log')
    tp = os.path.join(HERE, d, cid, 'stdout.txt')
    for src in (p, tp):
        if os.path.isfile(src):
            raw = open(src, encoding='utf-8-sig').read().lstrip('\ufeff').strip()
            try:
                j = json.loads(raw)
            except Exception:
                return ('PARSE_FAIL', None)
            if isinstance(j, dict) and j.get('status') in valid:
                return (j['status'], j.get('why'))
            return ('NO_STATUS', None)
    return ('NO_OUTPUT', None)

# design
design = list(csv.DictReader(io.open(os.path.join(HERE, '用例矩阵-设计级.csv'), encoding='utf-8-sig')))
# expanded
expanded = list(csv.DictReader(io.open(os.path.join(HERE, '用例矩阵-展开级.csv'), encoding='utf-8-sig')))

print('====== DESIGN ======')
from collections import Counter
dc = Counter()
for r in design:
    st, _ = read_status(r['ID'])
    dc[st] += 1
print(dc)
print('--- design missing/not-pass ---')
for r in design:
    st, why = read_status(r['ID'])
    if st not in ('PASS',):
        print(r['ID'], '|', r['优先级'], '|', st, '|', (why or '')[:60])

print()
print('====== EXPANDED ======')
ec = Counter()
for r in expanded:
    st, _ = read_status(r['ID'])
    ec[st] += 1
print(ec)
print('--- expanded missing/not-pass ---')
for r in expanded:
    st, why = read_status(r['ID'])
    if st not in ('PASS',):
        print(r['ID'], '|', r['优先级'], '|', st, '|', (why or '')[:60])