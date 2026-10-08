# -*- coding: utf-8 -*-
import csv, io, os
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-10-05-188.239.14.150\Windows'
prev = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-10-04-188.239.14.150\Windows\evidence'
design = list(csv.DictReader(open(base+'\\用例矩阵-设计级.csv', encoding='utf-8-sig')))
exp = list(csv.DictReader(open(base+'\\用例矩阵-展开级.csv', encoding='utf-8-sig')))
allids = [x['ID'] for x in design] + [x['ID'] for x in exp]
out = io.open(base+'\\_plan.txt','w',encoding='utf-8')
out.write('design ids: %d\n' % len([x['ID'] for x in design]))
out.write('expand ids: %d\n' % len([x['ID'] for x in exp]))
out.write('total unique: %d\n' % len(set(allids)))
prevdirs = set(os.listdir(prev))
# which design/expand ids lack probe in prev
missing = [i for i in allids if i not in prevdirs]
out.write('ids without prev evidence dir: %s\n' % missing)
# which prev dirs have real probe.mjs (has code beyond comments)
def is_shell(evd):
    p = os.path.join(prev, evd, 'probe.mjs')
    if not os.path.isfile(p): return 'no-probe'
    t = open(p, encoding='utf-8', errors='replace').read()
    lines = [l for l in t.splitlines() if l.strip()]
    code = [l for l in lines if not l.strip().startswith(('//','#'))]
    return 'real' if code else 'empty-shell'
states = {}
for i in allids:
    if i in prevdirs:
        states[i] = is_shell(i)
from collections import Counter
out.write('prev probe state: %s\n' % dict(Counter(states.values())))
# print the no-probe / empty-shell ids
out.write('no-probe/empty-shell ids: %s\n' % [i for i,s in states.items() if s!='real'])
# print full id list
out.write('\nALL DESIGN IDs:\n')
for x in design:
    out.write('  %s [%s] %s\n' % (x['ID'], x['优先级'], x['标题']))
out.write('\nALL EXPAND IDs:\n')
for x in exp:
    out.write('  %s [%s] %s\n' % (x['ID'], x['优先级'], x['展开类型']))
out.close()
print('done')