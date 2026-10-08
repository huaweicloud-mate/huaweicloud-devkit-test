import csv, os, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
TODAY = 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-10-01-188.239.14.150/Windows'
YEST = 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-09-30-188.239.14.150/Windows'
EVD = os.path.join(TODAY, 'evidence')

def rows(fn):
    return list(csv.DictReader(open(fn, encoding='utf-8-sig')))

des = rows(os.path.join(TODAY, '用例矩阵-设计级.csv'))
exp = rows(os.path.join(TODAY, '用例矩阵-展开级.csv'))

yev = os.path.join(YEST, 'evidence')
fixture13 = {'D1-66','D1-69','D2-10','D2-13','D2-27','D3-C14','D4-12','D4-29','D9-9','D8-10','D9-6','D9-10','D9-11'}

# For design rows, classify by case id
out = []
out.append('=== DESIGN (total %d) ===' % len(des))
noev = []
for r in des:
    cid = r['ID']; pr = r['优先级']
    probe = os.path.isfile(os.path.join(yev, cid, 'probe.mjs'))
    fx = cid in fixture13
    if not probe and not fx:
        noev.append(cid)
out.append('design cases with NEITHER yesterday-probe NOR fixture: %d' % len(noev))
for c in noev:
    out.append('   ' + c)

out.append('')
out.append('=== EXPANDED (total %d) ===' % len(exp))
eno = []
for r in exp:
    cid = r['ID']
    probe = os.path.isfile(os.path.join(yev, cid, 'probe.mjs'))
    fx = cid in fixture13
    if not probe and not fx:
        eno.append(cid)
out.append('expanded NEITHER: %d' % len(eno))
for c in eno:
    out.append('   ' + c)

out.append('')
out.append('=== design priority counts ===')
from collections import Counter
out.append(str(dict(Counter(r['优先级'] for r in des))))

open('C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/_plan.txt','w',encoding='utf-8').write('\n'.join(out))
print('\n'.join(out))