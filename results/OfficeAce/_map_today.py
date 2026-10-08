import csv, os, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE = os.path.dirname(os.path.abspath(__file__))
TODAY = os.path.join(BASE, '2026-10-01-188.239.14.150', 'Windows')
YEST = os.path.join(BASE, '2026-09-30-188.239.14.150', 'Windows')

def rows(fn):
    f = open(fn, encoding='utf-8-sig')
    r = list(csv.DictReader(f))
    f.close()
    return r

des = rows(os.path.join(TODAY, '用例矩阵-设计级.csv'))
exp = rows(os.path.join(TODAY, '用例矩阵-展开级.csv'))

def pid(x):
    return (x.get('优先级') or x.get('priority') or '').strip()

yev = os.path.join(YEST, 'evidence')
yev_dirs = set(os.listdir(yev)) if os.path.isdir(yev) else set()
def has_probe(cid):
    return os.path.isfile(os.path.join(yev, cid, 'probe.mjs'))

missing = []
for x in des:
    cid = x.get('ID'); pr = pid(x)
    if pr in ('P0','P1','P2'):
        if not (cid in yev_dirs and has_probe(cid)):
            missing.append((cid, pr))

out = []
out.append('MISSING = %d' % len(missing))
for m in missing:
    out.append('  %s %s' % m)

# also list what priority the 13 fixtures map to vs missing
open(os.path.join(BASE,'_map_out.txt'),'w',encoding='utf-8').write('\n'.join(out))
print('\n'.join(out))